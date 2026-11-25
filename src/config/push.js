
import { createRequire } from "node:module";
import CONFIG from "./config.js";

const require = createRequire(import.meta.url);
const webpush = require("web-push");

let configured = false;

export const configurePush = () => {
    const {
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY,
        VAPID_SUBJECT
    } = CONFIG.ENV;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
        console.warn(
            "Web Push is disabled: configure VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT."
        );

        return false;
    }

    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );

    configured = true;
    return true;
};

export const isPushConfigured = () => configured;

export default webpush;
