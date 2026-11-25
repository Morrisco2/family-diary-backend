
import mongoose from "mongoose";

const notificationEventSchema = new mongoose.Schema(
  {
    eventKey: {
      type: String,
      required: true,
      unique: true,
    },

    eventType: {
      type: String,
      required: true,
      enum: [
        "BIRTHDAY_REMINDER",
        "BIRTHDAY_MESSAGE",
      ],
    },

    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Families",
      default: null,
    },

    celebrant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    scheduledFor: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },

    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notifications",
      default: null,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },

    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationEventSchema.index({
  status: 1,
  scheduledFor: 1,
});

const NotificationEvent = mongoose.model(
  "NotificationEvent",
  notificationEventSchema
);

export default NotificationEvent;
