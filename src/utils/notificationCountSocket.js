import { getIO } from "../config/socket.js";

const notificationCountSocket = (userIds) => {
    try {
        const io = getIO();

        const uniqueUserIds = [
            ...new Set(userIds.map((id) => String(id))),
        ];

        uniqueUserIds.forEach((userId) => {
            io.to(`user:${userId}`).emit("notificationCountUpdate", {
                userId,
            });
        });
    } catch (error) {
        console.error("Notification count socket error:", error.message);
    }
};

export default notificationCountSocket;