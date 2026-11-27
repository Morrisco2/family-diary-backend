import nodemailer from "nodemailer";
import CONFIG from "./config.js";

const mailConfig = {
    host: CONFIG.ENV.SMTP_HOST,
    port: Number(CONFIG.ENV.SMTP_PORT || 465),
    secure: CONFIG.ENV.SMTP_SECURE === "true",
    auth: {
        user: CONFIG.ENV.SMTP_USER,
        pass: CONFIG.ENV.SMTP_PASSWORD,
    },
};

const transporter = nodemailer.createTransport(mailConfig);

export default transporter;
