import statusCode from "../constants/statusCode.js";
import appError from "../exceptions/appError.js";
import successResponse from "../exceptions/successResponse.js";


const userController = {
    fetchProfileData: async (req, res, next)=>{

        console.log("fetch user profile data route hitted");
        console.log("the user data is: ", req.user);
        

        if (!req.user) {
            return next(new appError("please login first", statusCode.UNAUTHORISED))
        }

        successResponse(res, req.user, "user data fetched successfully", statusCode.SUCCESS)
        
        
    }
}


export default userController