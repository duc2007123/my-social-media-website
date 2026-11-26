import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let ioInstance = null;
const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (server, clientUrl) => {
  const io = new Server(server, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    // Register user only after verifying the submitted access token.
    socket.on('register_user', ({ userId, token } = {}) => {
      if (!userId || !token) return;

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_traveljournal_btl_2026');
        if (decoded.id?.toString() !== userId.toString()) return;
      } catch {
        return;
      }

      const normalizedUserId = userId.toString();
      const previousUserId = socket.data.userId;
      if (previousUserId && previousUserId !== normalizedUserId) {
        socket.leave(`user_${previousUserId}`);
        if (onlineUsers.get(previousUserId) === socket.id) onlineUsers.delete(previousUserId);
      }

      socket.data.userId = normalizedUserId;
      onlineUsers.set(normalizedUserId, socket.id);
      socket.join(`user_${normalizedUserId}`);
      console.log(`[Socket.IO] User registered: ${normalizedUserId} -> Socket: ${socket.id}`);
    });

    socket.on('unregister_user', () => {
      const userId = socket.data.userId;
      if (!userId) return;

      socket.leave(`user_${userId}`);
      if (onlineUsers.get(userId) === socket.id) onlineUsers.delete(userId);
      socket.data.userId = null;
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      for (const [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`[Socket.IO] User disconnected: ${userId}`);
          break;
        }
      }
    });
  });

  ioInstance = io;
  return io;
};

// Helper function to send notification to a specific user
export const sendNotificationToUser = (targetUserId, notificationData) => {
  if (!ioInstance) return;
  ioInstance.to(`user_${targetUserId}`).emit('new_notification', notificationData);
};

// Helper function to broadcast new post
export const broadcastNewPost = (postData) => {
  if (!ioInstance) return;
  ioInstance.emit('new_post', postData);
};

// Helper function to broadcast like/unlike count update
export const broadcastPostLikeUpdate = (postId, likesCount, likedUserIds) => {
  if (!ioInstance) return;
  ioInstance.emit('post_like_updated', { postId, likesCount, likedUserIds });
};

export const getIO = () => ioInstance;
