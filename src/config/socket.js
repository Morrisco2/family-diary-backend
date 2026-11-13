import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

import CONFIG from "./config.js";
import appError from "../exceptions/appError.js";
import statusCode from "../constants/statusCode";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: CONFIG.ENV.CLIENT_URLS,
      credentials: true,
      methods: ["GET", "POST"]
    }
  });

  // Authenticate socket connections
  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(
        socket.handshake.headers.cookie || ""
      );

      const token = cookies.accessToken;

      if (!token) {
        return next(new appError("Authentication required", statusCode.BAD_REQUEST));
      }

      const decoded = jwt.verify(
        token,
        CONFIG.ENV.JWT_ACCESS_TOKEN_SECRET
      );

      socket.user = decoded;

      next();

    } catch (error) {
      next(new appError("Invalid authentication", statusCode.BAD_REQUEST));
    }
  });

  // Connect authenticated users to private rooms
  io.on("connection", (socket) => {
    const userId = socket.user.id;

    socket.join(`user:${userId}`);

    console.log(`User connected: ${userId}`);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

// Access Socket.IO from other backend files
export const getIO = () => {
  if (!io) {
    throw new appError("Socket.IO has not been initialized", statusCode.SERVICE_UNAVAILABLE);
  }

  return io;
};