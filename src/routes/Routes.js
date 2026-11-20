import { Router } from "express";
import authRoutes from "./auth.routes.js";
import familyRoutes from "./family.routes.js";
import searchRoutes from "./search.routes.js";
import userRoute from "./user.routes.js";
import notificationRoutes from "./notification.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/family", familyRoutes);
router.use("/search", searchRoutes);
router.use("/user", userRoute);
router.use("/notifications", notificationRoutes);

export default router;
