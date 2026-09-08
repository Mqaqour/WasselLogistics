import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types/chat.types';

const BASE_URL = import.meta.env.VITE_CHAT_BACKEND_URL?.trim();

let socket: Socket | null = null;

// Sessions currently joined, replayed on every (re)connect. A socket.io reconnect
// (a network blip, a backgrounded tab, ...) gets a *new* server-side socket.id and
// therefore loses server-side room membership even though this client-side Socket
// object and its listeners are untouched — without this, a dropped-then-restored
// connection silently stops receiving "message:new" for the room it had joined,
// and the chat looks like it needs a page refresh to show new replies.
const joinedSessions = new Set<string>();

export const socketClient = {
  connect(): Socket {
    // Reuse the existing instance even mid-handshake. Previously this recreated the
    // socket whenever `.connected` was momentarily false (e.g. still connecting when
    // ChatWindow mounted right after ChatWidget), which orphaned the socket that had
    // just joined the session's room — the new instance never rejoined it, so replies
    // stopped arriving live until a full page reload made everything reconnect in order.
    if (!socket) {
      socket = io(BASE_URL || undefined, {
        transports: ['websocket'],
        autoConnect: true,
      });
      socket.on('connect', () => {
        joinedSessions.forEach((sid) => socket!.emit('joinSession', sid));
      });
    }
    return socket;
  },

  joinSession(sessionId: string) {
    joinedSessions.add(sessionId);
    socket?.emit('joinSession', sessionId);
  },

  leaveSession(sessionId: string) {
    joinedSessions.delete(sessionId);
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
    joinedSessions.clear();
  },
};
