import dotenv from 'dotenv';
dotenv.config({ override: true, debug: true })

const parseBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === "") return defaultValue;
    return value.toLowerCase() === "true";
};

const CONFIG = {
    ENV: {
        NODE_ENV: process.env.NODE_ENV || "development",
        PORT: Number.parseInt(process.env.PORT || "3000", 10),
        MONGO_URL: process.env.MONGO_URL,
        JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET,
        JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET,
        CSRF_SECRET: process.env.CSRF_SECRET,
        COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE || "lax").toLowerCase(),
        CLIENT_URLS: process.env.CLIENT_URLS,
        TRUST_PROXY: process.env.TRUST_PROXY,

        CLOUD_NAME: process.env.CLOUD_NAME,
        CLOUD_API_KEY: process.env.CLOUD_API_KEY,
        CLOUD_API_SECRET: process.env.CLOUD_API_SECRET,
        CLOUD_URL: process.env.CLOUD_URL,
        VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
        VAPID_SUBJECT: process.env.VAPID_SUBJECT || "mailto:admin@familydiary.app",

        SMTP_HOST:process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_SECURE:process.env.SMTP_SECURE,
        SMTP_USER:process.env.SMTP_USER,
        SMTP_PASSWORD:process.env.SMTP_PASSWORD,
        MAIL_FROM_NAME:process.env.MAIL_FROM_NAME,
        MAIL_FROM_EMAIL:process.env.MAIL_FROM_EMAIL,
        FAMILY_DIARY_LOGO_URL:process.env.FAMILY_DIARY_LOGO_URL
    }
}



export const validateEnvironment = () => {
    const required = ["MONGO_URL", "JWT_ACCESS_TOKEN_SECRET", "CSRF_SECRET"];
    const missing = required.filter((key) => !CONFIG.ENV[key]);

    if (missing.length) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }

    if (CONFIG.ENV.JWT_ACCESS_TOKEN_SECRET.length < 32) {
        throw new Error("JWT_ACCESS_TOKEN_SECRET must contain at least 32 characters.");
    }

    if (CONFIG.ENV.CSRF_SECRET.length < 32) {
        throw new Error("CSRF_SECRET must contain at least 32 characters.");
    }

    if (!["strict", "lax", "none"].includes(CONFIG.ENV.COOKIE_SAME_SITE)) {
        throw new Error('COOKIE_SAME_SITE must be "strict", "lax", or "none".');
    }

    if (!Number.isInteger(CONFIG.ENV.PORT) || CONFIG.ENV.PORT < 1 || CONFIG.ENV.PORT > 65535) {
        throw new Error("PORT must be a valid TCP port.");
    }
};

export const getAllowedOrigins = () => CONFIG.ENV.CLIENT_URLS
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);


export default CONFIG