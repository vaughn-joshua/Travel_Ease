/**
 * Redis Client Module
 * 
 * Provides a shared Redis client instance with:
 * - Configurable via REDIS_ENABLED, REDIS_URL, or REDIS_HOST/PORT/PASSWORD env vars
 * - Graceful degradation when Redis is unavailable (no app crash)
 * - Connection logging and error handling
 * - Helper methods for common operations
 * 
 * Usage:
 *   import { redis, isRedisAvailable, redisGet, redisSet, redisDel } from './redisClient.js';
 */

import { Redis as IORedis, type RedisOptions } from 'ioredis';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Check if Redis is explicitly enabled via environment
 * Defaults to true if REDIS_URL or REDIS_HOST is provided
 */
function isRedisEnabled(): boolean {
  const explicitFlag = process.env.REDIS_ENABLED;
  if (explicitFlag !== undefined) {
    return explicitFlag.toLowerCase() === 'true' || explicitFlag === '1';
  }
  // Auto-enable if connection info is provided
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
}

/**
 * Build Redis connection options from environment variables
 */
function getRedisOptions(): RedisOptions | string | null {
  // Option 1: Full connection URL (preferred for production)
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  // Option 2: Individual host/port/password
  const host = process.env.REDIS_HOST;
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD;
  const db = parseInt(process.env.REDIS_DB || '0', 10);

  if (host) {
    const options: RedisOptions = {
      host,
      port,
      db,
      // Connection settings for resilience
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          // Stop retrying after 3 attempts
          console.warn('[Redis] Max retry attempts reached, giving up');
          return null;
        }
        // Exponential backoff: 200ms, 400ms, 800ms
        return Math.min(times * 200, 1000);
      },
      // Don't block the app if Redis is slow
      enableOfflineQueue: false,
    };

    if (password) {
      options.password = password;
    }

    return options;
  }

  return null;
}

// ============================================================================
// Client Instance
// ============================================================================

let redis: IORedis | null = null;
let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

/**
 * Initialize the Redis client if enabled and configured
 */
function initRedisClient(): IORedis | null {
  if (!isRedisEnabled()) {
    console.log('[Redis] Disabled via configuration (REDIS_ENABLED=false or no connection info)');
    return null;
  }

  const options = getRedisOptions();
  if (!options) {
    console.warn('[Redis] No connection configuration found. Running without Redis cache.');
    return null;
  }

  try {
    connectionStatus = 'connecting';
    
    const client = typeof options === 'string' 
      ? new IORedis(options, {
          connectTimeout: 5000,
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false,
          retryStrategy: (times: number) => {
            if (times > 3) return null;
            return Math.min(times * 200, 1000);
          },
        })
      : new IORedis(options);

    // Event handlers for connection lifecycle
    client.on('connect', () => {
      connectionStatus = 'connected';
      console.log('[Redis] Connected successfully');
    });

    client.on('ready', () => {
      connectionStatus = 'connected';
      console.log('[Redis] Ready to accept commands');
    });

    client.on('error', (err) => {
      connectionStatus = 'error';
      // Don't crash the app, just log the error
      console.error('[Redis] Connection error:', err.message);
    });

    client.on('close', () => {
      connectionStatus = 'disconnected';
      console.log('[Redis] Connection closed');
    });

    client.on('reconnecting', () => {
      connectionStatus = 'connecting';
      console.log('[Redis] Attempting to reconnect...');
    });

    return client;
  } catch (error) {
    connectionStatus = 'error';
    console.error('[Redis] Failed to initialize client:', error instanceof Error ? error.message : error);
    return null;
  }
}

// Initialize on module load
redis = initRedisClient();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if Redis is currently available and connected
 */
export function isRedisAvailable(): boolean {
  return redis !== null && connectionStatus === 'connected';
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): typeof connectionStatus {
  return connectionStatus;
}

/**
 * Get a value from Redis
 * Returns null if Redis is unavailable or key doesn't exist
 */
export async function redisGet(key: string): Promise<string | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    return await redis!.get(key);
  } catch (error) {
    console.error('[Redis] GET error:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get a value from Redis and parse as JSON
 * Returns null if Redis is unavailable, key doesn't exist, or parse fails
 */
export async function redisGetJSON<T = unknown>(key: string): Promise<T | null> {
  const value = await redisGet(key);
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[Redis] JSON parse error for key', key, ':', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Set a value in Redis with optional TTL (in seconds)
 * Returns true on success, false on failure
 */
export async function redisSet(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      await redis!.setex(key, ttlSeconds, value);
    } else {
      await redis!.set(key, value);
    }
    return true;
  } catch (error) {
    console.error('[Redis] SET error:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Set a JSON value in Redis with optional TTL (in seconds)
 * Returns true on success, false on failure
 */
export async function redisSetJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    return await redisSet(key, serialized, ttlSeconds);
  } catch (error) {
    console.error('[Redis] JSON stringify error:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Delete a key from Redis
 * Returns true on success, false on failure
 */
export async function redisDel(key: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    await redis!.del(key);
    return true;
  } catch (error) {
    console.error('[Redis] DEL error:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 * Use with caution in production (KEYS command can be slow)
 */
export async function redisDelPattern(pattern: string): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const keys = await redis!.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    return await redis!.del(...keys);
  } catch (error) {
    console.error('[Redis] DEL pattern error:', error instanceof Error ? error.message : error);
    return 0;
  }
}

/**
 * Increment a counter in Redis (useful for rate limiting)
 * Returns the new value, or null on failure
 */
export async function redisIncr(key: string): Promise<number | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    return await redis!.incr(key);
  } catch (error) {
    console.error('[Redis] INCR error:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Set expiration on a key (in seconds)
 */
export async function redisExpire(key: string, ttlSeconds: number): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    await redis!.expire(key, ttlSeconds);
    return true;
  } catch (error) {
    console.error('[Redis] EXPIRE error:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Get TTL remaining on a key (in seconds)
 * Returns -2 if key doesn't exist, -1 if no TTL, or remaining seconds
 */
export async function redisTTL(key: string): Promise<number> {
  if (!isRedisAvailable()) {
    return -2;
  }

  try {
    return await redis!.ttl(key);
  } catch (error) {
    console.error('[Redis] TTL error:', error instanceof Error ? error.message : error);
    return -2;
  }
}

/**
 * Gracefully close the Redis connection
 * Call this during app shutdown
 */
export async function redisDisconnect(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      console.log('[Redis] Disconnected gracefully');
    } catch (error) {
      console.error('[Redis] Error during disconnect:', error instanceof Error ? error.message : error);
    }
    redis = null;
    connectionStatus = 'disconnected';
  }
}

// Export the raw client for advanced use cases (use with caution)
export { redis };

export default {
  redis,
  isRedisAvailable,
  getRedisStatus,
  redisGet,
  redisGetJSON,
  redisSet,
  redisSetJSON,
  redisDel,
  redisDelPattern,
  redisIncr,
  redisExpire,
  redisTTL,
  redisDisconnect,
};

