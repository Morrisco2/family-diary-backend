import mongoose from "mongoose";
const notificationReadSchema = new mongoose.Schema({
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notifications",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  readAt: {
    type: Date,
    default: null
  },
  dismissedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });
notificationReadSchema.index({ notification: 1, user: 1 }, { unique: true });
notificationReadSchema.index({ user: 1, readAt: 1, dismissedAt: 1 });
export default mongoose.models.NotificationRead || mongoose.model("NotificationRead", notificationReadSchema);
