import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const startChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  },
});

export const sendMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many messages. Please slow down.',
    },
  },
});

export const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.CHAT_RATE_LIMIT_PER_MINUTE ?? 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many chat requests. Please slow down.',
    },
  },
});
