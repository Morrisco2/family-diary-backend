
import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import NotificationRead from "../models/notificationRead.model.js";
import PushSubscription from "../models/pushSubcription.model.js";
import Families from "../models/createFamily.model.js";
import { getIO } from "../config/socket.js";
import webpush, { isPushConfigured } from "../config/push.js";

const asId = (v) => String(v?._id || v?.id || v);

const emitToUsers = (userIds, notification) => {
  try {
    const io = getIO();

    for (const id of userIds) {
      io.to(`user:${asId(id)}`).emit("newNotification", notification);
    }
  } catch (error) {
    // Persistence is authoritative; Socket.IO can be unavailable during startup/tests.
    if (error.message?.includes("not been initialized")) return;

    console.error("Socket notification delivery failed:", error.message);
  }
};

export const deliverPushToUsers = async (userIds, notification) => {
  if (!isPushConfigured()) return;

  const ids = [...new Set(userIds.map(asId))];

  const subscriptions = await PushSubscription.find({
    user: { $in: ids },
    isActive: true
  }).lean();

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.text,
    notificationId: String(notification._id),
    url: "/dashboard/notification"
  });

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
            expirationTime: subscription.expirationTime
          },
          payload
        );

        await PushSubscription.updateOne(
          { _id: subscription._id },
          { $set: { lastUsedAt: new Date() } }
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.updateOne(
            { _id: subscription._id },
            { $set: { isActive: false } }
          );
        } else {
          console.error("Push delivery failed:", error.message);
        }
      }
    })
  );
};

export const publishNotification = async (data, recipientIds) => {
  const notification = await Notification.create(data);

  const recipients = [
    ...new Set((recipientIds || []).map(asId))
  ];

  if (data.channels?.includes("socket") !== false) {
    emitToUsers(recipients, notification);
  }

  if (data.channels?.includes("push") !== false) {
    await deliverPushToUsers(recipients, notification);
  }

  return notification;
};

export const createFamilyNotification = async ({
  familyId,
  senderId = null,
  title,
  text,
  type = "GENERAL",
  relatedId = null,
  confirmMember = false,
  excludedUsers = [],
  eventKey = null
}) => {
  const family = await Families.findById(familyId)
    .select("leader.id members.user members.status")
    .lean();

  if (!family) {
    throw new Error("Family not found");
  }

  const recipients = new Set([
    asId(family.leader.id)
  ]);

  for (const member of family.members || []) {
    if (member.status === "approved") {
      recipients.add(asId(member.user));
    }
  }

  for (const id of excludedUsers) {
    recipients.delete(asId(id));
  }

  return publishNotification(
    {
      recipientType: "family",
      family: familyId,
      sender: senderId,
      title,
      text,
      type,
      relatedId,
      confirmMember,
      excludedUsers,
      eventKey
    },
    [...recipients]
  );
};

export const createIndividualNotification = async ({
  userId,
  senderId = null,
  title,
  text,
  type = "GENERAL",
  relatedId = null,
  eventKey = null
}) => {
  return publishNotification(
    {
      recipientType: "individual",
      user: userId,
      sender: senderId,
      title,
      text,
      type,
      relatedId,
      eventKey
    },
    [userId]
  );
};

export const createGeneralNotification = async ({
  senderId,
  title,
  text,
  type = "APP_ANNOUNCEMENT"
}) => {
  // Snapshot current account IDs:
  // users registering later cannot see this announcement.
  const User = mongoose.model("User");

  const audienceUserIds = await User.distinct("_id", {});

  if (!audienceUserIds.length) {
    throw new Error(
      "There are no registered users to receive this announcement"
    );
  }

  return publishNotification(
    {
      recipientType: "general",
      audienceUserIds,
      sender: senderId,
      title,
      text,
      type
    },
    audienceUserIds
  );
};

// export const getVisibleNotificationQuery = async (userId) => {
//   const families = await Families.find({
//     $or: [
//       { "leader.id": userId },
//       {
//         members: {
//           $elemMatch: {
//             user: userId,
//             status: "approved"
//           }
//         }
//       }
//     ]
//   }).distinct("_id");

//   return {
//     $and: [
//       {
//         $or: [
//           {
//             recipientType: "individual",
//             user: userId
//           },
//           {
//             recipientType: "family",
//             family: { $in: families }
//           },
//           {
//             recipientType: "general",
//             audienceUserIds: userId
//           }
//         ]
//       },
//       {
//         excludedUsers: { $ne: userId }
//       }
//     ]
//   };
// };


export const getVisibleNotificationQuery = async (userId) => {
  // Normalize user ID to MongoDB ObjectId.
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const families = await Families.find({
    $or: [
      { "leader.id": userObjectId },
      {
        members: {
          $elemMatch: {
            user: userObjectId,
            status: "approved"
          }
        }
      }
    ]
  }).distinct("_id");

  return {
    $and: [
      {
        $or: [
          {
            recipientType: "individual",
            user: userObjectId
          },
          {
            recipientType: "family",
            family: { $in: families }
          },
          {
            recipientType: "general",
            audienceUserIds: userObjectId
          }
        ]
      },
      {
        excludedUsers: { $ne: userObjectId }
      }
    ]
  };
};

export const getNotifications = async (
  userId,
  { page = 1, limit = 20 } = {}
) => {
  const query = await getVisibleNotificationQuery(userId);

  const skip = (page - 1) * limit;

  // Retrieve notifications first.
  const rows = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Retrieve total count and read receipts after rows is initialized.
  const [total, receipts] = await Promise.all([
    Notification.countDocuments(query),

    NotificationRead.find({
      user: userId,
      notification: {
        $in: rows.map((notification) => notification._id)
      }
    }).lean()
  ]);

  const receiptMap = new Map(
    receipts.map((receipt) => [
      String(receipt.notification),
      receipt
    ])
  );

  const notifications = rows
    .filter((notification) => {
      const receipt = receiptMap.get(String(notification._id));

      return !receipt?.dismissedAt;
    })
    .map((notification) => {
      const receipt = receiptMap.get(String(notification._id));

      return {
        ...notification,
        id: String(notification._id),
        status: receipt?.readAt ? "read" : "unread",
        readAt: receipt?.readAt || null
      };
    });

  return {
    notifications,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
};

// export const getUnreadCount = async (userId) => {
//   const query = await getVisibleNotificationQuery(userId);

//   const result = await Notification.aggregate([
//     {
//       $match: query
//     },
//     {
//       $lookup: {
//         from: NotificationRead.collection.name,
//         let: {
//           notificationId: "$_id"
//         },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   {
//                     $eq: [
//                       "$notification",
//                       "$$notificationId"
//                     ]
//                   },
//                   {
//                     $eq: [
//                       "$user",
//                       new mongoose.Types.ObjectId(userId)
//                     ]
//                   },
//                   {
//                     $or: [
//                       {
//                         $ne: ["$readAt", null]
//                       },
//                       {
//                         $ne: ["$dismissedAt", null]
//                       }
//                     ]
//                   }
//                 ]
//               }
//             }
//           },
//           {
//             $limit: 1
//           }
//         ],
//         as: "receipt"
//       }
//     },
//     {
//       $match: {
//         receipt: { $size: 0 }
//       }
//     },
//     {
//       $count: "count"
//     }
//   ]);

//   return result[0]?.count || 0;
// };


export const getUnreadCount = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const query = await getVisibleNotificationQuery(userObjectId);

  const result = await Notification.aggregate([
    {
      $match: query
    },
    {
      $lookup: {
        from: NotificationRead.collection.name,
        let: {
          notificationId: "$_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: [
                      "$notification",
                      "$$notificationId"
                    ]
                  },
                  {
                    $eq: [
                      "$user",
                      userObjectId
                    ]
                  },
                  {
                    $or: [
                      {
                        $ne: [
                          { $ifNull: ["$readAt", null] },
                          null
                        ]
                      },
                      {
                        $ne: [
                          { $ifNull: ["$dismissedAt", null] },
                          null
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          },
          {
            $limit: 1
          }
        ],
        as: "receipt"
      }
    },
    {
      $match: {
        receipt: { $size: 0 }
      }
    },
    {
      $count: "count"
    }
  ]);

  return result[0]?.count || 0;
};


export const markNotificationRead = async (
  notificationId,
  userId
) => {
  const query = await getVisibleNotificationQuery(userId);

  const exists = await Notification.exists({
    _id: notificationId,
    ...query
  });

  if (!exists) return false;

  await NotificationRead.findOneAndUpdate(
    {
      notification: notificationId,
      user: userId
    },
    {
      $set: {
        readAt: new Date()
      }
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true
    }
  );

  return true;
};

export const markAllNotificationsRead = async (userId) => {
  const query = await getVisibleNotificationQuery(userId);

  const unread = await Notification.find(query)
    .select("_id")
    .lean();

  if (!unread.length) return 0;

  const ids = unread.map((notification) => notification._id);

  const now = new Date();

  await NotificationRead.bulkWrite(
    ids.map((notification) => ({
      updateOne: {
        filter: {
          notification,
          user: userId
        },
        update: {
          $set: {
            readAt: now
          },
          $setOnInsert: {
            notification,
            user: userId
          }
        },
        upsert: true
      }
    })),
    {
      ordered: false
    }
  );

  return ids.length;
};

export const dismissNotification = async (
  notificationId,
  userId
) => {
  const query = await getVisibleNotificationQuery(userId);

  const exists = await Notification.exists({
    _id: notificationId,
    ...query
  });

  if (!exists) return false;

  await NotificationRead.findOneAndUpdate(
    {
      notification: notificationId,
      user: userId
    },
    {
      $set: {
        dismissedAt: new Date()
      }
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true
    }
  );

  return true;
};
