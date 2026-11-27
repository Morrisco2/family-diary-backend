
import emailLayout from "./emailLayout.js";

const escapeHtml = (value = "") => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

const notificationTemplate = ({
    username,
    title,
    message,
    actionText,
    actionUrl,
    familyName,
}) => {

    const safeUsername = escapeHtml(username || "there");
    const safeMessage = escapeHtml(message || "").replace(/\n/g, "<br>");
    const safeFamilyName = escapeHtml(familyName || "");

    const familyContent = safeFamilyName
        ? `
            <p style="
                font-size:14px;
                color:#64748B;
                margin:0 0 20px;
            ">
                Family: <strong>${safeFamilyName}</strong>
            </p>
        `
        : "";

    const content = `
        <p style="
            font-size:16px;
            line-height:1.7;
            margin:0 0 20px;
        ">
            Hello ${safeUsername},
        </p>

        ${familyContent}

        <div style="
            font-size:15px;
            line-height:1.8;
            color:#374151;
        ">
            ${safeMessage}
        </div>
    `;

    return emailLayout({
        title,
        preheader: message,
        content,
        buttonText: actionText,
        buttonUrl: actionUrl,
    });
};

export default notificationTemplate;
