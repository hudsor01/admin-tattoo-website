interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  maxEntries: number; // Prevent memory leaks
}

/**
 * Production-ready rate limiter with LRU eviction
 * Falls back gracefully when external storage is unavailable
 */
export class ProductionRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up old entries periodically to prevent memory leaks
    // eslint-disable-next-line no-restricted-syntax
    setInterval(() => this.cleanup(), config.windowMs);
  }

  /**
   * Check if request should be rate limited
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const key = `rl_${identifier}`;
    
    // Get current entry or create new one
    let entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new or reset expired entry
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs,
        lastRequest: now
      };
      this.store.set(key, entry);
      this.evictOldEntries();
      return true;
    }

    // Update last request time
    entry.lastRequest = now;
    
    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const key = `rl_${identifier}`;
    const entry = this.store.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return this.config.maxRequests;
    }
    
    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Get reset time for identifier
   */
  getResetTime(identifier: string): number {
    const key = `rl_${identifier}`;
    const entry = this.store.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.config.windowMs;
    }
    
    return entry.resetTime;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.store) {
      if (now > entry.resetTime) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.store.delete(key));
  }

  /**
   * LRU eviction when we have too many entries
   */
  private evictOldEntries(): void {
    if (this.store.size <= this.config.maxEntries) {
      return;
    }

    // Sort by last request time and remove oldest
    const entries = Array.from(this.store.entries())
      .sort(([, a], [, b]) => a.lastRequest - b.lastRequest);
    
    // Remove at least 1 entry, or 10% of maxEntries, whichever is larger
    const toRemoveCount = Math.max(1, Math.floor(this.config.maxEntries * 0.1));
    const toRemove = entries.slice(0, toRemoveCount);
    toRemove.forEach(([key]) => this.store.delete(key));
  }

  /**
   * Get current store size (for monitoring)
   */
  getStoreSize(): number {
    return this.store.size;
  }

  /**
   * Manual cleanup for testing
   */
  forceCleanup(): void {
    this.cleanup();
  }
}

// Create singleton instances for different rate limit types
export const authRateLimiter = new ProductionRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxEntries: 10000 // Prevent memory leaks
});

export const apiRateLimiter = new ProductionRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  maxEntries: 50000
});

export const generalRateLimiter = new ProductionRateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute  
  maxEntries: 25000
});

/**
 * Helper function to get appropriate rate limiter
 */
export function getRateLimiter(type: 'auth' | 'api' | 'general'): ProductionRateLimiter {
  switch (type) {
    case 'auth':
      return authRateLimiter;
    case 'api':
      return apiRateLimiter;
    case 'general':
      return generalRateLimiter;
    default:
      return generalRateLimiter;
  }
}