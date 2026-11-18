import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshSession from "../models/refreshSession.model.js";
import CONFIG from "../config/config.js";
import {
    AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, REFRESH_COOKIE_NAME,
    REFRESH_COOKIE_OPTIONS, clearAuthCookie, clearRefreshCookie
} from "../config/cookieOptions.js";
import statusCode from "../constants/statusCode.js";
import appError from "../exceptions/appError.js";
import successResponse from "../exceptions/successResponse.js";
import { generateCsrfToken } from "../middlewares/security/csrfProtection.js";
import { createUser, findUserByEmail, findUserById } from "../services/user.services.js";
import { uploadAndSaveImage } from "../utils/imageUtils/ImageUpload.cloudinary.js";
import encryptPassword from "../utils/passwordUtils/encryptPassword.js";
import verifyPassword from "../utils/passwordUtils/verifyPassword.js";


const ACCESS_TOKEN_LIFETIME = "1h";
const REFRESH_TOKEN_LIFETIME = "30d";
const REFRESH_SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createAccessToken = (user) => {
    const payload = {
        id: user.id, email: user.email, username: user.name,
        role: user.role, imageURL: user.image?.imageUrl ?? ""
    };
    const token = jwt.sign(payload, CONFIG.ENV.JWT_ACCESS_TOKEN_SECRET, {
        algorithm: "HS256", expiresIn: ACCESS_TOKEN_LIFETIME
    });
    return { token, payload, expiresAt: Date.now() + 60 * 60 * 1000 };
};

const createRefreshToken = (userId, sessionId) => jwt.sign(
    { id: userId, sid: sessionId, type: "refresh" },
    CONFIG.ENV.JWT_REFRESH_TOKEN_SECRET,
    { algorithm: "HS256", expiresIn: REFRESH_TOKEN_LIFETIME }
);

const setAuthenticationCookies = (res, accessToken, refreshToken) => {
    res.cookie(AUTH_COOKIE_NAME, accessToken, AUTH_COOKIE_OPTIONS);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
};

const clearSessionCookiesAndResetCsrf = (req, res) => {
    clearAuthCookie(res);
    clearRefreshCookie(res);
    req.cookies = req.cookies || {};
    delete req.cookies[AUTH_COOKIE_NAME];
    generateCsrfToken(req, res, { overwrite: true });
};

const authController = {

    csrfToken: (req, res, next) => {
        try {
            const csrfToken = generateCsrfToken(req, res);

            return successResponse(
                res,
                { csrfToken },
                "CSRF token generated successfully"
            );
        } catch (error) {
            return next(error);
        }
    },


    register: async (req, res, next) => {
        console.log("Registration route hit");

        try {
            // Multer has already processed the uploaded image.
            const uploadedFile = req.file || null;

            const { name, email, phoneNumber, dob, password, terms } = req.body;

            console.log(name, email, phoneNumber, dob, password, terms);

            // Validate terms
            if (terms !== "true") {
                return next(
                    new appError(
                        "Please agree to the terms and conditions.",
                        statusCode.BAD_REQUEST
                    )
                );
            }

            // Validate required duplicatedFields
            if (!name || !email || !phoneNumber || !password) {
                return next(
                    new appError(
                        "Supply the complete details.",
                        statusCode.BAD_REQUEST
                    )
                );
            }

            let profilePictureData = null;

            // Upload image to Cloudinary if provided
            if (uploadedFile) {
                const cloudinaryResult = await uploadAndSaveImage(
                    uploadedFile.buffer
                );

                profilePictureData = {
                    imageUrl: cloudinaryResult.image_url,
                    cloudinary_id: cloudinaryResult.cloudinary_id
                };
            }

            // Hash password
            const hashedPassword = await encryptPassword(password);

            // Prepare user data
            const userData = {
                name,
                email,
                phoneNumber,
                dob,
                password: hashedPassword,
                terms: true,
                image: profilePictureData
            };

            // Create user
            const newUser = await createUser(userData);

            if (!newUser) {
                return next(
                    new appError(
                        "An error occurred, please try again.",
                        statusCode.INTERNAL_SERVER_ERROR
                    )
                );
            }

            console.log("New user created successfully");

            return successResponse(
                res,
                "Registration successful",
                newUser,
                statusCode.CREATED
            );

        } catch (error) {
            console.error("Registration error:", error);

            // Handle duplicate email or other unique duplicatedFields
            if (error.code === 11000) {
                const duplicatedField = Object.keys(error.keyValue)[0];

                return next(
                    new appError(
                        `This ${duplicatedField} is already registered.`,
                        statusCode.BAD_REQUEST
                    )
                );
            }

            // Handle database connection errors
            if (
                error.name === "MongooseServerSelectionError" ||
                error.message?.includes("topology") ||
                error.message?.includes("ECONNREFUSED")
            ) {
                return next(
                    new appError(
                        "Database service is temporarily unavailable. Please try again later.",
                        statusCode.SERVICE_UNAVAILABLE
                    )
                );
            }

            return next(
                new appError(
                    error.message || "Registration failed.",
                    statusCode.INTERNAL_SERVER_ERROR
                )
            );
        }
    },


    login: async (req, res, next) => {

        const { email, password } = req.body;
        console.log("password and email are: ", password, email);
        

        if (!email) {
            return next(new appError('Provide email address', statusCode.BAD_REQUEST))
        }

        try {

            // Find user.
            const user = await findUserByEmail(email);


            // Use a generic response to prevent account enumeration.
            if (!user) {
                return next(new appError("Invalid email or password", statusCode.UNAUTHORISED));
            }

            // Verify password.
            const isPasswordCorrect = await verifyPassword(
                password,
                user.password
            );

            if (!isPasswordCorrect) {
                return next(new appError("Invalid email or password", statusCode.UNAUTHORISED));
            }

            // Create a short-lived access token and a persistent refresh session.
            const { token, payload, expiresAt } = createAccessToken(user);
            const session = await RefreshSession.create({
                userId: user._id,
                tokenHash: crypto.randomBytes(32).toString("hex"),
                expiresAt: new Date(Date.now() + REFRESH_SESSION_LIFETIME_MS)
            });

            const refreshToken = createRefreshToken(user.id, session.id);
            session.tokenHash = hashToken(refreshToken);
            await session.save();

            setAuthenticationCookies(res, token, refreshToken);

            req.cookies = req.cookies || {};
            req.cookies[AUTH_COOKIE_NAME] = token;
            const csrfToken = generateCsrfToken(req, res, { overwrite: true });

            return successResponse(
                res,
                { ...payload, accessTokenExpiresAt: expiresAt },
                "Login successful",
                200,
                csrfToken
            );

        } catch (error) {

            return next(error);
        }
    },


    refresh: async (req, res, next) => {
        try {
            const oldRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
            if (!oldRefreshToken) {
                return next(new appError("Refresh session expired. Please log in again.", statusCode.UNAUTHORISED));
            }

            let decoded;
            try {
                decoded = jwt.verify(oldRefreshToken, CONFIG.ENV.JWT_REFRESH_TOKEN_SECRET, { algorithms: ["HS256"] });
            } catch {
                clearSessionCookiesAndResetCsrf(req, res);
                return next(new appError("Refresh session expired. Please log in again.", statusCode.UNAUTHORISED));
            }

            if (decoded.type !== "refresh" || !decoded.id || !decoded.sid) {
                return next(new appError("Invalid refresh session. Please log in again.", statusCode.UNAUTHORISED));
            }

            const session = await RefreshSession.findOne({
                _id: decoded.sid,
                userId: decoded.id,
                tokenHash: hashToken(oldRefreshToken),
                revokedAt: null,
                expiresAt: { $gt: new Date() }
            });

            if (!session) {
                clearSessionCookiesAndResetCsrf(req, res);
                return next(new appError("Refresh session is no longer valid. Please log in again.", statusCode.UNAUTHORISED));
            }

            const user = await findUserById(decoded.id);
            if (!user) {
                await RefreshSession.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
                clearSessionCookiesAndResetCsrf(req, res);
                return next(new appError("The account associated with this session no longer exists.", statusCode.UNAUTHORISED));
            }

            const { token, payload, expiresAt } = createAccessToken(user);
            const newRefreshToken = createRefreshToken(user.id, session.id);

            const rotated = await RefreshSession.findOneAndUpdate(
                {
                    _id: session._id,
                    tokenHash: hashToken(oldRefreshToken),
                    revokedAt: null,
                    expiresAt: { $gt: new Date() }
                },
                {
                    $set: {
                        tokenHash: hashToken(newRefreshToken),
                        expiresAt: new Date(Date.now() + REFRESH_SESSION_LIFETIME_MS)
                    }
                },
                { new: true }
            );

            if (!rotated) {
                clearSessionCookiesAndResetCsrf(req, res);
                return next(new appError("Refresh session has already been used. Please log in again.", statusCode.UNAUTHORISED));
            }

            setAuthenticationCookies(res, token, newRefreshToken);
            req.cookies = req.cookies || {};
            req.cookies[AUTH_COOKIE_NAME] = token;
            const csrfToken = generateCsrfToken(req, res, { overwrite: true });

            return successResponse(
                res,
                { ...payload, accessTokenExpiresAt: expiresAt },
                "Session refreshed successfully",
                statusCode.SUCCESS,
                csrfToken
            );
        } catch (error) {
            return next(error);
        }
    },

    // LOGOUT CONTROLLER

    logout: async (req, res, next) => {

        try {
            const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
            if (refreshToken) {
                try {
                    const decoded = jwt.verify(refreshToken, CONFIG.ENV.JWT_REFRESH_TOKEN_SECRET, { algorithms: ["HS256"] });
                    await RefreshSession.updateOne(
                        { _id: decoded.sid, tokenHash: hashToken(refreshToken), revokedAt: null },
                        { $set: { revokedAt: new Date() } }
                    );
                } catch {
                    // Always clear cookies, even if the refresh token is invalid.
                }
            }

            clearAuthCookie(res);
            clearRefreshCookie(res);

            // Switch the CSRF token back to the anonymous session context.
            req.cookies = req.cookies || {};
            delete req.cookies[AUTH_COOKIE_NAME];
            const csrfToken = generateCsrfToken(req, res, { overwrite: true });

            return res.status(statusCode.SUCCESS).json({
                success: true,
                message: "Logout successful",
                csrfToken
            });
        } catch (error) {
            return next(error);
        }
    }



}

export default authController