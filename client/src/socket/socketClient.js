import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ['websocket', 'polling']
});

// Helper to register authenticated user on socket
export const registerSocketUser = (userId) => {
  if (userId && socket.connected) {
    socket.emit('register_user', userId);
  }
};

export default socket;
