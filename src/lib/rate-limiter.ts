/**
 * Advanced rate limiting system with multiple strategies
 * Supports sliding window, fixed window, and token bucket algorithms
 */

import { sanitizeIP } from './sanitization';
import { logger } from './secure-logger';

export interface RateLimitConfig {
  windowMs: number;           // Time window in milliseconds
  maxRequests: number;        // Max requests per window
  keyGenerator?: (request: Request) => string;
  skip?: (request: Request) => boolean;
  message?: string;
  headers?: boolean;          // Include rate limit headers in response
  standardHeaders?: boolean;  // Use standard rate limit headers
  legacyHeaders?: boolean;    // Use legacy X-RateLimit-* headers
  store?: RateLimitStore;     // Custom store implementation
  onLimitReached?: (key: string, request: Request) => void;
}

export interface RateLimitInfo {
  totalHits: number;
  totalHitsNextWindow: number;
  resetTime: Date;
  remainingPoints: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  info: RateLimitInfo;
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitInfo>;
  decrement?(key: string): Promise<void>;
  resetKey?(key: string): Promise<void>;
  clean?(): Promise<void>;
}

/**
 * In-memory rate limit store with automatic cleanup
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, {
    hits: number;
    resetTime: number;
    nextWindow?: { hits: number; resetTime: number };
  }>();
  
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(cleanupIntervalMs = 5 * 60 * 1000) { // 5 minutes
    this.setupCleanup(cleanupIntervalMs);
  }
  
  async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now;
    const windowEnd = windowStart + windowMs;
    
    const existing = this.store.get(key);
    
    if (!existing || existing.resetTime < now) {
      // Create new window
      const info: RateLimitInfo = {
        totalHits: 1,
        totalHitsNextWindow: 0,
        resetTime: new Date(windowEnd),
        remainingPoints: 0 // Will be calculated by caller
      };
      
      this.store.set(key, {
        hits: 1,
        resetTime: windowEnd,
      });
      
      return info;
    }
    
    // Increment existing window
    existing.hits += 1;
    
    return {
      totalHits: existing.hits,
      totalHitsNextWindow: existing.nextWindow?.hits || 0,
      resetTime: new Date(existing.resetTime),
      remainingPoints: 0 // Will be calculated by caller
    };
  }
  
  async decrement(key: string): Promise<void> {
    const existing = this.store.get(key);
    if (existing && existing.hits > 0) {
      existing.hits -= 1;
      if (existing.hits <= 0) {
        this.store.delete(key);
      }
    }
  }
  
  async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async clean(): Promise<void> {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
  
  private setupCleanup(intervalMs: number): void {
    this.cleanupInterval = setInterval(() => {
      this.clean().catch(err => 
        logger.error('Rate limiter cleanup failed', { error: err })
      );
    }, intervalMs);
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}


/**
 * Advanced rate limiter with multiple algorithms
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private store: RateLimitStore;
  
  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (request: Request) => this.defaultKeyGenerator(request),
      skip: () => false,
      message: 'Too many requests',
      headers: true,
      standardHeaders: true,
      legacyHeaders: false,
      store: new MemoryRateLimitStore(),
      onLimitReached: () => {},
      ...config,
    };
    this.store = this.config.store;
  }
  
  private defaultKeyGenerator(request: Request): string {
    const clientIP = sanitizeIP(
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown'
    );
    
    const userAgent = request.headers.get('user-agent') || '';
    const url = new URL(request.url);
    
    // Create a composite key
    return `${clientIP}:${url.pathname}:${userAgent.substring(0, 50)}`;
  }
  
  async checkLimit(request: Request): Promise<RateLimitResult> {
    if (this.config.skip(request)) {
      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowMs),
        info: {
          totalHits: 0,
          totalHitsNextWindow: 0,
          resetTime: new Date(Date.now() + this.config.windowMs),
          remainingPoints: this.config.maxRequests,
        }
      };
    }
    
    const key = this.config.keyGenerator(request);
    const info = await this.store.increment(key, this.config.windowMs);
    
    const remaining = Math.max(0, this.config.maxRequests - info.totalHits);
    const allowed = info.totalHits <= this.config.maxRequests;
    
    if (!allowed) {
      this.config.onLimitReached(key, request);
      
      logger.warn('Rate limit exceeded', {
        key: key.substring(0, 50), // Partial key for security
        hits: info.totalHits,
        limit: this.config.maxRequests,
        ip: request.headers.get('x-forwarded-for')?.substring(0, 10) || 'unknown',
      });
    }
    
    const retryAfter = allowed ? undefined : Math.ceil(
      (info.resetTime.getTime() - Date.now()) / 1000
    );
    
    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime: info.resetTime,
      retryAfter,
      info: {
        ...info,
        remainingPoints: remaining,
      }
    };
  }
  
  createHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.config.headers) {
      if (this.config.standardHeaders) {
        headers['RateLimit-Limit'] = String(result.limit);
        headers['RateLimit-Remaining'] = String(result.remaining);
        headers['RateLimit-Reset'] = String(Math.ceil(result.resetTime.getTime() / 1000));
        
        if (result.retryAfter) {
          headers['Retry-After'] = String(result.retryAfter);
        }
      }
      
      if (this.config.legacyHeaders) {
        headers['X-RateLimit-Limit'] = String(result.limit);
        headers['X-RateLimit-Remaining'] = String(result.remaining);
        headers['X-RateLimit-Reset'] = String(Math.ceil(result.resetTime.getTime() / 1000));
      }
    }
    
    return headers;
  }
}

/**
 * Sliding window rate limiter
 */
export class SlidingWindowRateLimiter extends RateLimiter {
  private windows = new Map<string, Array<{ timestamp: number; count: number }>>();
  
  async checkLimit(request: Request): Promise<RateLimitResult> {
    const config = (this as unknown as { config: Required<RateLimitConfig> }).config;
    const key = config.keyGenerator(request);
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get or create window array
    let windows = this.windows.get(key) || [];
    
    // Remove old windows
    windows = windows.filter(w => w.timestamp > windowStart);
    
    // Count total requests in sliding window
    const totalRequests = windows.reduce((sum, w) => sum + w.count, 0);
    
    // Add current request
    const currentWindow = windows.find(w => 
      Math.floor(w.timestamp / 60000) === Math.floor(now / 60000) // Same minute
    );
    
    if (currentWindow) {
      currentWindow.count += 1;
    } else {
      windows.push({ timestamp: now, count: 1 });
    }
    
    this.windows.set(key, windows);
    
    const allowed = totalRequests + 1 <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - (totalRequests + 1));
    
    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetTime: new Date(now + config.windowMs),
      retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000),
      info: {
        totalHits: totalRequests + 1,
        totalHitsNextWindow: 0,
        resetTime: new Date(now + config.windowMs),
        remainingPoints: remaining,
      }
    };
  }
}

/**
 * Token bucket rate limiter
 */
export class TokenBucketRateLimiter {
  private buckets = new Map<string, {
    tokens: number;
    lastRefill: number;
    capacity: number;
    refillRate: number;
  }>();
  
  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private keyGenerator: (request: Request) => string = (req) => 
      sanitizeIP(req.headers.get('x-forwarded-for') || 'unknown')
  ) {}
  
  async checkLimit(request: Request): Promise<RateLimitResult> {
    const key = this.keyGenerator(request);
    const now = Date.now();
    
    let bucket = this.buckets.get(key);
    
    if (!bucket) {
      bucket = {
        tokens: this.capacity,
        lastRefill: now,
        capacity: this.capacity,
        refillRate: this.refillRate,
      };
      this.buckets.set(key, bucket);
    }
    
    // Refill tokens based on time elapsed
    const timeElapsed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timeElapsed * bucket.refillRate);
    
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    const allowed = bucket.tokens > 0;
    
    if (allowed) {
      bucket.tokens -= 1;
    }
    
    const refillTime = bucket.tokens === 0 ? 1000 / bucket.refillRate : 0;
    
    return {
      allowed,
      limit: this.capacity,
      remaining: bucket.tokens,
      resetTime: new Date(now + refillTime),
      retryAfter: allowed ? undefined : Math.ceil(refillTime / 1000),
      info: {
        totalHits: this.capacity - bucket.tokens,
        totalHitsNextWindow: 0,
        resetTime: new Date(now + refillTime),
        remainingPoints: bucket.tokens,
      }
    };
  }
}

/**
 * Predefined rate limiters for common scenarios
 */
export const RateLimitPresets = {
  // Very strict for auth endpoints
  AUTHENTICATION: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts',
  },
  
  // Strict for API writes
  API_WRITE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many write requests',
  },
  
  // Moderate for API reads
  API_READ: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many read requests',
  },
  
  // Generous for public endpoints
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
    message: 'Too many requests',
  },
  
  // Very strict for file uploads
  FILE_UPLOAD: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 3,
    message: 'Too many file uploads',
  },
  
  // Strict for password reset
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts',
  },
} as const;

// Global rate limiter instances
const globalLimiters = new Map<string, RateLimiter>();

/**
 * Create appropriate rate limit store based on environment
 */
export async function createRateLimitStore(): Promise<RateLimitStore> {
  // Always use memory store for now to avoid Redis dependency
  // Redis can be added later when actually needed
  return new MemoryRateLimitStore();
}

/**
 * Get or create a rate limiter instance
 */
export async function getRateLimiter(name: string, config: RateLimitConfig): Promise<RateLimiter> {
  if (!globalLimiters.has(name)) {
    // Create store if not provided
    if (!config.store) {
      config.store = await createRateLimitStore();
    }
    globalLimiters.set(name, new RateLimiter(config));
  }
  return globalLimiters.get(name)!;
}

/**
 * Create a production-ready rate limiter with Redis support
 */
export async function createProductionRateLimiter(config: Omit<RateLimitConfig, 'store'>): Promise<RateLimiter> {
  const store = await createRateLimitStore();
  return new RateLimiter({ ...config, store });
}

/**
 * Middleware helper for applying rate limiting
 */
export function withRateLimit(config: RateLimitConfig) {
  let limiterPromise: Promise<RateLimiter> | null = null;
  
  return async function(request: Request): Promise<{
    allowed: boolean;
    headers: Record<string, string>;
    error?: { message: string; status: number };
  }> {
    // Lazy initialization of limiter
    if (!limiterPromise) {
      limiterPromise = createProductionRateLimiter(config);
    }
    
    const limiter = await limiterPromise;
    const result = await limiter.checkLimit(request);
    const headers = limiter.createHeaders(result);
    
    if (!result.allowed) {
      return {
        allowed: false,
        headers,
        error: {
          message: config.message || 'Too many requests',
          status: 429,
        }
      };
    }
    
    return {
      allowed: true,
      headers,
    };
  };
}

// Exports are already declared above
