import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { API_BASE_URL } from './env';

const SOCKET_URL = API_BASE_URL;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  const token = Cookies.get('token') || Cookies.get('accessToken');

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected to backend:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('⚠️ Socket connection error:', error);
    });
  } else {
    // Check if token changed (e.g. user logged in or switched account)
    const currentSocketToken = socket.auth && (socket.auth as { token?: string }).token;
    if (currentSocketToken !== token) {
      console.log('🔄 Token changed, updating socket auth and reconnecting...');
      socket.auth = { token };
      socket.disconnect().connect();
    }
  }
  return socket;
};

export const joinEventRoom = (eventId: string) => {
  const s = getSocket();
  if (s && eventId) {
    s.emit('room:join', { eventId });
    console.log(`📡 Joined Socket Room: event:${eventId}`);
  }
};

export const leaveEventRoom = (eventId: string) => {
  const s = getSocket();
  if (s && eventId) {
    s.emit('room:leave', { eventId });
  }
};

export const placeBidSocket = (eventId: string, itemId: string, amount: number) => {
  const s = getSocket();
  if (s) {
    const token = Cookies.get('token') || Cookies.get('accessToken');
    s.emit('bid:place', { token, eventId, itemId, amount });
  }
};
