import transporter from "../config/mail.config.js";
import notificationTemplate from "../templates/email/notificationTemplate.js";

const sendEmail = async ({
    to,
    subject,
    html,
    text,
}) => {

    if (!to || !subject || (!html && !text)) {
        throw new Error("Recipient, subject and email content are required.");
    }

    const mailOptions = {
        from: {
            name: process.env.MAIL_FROM_NAME || "Family Diary",
            address: process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER,
        },
        to,
        subject,
        html,
        text,
    };

    try {
        const result = await transporter.sendMail(mailOptions);

        return {
            success: true,
            messageId: result.messageId,
            accepted: result.accepted,
            rejected: result.rejected,
        };

    } catch (error) {
        console.error("Email delivery failed:", error.message);

        throw error;
    }
};


const sendNotificationEmail = async ({
    to,
    username,
    title,
    message,
    actionText,
    actionUrl,
    familyName,
    subject,
}) => {

    if (!to || !title || !message) {
        throw new Error(
            "Recipient, title and message are required for notification emails."
        );
    }

    const html = notificationTemplate({
        username,
        title,
        message,
        actionText,
        actionUrl,
        familyName,
    });

    const text = `
Hello ${username || "there"},

${title}

${message}

${familyName ? `Family: ${familyName}\n` : ""}

${actionText && actionUrl ? `${actionText}: ${actionUrl}\n` : ""}

Regards,
Family Diary
    `.trim();

    return sendEmail({
        to,
        subject: subject || title,
        html,
        text,
    });
};


export {
    sendEmail,
    sendNotificationEmail,
};
