import { rateLimit } from "express-rate-limit";

const createLimiter = ({ windowMs, limit, message }) => rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({
        success: false,
        message
    })
});

export const generalApiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    message: "Too many requests. Please try again later."
});

export const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: "Too many authentication attempts. Try again later."
});

export const loginLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: "Too many login attempts. Please try again in 15 minutes."
});

export const passwordResetLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: "Too many password reset requests. Try again later."
});
