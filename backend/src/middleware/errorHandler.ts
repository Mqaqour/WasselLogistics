import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const anyErr = err as Record<string, unknown>;
  const status  = typeof anyErr?.status  === 'number' ? anyErr.status  : 500;
  const code    = typeof anyErr?.code    === 'string'  ? anyErr.code    : 'INTERNAL_SERVER_ERROR';
  const message = err instanceof Error   ? err.message : 'An unexpected error occurred.';

  if (status >= 500) {
    if (err instanceof Error) {
      logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
    } else {
      logger.error('Unhandled error (non-Error object):', err);
    }
  } else {
    logger.warn(`Client error ${status}: ${message}`);
  }

  res.status(status).json({
    success: false,
    error: { code, message },
  });
}
