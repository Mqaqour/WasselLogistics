import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function authRespondio(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header.' },
    });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== env.RESPOND_API_TOKEN) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid Bearer token.' },
    });
    return;
  }

  next();
}
