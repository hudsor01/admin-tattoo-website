import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  SecurityHeadersConfig,
  DEFAULT_SECURITY_HEADERS,
  createSecurityHeaders,
  withSecurityHeaders,
  createCSPNonce,
  updateCSPWithNonce,
  validateSecurityConfig,
  logSecurityHeadersStatus,
  securityHeaders
} from '@/lib/security-headers'

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    })
  }
})

describe('security-headers.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('DEFAULT_SECURITY_HEADERS', () => {
    it('should have proper CSP configuration', () => {
      expect(DEFAULT_SECURITY_HEADERS.contentSecurityPolicy).toContain("default-src 'self'")
      expect(DEFAULT_SECURITY_HEADERS.contentSecurityPolicy).toContain("object-src 'none'")
      expect(DEFAULT_SECURITY_HEADERS.contentSecurityPolicy).toContain("frame-ancestors 'none'")
    })

    it('should have secure frame options', () => {
      expect(DEFAULT_SECURITY_HEADERS.frameOptions).toBe('DENY')
    })

    it('should enable content type options', () => {
      expect(DEFAULT_SECURITY_HEADERS.contentTypeOptions).toBe(true)
    })

    it('should have secure referrer policy', () => {
      expect(DEFAULT_SECURITY_HEADERS.referrerPolicy).toBe('strict-origin-when-cross-origin')
    })

    it('should have HSTS configuration', () => {
      expect(DEFAULT_SECURITY_HEADERS.strictTransportSecurity).toEqual({
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true
      })
    })

    it('should have restrictive permissions policy', () => {
      expect(DEFAULT_SECURITY_HEADERS.permissionsPolicy?.camera).toEqual([])
      expect(DEFAULT_SECURITY_HEADERS.permissionsPolicy?.microphone).toEqual([])
      expect(DEFAULT_SECURITY_HEADERS.permissionsPolicy?.geolocation).toEqual([])
    })

    it('should have secure cross-origin policies', () => {
      expect(DEFAULT_SECURITY_HEADERS.crossOriginEmbedderPolicy).toBe('require-corp')
      expect(DEFAULT_SECURITY_HEADERS.crossOriginOpenerPolicy).toBe('same-origin')
      expect(DEFAULT_SECURITY_HEADERS.crossOriginResourcePolicy).toBe('same-origin')
    })
  })

  describe('createSecurityHeaders', () => {
    it('should create headers with default configuration', () => {
      const headers = createSecurityHeaders()
      
      expect(headers['Content-Security-Policy']).toBe(DEFAULT_SECURITY_HEADERS.contentSecurityPolicy)
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    })

    it('should merge custom configuration with defaults', () => {
      const customConfig: SecurityHeadersConfig = {
        frameOptions: 'SAMEORIGIN',
        referrerPolicy: 'no-referrer'
      }
      
      const headers = createSecurityHeaders(customConfig)
      
      expect(headers['X-Frame-Options']).toBe('SAMEORIGIN')
      expect(headers['Referrer-Policy']).toBe('no-referrer')
      expect(headers['Content-Security-Policy']).toBe(DEFAULT_SECURITY_HEADERS.contentSecurityPolicy)
    })

    it('should create HSTS header correctly', () => {
      const headers = createSecurityHeaders()
      
      expect(headers['Strict-Transport-Security']).toBe('max-age=63072000; includeSubDomains; preload')
    })

    it('should create HSTS header without optional flags', () => {
      const customConfig: SecurityHeadersConfig = {
        strictTransportSecurity: {
          maxAge: 3600,
          includeSubDomains: false,
          preload: false
        }
      }
      
      const headers = createSecurityHeaders(customConfig)
      
      expect(headers['Strict-Transport-Security']).toBe('max-age=3600')
    })

    it('should create permissions policy header', () => {
      const headers = createSecurityHeaders()
      
      expect(headers['Permissions-Policy']).toContain('camera=()')
      expect(headers['Permissions-Policy']).toContain('microphone=()')
      expect(headers['Permissions-Policy']).toContain('autoplay=("self")')
    })

    it('should handle empty permissions policy allowlist', () => {
      const customConfig: SecurityHeadersConfig = {
        permissionsPolicy: {
          camera: [],
          microphone: ['self']
        }
      }
      
      const headers = createSecurityHeaders(customConfig)
      
      expect(headers['Permissions-Policy']).toContain('camera=()')
      expect(headers['Permissions-Policy']).toContain('microphone=("self")')
    })

    it('should set cross-origin policies', () => {
      const headers = createSecurityHeaders()
      
      expect(headers['Cross-Origin-Embedder-Policy']).toBe('require-corp')
      expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin')
      expect(headers['Cross-Origin-Resource-Policy']).toBe('same-origin')
    })

    it('should set additional security headers', () => {
      const headers = createSecurityHeaders()
      
      expect(headers['X-Permitted-Cross-Domain-Policies']).toBe('none')
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
      expect(headers['X-DNS-Prefetch-Control']).toBe('off')
      expect(headers['X-Download-Options']).toBe('noopen')
    })

    it('should handle undefined configuration values', () => {
      const customConfig: SecurityHeadersConfig = {
        contentSecurityPolicy: undefined,
        frameOptions: undefined,
        contentTypeOptions: undefined
      }
      
      const headers = createSecurityHeaders(customConfig)
      
      expect(headers['Content-Security-Policy']).toBeUndefined()
      expect(headers['X-Frame-Options']).toBeUndefined()
      expect(headers['X-Content-Type-Options']).toBeUndefined()
    })

    it('should handle false contentTypeOptions', () => {
      const customConfig: SecurityHeadersConfig = {
        contentTypeOptions: false
      }
      
      const headers = createSecurityHeaders(customConfig)
      
      expect(headers['X-Content-Type-Options']).toBeUndefined()
    })
  })

  describe('withSecurityHeaders', () => {
    const createMockResponse = (body = 'test', status = 200) => {
      return new Response(body, { 
        status,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/html' }
      })
    }

    it('should apply security headers to response', () => {
      const middleware = withSecurityHeaders()
      const originalResponse = createMockResponse()
      
      const newResponse = middleware(originalResponse)
      
      expect(newResponse.headers.get('X-Frame-Options')).toBe('DENY')
      expect(newResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(newResponse.headers.get('Content-Security-Policy')).toBeTruthy()
    })

    it('should preserve original response properties', () => {
      const middleware = withSecurityHeaders()
      const originalResponse = createMockResponse('Hello World', 201)
      
      const newResponse = middleware(originalResponse)
      
      expect(newResponse.status).toBe(201)
      expect(newResponse.statusText).toBe('OK')
      expect(newResponse.headers.get('Content-Type')).toBe('text/html')
    })

    it('should apply custom security configuration', () => {
      const customConfig: SecurityHeadersConfig = {
        frameOptions: 'SAMEORIGIN'
      }
      const middleware = withSecurityHeaders(customConfig)
      const originalResponse = createMockResponse()
      
      const newResponse = middleware(originalResponse)
      
      expect(newResponse.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    })

    it('should not modify the original response', () => {
      const middleware = withSecurityHeaders()
      const originalResponse = createMockResponse()
      const originalHeadersCount = Array.from(originalResponse.headers.keys()).length
      
      const newResponse = middleware(originalResponse)
      
      expect(Array.from(originalResponse.headers.keys())).toHaveLength(originalHeadersCount)
      expect(Array.from(newResponse.headers.keys()).length).toBeGreaterThan(originalHeadersCount)
    })
  })

  describe('createCSPNonce', () => {
    it('should generate a nonce string', () => {
      const nonce = createCSPNonce()
      
      expect(typeof nonce).toBe('string')
      expect(nonce).toHaveLength(32) // 16 bytes * 2 hex chars
    })

    it('should generate different nonces on each call', () => {
      const nonce1 = createCSPNonce()
      const nonce2 = createCSPNonce()
      
      expect(nonce1).not.toBe(nonce2)
    })

    it('should only contain hex characters', () => {
      const nonce = createCSPNonce()
      
      expect(nonce).toMatch(/^[0-9a-f]+$/)
    })

    it('should call crypto.getRandomValues', () => {
      createCSPNonce()
      
      expect(crypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array))
    })
  })

  describe('updateCSPWithNonce', () => {
    it('should add nonce to script-src directive', () => {
      const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'"
      const nonce = 'abc123'
      
      const result = updateCSPWithNonce(csp, nonce)
      
      expect(result).toBe("default-src 'self'; script-src 'self' 'unsafe-inline' 'nonce-abc123'")
    })

    it('should handle CSP without script-src', () => {
      const csp = "default-src 'self'; style-src 'self'"
      const nonce = 'abc123'
      
      const result = updateCSPWithNonce(csp, nonce)
      
      expect(result).toBe(csp) // Should remain unchanged
    })

    it('should handle empty CSP', () => {
      const csp = ''
      const nonce = 'abc123'
      
      const result = updateCSPWithNonce(csp, nonce)
      
      expect(result).toBe('')
    })

    it('should handle complex script-src directive', () => {
      const csp = "default-src 'self'; script-src 'self' https://apis.google.com 'unsafe-eval'; style-src 'self'"
      const nonce = 'xyz789'
      
      const result = updateCSPWithNonce(csp, nonce)
      
      expect(result).toBe("default-src 'self'; script-src 'self' https://apis.google.com 'unsafe-eval' 'nonce-xyz789'; style-src 'self'")
    })
  })

  describe('validateSecurityConfig', () => {
    it('should validate default configuration', () => {
      const result = validateSecurityConfig(DEFAULT_SECURITY_HEADERS)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings.length).toBeGreaterThan(0) // Should have warnings for unsafe-inline/unsafe-eval
    })

    it('should detect missing CSP', () => {
      const config: SecurityHeadersConfig = {
        frameOptions: 'DENY'
      }
      
      const result = validateSecurityConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Content Security Policy is not defined')
    })

    it('should warn about unsafe-eval in CSP', () => {
      const config: SecurityHeadersConfig = {
        contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-eval'"
      }
      
      const result = validateSecurityConfig(config)
      
      expect(result.warnings).toContain('CSP allows unsafe-eval which may be dangerous')
    })

    it('should warn about unsafe-inline in CSP', () => {
      const config: SecurityHeadersConfig = {
        contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'"
      }
      
      const result = validateSecurityConfig(config)
      
      expect(result.warnings).toContain('CSP allows unsafe-inline which reduces security')
    })

    it('should warn about missing object-src none', () => {
      const config: SecurityHeadersConfig = {
        contentSecurityPolicy: "default-src 'self'; script-src 'self'"
      }
      
      const result = validateSecurityConfig(config)
      
      expect(result.warnings).toContain('CSP should include object-src none to prevent object injection')
    })

    it('should warn about missing frame options', () => {
      const config: SecurityHeadersConfig = {
        contentSecurityPolicy: "default-src 'self'; object-src 'none'"
      }
      
      const result = validateSecurityConfig(config)
      
      expect(result.warnings).toContain('X-Frame-Options not set - clickjacking protection missing')
    })

    it('should warn about missing HSTS', () => {
      const config: SecurityHeadersConfig = {
        contentSecurityPolicy: "default-src 'self'; object-src 'none'",
        frameOptions: 'DENY'
      }
      
      const result = validateSecurityConfig(config)
      
      expect(result.warnings).toContain('HSTS not configured')
    })

    it('should warn about insecure frame options', () => {
      const config: SecurityHeadersConfig = {
        contentSecurityPolicy: "default-src 'self'; object-src 'none'",
        frameOptions: 'ALLOWALL'
      }
      
      const result = validateSecurityConfig(config)
      
      expect(result.warnings).toContain('Frame options should be DENY or SAMEORIGIN')
    })

    it('should handle secure configuration', () => {
      const config: SecurityHeadersConfig = {
        contentSecurityPolicy: "default-src 'self'; object-src 'none'",
        frameOptions: 'DENY',
        strictTransportSecurity: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      }
      
      const result = validateSecurityConfig(config)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('logSecurityHeadersStatus', () => {
    it('should call validateSecurityConfig', () => {
      // Just test that the function runs without error since it's mainly for logging
      expect(() => {
        logSecurityHeadersStatus(DEFAULT_SECURITY_HEADERS)
      }).not.toThrow()
    })

    it('should not throw errors', () => {
      expect(() => {
        logSecurityHeadersStatus(DEFAULT_SECURITY_HEADERS)
      }).not.toThrow()
    })

    it('should handle empty configuration', () => {
      expect(() => {
        logSecurityHeadersStatus({})
      }).not.toThrow()
    })

    it('should handle configuration with errors', () => {
      const config: SecurityHeadersConfig = {}
      
      expect(() => {
        logSecurityHeadersStatus(config)
      }).not.toThrow()
    })
  })

  describe('securityHeaders export', () => {
    it('should export the default security headers', () => {
      expect(securityHeaders).toBe(DEFAULT_SECURITY_HEADERS)
      expect(securityHeaders.contentSecurityPolicy).toBeTruthy()
      expect(securityHeaders.frameOptions).toBe('DENY')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null configuration', () => {
      const headers = createSecurityHeaders(null as any)
      
      expect(headers).toBeTruthy()
      expect(typeof headers).toBe('object')
    })

    it('should handle configuration with null values', () => {
      const config: SecurityHeadersConfig = {
        contentSecurityPolicy: null as any,
        frameOptions: null as any
      }
      
      const headers = createSecurityHeaders(config)
      
      expect(headers['Content-Security-Policy']).toBeUndefined()
      expect(headers['X-Frame-Options']).toBeUndefined()
    })

    it('should handle empty permissions policy', () => {
      const config: SecurityHeadersConfig = {
        permissionsPolicy: {}
      }
      
      const headers = createSecurityHeaders(config)
      
      expect(headers['Permissions-Policy']).toBe('')
    })

    it('should handle malformed CSP for nonce update', () => {
      const malformedCSP = 'not-a-valid-csp'
      const result = updateCSPWithNonce(malformedCSP, 'nonce123')
      
      expect(result).toBe(malformedCSP)
    })

    it('should handle response cloning with stream body', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue('test data')
          controller.close()
        }
      })
      
      const originalResponse = new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
      
      const middleware = withSecurityHeaders()
      const newResponse = middleware(originalResponse)
      
      expect(newResponse).toBeInstanceOf(Response)
      expect(newResponse.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should handle very long CSP directives', () => {
      const longCSP = 'script-src ' + 'https://example.com '.repeat(100)
      const nonce = 'abc123'
      
      const result = updateCSPWithNonce(longCSP, nonce)
      
      expect(result).toContain('nonce-abc123')
    })

    it('should validate permissions policy with unusual origins', () => {
      const config: SecurityHeadersConfig = {
        contentSecurityPolicy: "default-src 'self'; object-src 'none'",
        permissionsPolicy: {
          camera: ['self', 'https://example.com', '*']
        }
      }
      
      const headers = createSecurityHeaders(config)
      
      expect(headers['Permissions-Policy']).toContain('camera=("self" "https://example.com" "*")')
    })
  })
})