import cookieParser from "cookie-parser";
import express from "express";

import CONFIG, { validateEnvironment } from "./config/config.js";
import connectDB from "./config/DB.js";
import { corsMiddleware, securityHeaders } from "./config/security.js";
import statusCode from "./constants/statusCode.js";
import appError from "./exceptions/appError.js";
import errorHandler from "./exceptions/errorHandler.js";
import { doubleCsrfProtection } from "./middlewares/security/csrfProtection.js";
import { generalApiLimiter } from "./middlewares/security/rateLimiter.js";
import routes from "./routes/Routes.js";

const app = express();

// Only configure trust proxy when the deployment actually sits behind a
// known reverse proxy. Set TRUST_PROXY=1 (or the appropriate hop count) there.
if (CONFIG.ENV.TRUST_PROXY) {
    const trustProxy = /^\d+$/.test(CONFIG.ENV.TRUST_PROXY)
        ? Number(CONFIG.ENV.TRUST_PROXY)
        : CONFIG.ENV.TRUST_PROXY === "true";
    app.set("trust proxy", trustProxy);
}

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(statusCode.SUCCESS).send("Welcome to Family Diary backend server.");
});


app.use("/api/v1", generalApiLimiter, doubleCsrfProtection, routes);

app.use((req, res, next) => {
    next(new appError("Route not found.", statusCode.NOT_FOUND));
});

app.use(errorHandler);

const startServer = async () => {
    try {
        validateEnvironment();
        await connectDB();

        app.listen(CONFIG.ENV.PORT, () => {
            console.log(`Family Diary API is running on port ${CONFIG.ENV.PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exitCode = 1;
    }
};


if (process.env.NODE_ENV !== "test") {
    startServer();
}

export default app;