/**
 * Rate limiter middleware for map API endpoints
 * Uses in-memory store (per-process)
 */

import { Request, Response, NextFunction } from 'express';
import mapConfig from '../config/map.js';

const { windowMs, max } = mapConfig.rateLimit;

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Store: { ip: { count, resetTime } }
const store = new Map<string, RateLimitRecord>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of store.entries()) {
    if (now > data.resetTime) {
      store.delete(ip);
    }
  }
}, windowMs);

interface RateLimitOptions {
  max?: number;
  windowMs?: number;
}

/**
 * Rate limiter middleware factory
 */
export function createMapRateLimiter(options: RateLimitOptions = {}) {
  const limit = options.max || max;
  const window = options.windowMs || windowMs;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    let record = store.get(ip);

    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + window,
      };
      store.set(ip, record);
    }

    record.count++;

    // Set rate limit headers
    res.set('X-RateLimit-Limit', limit.toString());
    res.set('X-RateLimit-Remaining', Math.max(0, limit - record.count).toString());
    res.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

    if (record.count > limit) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.set('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      });
    }

    next();
  };
}

/**
 * Default map rate limiter instance
 */
export const mapRateLimiter = createMapRateLimiter();

export default mapRateLimiter;

