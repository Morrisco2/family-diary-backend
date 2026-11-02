import multer from 'multer';
import { z } from 'zod';
import appError from '../../exceptions/appError.js';
import statusCode from '../../constants/statusCode.js';
import { imageValidationSchema, MAX_FILE_SIZE } from '../../validations/user.validation.js';

// Initialize a reusable instance of Multer using memory storage
const multerInstance = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE }
});

/**
 * Reusable utility to process and validate file uploads.
 * @param {object} req
 * @param {object} res 
 * @param {string} fieldName 
 * @returns {Promise<object>} 
 */
export const parseAndValidateUpload = (req, res, fieldName = 'avatar') => {
    return new Promise((resolve, reject) => {
        const upload = multerInstance.single(fieldName);

        upload(req, res, (err) => {
            // Handle native Multer size violations
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return reject(new appError("File is too large. Maximum size allowed is 5MB.", statusCode.BAD_REQUEST));
                }
                return reject(new appError(err.message, statusCode.BAD_REQUEST));
            } else if (err) {
                return reject(new appError("An unexpected upload error occurred.", statusCode.INTERNAL_SERVER_ERROR));
            }

            // Ensure a file actually reached the server
            if (!req.file) {
                return reject(new appError("Please upload an image file.", statusCode.BAD_REQUEST));
            }

            // Hand structural file metadata off to Zod
            try {
                imageValidationSchema.parse(req.file);
                
                // Success! Resolve the promise with the file details
                resolve(req.file);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    const errorMessage = error.errors[0]?.message || "Invalid file properties.";
                    return reject(new appError(errorMessage, statusCode.BAD_REQUEST));
                }
                reject(error);
            }
        });
    });
};
