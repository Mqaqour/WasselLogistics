import { Request, Response } from 'express';
import { env } from '../config/env';
import * as authRepo from '../repositories/auth.repository';
import {
  sendLoginBlockedNotification,
  verifyPassword,
  issueSessionToken,
  generateTotpSecret,
  buildTotpAuthUri,
  buildTotpQrDataUrl,
  verifyTotp,
} from '../services/auth.service';
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

const SESSION_COOKIE_MAX_AGE_MS = env.AUTH_TOKEN_TTL_HOURS * MILLISECONDS_PER_HOUR;

function setSessionCookie(res: Response, token: string): void {
  res.cookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(env.AUTH_COOKIE_NAME, { path: '/' });
}

/** Records one failed login attempt and advances / applies the per-IP block. */
async function registerFailedAttempt(input: {
  ipAddress: string;
  username: string;
  userAgent: string | null;
  reason: 'invalid_credentials' | 'invalid_totp';
  currentBlock: Awaited<ReturnType<typeof authRepo.findIpBlock>>;
  now: Date;
}): Promise<{ blockedUntil: Date | null; remainingAttempts: number }> {
  const { ipAddress, username, userAgent, reason, currentBlock, now } = input;

  await authRepo.recordLoginAttempt({ ipAddress, username, succeeded: false, failureReason: reason, userAgent });

  const resetAttempts = currentBlock
    ? shouldResetFailedAttempts(currentBlock.lastAttemptAt, currentBlock.blockedUntil, now)
    : false;
  const failedAttempts = resetAttempts ? 1 : (currentBlock?.failedAttempts ?? 0) + 1;
  const blockedUntil = failedAttempts >= env.LOGIN_MAX_ATTEMPTS ? addHours(now, env.LOGIN_BLOCK_HOURS) : null;

  await authRepo.saveIpBlock(ipAddress, failedAttempts, blockedUntil, null);

  if (blockedUntil) {
    await notifyBlockedIpOnce({ ipAddress, username, failedAttempts, blockedUntil, userAgent, alreadyNotified: false });
  }

  return { blockedUntil, remainingAttempts: Math.max(env.LOGIN_MAX_ATTEMPTS - failedAttempts, 0) };
}

export async function login(req: Request, res: Response): Promise<void> {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  const totpCode = req.body?.totp !== undefined ? String(req.body.totp) : '';
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
      await authRepo.recordLoginAttempt({ ipAddress, username, succeeded: false, failureReason: 'ip_blocked', userAgent });
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

    if (!user || !validPassword) {
      const { blockedUntil, remainingAttempts } = await registerFailedAttempt({
        ipAddress, username, userAgent, reason: 'invalid_credentials', currentBlock, now,
      });
      if (blockedUntil) {
        res.status(423).json({
          ok: false,
          error: 'This IP is blocked for 24 hours because of repeated failed login attempts.',
          blockedUntil: blockedUntil.toISOString(),
        });
        return;
      }
      res.status(401).json({ ok: false, error: 'Invalid username or password.', remainingAttempts });
      return;
    }

    // Password OK — enforce the authenticator-app second factor when the user has enrolled.
    if (user.totpEnabled) {
      if (!totpCode) {
        // Correct password, code still needed. Not counted as a failed attempt.
        res.status(200).json({ ok: false, mfaRequired: true });
        return;
      }
      if (!user.totpSecret || !verifyTotp(user.totpSecret, totpCode)) {
        const { blockedUntil, remainingAttempts } = await registerFailedAttempt({
          ipAddress, username, userAgent, reason: 'invalid_totp', currentBlock, now,
        });
        if (blockedUntil) {
          res.status(423).json({
            ok: false,
            error: 'This IP is blocked for 24 hours because of repeated failed login attempts.',
            blockedUntil: blockedUntil.toISOString(),
          });
          return;
        }
        res.status(401).json({ ok: false, mfaRequired: true, error: 'Invalid authentication code.', remainingAttempts });
        return;
      }
    }

    await authRepo.recordLoginAttempt({ ipAddress, username, succeeded: true, failureReason: null, userAgent });
    await authRepo.clearIpBlock(ipAddress);

    const token = issueSessionToken(user);
    setSessionCookie(res, token);

    res.json({
      ok: true,
      token,
      user: { username: user.username, displayName: user.displayName, mfaEnabled: user.totpEnabled },
    });
  } catch (error) {
    logger.error(`Login failed because auth storage is unavailable: ${error instanceof Error ? error.message : String(error)}`);
    res.status(503).json({ ok: false, error: 'Login service is unavailable. Please try again later.' });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearSessionCookie(res);
  res.json({ ok: true });
}

/** Returns the signed-in user (used by the SPA to validate a stored session on load). */
export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ ok: false });
    return;
  }
  try {
    const user = await authRepo.findActiveUserById(req.user.sub);
    if (!user) {
      clearSessionCookie(res);
      res.status(401).json({ ok: false });
      return;
    }
    res.json({ ok: true, user: { username: user.username, displayName: user.displayName, mfaEnabled: user.totpEnabled } });
  } catch (error) {
    logger.error(`/auth/me failed: ${error instanceof Error ? error.message : String(error)}`);
    res.status(503).json({ ok: false, error: 'Auth service is unavailable.' });
  }
}

/** Starts authenticator-app enrolment: generates + stores a pending secret, returns the QR. */
export async function totpSetup(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ ok: false }); return; }
  try {
    const user = await authRepo.findActiveUserById(req.user.sub);
    if (!user) { res.status(401).json({ ok: false }); return; }

    const secret = generateTotpSecret();
    await authRepo.setUserTotpSecret(user.id, secret);

    const otpauthUrl = buildTotpAuthUri(user.username, secret);
    const qrDataUrl = await buildTotpQrDataUrl(otpauthUrl);

    res.json({ ok: true, secret, otpauthUrl, qrDataUrl });
  } catch (error) {
    logger.error(`TOTP setup failed: ${error instanceof Error ? error.message : String(error)}`);
    res.status(503).json({ ok: false, error: 'Could not start two-factor setup.' });
  }
}

/** Confirms the pending secret with a first valid code and switches 2FA on. */
export async function totpConfirm(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ ok: false }); return; }
  const code = String(req.body?.code ?? '');
  try {
    const user = await authRepo.findActiveUserById(req.user.sub);
    if (!user || !user.totpSecret) {
      res.status(400).json({ ok: false, error: 'Start setup first.' });
      return;
    }
    if (!verifyTotp(user.totpSecret, code)) {
      res.status(400).json({ ok: false, error: 'Invalid code. Try again.' });
      return;
    }
    await authRepo.setUserTotpEnabled(user.id, true);
    res.json({ ok: true });
  } catch (error) {
    logger.error(`TOTP confirm failed: ${error instanceof Error ? error.message : String(error)}`);
    res.status(503).json({ ok: false, error: 'Could not enable two-factor authentication.' });
  }
}

/** Turns 2FA off — requires a current valid code (or the current password). */
export async function totpDisable(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ ok: false }); return; }
  const code = String(req.body?.code ?? '');
  const password = String(req.body?.password ?? '');
  try {
    const user = await authRepo.findActiveUserById(req.user.sub);
    if (!user) { res.status(401).json({ ok: false }); return; }
    if (!user.totpEnabled) { res.json({ ok: true }); return; }

    const okByCode = !!user.totpSecret && verifyTotp(user.totpSecret, code);
    const okByPassword = !!password && verifyPassword(password, user.passwordHash);
    if (!okByCode && !okByPassword) {
      res.status(400).json({ ok: false, error: 'Enter a valid authentication code or your password.' });
      return;
    }
    await authRepo.setUserTotpEnabled(user.id, false);
    res.json({ ok: true });
  } catch (error) {
    logger.error(`TOTP disable failed: ${error instanceof Error ? error.message : String(error)}`);
    res.status(503).json({ ok: false, error: 'Could not disable two-factor authentication.' });
  }
}
