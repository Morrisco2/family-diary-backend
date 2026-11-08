import jwt from "jsonwebtoken";
import CONFIG from "../config/config.js";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, clearAuthCookie } from "../config/cookieOptions.js";
import statusCode from "../constants/statusCode.js";
import appError from "../exceptions/appError.js";
import successResponse from "../exceptions/successResponse.js";
import { createUser, findUserByEmail } from "../services/user.services.js";
import encryptPassword from "../utils/passwordUtils/encryptPassword.js";
import verifyPassword from "../utils/passwordUtils/verifyPassword.js";
import { uploadAndSaveImage } from "../utils/imageUtils/ImageUpload.cloudinary.js";
import { generateCsrfToken } from "../middlewares/security/csrfProtection.js";


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

            // Create JWT payload.
            const payload = {
                id: user.id,
                email: user.email,
                username: user.name,
                role: user.role
            };

            // Generate JWT.
            const token = jwt.sign(payload, CONFIG.ENV.JWT_ACCESS_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "1h"
                }
            );

            // Set HTTP-only cookie.
            res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);


            req.cookies = req.cookies || {};
            req.cookies[AUTH_COOKIE_NAME] = token;
            const csrfToken = generateCsrfToken(req, res, { overwrite: true });


            return successResponse(
                res,
                payload,
                "Login successful",
                200,
                csrfToken
            );

        } catch (error) {

            return next(error);
        }
    },


    // LOGOUT CONTROLLER

    logout: async (req, res, next) => {

        try {
            clearAuthCookie(res);

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