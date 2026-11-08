import statusCode from "../constants/statusCode.js";
import appError from "../exceptions/appError.js";
import { familySchema } from "../validations/family.validate.js";
import validateRequest from "./security/validateRequest.js";

const familyMiddleware = (req, res, next) => {
    const familyName = req.body.familyName;
    if (!familyName.toLowerCase().includes('family')) {
        return next(new appError('family name must include the word "family" ', statusCode.BAD_REQUEST))
    } else if (familyName.toLowerCase() === 'family') {
        return next(new appError('name cannot be the word family alone!', statusCode.BAD_REQUEST))
    }
    validateRequest(familySchema)

    next()
}

export default familyMiddleware