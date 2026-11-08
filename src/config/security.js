import helmet from "helmet";
import cors from "cors";
import CONFIG, { getAllowedOrigins } from "./config.js";

const isProduction = CONFIG.ENV.NODE_ENV === "production";
const allowedOrigins = getAllowedOrigins();

export const securityHeaders = helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: isProduction ? undefined : false
});

export const corsOptions = {
    origin(origin, callback) {
        // Requests without an Origin header are typically server-to-server or CLI requests.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        const error = new Error("Origin not allowed by CORS");
        error.statusCode = 403;
        return callback(error);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"]
};

export const corsMiddleware = cors(corsOptions);