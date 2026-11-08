import { v2 as cloudinary } from "cloudinary";
import CONFIG from "../../config/config.js";
import appError from "../../exceptions/appError.js";
import statusCode from "../../constants/statusCode.js";

cloudinary.config({
    cloud_name: CONFIG.ENV.CLOUD_NAME,
    api_key: CONFIG.ENV.CLOUD_API_KEY,
    api_secret: CONFIG.ENV.CLOUD_API_SECRET
});

export async function uploadAndSaveImage(fileBuffer, mimeType = "image/jpeg") {
    if (!CONFIG.ENV.CLOUD_NAME || !CONFIG.ENV.CLOUD_API_KEY || !CONFIG.ENV.CLOUD_API_SECRET) {
        throw new appError("Image upload service is not configured.", statusCode.SERVICE_UNAVAILABLE);
    }

    try {
        const base64Image = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: "family_diary_images",
            resource_type: "image",
            transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
                { quality: "auto", fetch_format: "auto" }
            ]
        });

        return {
            image_url: result.secure_url,
            cloudinary_id: result.public_id,
            format: result.format,
            createdAt: result.created_at
        };
    } catch (error) {
        console.error("Cloudinary upload failed:", error.message);
        throw new appError(
            "Unable to upload profile picture. Please try again.",
            statusCode.SERVICE_UNAVAILABLE
        );
    }
}
