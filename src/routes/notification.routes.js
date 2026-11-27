import { Router } from "express";
import authenticateJWT from "../middlewares/authenticate_jwt.middleware.js";
import authorizeRoles from "../middlewares/security/authorizeRoles.js";
import controller from "../controllers/notification.controller.js";


const router = Router();

router.use(authenticateJWT);
router.get("/", controller.list);
router.get("/unread-count", controller.unreadCount);
router.patch("/read-all", controller.markAllRead);
router.patch("/:id/read", controller.markRead);
router.delete("/:id", controller.dismiss);
router.get("/push/public-key", controller.publicKey);
router.post("/push/subscribe", controller.subscribePush);
router.delete("/push/unsubscribe", controller.unsubscribePush);
router.post("/admin", authorizeRoles("admin"), controller.createGeneral);
router.post(
    "/admin/test-socket",
    controller.testSocketNotification
);
export default router;
