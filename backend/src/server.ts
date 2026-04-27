import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { initSocketService } from './services/socket.service';
import { getPool, closePool } from './config/database';
import { setDbAvailable } from './repositories/chat.repository';
import { logger } from './utils/logger';

async function main() {
  // Warm up DB connection pool (non-fatal — server starts even if DB is unavailable)
  try {
    await getPool();
    setDbAvailable(true);
  } catch (err) {
    setDbAvailable(false);
    logger.warn('Could not connect to SQL Server on startup — chat features will be unavailable until the DB is reachable.');
    logger.warn(String(err));
  }

  const app        = createApp();
  const httpServer = http.createServer(app);

  initSocketService(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`Wassel Chat Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal} — shutting down gracefully...`);
    httpServer.close(async () => {
      await closePool();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
