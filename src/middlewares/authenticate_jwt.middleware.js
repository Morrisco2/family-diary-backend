import jwt from "jsonwebtoken";
import CONFIG from "../config/config.js";
import { AUTH_COOKIE_NAME } from "../config/cookieOptions.js";
import statusCode from "../constants/statusCode.js";
import appError from "../exceptions/appError.js";
import { findUserById } from "../services/user.services.js";

const authenticateJWT = async (req, res, next) => {
    console.log("this is the authenticate jwt middleware");
    
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
        return next(new appError("Authentication required.", statusCode.UNAUTHORISED));
    }

    try {
        const decoded = jwt.verify(token, CONFIG.ENV.JWT_ACCESS_TOKEN_SECRET, {
            algorithms: ["HS256"]
        });

        if (!decoded.id) {
            return next(new appError("Invalid authentication token.", statusCode.UNAUTHORISED));
        }

        // Read the current account/role so a deleted or demoted account cannot
        // continue using stale authorization claims until the JWT expires.
        const user = await findUserById(decoded.id);

        if (!user) {
            return next(new appError("The account associated with this session no longer exists.", statusCode.UNAUTHORISED));
        }

        req.user = {
            id: user.id,
            email: user.email,
            username: user.name,
            role: user.role
        };

        return next();
    } catch (error) {
        if (["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"].includes(error.name)) {
            return next(new appError("Invalid or expired authentication token.", statusCode.UNAUTHORISED));
        }

        return next(error);
    }
};

export default authenticateJWT;
