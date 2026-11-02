import jwt from 'jsonwebtoken'


import statusCode from "../constants/statusCode.js";
import successResponse from "../exceptions/successResponse.js";
import CONFIG from "../config/config.js";
import appError from "../exceptions/appError.js";
import { findUserByEmail, createUser } from "../services/user.services.js";
import encryptPassword from "../utils/passwordUtils/encryptPassword.js";
import decriptPassword from "../utils/passwordUtils/decryptPassword.js";
import { parseAndValidateUpload } from "../utils/imageUtils/imageSizeCheck.utils.js";
import { uploadAndSaveImage } from "../utils/imageUtils/ImageUpload.cloudinary.js";

const authController = {

    // REGISTRATION CONTROLLER
    // register: async (req, res, next) => {
    //     console.log('registration route hitted');

    //     let uploadedFile = req.file || null;

    //     console.log('the image file is: ', uploadedFile);






    //     // Now req.body is safely populated by Multer
    //     const { name, email, phoneNumber, dob, password, terms } = req.body;

    //     if (!terms) {
    //         return next(new appError('please agree to the terms and condition', statusCode.BAD_REQUEST));
    //     }

    //     if (!name || !email || !phoneNumber || !password) {
    //         return next(new appError('supply the complete details ', statusCode.BAD_REQUEST));
    //     }

    //     try {
    //         let profilePictureData = null;

    //         // If an image was successfully attached and passed Zod sizing check, upload it to Cloudinary
    //         // if (uploadedFile) {
    //         //     const base64Image = `data:${uploadedFile.mimetype};base64,${uploadedFile.buffer.toString('base64')}`;

    //         //     // Your utility should return the saved DB image record or metadata
    //         //     const cloudinaryResult = await uploadAndSaveImage(base64Image);

    //         //     profilePictureData = {
    //         //         imageUrl: cloudinaryResult.image_url, // Maps to your schema paths
    //         //         cloudinary_id: cloudinaryResult.cloudinary_id
    //         //     };
    //         // }


    //         const uploadedFile = req.file || null;


    //         if (uploadedFile) {
    //             const cloudinaryResult = await uploadAndSaveImage(
    //                 uploadedFile.buffer
    //             );

    //             profilePictureData = {
    //                 imageUrl: cloudinaryResult.image_url,
    //                 cloudinary_id: cloudinaryResult.cloudinary_id
    //             };
    //         }

    //         const hashedPassword = await encryptPassword(password);

    //         // Construct userData matching your updated Mongoose Model
    //         const userData = {
    //             name,
    //             email,
    //             phoneNumber,
    //             dob,
    //             password: hashedPassword,
    //             terms,
    //             image: profilePictureData // Stores null if no image was provided
    //         };

    //         const newUser = await createUser(userData);

    //         if (!newUser) {
    //             return next(new appError('An error occurred, please try again', statusCode.INTERNAL_SERVER_ERROR));
    //         }

    //         console.log('new user is: ', newUser);

    //         //Return success response to the client
    //         return successResponse(res, 'Registration successful', newUser);

    //     } catch (error) {
    //         console.log('error creating user: ', error.message);

    //         // Email Already Exists 
    //         if (error.code === 11000) {
    //             const field = Object.keys(error.keyValue)[0];
    //             return next(new appError(`This ${field} is already registered.`, statusCode.BAD_REQUEST));
    //         }

    //         if (
    //             error.name === 'MongooseServerSelectionError' ||
    //             error.message.includes('topology') ||
    //             error.message.includes('ECONNREFUSED')
    //         ) {
    //             return next(new appError('Database service is temporarily unavailable. Please try again later.', statusCode.SERVICE_UNAVAILABLE));
    //         }

    //         // Catch any other unhandled errors 
    //         return next(new appError(error.message, statusCode.INTERNAL_SERVER_ERROR));
    //     }




    //     // const { name, email, phoneNumber, dob, password, image, terms } = req.body;

    //     // if (!terms) {
    //     //     return next(new appError('please agree to the terms and condition', statusCode.BAD_REQUEST))
    //     // }

    //     // if (!name || !email || !phoneNumber || !password) {
    //     //     return next(new appError('supply the complete details ', statusCode.BAD_REQUEST))
    //     // }

    //     // const hashedPassword = await encryptPassword(password);

    //     // const userData = {
    //     //     name, email, phoneNumber, dob, password: hashedPassword, terms, image
    //     // }

    //     // try {
    //     //     const newUser = await createUser(userData);

    //     //     if (!newUser) {
    //     //         return next(new appError('An error occurred, please try again', statusCode.INTERNAL_SERVER_ERROR));
    //     //     }

    //     //     console.log('new user is: ', newUser);

    //     // } catch (error) {
    //     //     console.log('error creating user: ', error.message);

    //     //     // Email Already Exists 
    //     //     if (error.code === 11000) {
    //     //         const field = Object.keys(error.keyValue)[0];
    //     //         return next(new appError(`This ${field} is already registered.`, statusCode.BAD_REQUEST));
    //     //     }

    //     //     if (
    //     //         error.name === 'MongooseServerSelectionError' ||
    //     //         error.message.includes('topology') ||
    //     //         error.message.includes('ECONNREFUSED')
    //     //     ) {
    //     //         return next(new appError('Database service is temporarily unavailable. Please try again later.', statusCode.SERVICE_UNAVAILABLE));
    //     //     }

    //     //     //  Catch any other unhandled errors 
    //     //     return next(new appError(error.message, statusCode.INTERNAL_SERVER_ERROR));
    //     // }






    // },


    register: async (req, res, next) => {
        console.log("Registration route hit");

        try {
            // Multer has already processed the uploaded image.
            const uploadedFile = req.file || null;

            const { name, email, phoneNumber, dob, password, terms } = req.body;

            console.log(name, email, phoneNumber, dob, password, terms);

            // Validate terms
            if (terms !== "true") {
                return next(
                    new appError(
                        "Please agree to the terms and conditions.",
                        statusCode.BAD_REQUEST
                    )
                );
            }

            // Validate required fields
            if (!name || !email || !phoneNumber || !password) {
                return next(
                    new appError(
                        "Supply the complete details.",
                        statusCode.BAD_REQUEST
                    )
                );
            }

            let profilePictureData = null;

            // Upload image to Cloudinary if provided
            if (uploadedFile) {
                const cloudinaryResult = await uploadAndSaveImage(
                    uploadedFile.buffer
                );

                profilePictureData = {
                    imageUrl: cloudinaryResult.image_url,
                    cloudinary_id: cloudinaryResult.cloudinary_id
                };
            }

            // Hash password
            const hashedPassword = await encryptPassword(password);

            // Prepare user data
            const userData = {
                name,
                email,
                phoneNumber,
                dob,
                password: hashedPassword,
                terms: true,
                image: profilePictureData
            };

            // Create user
            const newUser = await createUser(userData);

            if (!newUser) {
                return next(
                    new appError(
                        "An error occurred, please try again.",
                        statusCode.INTERNAL_SERVER_ERROR
                    )
                );
            }

            console.log("New user created successfully");

            return successResponse(
                res,
                "Registration successful",
                newUser
            );

        } catch (error) {
            console.error("Registration error:", error);

            // Handle duplicate email or other unique fields
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];

                return next(
                    new appError(
                        `This ${field} is already registered.`,
                        statusCode.BAD_REQUEST
                    )
                );
            }

            // Handle database connection errors
            if (
                error.name === "MongooseServerSelectionError" ||
                error.message?.includes("topology") ||
                error.message?.includes("ECONNREFUSED")
            ) {
                return next(
                    new appError(
                        "Database service is temporarily unavailable. Please try again later.",
                        statusCode.SERVICE_UNAVAILABLE
                    )
                );
            }

            return next(
                new appError(
                    error.message || "Registration failed.",
                    statusCode.INTERNAL_SERVER_ERROR
                )
            );
        }
    },


    // LOGIN CONTROLLER
    login: async (req, res, next) => {
        const { email, password } = req.body
        console.log('login controller: ', email, password);

        try {
            // Find user
            const user = await findUserByEmail(email);

            if (!user) {
                console.log('there no user in databse ');

                return next(new appError('User not registered', statusCode.UNAUTHORISED))
            }

            // Create payload for JWT
            const payload = {
                id: user.id,
                email: user.email,
                username: user.name,
                role: user.role
            };

            console.log(payload);

            const secret = CONFIG.ENV;

            console.log('my secret token is: ', secret);


            // Sign token
            const token = jwt.sign(payload, CONFIG.ENV.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.cookie("accessToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: "/",
            });

            successResponse(res, token, 'login successful')

        } catch (error) {
            console.log('error finding user by email: ', error);

        }



    },


}

export default authController