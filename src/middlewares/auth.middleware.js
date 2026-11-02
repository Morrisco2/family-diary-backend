import { ZodError } from 'zod';


// LOCAL IMPORT
import appError from '../exceptions/appError.js';
import statusCode from '../constants/statusCode.js';
import { registerUserSchema, loginUserSchema } from '../validations/user.validation.js';




const authMiddelware = {


    // REGISTRATION MIDDELWARE

    registerMiddleware: (req, res, next) => {
        console.log("Registration body:", req.body);

        const result = registerUserSchema.safeParse(req.body);

        if (!result.success) {
            return next(
                new appError(
                    result.error.message,
                    statusCode.BAD_REQUEST
                )
            );
        }

        req.body = result.data;

        next();
    },

    // LOGIN MIDDLEWARE
    loginMiddleware: (req, res, next) => {
        try {
            loginUserSchema.parse(req.body);

            next();

        } catch (error) {
            if (error instanceof ZodError) {
                return (new appError(error.message, statusCode.BAD_REQUEST));
            }
            next(error);
        }
    }



}

export default authMiddelware;