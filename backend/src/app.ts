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

  // CORS — supports single URL or comma-separated list in FRONTEND_URL
  const allowedOrigins = env.FRONTEND_URL
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }));
  // Respond 204 to all OPTIONS preflight requests before any auth middleware
  app.options('*', cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
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

  // QuickRate proxy — forwards to quickrate.wassel.ps with the server-side API key
  app.post('/api/quickrate/*', async (req, res) => {
    const upstreamPath = req.path.replace('/api/quickrate', '');
    const url = `${env.QUICKRATE_BASE_URL}${upstreamPath}`;
    try {
      const upstream = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.QUICKRATE_API_KEY,
        },
        body: JSON.stringify(req.body),
      });
      const data = await upstream.json().catch(() => ({}));
      res.status(upstream.status).json(data);
    } catch (err) {
      res.status(502).json({ error: 'QuickRate upstream error' });
    }
  });

  // Centralised error handler (must be last)
  app.use(errorHandler);

  return app;
}
