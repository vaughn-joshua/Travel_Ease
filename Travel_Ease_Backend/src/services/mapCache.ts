/**
 * Simple LRU Cache utility for map service responses
 * Uses in-memory storage with TTL support
 */

interface CacheItem<T> {
  value: T;
  expiresAt: number | null;
}

class LRUCache<T = unknown> {
  private cache: Map<string, CacheItem<T>>;
  private maxSize: number;

  constructor(maxSize = 500) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get a cached value
   */
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

  /**
   * Set a cached value with TTL
   */
  set(key: string, value: T, ttlSeconds?: number): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: ttlSeconds !== undefined && ttlSeconds !== null 
        ? Date.now() + (ttlSeconds * 1000) 
        : null,
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

type CacheType = 'search' | 'geocode' | 'route';

// Singleton instances for different cache types
const caches: Record<CacheType, LRUCache> = {
  search: new LRUCache(200),
  geocode: new LRUCache(500),
  route: new LRUCache(100),
};

/**
 * Create a cache key from parameters
 */
export function createCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return `${prefix}:${sorted}`;
}

interface CacheResult<T> {
  data: T;
  fromCache: boolean;
}

/**
 * Cache decorator for async functions
 */
export function withCache<T>(cacheType: CacheType, ttl: number) {
  const cache = caches[cacheType] || caches.search;
  
  return function(keyParams: Record<string, unknown>, fetchFn: () => Promise<T>): Promise<CacheResult<T>> {
    const key = createCacheKey(cacheType, keyParams);
    const cached = cache.get(key) as T | undefined;
    
    if (cached !== undefined) {
      return Promise.resolve({ data: cached, fromCache: true });
    }
    
    return fetchFn().then(data => {
      cache.set(key, data, ttl);
      return { data, fromCache: false };
    });
  };
}

/**
 * Get cache instance by type
 */
export function getCache(cacheType: CacheType | string): LRUCache {
  return caches[cacheType as CacheType] || caches.search;
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  Object.values(caches).forEach(cache => cache.clear());
}

export default { withCache, createCacheKey, getCache, clearAllCaches };

