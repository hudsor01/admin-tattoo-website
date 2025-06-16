import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  generateCSRFToken,
  validateCSRFToken,
  extractCSRFToken,
  validateRequestCSRF,
  generateCSRFTokenForResponse,
  withCSRFProtection,
  createCSRFProtection,
  CSRFTokenManager,
  CSRF_CONFIG
} from '@/lib/csrf-protection'

// Mock dependencies
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>()
  return {
    ...actual,
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => 'mocked_hash')
    })),
    randomBytes: vi.fn(() => Buffer.from('mocked_random_bytes')),
    timingSafeEqual: vi.fn(() => true)
  }
})

vi.mock('@/lib/env-validation', () => ({
  env: {
    BETTER_AUTH_SECRET: 'test_secret_key_for_testing_purposes_very_long',
    CSRF_SECRET: 'test_csrf_secret_key'
  }
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn()
  }
}))

// Mock document for client-side tests
Object.defineProperty(global, 'document', {
  value: {
    cookie: 'csrf-token=test.123.hash'
  },
  writable: true
})

// Mock fetch for client-side tests
global.fetch = vi.fn()

describe('csrf-protection.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('generateCSRFToken', () => {
    it('should generate a valid CSRF token', () => {
      const result = generateCSRFToken()
      
      expect(result.token).toContain('.')
      expect(result.expires).toBeGreaterThan(Date.now())
      expect(result.token.split('.')).toHaveLength(3)
    })

    it('should include session ID in token if provided', () => {
      const sessionId = 'test-session-123'
      const result = generateCSRFToken(sessionId)
      
      expect(result.sessionId).toBe(sessionId)
      expect(result.token).toBeTruthy()
    })

    it('should set proper expiration time', () => {
      const result = generateCSRFToken()
      const expectedExpiry = Date.now() + CSRF_CONFIG.maxAge
      
      expect(result.expires).toBe(expectedExpiry)
    })

    it('should generate different tokens on each call', () => {
      vi.mocked(require('crypto').randomBytes).mockReturnValueOnce(Buffer.from('random1'))
      const token1 = generateCSRFToken()
      
      vi.mocked(require('crypto').randomBytes).mockReturnValueOnce(Buffer.from('random2'))
      const token2 = generateCSRFToken()
      
      expect(token1.token).not.toBe(token2.token)
    })

    it('should call crypto functions correctly', () => {
      const mockRandomBytes = vi.mocked(require('crypto').randomBytes)
      const mockCreateHash = vi.mocked(require('crypto').createHash)
      
      generateCSRFToken('session123')
      
      expect(mockRandomBytes).toHaveBeenCalledWith(CSRF_CONFIG.tokenLength)
      expect(mockCreateHash).toHaveBeenCalledWith('sha256')
    })
  })

  describe('validateCSRFToken', () => {
    const validToken = 'random_part.1718452800000.mocked_hash'

    it('should validate a correct token', () => {
      const result = validateCSRFToken(validToken)
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty token', () => {
      const result = validateCSRFToken('')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('No CSRF token provided')
    })

    it('should reject token with invalid format', () => {
      const result = validateCSRFToken('invalid_token')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid token format')
    })

    it('should reject token with missing parts', () => {
      const result = validateCSRFToken('part1.part2.')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid token format')
    })

    it('should reject token with invalid timestamp', () => {
      const result = validateCSRFToken('random.invalid_timestamp.hash')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid timestamp in token')
    })

    it('should detect expired tokens', () => {
      const expiredTimestamp = Date.now() - CSRF_CONFIG.maxAge - 1000
      const expiredToken = `random.${expiredTimestamp}.hash`
      
      const result = validateCSRFToken(expiredToken)
      
      expect(result.valid).toBe(false)
      expect(result.expired).toBe(true)
      expect(result.error).toBe('Token expired')
    })

    it('should reject token with invalid signature', () => {
      vi.mocked(require('crypto').timingSafeEqual).mockReturnValueOnce(false)
      
      const result = validateCSRFToken(validToken)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid signature')
    })

    it('should handle signature length mismatch', () => {
      const tokenWithShortSignature = 'random.1718452800000.short'
      
      const result = validateCSRFToken(tokenWithShortSignature)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid signature')
    })

    it('should validate token with session ID', () => {
      const sessionId = 'test-session'
      const result = validateCSRFToken(validToken, sessionId)
      
      expect(result.valid).toBe(true)
    })

    it('should handle validation errors gracefully', () => {
      vi.mocked(require('crypto').createHash).mockImplementationOnce(() => {
        throw new Error('Crypto error')
      })
      
      const result = validateCSRFToken(validToken)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token validation failed')
    })
  })

  describe('extractCSRFToken', () => {
    const createMockRequest = (options: {
      headers?: Record<string, string>
      url?: string
      method?: string
    } = {}) => {
      return new NextRequest(options.url || 'http://localhost:3001/api/test', {
        method: options.method || 'POST',
        headers: options.headers || {}
      })
    }

    it('should extract token from header', () => {
      const request = createMockRequest({
        headers: { [CSRF_CONFIG.headerName]: 'header_token' }
      })
      
      const result = extractCSRFToken(request)
      
      expect(result).toBe('header_token')
    })

    it('should extract token from form data URL params', () => {
      const request = createMockRequest({
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        url: 'http://localhost:3001/api/test?_csrf=form_token'
      })
      
      const result = extractCSRFToken(request)
      
      expect(result).toBe('form_token')
    })

    it('should prioritize header over form data', () => {
      const request = createMockRequest({
        headers: {
          [CSRF_CONFIG.headerName]: 'header_token',
          'content-type': 'application/x-www-form-urlencoded'
        },
        url: 'http://localhost:3001/api/test?_csrf=form_token'
      })
      
      const result = extractCSRFToken(request)
      
      expect(result).toBe('header_token')
    })

    it('should return null when no token found', () => {
      const request = createMockRequest()
      
      const result = extractCSRFToken(request)
      
      expect(result).toBe(null)
    })

    it('should handle malformed URL gracefully', () => {
      const request = createMockRequest({
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        url: 'invalid-url'
      })
      
      const result = extractCSRFToken(request)
      
      expect(result).toBe(null)
    })

    it('should ignore non-form content types', () => {
      const request = createMockRequest({
        headers: { 'content-type': 'application/json' },
        url: 'http://localhost:3001/api/test?_csrf=form_token'
      })
      
      const result = extractCSRFToken(request)
      
      expect(result).toBe(null)
    })
  })

  describe('validateRequestCSRF', () => {
    const createMockRequest = (method: string, headers: Record<string, string> = {}) => {
      return new NextRequest('http://localhost:3001/api/test', {
        method,
        headers
      })
    }

    it('should allow safe methods without token', async () => {
      const getRequest = createMockRequest('GET')
      const headRequest = createMockRequest('HEAD')
      const optionsRequest = createMockRequest('OPTIONS')
      
      expect(await validateRequestCSRF(getRequest)).toEqual({ valid: true })
      expect(await validateRequestCSRF(headRequest)).toEqual({ valid: true })
      expect(await validateRequestCSRF(optionsRequest)).toEqual({ valid: true })
    })

    it('should require token for unsafe methods', async () => {
      const postRequest = createMockRequest('POST')
      
      const result = await validateRequestCSRF(postRequest)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('CSRF token required for this request')
    })

    it('should validate token for unsafe methods', async () => {
      const postRequest = createMockRequest('POST', {
        [CSRF_CONFIG.headerName]: 'valid.1718452800000.hash'
      })
      
      const result = await validateRequestCSRF(postRequest)
      
      expect(result.valid).toBe(true)
    })

    it('should pass session ID to token validation', async () => {
      const sessionId = 'test-session'
      const postRequest = createMockRequest('POST', {
        [CSRF_CONFIG.headerName]: 'valid.1718452800000.hash'
      })
      
      const result = await validateRequestCSRF(postRequest, sessionId)
      
      expect(result.valid).toBe(true)
    })

    it('should log validation failures', async () => {
      const mockLogger = vi.mocked(require('@/lib/logger').logger)
      const postRequest = createMockRequest('POST', {
        [CSRF_CONFIG.headerName]: 'invalid_token'
      })
      
      await validateRequestCSRF(postRequest)
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'CSRF validation failed',
        expect.objectContaining({
          method: 'POST',
          url: 'http://localhost:3001/api/test'
        })
      )
    })
  })

  describe('generateCSRFTokenForResponse', () => {
    it('should generate response with token and headers', () => {
      const result = generateCSRFTokenForResponse()
      
      expect(result.token).toBeTruthy()
      expect(result.cookieValue).toContain('HttpOnly')
      expect(result.cookieValue).toContain('SameSite=Strict')
      expect(result.headerValue).toBe(result.token)
    })

    it('should include session ID if provided', () => {
      const sessionId = 'test-session'
      const result = generateCSRFTokenForResponse(sessionId)
      
      expect(result.token).toBeTruthy()
      expect(result.cookieValue).toContain(result.token)
    })

    it('should set correct cookie properties', () => {
      const result = generateCSRFTokenForResponse()
      
      expect(result.cookieValue).toContain('HttpOnly')
      expect(result.cookieValue).toContain('SameSite=Strict')
      expect(result.cookieValue).toContain('Path=/')
      expect(result.cookieValue).toContain(`Max-Age=${CSRF_CONFIG.maxAge / 1000}`)
    })
  })

  describe('withCSRFProtection', () => {
    const createMockRequest = (method: string, url: string, headers: Record<string, string> = {}) => {
      return new NextRequest(url, { method, headers })
    }

    it('should skip protection for specified routes', async () => {
      const middleware = withCSRFProtection({
        skipRoutes: [/\/api\/health/]
      })
      
      const request = createMockRequest('POST', 'http://localhost:3001/api/health/check')
      const result = await middleware(request)
      
      expect(result.valid).toBe(true)
    })

    it('should skip protection for safe methods and provide token', async () => {
      const middleware = withCSRFProtection()
      
      const request = createMockRequest('GET', 'http://localhost:3001/api/test')
      const result = await middleware(request)
      
      expect(result.valid).toBe(true)
      expect(result.token).toBeTruthy()
      expect(result.headers).toBeTruthy()
    })

    it('should validate token for unsafe methods', async () => {
      const middleware = withCSRFProtection()
      
      const request = createMockRequest('POST', 'http://localhost:3001/api/test', {
        [CSRF_CONFIG.headerName]: 'valid.1718452800000.hash'
      })
      
      const result = await middleware(request)
      
      expect(result.valid).toBe(true)
      expect(result.token).toBeTruthy()
    })

    it('should reject invalid tokens', async () => {
      vi.mocked(require('crypto').timingSafeEqual).mockReturnValueOnce(false)
      
      const middleware = withCSRFProtection()
      
      const request = createMockRequest('POST', 'http://localhost:3001/api/test', {
        [CSRF_CONFIG.headerName]: 'invalid_token'
      })
      
      const result = await middleware(request)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should use custom session extractor', async () => {
      const customExtractor = vi.fn(() => 'custom-session')
      const middleware = withCSRFProtection({
        customSessionExtractor: customExtractor
      })
      
      const request = createMockRequest('GET', 'http://localhost:3001/api/test')
      await middleware(request)
      
      expect(customExtractor).toHaveBeenCalledWith(request)
    })

    it('should respect custom skip methods', async () => {
      const middleware = withCSRFProtection({
        skipMethods: ['GET', 'POST']
      })
      
      const request = createMockRequest('POST', 'http://localhost:3001/api/test')
      const result = await middleware(request)
      
      expect(result.valid).toBe(true)
      expect(result.token).toBeTruthy()
    })
  })

  describe('createCSRFProtection', () => {
    it('should create middleware with default skip routes', async () => {
      const middleware = createCSRFProtection()
      
      const healthRequest = new NextRequest('http://localhost:3001/api/health/check', {
        method: 'POST'
      })
      
      const result = await middleware(healthRequest)
      
      expect(result.valid).toBe(true)
    })

    it('should skip auth routes', async () => {
      const middleware = createCSRFProtection()
      
      const authRequest = new NextRequest('http://localhost:3001/api/auth/login', {
        method: 'POST'
      })
      
      const result = await middleware(authRequest)
      
      expect(result.valid).toBe(true)
    })

    it('should use custom session extractor', async () => {
      const customExtractor = vi.fn(() => 'extracted-session')
      const middleware = createCSRFProtection(customExtractor)
      
      const request = new NextRequest('http://localhost:3001/api/test', {
        method: 'GET'
      })
      
      await middleware(request)
      
      expect(customExtractor).toHaveBeenCalledWith(request)
    })
  })

  describe('CSRFTokenManager', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('getToken', () => {
      it('should get token from cookie if valid', async () => {
        document.cookie = 'csrf-token=valid.123.hash'
        
        const token = await CSRFTokenManager.getToken()
        
        expect(token).toBe('valid.123.hash')
      })

      it('should fetch new token if cookie is invalid', async () => {
        document.cookie = 'csrf-token=invalid_format'
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'new.456.token' })
        } as Response)
        
        const token = await CSRFTokenManager.getToken()
        
        expect(token).toBe('new.456.token')
        expect(fetch).toHaveBeenCalledWith('/api/csrf-token', {
          method: 'GET',
          credentials: 'same-origin'
        })
      })

      it('should return null if API fails', async () => {
        document.cookie = ''
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
        
        const token = await CSRFTokenManager.getToken()
        
        expect(token).toBe(null)
      })

      it('should return null if API response is not ok', async () => {
        document.cookie = ''
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false
        } as Response)
        
        const token = await CSRFTokenManager.getToken()
        
        expect(token).toBe(null)
      })
    })

    describe('addTokenToHeaders', () => {
      it('should add token to headers', async () => {
        document.cookie = 'csrf-token=valid.123.hash'
        
        const headers = await CSRFTokenManager.addTokenToHeaders()
        
        expect(headers[CSRF_CONFIG.headerName]).toBe('valid.123.hash')
      })

      it('should preserve existing headers', async () => {
        document.cookie = 'csrf-token=valid.123.hash'
        const existingHeaders = { 'Content-Type': 'application/json' }
        
        const headers = await CSRFTokenManager.addTokenToHeaders(existingHeaders)
        
        expect(headers['Content-Type']).toBe('application/json')
        expect(headers[CSRF_CONFIG.headerName]).toBe('valid.123.hash')
      })

      it('should not add header if no token available', async () => {
        document.cookie = ''
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
        
        const headers = await CSRFTokenManager.addTokenToHeaders()
        
        expect(headers[CSRF_CONFIG.headerName]).toBeUndefined()
      })
    })

    describe('secureFetch', () => {
      it('should make fetch request with CSRF token', async () => {
        document.cookie = 'csrf-token=valid.123.hash'
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true
        } as Response)
        
        await CSRFTokenManager.secureFetch('/api/test', {
          method: 'POST',
          body: JSON.stringify({ data: 'test' })
        })
        
        expect(fetch).toHaveBeenCalledWith('/api/test', {
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
          headers: {
            [CSRF_CONFIG.headerName]: 'valid.123.hash'
          },
          credentials: 'same-origin'
        })
      })

      it('should merge with existing headers', async () => {
        document.cookie = 'csrf-token=valid.123.hash'
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true
        } as Response)
        
        await CSRFTokenManager.secureFetch('/api/test', {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        expect(fetch).toHaveBeenCalledWith('/api/test', {
          headers: {
            'Content-Type': 'application/json',
            [CSRF_CONFIG.headerName]: 'valid.123.hash'
          },
          credentials: 'same-origin'
        })
      })

      it('should work without existing headers', async () => {
        document.cookie = 'csrf-token=valid.123.hash'
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true
        } as Response)
        
        await CSRFTokenManager.secureFetch('/api/test')
        
        expect(fetch).toHaveBeenCalledWith('/api/test', {
          headers: {
            [CSRF_CONFIG.headerName]: 'valid.123.hash'
          },
          credentials: 'same-origin'
        })
      })
    })

    describe('isValidTokenFormat', () => {
      it('should validate correct token format', () => {
        expect(CSRFTokenManager.isValidTokenFormat('part1.part2.part3')).toBe(true)
      })

      it('should reject invalid token format', () => {
        expect(CSRFTokenManager.isValidTokenFormat('invalid')).toBe(false)
        expect(CSRFTokenManager.isValidTokenFormat('part1.part2')).toBe(false)
        expect(CSRFTokenManager.isValidTokenFormat('part1.part2.part3.part4')).toBe(false)
      })
    })
  })

  describe('CSRF_CONFIG', () => {
    it('should export configuration object', () => {
      expect(CSRF_CONFIG.tokenLength).toBe(32)
      expect(CSRF_CONFIG.maxAge).toBe(60 * 60 * 1000)
      expect(CSRF_CONFIG.cookieName).toBe('csrf-token')
      expect(CSRF_CONFIG.headerName).toBe('x-csrf-token')
    })

    it('should use environment secret', () => {
      expect(CSRF_CONFIG.secretKey).toBeTruthy()
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle missing crypto module gracefully', async () => {
      vi.mocked(require('crypto').createHash).mockImplementationOnce(() => {
        throw new Error('Crypto not available')
      })
      
      const result = validateCSRFToken('valid.123.hash')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token validation failed')
    })

    it('should handle malformed cookies', async () => {
      document.cookie = 'csrf-token='
      
      const token = await CSRFTokenManager.getToken()
      
      expect(fetch).toHaveBeenCalledWith('/api/csrf-token', expect.any(Object))
    })

    it('should handle very long tokens', () => {
      const longToken = 'a'.repeat(1000) + '.123.' + 'b'.repeat(1000)
      
      const result = validateCSRFToken(longToken)
      
      expect(result.valid).toBe(false)
    })

    it('should handle concurrent token validation', async () => {
      const token = 'valid.1718452800000.hash'
      
      const promises = Array(10).fill(null).map(() => 
        validateCSRFToken(token, 'session')
      )
      
      const results = await Promise.all(promises)
      
      results.forEach(result => {
        expect(result.valid).toBe(true)
      })
    })

    it('should handle buffer allocation errors', () => {
      const originalBuffer = Buffer.from
      vi.spyOn(Buffer, 'from').mockImplementationOnce(() => {
        throw new Error('Buffer allocation failed')
      })
      
      const result = validateCSRFToken('valid.123.hash')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token validation failed')
      
      Buffer.from = originalBuffer
    })
  })
})