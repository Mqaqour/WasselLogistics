import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import chatRoutes from './routes/chat.routes';
import respondioRoutes from './routes/respondio.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — restricted to FRONTEND_URL
  app.use(cors({
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing
  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
  });

  // Routes
  app.use('/api/chat',      chatRoutes);
  app.use('/api/respondio', respondioRoutes);

  // Centralised error handler (must be last)
  app.use(errorHandler);

  return app;
}
