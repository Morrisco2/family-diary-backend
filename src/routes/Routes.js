import { Router } from "express";
import authRoutes from './auth.routes.js';
import familyRoutes from './family.routes.js';
import searchRoutes from './search.routes.js'
import userRoute from './user.routes.js'

const router = Router();

router.use("/auth", authRoutes);
router.use("/family", familyRoutes);
router.use("/search", searchRoutes);
router.use('/user', userRoute);


export default router;