import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { verifySessionToken, SessionClaims } from '../services/auth.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionClaims;
    }
  }
}

function extractToken(req: Request): string | null {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[env.AUTH_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const header = req.get('authorization');
  if (header && header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

/**
 * Rejects the request with 401 unless it carries a valid portal session token
 * (HttpOnly cookie set at login, or `Authorization: Bearer <token>`).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } });
    return;
  }

  const claims = verifySessionToken(token);
  if (!claims) {
    res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Session expired or invalid. Please sign in again.' } });
    return;
  }

  req.user = claims;
  next();
}

/**
 * Guards write verbs only — GET/HEAD/OPTIONS stay public. Used on routers that
 * serve public reads but admin-only mutations (KB, resources, topics, tags).
 */
export function requireAuthForWrites(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }
  requireAuth(req, res, next);
}
