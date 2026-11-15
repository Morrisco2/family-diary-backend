import Notification from "../models/Notification.js";
import { getIO } from "../config/socket.js";

const createNotification = async ({
  recipient,
  sender,
  title,
  message,
  type,
  relatedId
}) => {

  // Save notification to database
  const notification = await Notification.create({
    recipient,
    sender,
    title,
    message,
    type,
    relatedId,
    isRead: false
  });

  // Send real-time notification
  getIO()
    .to(`user:${recipient}`)
    .emit("newNotification", notification);

  return notification;
};

export default createNotification;