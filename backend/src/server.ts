import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { initSocketService } from './services/socket.service';
import { getPool, closePool } from './config/database';
import { setDbAvailable } from './repositories/chat.repository';
import { logger } from './utils/logger';
import { seedQuestionsKnowledgeBaseAsync } from './seeds/questionsKnowledgeBase.seed';

// Last-resort safety net. An EventEmitter 'error' with no listener (e.g. a
// dropped response socket, a DB pool's background connection error) crashes
// the whole process with no chance for any try/catch to see it — which is
// exactly why several outages today showed up as a bare iisnode 404/500 with
// nothing in any log. Logging here at least captures the real error before
// the (inevitable, unavoidable) restart, instead of losing it entirely.
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — process will exit:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection — process will exit:', reason);
  process.exit(1);
});

async function main() {
  const app        = createApp();
  const httpServer = http.createServer(app);

  initSocketService(httpServer);

  const port = process.env.PORT ?? 3000;
  httpServer.listen(port, () => {
    logger.info(`Wassel Chat Backend running on port ${port} [${env.NODE_ENV}]`);
  });

  // Warm up DB in background so HTTP startup is never blocked by DB connectivity.
  void (async () => {
    try {
      await getPool();
      setDbAvailable(true);
      // Seed the Questions Knowledge Base (idempotent — safe to run every startup)
      await seedQuestionsKnowledgeBaseAsync();
    } catch (err) {
      setDbAvailable(false);
      logger.warn('Could not connect to SQL Server on startup — chat features will be unavailable until the DB is reachable.');
      logger.warn(String(err));
    }
  })();

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
