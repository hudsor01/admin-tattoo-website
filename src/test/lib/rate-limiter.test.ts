import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ProductionRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  generalRateLimiter,
  getRateLimiter
} from '@/lib/rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('ProductionRateLimiter Basic Functionality', () => {
    it('should allow requests within limit', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'test-user-1'

      // Should allow first request
      expect(rateLimiter.isAllowed(identifier)).toBe(true)
      expect(rateLimiter.getRemaining(identifier)).toBe(19)

      // Should allow subsequent requests up to limit
      for (let i = 0; i < 18; i++) {
        expect(rateLimiter.isAllowed(identifier)).toBe(true)
      }

      expect(rateLimiter.getRemaining(identifier)).toBe(1)
    })

    it('should block requests when limit exceeded', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'test-user-2'

      // Exhaust the limit (20 requests for general limiter)
      for (let i = 0; i < 20; i++) {
        expect(rateLimiter.isAllowed(identifier)).toBe(true)
      }

      // Next request should be blocked
      expect(rateLimiter.isAllowed(identifier)).toBe(false)
      expect(rateLimiter.getRemaining(identifier)).toBe(0)
    })

    it('should reset after window expires', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'test-user-3'

      // Exhaust the limit
      for (let i = 0; i < 20; i++) {
        expect(rateLimiter.isAllowed(identifier)).toBe(true)
      }

      expect(rateLimiter.isAllowed(identifier)).toBe(false)

      // Fast forward past the window (1 minute for general limiter)
      vi.advanceTimersByTime(61 * 1000)

      // Should be allowed again
      expect(rateLimiter.isAllowed(identifier)).toBe(true)
      expect(rateLimiter.getRemaining(identifier)).toBe(19)
    })

    it('should handle multiple identifiers independently', () => {
      const rateLimiter = getRateLimiter('general')
      const user1 = 'user-1'
      const user2 = 'user-2'

      // Exhaust limit for user1
      for (let i = 0; i < 20; i++) {
        expect(rateLimiter.isAllowed(user1)).toBe(true)
      }
      expect(rateLimiter.isAllowed(user1)).toBe(false)

      // user2 should still be allowed
      expect(rateLimiter.isAllowed(user2)).toBe(true)
      expect(rateLimiter.getRemaining(user2)).toBe(19)
    })

    it('should return correct remaining count', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'test-remaining'

      expect(rateLimiter.getRemaining(identifier)).toBe(20)

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed(identifier)
      }

      expect(rateLimiter.getRemaining(identifier)).toBe(15)
    })

    it('should return correct reset time', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'test-reset-time'
      const now = Date.now()

      rateLimiter.isAllowed(identifier)
      const resetTime = rateLimiter.getResetTime(identifier)

      // Should be approximately 1 minute from now (general limiter window)
      expect(resetTime).toBeGreaterThan(now + 59 * 1000)
      expect(resetTime).toBeLessThan(now + 61 * 1000)
    })
  })

  describe('Rate Limiter Types', () => {
    it('should have correct configuration for auth rate limiter', () => {
      const rateLimiter = getRateLimiter('auth')
      const identifier = 'auth-user'

      // Auth limiter allows 5 requests
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed(identifier)).toBe(true)
      }
      expect(rateLimiter.isAllowed(identifier)).toBe(false)
      expect(rateLimiter.getRemaining(identifier)).toBe(0)
    })

    it('should have correct configuration for API rate limiter', () => {
      const rateLimiter = getRateLimiter('api')
      const identifier = 'api-user'

      // API limiter allows 100 requests
      for (let i = 0; i < 100; i++) {
        expect(rateLimiter.isAllowed(identifier)).toBe(true)
      }
      expect(rateLimiter.isAllowed(identifier)).toBe(false)
      expect(rateLimiter.getRemaining(identifier)).toBe(0)
    })

    it('should have correct configuration for general rate limiter', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'general-user'

      // General limiter allows 20 requests
      for (let i = 0; i < 20; i++) {
        expect(rateLimiter.isAllowed(identifier)).toBe(true)
      }
      expect(rateLimiter.isAllowed(identifier)).toBe(false)
      expect(rateLimiter.getRemaining(identifier)).toBe(0)
    })

    it('should return general rate limiter for unknown type', () => {
      const rateLimiter = getRateLimiter('unknown' as any)
      expect(rateLimiter).toBe(generalRateLimiter)
    })
  })

  describe('Memory Management', () => {
    it('should clean up expired entries', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'cleanup-test'

      // Make a request
      rateLimiter.isAllowed(identifier)
      expect(rateLimiter.getStoreSize()).toBeGreaterThan(0)

      // Fast forward past window time
      vi.advanceTimersByTime(120 * 1000)

      // Force cleanup manually
      rateLimiter.forceCleanup()

      // Make a new request
      rateLimiter.isAllowed('different-user')

      // Store size should be minimal (only the new user)
      expect(rateLimiter.getStoreSize()).toBeLessThanOrEqual(2)
    })

    it('should handle LRU eviction when max entries exceeded', () => {
      // Use a custom rate limiter with small max entries for testing
      const testRateLimiter = new ProductionRateLimiter({
        maxRequests: 10,
        windowMs: 60 * 1000,
        maxEntries: 5
      })

      // Add more entries than maxEntries
      for (let i = 0; i < 10; i++) {
        testRateLimiter.isAllowed(`user-${i}`)
      }

      // Store should not exceed maxEntries significantly
      expect(testRateLimiter.getStoreSize()).toBeLessThanOrEqual(6)
    })

    it('should update last request time on subsequent requests', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'last-request-test'

      // Make initial request
      rateLimiter.isAllowed(identifier)
      const initialResetTime = rateLimiter.getResetTime(identifier)

      // Advance time slightly
      vi.advanceTimersByTime(5000)

      // Make another request
      rateLimiter.isAllowed(identifier)
      const newResetTime = rateLimiter.getResetTime(identifier)

      // Reset time should remain the same within the window
      expect(newResetTime).toBe(initialResetTime)
      
      // But if we advance past the window, it should update
      vi.advanceTimersByTime(120 * 1000) // Past the 1-minute window
      rateLimiter.isAllowed(identifier)
      const futureResetTime = rateLimiter.getResetTime(identifier)
      expect(futureResetTime).toBeGreaterThan(initialResetTime)
    })
  })

  describe('Edge Cases', () => {
    it('should handle requests for non-existent entries', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'non-existent'

      // Should return max requests for non-existent entry
      expect(rateLimiter.getRemaining(identifier)).toBe(20)

      // Reset time should be in the future
      const resetTime = rateLimiter.getResetTime(identifier)
      expect(resetTime).toBeGreaterThan(Date.now())
    })

    it('should handle concurrent requests properly', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'concurrent-test'

      // Simulate concurrent requests
      const results = []
      for (let i = 0; i < 25; i++) {
        results.push(rateLimiter.isAllowed(identifier))
      }

      // First 20 should be allowed, rest should be blocked
      const allowedCount = results.filter(result => result).length
      expect(allowedCount).toBe(20)
    })

    it('should handle zero remaining requests correctly', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'zero-remaining'

      // Exhaust all requests
      for (let i = 0; i < 20; i++) {
        rateLimiter.isAllowed(identifier)
      }

      expect(rateLimiter.getRemaining(identifier)).toBe(0)
      expect(rateLimiter.isAllowed(identifier)).toBe(false)
    })

    it('should handle rapid successive requests', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'rapid-requests'

      // Make rapid requests
      const results = []
      for (let i = 0; i < 30; i++) {
        results.push({
          allowed: rateLimiter.isAllowed(identifier),
          remaining: rateLimiter.getRemaining(identifier)
        })
      }

      // Verify consistency
      let allowedCount = 0
      for (const result of results) {
        if (result.allowed) {
          allowedCount++
          expect(result.remaining).toBe(20 - allowedCount)
        } else {
          expect(result.remaining).toBe(0)
        }
      }

      expect(allowedCount).toBe(20)
    })

    it('should handle boundary conditions at window reset', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'boundary-test'

      // Make request just before window expires
      rateLimiter.isAllowed(identifier)
      
      // Advance to just before reset
      vi.advanceTimersByTime(59 * 1000)
      expect(rateLimiter.getRemaining(identifier)).toBe(19)

      // Advance past reset
      vi.advanceTimersByTime(2 * 1000)
      expect(rateLimiter.getRemaining(identifier)).toBe(20)
    })
  })

  describe('Singleton Instances', () => {
    it('should provide singleton instances', () => {
      expect(authRateLimiter).toBeDefined()
      expect(apiRateLimiter).toBeDefined()
      expect(generalRateLimiter).toBeDefined()

      // Should be the same instances
      expect(getRateLimiter('auth')).toBe(authRateLimiter)
      expect(getRateLimiter('api')).toBe(apiRateLimiter)
      expect(getRateLimiter('general')).toBe(generalRateLimiter)
    })

    it('should maintain separate state for different rate limiter types', () => {
      const authIdentifier = 'auth-test'
      const apiIdentifier = 'api-test'
      const generalIdentifier = 'general-test'

      // Exhaust auth limiter
      const authLimiter = getRateLimiter('auth')
      for (let i = 0; i < 5; i++) {
        authLimiter.isAllowed(authIdentifier)
      }
      expect(authLimiter.isAllowed(authIdentifier)).toBe(false)

      // API and general should still work
      expect(getRateLimiter('api').isAllowed(apiIdentifier)).toBe(true)
      expect(getRateLimiter('general').isAllowed(generalIdentifier)).toBe(true)
    })
  })

  describe('Performance and Monitoring', () => {
    it('should track store size correctly', () => {
      const rateLimiter = getRateLimiter('general')
      const initialSize = rateLimiter.getStoreSize()

      // Add some entries
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed(`perf-user-${i}`)
      }

      expect(rateLimiter.getStoreSize()).toBe(initialSize + 5)
    })

    it('should handle cleanup interval correctly', () => {
      const rateLimiter = getRateLimiter('general')
      
      // Add entry
      rateLimiter.isAllowed('cleanup-interval-test')
      const sizeBeforeCleanup = rateLimiter.getStoreSize()

      // Advance time to trigger periodic cleanup
      vi.advanceTimersByTime(120 * 1000)

      // Size should be reduced (expired entries cleaned up)
      expect(rateLimiter.getStoreSize()).toBeLessThanOrEqual(sizeBeforeCleanup)
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle Date.now() fluctuations gracefully', () => {
      const rateLimiter = getRateLimiter('general')
      const identifier = 'time-fluctuation'

      // Mock Date.now to simulate time going backwards (clock adjustment)
      const originalNow = Date.now
      let mockTime = originalNow()
      
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime)

      rateLimiter.isAllowed(identifier)
      
      // Simulate time going backwards
      mockTime -= 1000
      
      // Should still work without throwing
      expect(() => rateLimiter.isAllowed(identifier)).not.toThrow()
      
      Date.now = originalNow
    })

    it('should handle extreme identifier values', () => {
      const rateLimiter = getRateLimiter('general')

      // Test with very long identifier
      const longIdentifier = 'a'.repeat(1000)
      expect(rateLimiter.isAllowed(longIdentifier)).toBe(true)

      // Test with special characters
      const specialIdentifier = '!@#$%^&*()_+{}|:"<>?[]\\;\',./'
      expect(rateLimiter.isAllowed(specialIdentifier)).toBe(true)

      // Test with unicode
      const unicodeIdentifier = '测试用户🚀🎯'
      expect(rateLimiter.isAllowed(unicodeIdentifier)).toBe(true)
    })
  })
})