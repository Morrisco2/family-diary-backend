import validateRequest from "./security/validateRequest.js";
import { registerUserSchema, loginUserSchema } from "../validations/user.validation.js";

const authMiddleware = {
    registerMiddleware: validateRequest(registerUserSchema),
    loginMiddleware: validateRequest(loginUserSchema)
};

export default authMiddleware;