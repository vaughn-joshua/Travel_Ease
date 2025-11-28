/**
 * Simple LRU Cache utility for map service responses
 * Uses in-memory storage with TTL support
 */

class LRUCache {
  constructor(maxSize = 500) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get a cached value
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
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
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds
   */
  set(key, value, ttlSeconds) {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
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
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a cached value
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   * @returns {object} Cache statistics
   */
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Singleton instances for different cache types
const caches = {
  search: new LRUCache(200),
  geocode: new LRUCache(500),
  route: new LRUCache(100),
};

/**
 * Create a cache key from parameters
 * @param {string} prefix - Cache type prefix
 * @param {object} params - Parameters to include in key
 * @returns {string} Cache key
 */
export function createCacheKey(prefix, params) {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return `${prefix}:${sorted}`;
}

/**
 * Cache decorator for async functions
 * @param {string} cacheType - Type of cache (search, geocode, route)
 * @param {number} ttl - TTL in seconds
 * @returns {Function} Decorator function
 */
export function withCache(cacheType, ttl) {
  const cache = caches[cacheType] || caches.search;
  
  return function(keyParams, fetchFn) {
    const key = createCacheKey(cacheType, keyParams);
    const cached = cache.get(key);
    
    if (cached !== undefined) {
      return { data: cached, fromCache: true };
    }
    
    return fetchFn().then(data => {
      cache.set(key, data, ttl);
      return { data, fromCache: false };
    });
  };
}

/**
 * Get cache instance by type
 * @param {string} cacheType - Type of cache
 * @returns {LRUCache}
 */
export function getCache(cacheType) {
  return caches[cacheType] || caches.search;
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
  Object.values(caches).forEach(cache => cache.clear());
}

export default { withCache, createCacheKey, getCache, clearAllCaches };

