import { Router } from "express";
import { uploadImage } from "../utils/imageUtils/multer.js";

// local import
import authController from "../controllers/auth.controller.js";
import authMiddelware from "../middlewares/auth.middleware.js";
import { authLimiter, loginLimiter } from "../middlewares/security/rateLimiter.js";

const router = Router()

// passport routes
router.get("/csrf", authController.csrfToken);
router.post('/register', authLimiter, uploadImage("image"), authMiddelware.registerMiddleware, authController.register);
router.post('/login',authLimiter,  authMiddelware.loginMiddleware, authController.login);
router.post("/logout", authLimiter, authController.logout);


export default router;