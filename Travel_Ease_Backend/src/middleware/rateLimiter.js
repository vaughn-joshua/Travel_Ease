/**
 * Rate limiter middleware for map API endpoints
 * Uses in-memory store (per-process)
 */

import mapConfig from '../../config/map_config.js';

const { windowMs, max } = mapConfig.rateLimit;

// Store: { ip: { count, resetTime } }
const store = new Map();

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

/**
 * Rate limiter middleware factory
 * @param {object} options - Override default options
 * @returns {Function} Express middleware
 */
export function createMapRateLimiter(options = {}) {
  const limit = options.max || max;
  const window = options.windowMs || windowMs;

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
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

