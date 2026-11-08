import { ZodError } from "zod";
import CONFIG from "../config/config.js";

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || "Internal server error";
    let details;

    if (err instanceof ZodError) {
        statusCode = 400;
        message = "Request validation failed.";
        details = err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
        }));
    } else if (err.code === "EBADCSRFTOKEN") {
        statusCode = 403;
        message = "Invalid or missing CSRF token. Refresh your security token and try again.";
    } else if (err.type === "entity.too.large") {
        statusCode = 413;
        message = "Request body is too large.";
    }

    const isProduction = CONFIG.ENV.NODE_ENV === "production";
    const isOperational = err.isOperational === true || statusCode < 500;

    if (isProduction && !isOperational) {
        message = "Something went wrong. Please try again later.";
        details = undefined;
    }

    if (!isProduction && err.stack) {
        console.error(err.stack);
    } else if (statusCode >= 500) {
        console.error(err);
    }

    return res.status(statusCode).json({
        success: false,
        message,
        ...(details ? { errors: details } : {}),
        ...(!isProduction && !details ? { stack: err.stack } : {})
    });
};

export default errorHandler;








// const errorHandler = (err, req, res, next) => {

//     if (res.headersSent) {
//         return next(err);
//     }

//     const statusCode = err.statusCode || 500;

//     const isProduction = process.env.NODE_ENV === "production";

//     return res.status(statusCode).json({
//         success: false,

//         message: isProduction && statusCode === 500
//             ? "Something went wrong. Please try again later."
//             : err.message || "Internal server error",

//         ...(isProduction
//             ? {}
//             : { stack: err.stack })
//     });
// };

// export default errorHandler;


