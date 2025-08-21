import { io } from 'socket.io-client';

export function createSocketConnection(token) {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const socket = io(url, {
    transports: ['websocket'],
    path: '/socket.io',
    auth: { token },
    autoConnect: true,
  });
  return socket;
}