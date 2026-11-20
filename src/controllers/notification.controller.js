import statusCode from "../constants/statusCode.js";
import appError from "../exceptions/appError.js";
import successResponse from "../exceptions/successResponse.js";
import PushSubscription from "../models/pushSubcription.model.js";
import CONFIG from "../config/config.js";
import { createGeneralNotification, getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, dismissNotification } from "../services/notification.services.js";

const controller = {
  list: async (req, res, next) => {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page || "1", 10));
      const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || "20", 10)));
      return successResponse(res, await getNotifications(req.user.id, { page, limit }), "Notifications fetched successfully");
    } catch (e) { return next(e); }
  },
  unreadCount: async (req, res, next) => { try { return successResponse(res, { count: await getUnreadCount(req.user.id) }, "Unread count fetched"); } catch (e) { return next(e); } },
  markRead: async (req, res, next) => { try { const ok = await markNotificationRead(req.params.id, req.user.id); if (!ok) return next(new appError("Notification not found", statusCode.NOT_FOUND)); return successResponse(res, null, "Notification marked as read"); } catch (e) { return next(e); } },
  markAllRead: async (req, res, next) => { try { const count = await markAllNotificationsRead(req.user.id); return successResponse(res, { count }, "Notifications marked as read"); } catch (e) { return next(e); } },
  dismiss: async (req, res, next) => { try { const ok = await dismissNotification(req.params.id, req.user.id); if (!ok) return next(new appError("Notification not found", statusCode.NOT_FOUND)); return successResponse(res, null, "Notification dismissed"); } catch (e) { return next(e); } },
  subscribePush: async (req, res, next) => {
    try {
      const { endpoint, keys, expirationTime } = req.body || {};
      if (!endpoint || !keys?.p256dh || !keys?.auth) return next(new appError("A valid push subscription is required", statusCode.BAD_REQUEST));
      await PushSubscription.findOneAndUpdate({ endpoint }, { $set: { user: req.user.id, endpoint, keys, expirationTime: expirationTime || null, userAgent: req.get("user-agent") || null, isActive: true, lastUsedAt: new Date() } }, { upsert: true, new: true, setDefaultsOnInsert: true });
      return successResponse(res, null, "Push notifications enabled");
    } catch (e) { return next(e); }
  },
  unsubscribePush: async (req, res, next) => { try { const { endpoint } = req.body || {}; if (endpoint) await PushSubscription.updateOne({ user: req.user.id, endpoint }, { $set: { isActive: false } }); return successResponse(res, null, "Push subscription removed"); } catch (e) { return next(e); } },
  publicKey: (req, res, next) => { if (!CONFIG.ENV.VAPID_PUBLIC_KEY) return next(new appError("Push notifications are not configured on this server", statusCode.SERVICE_UNAVAILABLE)); return successResponse(res, { publicKey: CONFIG.ENV.VAPID_PUBLIC_KEY }, "Push public key fetched"); },
  createGeneral: async (req, res, next) => {
    try {
      const { title, text } = req.body || {};
      if (!title?.trim() || !text?.trim()) return next(new appError("Title and message are required", statusCode.BAD_REQUEST));
      const notification = await createGeneralNotification({ senderId: req.user.id, title, text });
      return successResponse(res, notification, "General announcement published", statusCode.CREATED);
    } catch (e) { return next(e); }
  }
};
export default controller;
