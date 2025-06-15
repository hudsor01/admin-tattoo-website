import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getRateLimiter } from '@/lib/rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Auth Rate Limiter', () => {
    it('should allow requests within limit', () => {
      const limiter = getRateLimiter('auth')
      const ip = '192.168.1.1'

      // Should allow first 5 requests
      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed(ip)).toBe(true)
      }
    })

    it('should block requests over limit', () => {
      const limiter = getRateLimiter('auth')
      const ip = '192.168.1.2'

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        limiter.isAllowed(ip)
      }

      // Next request should be blocked
      expect(limiter.isAllowed(ip)).toBe(false)
    })

    it('should reset after window expires', () => {
      const limiter = getRateLimiter('auth')
      const ip = '192.168.1.3'

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        limiter.isAllowed(ip)
      }

      // Should be blocked
      expect(limiter.isAllowed(ip)).toBe(false)

      // Fast forward past the window (15 minutes + 1 second)
      vi.advanceTimersByTime(15 * 60 * 1000 + 1000)

      // Should allow new requests
      expect(limiter.isAllowed(ip)).toBe(true)
    })
  })

  describe('API Rate Limiter', () => {
    it('should have higher limits for API calls', () => {
      const limiter = getRateLimiter('api')
      const ip = '192.168.1.4'

      // Should allow more requests (100 vs 5 for auth)
      for (let i = 0; i < 100; i++) {
        expect(limiter.isAllowed(ip)).toBe(true)
      }

      // 101st request should be blocked
      expect(limiter.isAllowed(ip)).toBe(false)
    })
  })

  describe('Rate Limiter Utilities', () => {
    it('should return correct remaining count', () => {
      const limiter = getRateLimiter('auth')
      const ip = '192.168.1.5'

      expect(limiter.getRemaining(ip)).toBe(5)

      limiter.isAllowed(ip) // Use 1
      expect(limiter.getRemaining(ip)).toBe(4)

      limiter.isAllowed(ip) // Use 2
      expect(limiter.getRemaining(ip)).toBe(3)
    })

    it('should return correct reset time', () => {
      const limiter = getRateLimiter('auth')
      const ip = '192.168.1.6'
      const startTime = Date.now()

      limiter.isAllowed(ip)
      const resetTime = limiter.getResetTime(ip)

      // Reset time should be approximately 15 minutes from now
      const expectedResetTime = startTime + (15 * 60 * 1000)
      expect(resetTime).toBeCloseTo(expectedResetTime, -2) // Within 100ms
    })
  })
})