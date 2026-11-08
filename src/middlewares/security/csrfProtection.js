import { doubleCsrf } from "csrf-csrf";
import CONFIG from "../../config/config.js";
import { AUTH_COOKIE_NAME } from "../../config/cookieOptions.js";

const isProduction = CONFIG.ENV.NODE_ENV === "production";
const sameSite = CONFIG.ENV.COOKIE_SAME_SITE;

const csrfCookieName = isProduction ? "__Host-csrf-token" : "csrf-token";

const {
    generateCsrfToken,
    doubleCsrfProtection
} = doubleCsrf({
    getSecret: () => CONFIG.ENV.CSRF_SECRET,

    // Bind the CSRF token to the current authentication cookie. The login
    // controller updates req.cookies before generating the authenticated token.
    getSessionIdentifier: (req) => req.cookies?.[AUTH_COOKIE_NAME] || "anonymous",

    cookieName: csrfCookieName,
    cookieOptions: {
        httpOnly: true,
        secure: isProduction || sameSite === "none",
        sameSite,
        path: "/"
    },
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
    getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"]
});

export { generateCsrfToken, doubleCsrfProtection, csrfCookieName };
