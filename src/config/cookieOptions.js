import CONFIG from "./config.js";

const isProduction = CONFIG.ENV.NODE_ENV === "production";
const sameSite = CONFIG.ENV.COOKIE_SAME_SITE;

const secure = isProduction || sameSite === "none";
const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export const AUTH_COOKIE_NAME = "accessToken";
export const REFRESH_COOKIE_NAME = "refreshToken";

export const AUTH_COOKIE_OPTIONS = Object.freeze({
    httpOnly: true,
    secure,
    sameSite,
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: "/"
});

export const REFRESH_COOKIE_OPTIONS = Object.freeze({
    httpOnly: true,
    secure,
    sameSite,
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: "/api/v1/auth"
});

export const clearAuthCookie = (res) => {
    const { maxAge, ...clearOptions } = AUTH_COOKIE_OPTIONS;
    res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
};

export const clearRefreshCookie = (res) => {
    const { maxAge, ...clearOptions } = REFRESH_COOKIE_OPTIONS;
    res.clearCookie(REFRESH_COOKIE_NAME, clearOptions);
};
