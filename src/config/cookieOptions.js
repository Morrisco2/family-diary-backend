import CONFIG from "./config.js";

const isProduction = CONFIG.ENV.NODE_ENV === "production";
const sameSite = CONFIG.ENV.COOKIE_SAME_SITE;

const secure = isProduction || sameSite === "none";
export const AUTH_COOKIE_NAME = "accessToken";

export const AUTH_COOKIE_OPTIONS = Object.freeze({
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 60 * 60 * 1000,
    path: "/"
});

export const clearAuthCookie = (res) => {
    const { maxAge, ...clearOptions } = AUTH_COOKIE_OPTIONS;
    res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
};
