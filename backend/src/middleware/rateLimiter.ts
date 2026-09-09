import { Request } from 'express';
import rateLimit, { Options } from 'express-rate-limit';
import { env } from '../config/env';

// Loopback traffic (127.0.0.1 / ::1) is always local dev/testing, never a real
// customer — a live server never sees its own visitors arrive from its own
// loopback address. Exempting it means test traffic on a dev machine can never
// rate-limit real usage on the same box, with no change to production behavior.
function isLoopback(req: Request): boolean {
  const ip = req.ip ?? '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

function makeLimiter(windowMs: number, max: number, message: string, overrides: Partial<Options> = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: isLoopback,
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message },
    },
    ...overrides,
  });
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export const startChatLimiter = makeLimiter(15 * MIN, 10, 'Too many requests. Please try again later.');

export const sendMessageLimiter = makeLimiter(15 * MIN, 60, 'Too many messages. Please slow down.');

export const uploadAttachmentLimiter = makeLimiter(15 * MIN, 20, 'Too many uploads. Please slow down.');

export const aiChatLimiter = makeLimiter(MIN, env.CHAT_RATE_LIMIT_PER_MINUTE ?? 20, 'Too many chat requests. Please slow down.');

// Tracking proxies (DHL, FedEx, Jordan Passport, Wassel) — each hit costs a real
// external API call against a rate-limited/paid upstream.
export const trackingLimiter = makeLimiter(15 * MIN, 20, 'Too many tracking requests. Please try again later.');

// GeneralTrackingApi — the unified /api/general-tracking endpoint. Called by
// respond.io (many customers behind a shared pool of IPs), so it needs a much
// higher ceiling than the per-visitor trackingLimiter above.
export const generalTrackingLimiter = makeLimiter(15 * MIN, 300, 'Too many tracking requests. Please try again later.');

// Shipping rate quotes — proxies to QuickRate with our own API key.
export const quickrateLimiter = makeLimiter(15 * MIN, 15, 'Too many rate requests. Please try again later.');

// Pickup / shipping-request submissions — each success sends a real email and writes a DB row.
export const sendRequestLimiter = makeLimiter(HOUR, 5, 'Too many requests submitted. Please try again later.');

// Contact Us — final send (sends a real email to the ops inbox).
export const contactSubmitLimiter = makeLimiter(HOUR, 5, 'Too many messages submitted. Please try again later.');

// Contact Us — AI suggestion draft + its persistence call. These fire together once
// per submission attempt, and each call costs real Azure AI Foundry usage.
export const contactAiLimiter = makeLimiter(HOUR, 10, 'Too many requests. Please try again later.');

// "Notify me when it arrives" registration/check — DB already enforces uniqueness,
// this just stops pre-DB hammering.
export const waitingShipmentsLimiter = makeLimiter(HOUR, 10, 'Too many requests. Please try again later.');

// SMS verification — the highest-risk endpoint: an attacker could otherwise SMS-bomb
// any phone number for free by rotating IPs. Keyed on the target phone number in
// addition to the caller's IP, so throttling a victim's number doesn't depend on IP.
export const smsIpLimiter = makeLimiter(HOUR, 5, 'Too many SMS requests. Please try again later.');

export const smsPhoneLimiter = makeLimiter(HOUR, 3, 'Too many SMS requests for this number. Please try again later.', {
  keyGenerator: (req) => String(req.body?.to ?? 'unknown').trim() || 'unknown',
});

// Blanket safety net for every other /api/* route (defense-in-depth so a future
// endpoint added without its own limiter isn't left completely unprotected).
export const apiFallbackLimiter = makeLimiter(15 * MIN, 100, 'Too many requests. Please try again later.');
