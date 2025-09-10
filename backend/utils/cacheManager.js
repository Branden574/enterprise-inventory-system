/**
 * Enterprise In-Memory Caching System
 * High-performance caching with TTL and intelligent invalidation
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    this.hitCount = 0;
    this.missCount = 0;
    this.maxSize = 1000; // Maximum cache entries
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Set a cache entry with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 300000) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    const expiresAt = Date.now() + ttl;
    this.cache.set(key, value);
    this.ttlMap.set(key, expiresAt);
  }

  /**
   * Get a cache entry
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(key) {
    const value = this.cache.get(key);
    const expiresAt = this.ttlMap.get(key);

    if (!value || !expiresAt) {
      this.missCount++;
      return null;
    }

    if (Date.now() > expiresAt) {
      this.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return value;
  }

  /**
   * Delete a cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.ttlMap.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, expiresAt] of this.ttlMap.entries()) {
      if (now > expiresAt) {
        this.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(2) : 0,
      cacheSize: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Generate cache key for items query
   */
  generateItemsKey(query, page, limit, sort) {
    return `items:${JSON.stringify({ query, page, limit, sort })}`;
  }

  /**
   * Generate cache key for categories
   */
  generateCategoriesKey() {
    return 'categories:all';
  }

  /**
   * Invalidate related caches when data changes
   */
  invalidateItems() {
    for (const key of this.cache.keys()) {
      if (key.startsWith('items:')) {
        this.delete(key);
      }
    }
  }

  invalidateCategories() {
    this.delete('categories:all');
  }

  /**
   * Destroy cache manager
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
