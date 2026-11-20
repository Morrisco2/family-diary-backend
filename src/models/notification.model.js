import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientType: { type: String, required: true, enum: ["family", "individual", "general"] },
  family: { type: mongoose.Schema.Types.ObjectId, ref: "Families", default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  // Explicit publication-time audience snapshot for general announcements.
  audienceUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  excludedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  title: { type: String, required: true, trim: true, maxlength: 150 },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  type: { type: String, required: true, enum: ["BIRTHDAY_REMINDER", "BIRTHDAY_MESSAGE", "MEMBER_CONFIRMATION", "FAMILY_INVITATION", "FAMILY_UPDATE", "APP_ANNOUNCEMENT", "GENERAL"] },
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  confirmMember: { type: Boolean, default: false },
  channels: { type: [String], enum: ["in_app", "socket", "push"], default: ["in_app", "socket", "push"] },
  eventKey: { type: String, default: null },
  scheduledFor: { type: Date, default: null }
}, { timestamps: true });

notificationSchema.pre("validate", function (next) {
  const hasFamily = Boolean(this.family);
  const hasUser = Boolean(this.user);
  if (this.recipientType === "family" && (!hasFamily || hasUser)) return next(new Error("Invalid family notification destination"));
  if (this.recipientType === "individual" && (!hasUser || hasFamily)) return next(new Error("Invalid individual notification destination"));
  if (this.recipientType === "general" && (hasFamily || hasUser || !this.audienceUserIds?.length)) return next(new Error("General announcements require a publication-time audience"));
  next();
});

notificationSchema.index({ eventKey: 1 }, { unique: true, partialFilterExpression: { eventKey: { $type: "string" } } });
notificationSchema.index({ family: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ audienceUserIds: 1, createdAt: -1 });
notificationSchema.index({ recipientType: 1, createdAt: -1 });

export default mongoose.models.Notifications || mongoose.model("Notifications", notificationSchema);
