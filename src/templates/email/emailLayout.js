import CONFIG from "../../config/config";

const APP_NAME = "Family Diary";
const APP_COLOR = "#2E5E99";
const BACKGROUND_COLOR = "#E9F1FA";
const CARD_COLOR = "#D0DDED";
const TEXT_COLOR = "#1F2937";
const MUTED_COLOR = "#64748B";

const APP_LOGO_URL = CONFIG.ENV.FAMILY_DIARY_LOGO_URL || "";

const escapeHtml = (value = "") => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

const emailLayout = ({
    title,
    preheader = "",
    content,
    buttonText,
    buttonUrl,
    footerText = "You received this email because you are a member of Family Diary.",
}) => {

    const button = buttonText && buttonUrl
        ? `
            <div style="text-align:center; margin:32px 0;">
                <a
                    href="${escapeHtml(buttonUrl)}"
                    style="
                        display:inline-block;
                        padding:14px 26px;
                        background:${APP_COLOR};
                        color:#FFFFFF;
                        text-decoration:none;
                        border-radius:8px;
                        font-size:15px;
                        font-weight:600;
                    "
                >
                    ${escapeHtml(buttonText)}
                </a>
            </div>
        `
        : "";

    const logo = APP_LOGO_URL
        ? `
            <img
                src="${escapeHtml(APP_LOGO_URL)}"
                alt="${APP_NAME}"
                width="70"
                style="
                    display:block;
                    width:70px;
                    max-width:70px;
                    height:auto;
                    margin:0 auto 12px;
                    border:0;
                    outline:none;
                    text-decoration:none;
                "
            />
        `
        : "";

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${escapeHtml(title)}</title>
    </head>

    <body style="
        margin:0;
        padding:0;
        background:${BACKGROUND_COLOR};
        font-family:Arial, Helvetica, sans-serif;
        color:${TEXT_COLOR};
    ">

        <div style="
            display:none;
            font-size:1px;
            line-height:1px;
            max-height:0;
            max-width:0;
            opacity:0;
            overflow:hidden;
        ">
            ${escapeHtml(preheader)}
        </div>

        <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="background:${BACKGROUND_COLOR};"
        >
            <tr>
                <td align="center" style="padding:40px 16px;">

                    <table
                        role="presentation"
                        width="600"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="
                            width:100%;
                            max-width:600px;
                            background:${CARD_COLOR};
                            border-radius:14px;
                            overflow:hidden;
                        "
                    >

                        <!-- Email Header -->
                        <tr>
                            <td style="
                                padding:28px 24px;
                                text-align:center;
                                background:${APP_COLOR};
                            ">
                                ${logo}

                                <h1 style="
                                    margin:0;
                                    color:#FFFFFF;
                                    font-size:24px;
                                    font-weight:700;
                                ">
                                    ${APP_NAME}
                                </h1>
                            </td>
                        </tr>

                        <!-- Email Content -->
                        <tr>
                            <td style="padding:36px 30px 24px;">

                                <h2 style="
                                    margin:0 0 24px;
                                    font-size:24px;
                                    line-height:1.4;
                                    color:${TEXT_COLOR};
                                ">
                                    ${escapeHtml(title)}
                                </h2>

                                ${content}

                                ${button}

                            </td>
                        </tr>

                        <!-- Email Footer -->
                        <tr>
                            <td style="
                                padding:24px;
                                border-top:1px solid #E5E7EB;
                                text-align:center;
                            ">
                                <p style="
                                    margin:0;
                                    font-size:12px;
                                    line-height:1.7;
                                    color:${MUTED_COLOR};
                                ">
                                    ${escapeHtml(footerText)}
                                </p>

                                <p style="
                                    margin:12px 0 0;
                                    font-size:12px;
                                    color:${MUTED_COLOR};
                                ">
                                    &copy; ${new Date().getFullYear()}
                                    ${APP_NAME}
                                </p>
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>

    </body>
    </html>
    `;
};

export default emailLayout;
