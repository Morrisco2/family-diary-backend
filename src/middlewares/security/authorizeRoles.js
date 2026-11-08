import statusCode from "../../constants/statusCode";
import appError from "../../exceptions/appError";

const authorizeRoles = (...allowedRoles) => {

    return (req, res, next) => {

        if (!req.user) {

            return next(new appError('Authentication required', statusCode.UNAUTHORISED))
        }

        // Check the authenticated user's role.
        if (!allowedRoles.includes(req.user.role)) {
            return next(new appError('You do not have permission to perform this action', statusCode.FORBIDDEN))
        }

        return next();
    };
};

export default authorizeRoles;
