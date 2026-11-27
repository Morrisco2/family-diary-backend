import { Router } from "express";

// local import 
import familyController from "../controllers/family.controller.js";
import authenticateJWT from "../middlewares/authenticate_jwt.middleware.js";
import familyMiddleware from "../middlewares/family.middleware.js";
import authorizeRoles from "../middlewares/security/authorizeRoles.js";

const router = Router();

// family routes
router.use(authenticateJWT)
router.post('/create-family',familyMiddleware, familyController.createFamily);
router.get('/fetch-family', familyController.fetchFamilies)
router.post('/join-family', familyController.joinFamily);
router.post('/leader/confirm-member', authorizeRoles('leader', 'admin'), familyController.confirmNewMember)
router.get("/my-membership", authenticateJWT, familyController.getMyFamilyMembership)


export default router