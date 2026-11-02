import { Router } from "express";
import { uploadImage } from "../utils/imageUtils/multer.js";

// local import
import authController from "../controllers/auth.controller.js";
import authMiddelware from "../middlewares/auth.middleware.js";

const router = Router()

// passport routes
router.post('/register', uploadImage("image"), authMiddelware.registerMiddleware, authController.register);
router.post('/login', authMiddelware.loginMiddleware, authController.login);


export default router;