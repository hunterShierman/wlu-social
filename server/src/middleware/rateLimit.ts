// server/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

// adds a rate limit for uploads per user/ip (prevents bots from spamming)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // resets every hour
  max: 10, // Max 10 uploads per hour
  message: 'Too many uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});