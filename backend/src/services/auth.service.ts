import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { getNotificationSettings } from './settings.service';

// ── Session tokens (JWT) ─────────────────────────────────────────────────────

export interface SessionClaims {
  sub: number;
  username: string;
  name: string | null;
}

export function issueSessionToken(user: { id: number; username: string; displayName: string | null }): string {
  return jwt.sign(
    { username: user.username, name: user.displayName ?? null } satisfies Omit<SessionClaims, 'sub'>,
    env.AUTH_JWT_SECRET,
    { subject: String(user.id), expiresIn: `${env.AUTH_TOKEN_TTL_HOURS}h` }
  );
}

export function verifySessionToken(token: string): SessionClaims | null {
  try {
    const decoded = jwt.verify(token, env.AUTH_JWT_SECRET) as jwt.JwtPayload;
    if (!decoded.sub) return null;
    return {
      sub: Number(decoded.sub),
      username: String(decoded.username ?? ''),
      name: (decoded.name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

// ── TOTP (authenticator app) second factor ───────────────────────────────────

// Allow the current step ±1 (±30s) to absorb clock skew.
authenticator.options = { window: 1 };

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function buildTotpAuthUri(username: string, secret: string): string {
  return authenticator.keyuri(username, env.AUTH_TOTP_ISSUER, secret);
}

export async function buildTotpQrDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, { margin: 1, width: 220 });
}

export function verifyTotp(secret: string, code: string): boolean {
  const clean = String(code ?? '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  try {
    return authenticator.verify({ token: clean, secret });
  } catch {
    return false;
  }
}

export function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(Buffer.from(password, 'utf16le'))
    .digest('hex')
    .toLowerCase();
}

function safeCompareHex(leftHex: string, rightHex: string): boolean {
  const left = Buffer.from(leftHex, 'hex');
  const right = Buffer.from(rightHex, 'hex');

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function verifySha256Password(password: string, storedHash: string): boolean {
  const normalizedHash = storedHash.trim().toLowerCase().replace(/^sha256\$/, '');

  if (!/^[a-f0-9]{64}$/.test(normalizedHash)) {
    return false;
  }

  return safeCompareHex(hashPassword(password), normalizedHash);
}

function verifyPbkdf2Password(password: string, storedHash: string): boolean {
  const [scheme, iterationsValue, saltHex, hashHex] = storedHash.split('$');

  if (scheme !== 'pbkdf2_sha256' || !iterationsValue || !saltHex || !hashHex) {
    return false;
  }

  const iterations = Number.parseInt(iterationsValue, 10);
  const expectedHash = Buffer.from(hashHex, 'hex');

  if (!Number.isFinite(iterations) || iterations < 100000 || expectedHash.length === 0) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const actualHash = crypto.pbkdf2Sync(password, salt, iterations, expectedHash.length, 'sha256');
  return actualHash.length === expectedHash.length && crypto.timingSafeEqual(actualHash, expectedHash);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const trimmedHash = storedHash.trim();

  if (trimmedHash.startsWith('pbkdf2_sha256$')) {
    return verifyPbkdf2Password(password, trimmedHash);
  }

  return verifySha256Password(password, trimmedHash);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendLoginBlockedNotification(input: {
  ipAddress: string;
  username: string;
  failedAttempts: number;
  blockedUntil: Date;
  userAgent: string | null;
}): Promise<boolean> {
  const { loginAlertEmails } = await getNotificationSettings();
  const recipients = loginAlertEmails
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  if (!recipients.length) {
    logger.warn('Login block notification skipped: LOGIN_ALERT_EMAILS is empty.');
    return false;
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    logger.warn('Login block notification skipped: SMTP is not configured.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });

    const submittedAt = new Date().toISOString();
    const blockedUntilIso = input.blockedUntil.toISOString();
    const subject = `Wassel portal login blocked - ${input.ipAddress}`;
    const text = [
      'Wassel portal login IP blocked.',
      `IP address: ${input.ipAddress}`,
      `Username attempted: ${input.username}`,
      `Failed attempts: ${input.failedAttempts}`,
      `Blocked until: ${blockedUntilIso}`,
      `User agent: ${input.userAgent || '-'}`,
      `Detected at: ${submittedAt}`,
    ].join('\n');

    const rows = [
      ['IP address', input.ipAddress],
      ['Username attempted', input.username],
      ['Failed attempts', String(input.failedAttempts)],
      ['Blocked until', blockedUntilIso],
      ['User agent', input.userAgent || '-'],
      ['Detected at', submittedAt],
    ]
      .map(([label, value]) => (
        `<tr><td style="padding:8px 0; width:180px; color:#64748b;">${escapeHtml(label)}</td><td style="padding:8px 0; font-weight:600;">${escapeHtml(value)}</td></tr>`
      ))
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f5f8fc; padding:24px; color:#0f172a;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
          <tr>
            <td style="background:#991b1b; padding:18px 24px; color:#ffffff;">
              <h2 style="margin:0; font-size:20px;">Wassel portal login IP blocked</h2>
              <p style="margin:6px 0 0; font-size:12px; opacity:0.9;">${escapeHtml(submittedAt)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
                ${rows}
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

    await transporter.sendMail({
      from: env.SMTP_USER,
      to: recipients.join(','),
      subject,
      text,
      html,
    });

    return true;
  } catch (error) {
    logger.warn(`Could not send login block notification: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
