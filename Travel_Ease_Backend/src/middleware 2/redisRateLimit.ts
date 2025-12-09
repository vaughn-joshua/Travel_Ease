/**
 * Redis-Based Rate Limiter Middleware
 * 
 * Provides distributed rate limiting using Redis with:
 * - Per-IP or per-user rate limiting
 * - Sliding window algorithm using Redis INCR + EXPIRE
 * - Graceful fallback to in-memory limiter when Redis is unavailable
 * - Standard rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, etc.)
 * 
 * Usage:
 *   import { createRedisRateLimiter, loginRateLimiter } from './redisRateLimit.js';
 * 
 *   // Custom rate limiter
 *   router.post('/endpoint', createRedisRateLimiter({ max: 10, windowSeconds: 60 }), handler);
 * 
 *   // Pre-configured login rate limiter
 *   router.post('/login', loginRateLimiter, handler);
 */

import { Request, Response, NextFunction } from 'express';
import { 
  isRedisAvailable, 
  redisIncr, 
  redisExpire, 
  redisTTL 
} from '../lib/redisClient.js';

// ============================================================================
// In-Memory Fallback Store
// ============================================================================

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store for fallback when Redis is unavailable
const memoryStore = new Map<string, RateLimitRecord>();

// Clean up expired entries periodically (every minute)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of memoryStore.entries()) {
    if (now > data.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 60000);

// ============================================================================
// Rate Limiter Factory
// ============================================================================

export interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  max: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Key prefix for Redis (default: 'ratelimit') */
  keyPrefix?: string;
  /** 
   * Function to extract identifier from request
   * Default: uses IP address
   * For user-based limiting, return user ID
   */
  keyGenerator?: (req: Request) => string;
  /** Custom message for rate limit exceeded */
  message?: string;
  /** Skip rate limiting for certain requests */
  skip?: (req: Request) => boolean;
}

/**
 * Create a rate limiter middleware with the specified options
 * 
 * @example
 * // 10 requests per minute per IP
 * const limiter = createRedisRateLimiter({ max: 10, windowSeconds: 60 });
 * 
 * // 5 requests per hour per user
 * const userLimiter = createRedisRateLimiter({
 *   max: 5,
 *   windowSeconds: 3600,
 *   keyGenerator: (req) => `user:${req.user?.id || req.ip}`
 * });
 */
export function createRedisRateLimiter(options: RateLimitOptions) {
  const {
    max,
    windowSeconds,
    keyPrefix = 'ratelimit',
    keyGenerator = (req: Request) => req.ip || 'unknown',
    message = 'Too many requests, please try again later.',
    skip,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if we should skip rate limiting
    if (skip && skip(req)) {
      return next();
    }

    const identifier = keyGenerator(req);
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();

    try {
      // Try Redis first
      if (isRedisAvailable()) {
        const result = await redisRateLimit(key, max, windowSeconds);
        
        // Set rate limit headers
        res.set('X-RateLimit-Limit', max.toString());
        res.set('X-RateLimit-Remaining', Math.max(0, max - result.count).toString());
        res.set('X-RateLimit-Reset', result.resetTime.toString());

        if (result.count > max) {
          const retryAfter = Math.max(1, result.resetTime - Math.floor(now / 1000));
          res.set('Retry-After', retryAfter.toString());
          
          return res.status(429).json({
            error: 'Too Many Requests',
            message,
            retryAfter,
          });
        }

        return next();
      }

      // Fallback to in-memory rate limiting
      const memResult = memoryRateLimit(key, max, windowSeconds, now);
      
      // Set rate limit headers
      res.set('X-RateLimit-Limit', max.toString());
      res.set('X-RateLimit-Remaining', Math.max(0, max - memResult.count).toString());
      res.set('X-RateLimit-Reset', Math.ceil(memResult.resetTime / 1000).toString());

      if (memResult.count > max) {
        const retryAfter = Math.ceil((memResult.resetTime - now) / 1000);
        res.set('Retry-After', retryAfter.toString());
        
        return res.status(429).json({
          error: 'Too Many Requests',
          message,
          retryAfter,
        });
      }

      return next();
    } catch (error) {
      // If rate limiting fails, allow the request through
      // This prevents rate limiting failures from blocking legitimate requests
      console.error('[RateLimit] Error:', error instanceof Error ? error.message : error);
      return next();
    }
  };
}

// ============================================================================
// Redis Rate Limiting
// ============================================================================

interface RateLimitResult {
  count: number;
  resetTime: number; // Unix timestamp in seconds
}

/**
 * Perform rate limiting using Redis INCR + EXPIRE
 */
async function redisRateLimit(
  key: string, 
  max: number, 
  windowSeconds: number
): Promise<RateLimitResult> {
  // Increment the counter
  const count = await redisIncr(key);
  
  if (count === null) {
    // Redis error, return a permissive result
    return { count: 0, resetTime: Math.floor(Date.now() / 1000) + windowSeconds };
  }

  // If this is the first request, set the expiration
  if (count === 1) {
    await redisExpire(key, windowSeconds);
  }

  // Get the TTL to calculate reset time
  const ttl = await redisTTL(key);
  const resetTime = Math.floor(Date.now() / 1000) + Math.max(ttl, 0);

  return { count, resetTime };
}

// ============================================================================
// In-Memory Rate Limiting (Fallback)
// ============================================================================

interface MemoryRateLimitResult {
  count: number;
  resetTime: number; // Unix timestamp in milliseconds
}

/**
 * Perform rate limiting using in-memory store (fallback)
 */
function memoryRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
  now: number
): MemoryRateLimitResult {
  let record = memoryStore.get(key);

  // If no record or expired, create new one
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + (windowSeconds * 1000),
    };
    memoryStore.set(key, record);
  }

  // Increment counter
  record.count++;

  return {
    count: record.count,
    resetTime: record.resetTime,
  };
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/**
 * Rate limiter for login endpoint
 * 5 attempts per minute per IP to prevent brute force attacks
 */
export const loginRateLimiter = createRedisRateLimiter({
  max: 5,
  windowSeconds: 60,
  keyPrefix: 'ratelimit:login',
  message: 'Too many login attempts. Please try again in a minute.',
});

/**
 * Rate limiter for registration endpoint
 * 3 registrations per hour per IP to prevent spam
 */
export const registerRateLimiter = createRedisRateLimiter({
  max: 3,
  windowSeconds: 3600,
  keyPrefix: 'ratelimit:register',
  message: 'Too many registration attempts. Please try again later.',
});

/**
 * Rate limiter for password reset endpoint
 * 3 attempts per 15 minutes per IP
 */
export const passwordResetRateLimiter = createRedisRateLimiter({
  max: 3,
  windowSeconds: 900,
  keyPrefix: 'ratelimit:password_reset',
  message: 'Too many password reset attempts. Please try again later.',
});

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
export const apiRateLimiter = createRedisRateLimiter({
  max: 100,
  windowSeconds: 60,
  keyPrefix: 'ratelimit:api',
  message: 'Rate limit exceeded. Please slow down.',
});

/**
 * Rate limiter for write operations (POST, PUT, DELETE)
 * 30 requests per minute per IP
 */
export const writeRateLimiter = createRedisRateLimiter({
  max: 30,
  windowSeconds: 60,
  keyPrefix: 'ratelimit:write',
  message: 'Too many write operations. Please slow down.',
});

export default {
  createRedisRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
  apiRateLimiter,
  writeRateLimiter,
};

