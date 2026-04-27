import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types/chat.types';

const BASE_URL = import.meta.env.VITE_CHAT_BACKEND_URL?.trim();

let socket: Socket | null = null;

export const socketClient = {
  connect(): Socket {
    if (!socket || !socket.connected) {
      socket = io(BASE_URL || undefined, {
        transports: ['websocket'],
        autoConnect: true,
      });
    }
    return socket;
  },

  joinSession(sessionId: string) {
    socket?.emit('joinSession', sessionId);
  },

  leaveSession(sessionId: string) {
    socket?.emit('leaveSession', sessionId);
  },

  onMessage(callback: (msg: ChatMessage) => void) {
    socket?.on('message:new', callback);
  },

  offMessage(callback: (msg: ChatMessage) => void) {
    socket?.off('message:new', callback);
  },

  onChatClosed(callback: () => void) {
    socket?.on('chat:closed', callback);
  },

  disconnect() {
    socket?.disconnect();
    socket = null;
  },
};
