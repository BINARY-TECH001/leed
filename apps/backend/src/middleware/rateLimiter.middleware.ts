import type { Request, Response, NextFunction } from 'express';
import { redis } from '../utils/redis.js';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 120;

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `ratelimit:${ip}`;

  try {
    const current = await redis.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= MAX_REQUESTS) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down and try again later.',
      });
      return;
    }

    await redis.set(key, (count + 1).toString(), WINDOW_SECONDS);
    next();
  } catch {
    // If rate limiter fails, allow request through gracefully
    next();
  }
};
