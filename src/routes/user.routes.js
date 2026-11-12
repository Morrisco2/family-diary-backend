import {Router} from "express"
import authenticateJWT from "../middlewares/authenticate_jwt.middleware.js";
import userController from "../controllers/user.controller.js";

const router = Router();


router.get('/user-data', authenticateJWT, userController.fetchProfileData);


export default router