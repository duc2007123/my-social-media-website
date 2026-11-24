import { Server } from 'socket.io';

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

    // Register user when authenticated
    socket.on('register_user', (userId) => {
      if (userId) {
        onlineUsers.set(userId.toString(), socket.id);
        socket.join(`user_${userId}`);
        console.log(`[Socket.IO] User registered: ${userId} -> Socket: ${socket.id}`);
      }
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
