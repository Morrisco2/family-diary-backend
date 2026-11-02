import { Router } from "express";

// local import 
import familyController from "../controllers/family.controller.js";
import familyMiddleware from "../middlewares/family.middleware.js";

const router = Router();

// family routes
router.use(familyMiddleware)
router.post('/create-family', familyController.createFamily);
router.get('/fetch-family', familyController.fetchFamilies)


export default router