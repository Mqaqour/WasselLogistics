import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { SocketMessageNewEvent } from '../types/chat.types';

let io: SocketServer | null = null;

export function initSocketService(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on('joinSession', (sessionId: string) => {
      const room = `chat:${sessionId}`;
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('leaveSession', (sessionId: string) => {
      const room = `chat:${sessionId}`;
      socket.leave(room);
      logger.debug(`Socket ${socket.id} left room ${room}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitAgentMessage(sessionId: string, event: SocketMessageNewEvent): void {
  if (!io) {
    logger.warn('Socket.IO not initialised — cannot emit agent message.');
    return;
  }
  io.to(`chat:${sessionId}`).emit('message:new', event);
}

export function emitChatClosed(sessionId: string): void {
  if (!io) return;
  io.to(`chat:${sessionId}`).emit('chat:closed');
}
