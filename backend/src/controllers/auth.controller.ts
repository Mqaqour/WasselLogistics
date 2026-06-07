import { Request, Response } from 'express';
import { env } from '../config/env';
import * as authRepo from '../repositories/auth.repository';
import { sendLoginBlockedNotification, verifyPassword } from '../services/auth.service';
import { logger } from '../utils/logger';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

function normalizeIp(ipAddress: string | undefined): string {
  const normalized = (ipAddress || 'unknown').trim();

  if (normalized.startsWith('::ffff:')) {
    return normalized.slice(7);
  }

  return normalized || 'unknown';
}

function getClientIp(req: Request): string {
  return normalizeIp(req.ip || req.socket.remoteAddress);
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * MILLISECONDS_PER_HOUR);
}

function isFutureDate(date: Date | null, now: Date): date is Date {
  return date instanceof Date && date.getTime() > now.getTime();
}

function shouldResetFailedAttempts(lastAttemptAt: Date | null, blockedUntil: Date | null, now: Date): boolean {
  if (blockedUntil instanceof Date && blockedUntil.getTime() <= now.getTime()) {
    return true;
  }

  if (lastAttemptAt instanceof Date && addHours(lastAttemptAt, env.LOGIN_BLOCK_HOURS).getTime() <= now.getTime()) {
    return true;
  }

  return false;
}

async function notifyBlockedIpOnce(input: {
  ipAddress: string;
  username: string;
  failedAttempts: number;
  blockedUntil: Date;
  userAgent: string | null;
  alreadyNotified: boolean;
}): Promise<void> {
  if (input.alreadyNotified) {
    return;
  }

  const sent = await sendLoginBlockedNotification({
    ipAddress: input.ipAddress,
    username: input.username,
    failedAttempts: input.failedAttempts,
    blockedUntil: input.blockedUntil,
    userAgent: input.userAgent,
  });

  if (sent) {
    try {
      await authRepo.markBlockNotificationSent(input.ipAddress);
    } catch (error) {
      logger.warn(`Could not mark login block notification as sent: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  const ipAddress = getClientIp(req);
  const userAgent = req.get('user-agent')?.slice(0, 512) ?? null;
  const now = new Date();

  if (!username || !password) {
    res.status(400).json({ ok: false, error: 'Username and password are required.' });
    return;
  }

  try {
    const currentBlock = await authRepo.findIpBlock(ipAddress);

    if (currentBlock && isFutureDate(currentBlock.blockedUntil, now)) {
      await authRepo.recordLoginAttempt({
        ipAddress,
        username,
        succeeded: false,
        failureReason: 'ip_blocked',
        userAgent,
      });

      await notifyBlockedIpOnce({
        ipAddress,
        username,
        failedAttempts: currentBlock.failedAttempts,
        blockedUntil: currentBlock.blockedUntil,
        userAgent,
        alreadyNotified: currentBlock.notificationSentAt instanceof Date,
      });

      res.status(423).json({
        ok: false,
        error: 'This IP is blocked for 24 hours because of repeated failed login attempts.',
        blockedUntil: currentBlock.blockedUntil.toISOString(),
      });
      return;
    }

    const user = await authRepo.findActiveUserByUsername(username);
    const validPassword = user ? verifyPassword(password, user.passwordHash) : false;

    if (user && validPassword) {
      await authRepo.recordLoginAttempt({
        ipAddress,
        username,
        succeeded: true,
        failureReason: null,
        userAgent,
      });
      await authRepo.clearIpBlock(ipAddress);

      res.json({
        ok: true,
        user: {
          username: user.username,
          displayName: user.displayName,
        },
      });
      return;
    }

    await authRepo.recordLoginAttempt({
      ipAddress,
      username,
      succeeded: false,
      failureReason: 'invalid_credentials',
      userAgent,
    });

    const resetAttempts = currentBlock
      ? shouldResetFailedAttempts(currentBlock.lastAttemptAt, currentBlock.blockedUntil, now)
      : false;
    const failedAttempts = resetAttempts ? 1 : (currentBlock?.failedAttempts ?? 0) + 1;
    const blockedUntil = failedAttempts >= env.LOGIN_MAX_ATTEMPTS
      ? addHours(now, env.LOGIN_BLOCK_HOURS)
      : null;

    await authRepo.saveIpBlock(ipAddress, failedAttempts, blockedUntil, null);

    if (blockedUntil) {
      await notifyBlockedIpOnce({
        ipAddress,
        username,
        failedAttempts,
        blockedUntil,
        userAgent,
        alreadyNotified: false,
      });

      res.status(423).json({
        ok: false,
        error: 'This IP is blocked for 24 hours because of repeated failed login attempts.',
        blockedUntil: blockedUntil.toISOString(),
      });
      return;
    }

    res.status(401).json({
      ok: false,
      error: 'Invalid username or password.',
      remainingAttempts: Math.max(env.LOGIN_MAX_ATTEMPTS - failedAttempts, 0),
    });
  } catch (error) {
    logger.error(`Login failed because auth storage is unavailable: ${error instanceof Error ? error.message : String(error)}`);
    res.status(503).json({ ok: false, error: 'Login service is unavailable. Please try again later.' });
  }
}
