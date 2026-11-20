
import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    endpoint: {
      type: String,
      required: true,
    },

    keys: {
      p256dh: {
        type: String,
        required: true,
      },

      auth: {
        type: String,
        required: true,
      },
    },

    expirationTime: {
      type: Number,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

pushSubscriptionSchema.index(
  { endpoint: 1 },
  { unique: true }
);

pushSubscriptionSchema.index({
  user: 1,
  isActive: 1,
});

const PushSubscription = mongoose.model(
  "PushSubscriptions",
  pushSubscriptionSchema
);

export default PushSubscription;
