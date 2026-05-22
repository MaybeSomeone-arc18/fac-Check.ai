import { io } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export const socket = io(URL as string, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket'] // Force WebSockets to prevent 400 Session ID errors on Next.js proxying
});
