
import { v2 as cloudinary } from "cloudinary";
import CONFIG from "../../config/config.js";

import appError from "../../exceptions/appError.js";
import statusCode from "../../constants/statusCode.js";

cloudinary.config({
    cloud_name: CONFIG.ENV.CLOUD_NAME,
    api_key: CONFIG.ENV.CLOUD_API_KEY,
    api_secret: CONFIG.ENV.CLOUD_API_SECRET,
});

export async function uploadAndSaveImage(fileBuffer) {
    try {
        const base64Image = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;

        const cloudinaryResponse = await cloudinary.uploader.upload(
            base64Image,
            {
                folder: "family_diary_images",
                transformation: [
                    {
                        width: 400,
                        height: 400,
                        crop: "fill",
                        gravity: "face"
                    },
                    {
                        quality: "auto",
                        fetch_format: "auto"
                    }
                ]
            }
        );

        return {
            image_url: cloudinaryResponse.secure_url,
            cloudinary_id: cloudinaryResponse.public_id,
            format: cloudinaryResponse.format,
            createdAt: cloudinaryResponse.created_at
        };

    } catch (error) {
        console.error("Cloudinary upload failed:", error);

        throw new appError(
            "Unable to upload profile picture. Please try again.",
            statusCode.INTERNAL_SERVER_ERROR
        );
    }
}
