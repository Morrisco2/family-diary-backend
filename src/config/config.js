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
        CSRF_SECRET: process.env.CSRF_SECRET,
        COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE || "lax").toLowerCase(),
        CLIENT_URLS: process.env.CLIENT_URLS,
        TRUST_PROXY: process.env.TRUST_PROXY,

        EMAIL_HOST: process.env.EMAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT,
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
        FROM_EMAIL: process.env.FROM_EMAIL,

        CLOUD_NAME: process.env.CLOUD_NAME,
        CLOUD_API_KEY: process.env.CLOUD_API_KEY,
        CLOUD_API_SECRET: process.env.CLOUD_API_SECRET,
        CLOUD_URL: process.env.CLOUD_URL
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