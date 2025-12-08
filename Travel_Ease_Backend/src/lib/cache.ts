/**
 * Unified Cache Module
 * 
 * Provides a caching layer that:
 * - Uses Redis when available for distributed caching
 * - Falls back to in-memory LRU cache when Redis is unavailable
 * - Handles serialization/deserialization automatically
 * - Provides consistent API regardless of backend
 * 
 * Usage:
 *   import { cacheResult, buildCacheKey, invalidateCache } from './cache.js';
 * 
 *   // In a controller:
 *   const data = await cacheResult({
 *     key: buildCacheKey('blogs', 'overview'),
 *     ttl: 60,
 *     fetchFn: () => fetchBlogsFromDB()
 *   });
 */

import { 
  isRedisAvailable, 
  redisGetJSON, 
  redisSetJSON, 
  redisDel, 
  redisDelPattern 
} from './redisClient.js';

// ============================================================================
// In-Memory LRU Cache (Fallback)
// ============================================================================

interface CacheItem<T> {
  value: T;
  expiresAt: number | null;
}

class LRUCache<T = unknown> {
  private cache: Map<string, CacheItem<T>>;
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Check TTL
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    // Delete existing key first to maintain LRU ordering (move to end)
    const exists = this.cache.has(key);
    if (exists) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity (only if this is a new key)
    if (!exists && this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: ttlSeconds !== undefined && ttlSeconds > 0
        ? Date.now() + (ttlSeconds * 1000)
        : null,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a prefix
   */
  deleteByPrefix(prefix: string): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Singleton in-memory cache instance
const memoryCache = new LRUCache(1000);

// ============================================================================
// Cache Key Builders
// ============================================================================

/**
 * Serialize a value for cache key in a type-preserving way
 * - Strings use JSON.stringify to properly escape quotes and special chars
 * - Objects/arrays use JSON.stringify for proper serialization
 * - Primitives are converted directly
 */
function serializeValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  const type = typeof value;
  
  if (type === 'string') {
    // Use JSON.stringify to properly escape quotes and special characters
    // This prevents cache key collisions from strings containing quotes
    // e.g., 'test"value' becomes '"test\"value"' (properly escaped)
    return JSON.stringify(value);
  }
  
  if (type === 'number' || type === 'boolean') {
    return String(value);
  }
  
  if (type === 'object') {
    // Use JSON.stringify for objects and arrays to handle nested structures
    // This avoids [object Object] and properly serializes nested values
    return JSON.stringify(value);
  }
  
  // Fallback for other types
  return String(value);
}

/**
 * Build a standardized cache key from namespace and identifiers
 * 
 * @param namespace - Category/feature name (e.g., 'blogs', 'business', 'travel_plans')
 * @param parts - Additional key parts (e.g., 'overview', 'featured', id)
 * @returns Formatted cache key like 'blogs:overview' or 'business:123'
 * 
 * @example
 * buildCacheKey('blogs', 'overview')           // 'blogs:overview'
 * buildCacheKey('blogs', 'detail', 'my-slug')  // 'blogs:detail:my-slug'
 * buildCacheKey('business', 'list', { page: 1, search: 'cafe' }) // 'business:list:page=1&search="cafe"'
 */
export function buildCacheKey(namespace: string, ...parts: (string | number | Record<string, unknown>)[]): string {
  const keyParts = [namespace];

  for (const part of parts) {
    if (part === null || part === undefined) {
      continue;
    }

    if (typeof part === 'object') {
      // Sort object keys for consistent cache keys
      const sorted = Object.keys(part)
        .filter(k => part[k] !== undefined && part[k] !== null && part[k] !== '')
        .sort()
        .map(k => `${k}=${serializeValue(part[k])}`)
        .join('&');
      if (sorted) {
        keyParts.push(sorted);
      }
    } else {
      keyParts.push(String(part));
    }
  }

  return keyParts.join(':');
}

// ============================================================================
// Main Cache Functions
// ============================================================================

interface CacheResultOptions<T> {
  /** Cache key (use buildCacheKey to generate) */
  key: string;
  /** Time-to-live in seconds */
  ttl: number;
  /** Function to fetch data if not cached */
  fetchFn: () => Promise<T>;
  /** Force refresh (bypass cache read, still writes to cache) */
  forceRefresh?: boolean;
}

interface CacheResultReturn<T> {
  data: T;
  fromCache: boolean;
  cacheBackend: 'redis' | 'memory' | 'none';
}

/**
 * Get data from cache or fetch and cache it
 * 
 * This is the main caching function. It:
 * 1. Checks Redis first (if available)
 * 2. Falls back to in-memory cache
 * 3. Calls fetchFn if no cache hit
 * 4. Stores result in both Redis and memory cache
 * 
 * @example
 * const { data, fromCache } = await cacheResult({
 *   key: buildCacheKey('blogs', 'featured'),
 *   ttl: 60,
 *   fetchFn: async () => {
 *     return await prisma.blog.findMany({ where: { isFeatured: true } });
 *   }
 * });
 */
export async function cacheResult<T>(options: CacheResultOptions<T>): Promise<CacheResultReturn<T>> {
  const { key, ttl, fetchFn, forceRefresh = false } = options;

  // Skip cache read if force refresh
  if (!forceRefresh) {
    // Try Redis first
    if (isRedisAvailable()) {
      try {
        const cached = await redisGetJSON<T>(key);
        if (cached !== null) {
          return { data: cached, fromCache: true, cacheBackend: 'redis' };
        }
      } catch (error) {
        // Redis error, fall through to memory cache
        console.warn('[Cache] Redis read error, falling back to memory:', error instanceof Error ? error.message : error);
      }
    }

    // Try memory cache
    const memoryCached = memoryCache.get(key) as T | undefined;
    if (memoryCached !== undefined) {
      return { data: memoryCached, fromCache: true, cacheBackend: 'memory' };
    }
  }

  // Cache miss - fetch fresh data
  const data = await fetchFn();

  // Store in both caches (fire and forget for Redis)
  try {
    // Memory cache (synchronous, always succeeds)
    memoryCache.set(key, data, ttl);

    // Redis cache (async, may fail silently)
    if (isRedisAvailable()) {
      redisSetJSON(key, data, ttl).catch(err => {
        console.warn('[Cache] Redis write error:', err instanceof Error ? err.message : err);
      });
    }
  } catch (error) {
    // Don't fail the request if caching fails
    console.warn('[Cache] Error storing cache:', error instanceof Error ? error.message : error);
  }

  return { data, fromCache: false, cacheBackend: 'none' };
}

/**
 * Get a value from cache without fetching
 * Returns null if not found
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  // Try Redis first
  if (isRedisAvailable()) {
    try {
      const cached = await redisGetJSON<T>(key);
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      console.warn('[Cache] Redis read error:', error instanceof Error ? error.message : error);
    }
  }

  // Try memory cache
  const memoryCached = memoryCache.get(key) as T | undefined;
  return memoryCached ?? null;
}

/**
 * Set a value in cache directly
 */
export async function setInCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  // Memory cache
  memoryCache.set(key, value, ttlSeconds);

  // Redis cache
  if (isRedisAvailable()) {
    try {
      await redisSetJSON(key, value, ttlSeconds);
    } catch (err) {
      console.warn('[Cache] Redis write error:', err instanceof Error ? err.message : err);
    }
  }
}

/**
 * Invalidate (delete) a specific cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  // Memory cache
  memoryCache.delete(key);

  // Redis cache
  if (isRedisAvailable()) {
    try {
      await redisDel(key);
    } catch (err) {
      console.warn('[Cache] Redis delete error:', err instanceof Error ? err.message : err);
    }
  }
}

/**
 * Invalidate all cache keys matching a prefix/pattern
 * 
 * @param prefix - Key prefix to match (e.g., 'blogs:' to clear all blog caches)
 * 
 * @example
 * // Clear all blog caches
 * await invalidateCachePattern('blogs:');
 * 
 * // Clear all business listing caches
 * await invalidateCachePattern('business:list:');
 */
export async function invalidateCachePattern(prefix: string): Promise<void> {
  // Memory cache
  memoryCache.deleteByPrefix(prefix);

  // Redis cache (use pattern matching)
  if (isRedisAvailable()) {
    try {
      await redisDelPattern(`${prefix}*`);
    } catch (err) {
      console.warn('[Cache] Redis pattern delete error:', err instanceof Error ? err.message : err);
    }
  }
}

/**
 * Clear all caches (use with caution)
 */
export function clearAllCaches(): void {
  memoryCache.clear();
  // Note: We don't clear Redis entirely as it may be shared
  console.log('[Cache] Memory cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { memory: { size: number; maxSize: number }; redisAvailable: boolean } {
  return {
    memory: memoryCache.stats(),
    redisAvailable: isRedisAvailable(),
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  cacheResult,
  getFromCache,
  setInCache,
  invalidateCache,
  invalidateCachePattern,
  clearAllCaches,
  getCacheStats,
  buildCacheKey,
};

