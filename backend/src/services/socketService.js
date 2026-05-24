import { io } from 'socket.io-client';

// Admin dashboard socket (real-time events only)
const socket = io('https://ecommerce-app-backend-1kn0.onrender.com', {
  transports: ['websocket'],
});

export const connectAdminSocket = () => {
  // Subscribe once
  socket.emit('subscribe-admin');
};

export default socket;

