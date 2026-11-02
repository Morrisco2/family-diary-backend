import bcrypt from "bcryptjs";

// local imports
import appError from "../../exceptions/appError.js";
import statusCode from "../../constants/statusCode.js";

const decriptPassword = async (reqPassword, dbPassword, next)=>{
    const isMatch = await bcrypt.compare(reqPassword, dbPassword);

    if (!isMatch) {
        return next(new appError('password incorrect', statusCode.UNAUTHORISED))
    }

    return isMatch
}


export default decriptPassword