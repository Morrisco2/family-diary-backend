import { sendNotificationEmail } from "../services/email.services.js";

const sendAppNotificationEmail = async ({
    recipient,
    notification,
    actionText,
    actionUrl,
    familyName,
}) => {

    if (!recipient?.email) {
        console.warn("Email skipped: recipient email not found.");
        return null;
    }

    return sendNotificationEmail({
        to: recipient.email,
        username: recipient.username,
        title: notification.title,
        message: notification.message,
        actionText,
        actionUrl,
        familyName,
    });
};

export default sendAppNotificationEmail;
