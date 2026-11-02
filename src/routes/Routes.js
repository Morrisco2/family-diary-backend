import { Router } from "express";
import authRoutes from './auth.routes.js';
import familyRoutes from './family.routes.js';

const router = Router();

router.use("/auth", authRoutes);
router.use("/family", familyRoutes);


export default router;