import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ['websocket', 'polling']
});

let registeredUser = null;

socket.on('connect', () => {
  if (registeredUser) {
    socket.emit('register_user', registeredUser);
  }
});

// Register authenticated users now and again after reconnects.
export const registerSocketUser = (userId, token) => {
  registeredUser = userId && token ? { userId: userId.toString(), token } : null;
  if (registeredUser && socket.connected) socket.emit('register_user', registeredUser);
};

export const unregisterSocketUser = () => {
  registeredUser = null;
  if (socket.connected) socket.emit('unregister_user');
};

export default socket;
