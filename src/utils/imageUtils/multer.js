
import multer from "multer";
import { z } from "zod";

import appError from "../../exceptions/appError.js";
import statusCode from "../../constants/statusCode.js";

import {
    imageValidationSchema,
    MAX_FILE_SIZE
} from "../../validations/user.validation.js";

// Configure Multer
const storage = multer.memoryStorage();

const multerInstance = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(
                new appError(
                    "Only JPEG, PNG, WEBP and GIF images are allowed.",
                    statusCode.BAD_REQUEST
                )
            );
        }

        cb(null, true);
    }
});

// Reusable single-image upload middleware
export const uploadImage = (fieldName = "image") => {
    return (req, res, next) => {
        multerInstance.single(fieldName)(req, res, (error) => {
            if (error) {
                if (error instanceof multer.MulterError) {
                    if (error.code === "LIMIT_FILE_SIZE") {
                        return next(
                            new appError(
                                "File is too large. Maximum size allowed is 5MB.",
                                statusCode.BAD_REQUEST
                            )
                        );
                    }

                    return next(
                        new appError(error.message, statusCode.BAD_REQUEST)
                    );
                }

                return next(error);
            }

            // Validate uploaded file with Zod
            if (req.file) {
                const result = imageValidationSchema.safeParse(req.file);

                if (!result.success) {
                    return next(
                        new appError(
                            result.error.issues[0]?.message ||
                            "Invalid image file.",
                            statusCode.BAD_REQUEST
                        )
                    );
                }
            }

            next();
        });
    };
};

export default multerInstance;
