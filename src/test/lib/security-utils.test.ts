import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  SecurityLogger,
  withErrorHandler,
  getClientIP,
  PerformanceMonitor
} from '@/lib/security-utils'

// Mock console methods
const originalConsole = {
  error: console.error,
  warn: console.warn,
  info: console.info
}

// Mock NextResponse
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, init) => ({ json: data, status: init?.status || 200 }))
  }
}))

describe('Security Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.error = vi.fn()
    console.warn = vi.fn()
    console.info = vi.fn()
    
    // Reset singleton instance
    ;(SecurityLogger as any).instance = undefined
  })

  afterEach(() => {
    console.error = originalConsole.error
    console.warn = originalConsole.warn
    console.info = originalConsole.info
    
    delete process.env.LOG_LEVEL
  })

  describe('SecurityLogger', () => {
    describe('Singleton Pattern', () => {
      it('should return the same instance', () => {
        const logger1 = SecurityLogger.getInstance()
        const logger2 = SecurityLogger.getInstance()

        expect(logger1).toBe(logger2)
      })

      it('should create new instance on first call', () => {
        const logger = SecurityLogger.getInstance()

        expect(logger).toBeInstanceOf(SecurityLogger)
      })
    })

    describe('Log Level Configuration', () => {
      it('should use default log level when not set', () => {
        const logger = SecurityLogger.getInstance()
        
        logger.info('test message')
        
        expect(console.info).toHaveBeenCalledWith(
          'Security Info:',
          'test message',
          undefined
        )
      })

      it('should use LOG_LEVEL environment variable', () => {
        process.env.LOG_LEVEL = 'error'
        const logger = SecurityLogger.getInstance()
        
        logger.warn('warning message')
        logger.error('error message')
        
        expect(console.warn).not.toHaveBeenCalled()
        expect(console.error).toHaveBeenCalledWith(
          'Security Error:',
          'error message',
          expect.objectContaining({
            error: undefined
          })
        )
      })

      it('should respect debug log level', () => {
        process.env.LOG_LEVEL = 'debug'
        const logger = SecurityLogger.getInstance()
        
        logger.info('info message', { key: 'value' })
        
        expect(console.info).toHaveBeenCalledWith(
          'Security Info:',
          'info message',
          { key: 'value' }
        )
      })

      it('should filter logs below current level', () => {
        process.env.LOG_LEVEL = 'warn'
        const logger = SecurityLogger.getInstance()
        
        logger.info('info message')
        logger.warn('warn message')
        logger.error('error message')
        
        expect(console.info).not.toHaveBeenCalled()
        expect(console.warn).toHaveBeenCalledWith(
          'Security Warning:',
          'warn message',
          undefined
        )
        expect(console.error).toHaveBeenCalled()
      })
    })

    describe('Error Logging', () => {
      it('should log error message with metadata', () => {
        const logger = SecurityLogger.getInstance()
        const metadata = { userId: '123', action: 'login' }
        
        logger.error('Login failed', undefined, metadata)
        
        expect(console.error).toHaveBeenCalledWith(
          'Security Error:',
          'Login failed',
          {
            ...metadata,
            error: undefined
          }
        )
      })

      it('should log error with Error object', () => {
        const logger = SecurityLogger.getInstance()
        const error = new Error('Database connection failed')
        const metadata = { context: 'user-creation' }
        
        logger.error('Operation failed', error, metadata)
        
        expect(console.error).toHaveBeenCalledWith(
          'Security Error:',
          'Operation failed',
          {
            ...metadata,
            error: {
              name: 'Error',
              message: 'Database connection failed',
              stack: error.stack
            }
          }
        )
      })

      it('should hide stack trace in production', () => {
        const originalNodeEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'
        
        const logger = SecurityLogger.getInstance()
        const error = new Error('Test error')
        
        logger.error('Test', error)
        
        expect(console.error).toHaveBeenCalledWith(
          'Security Error:',
          'Test',
          {
            error: {
              name: 'Error',
              message: 'Test error',
              stack: undefined
            }
          }
        )
        
        process.env.NODE_ENV = originalNodeEnv
      })
    })

    describe('Warning Logging', () => {
      it('should log warning with metadata', () => {
        const logger = SecurityLogger.getInstance()
        const metadata = { threshold: 1000, actual: 1500 }
        
        logger.warn('Performance threshold exceeded', metadata)
        
        expect(console.warn).toHaveBeenCalledWith(
          'Security Warning:',
          'Performance threshold exceeded',
          metadata
        )
      })
    })

    describe('Info Logging', () => {
      it('should log info with metadata', () => {
        const logger = SecurityLogger.getInstance()
        const metadata = { operation: 'cache-clear', count: 5 }
        
        logger.info('Cache cleared', metadata)
        
        expect(console.info).toHaveBeenCalledWith(
          'Security Info:',
          'cache cleared',
          metadata
        )
      })
    })

    describe('Security Event Logging', () => {
      it('should log security events with high priority', () => {
        const logger = SecurityLogger.getInstance()
        const metadata = { ip: '192.168.1.1', userAgent: 'browser' }
        
        logger.security('Suspicious login attempt', metadata)
        
        expect(console.error).toHaveBeenCalledWith(
          'SECURITY EVENT:',
          'Suspicious login attempt',
          {
            ...metadata,
            securityEvent: true,
            priority: 'high',
            timestamp: expect.any(String),
            environment: process.env.NODE_ENV,
            service: 'tattoo-admin'
          }
        )
      })

      it('should include timestamp in security events', () => {
        const logger = SecurityLogger.getInstance()
        
        logger.security('Test event')
        
        const logCall = (console.error as any).mock.calls[0]
        const logData = logCall[2]
        expect(logData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })
    })

    describe('Authentication Logging', () => {
      it('should log auth events with user and IP info', () => {
        const logger = SecurityLogger.getInstance()
        const metadata = { userAgent: 'mobile-app' }
        
        logger.auth('LOGIN_SUCCESS', 'user123', '10.0.0.1', metadata)
        
        expect(console.error).toHaveBeenCalledWith(
          'SECURITY EVENT:',
          'AUTH: LOGIN_SUCCESS',
          {
            userId: 'user123',
            ip: '10.0.0.1',
            ...metadata,
            securityEvent: true,
            priority: 'high',
            timestamp: expect.any(String),
            environment: process.env.NODE_ENV,
            service: 'tattoo-admin'
          }
        )
      })

      it('should handle missing user ID and IP', () => {
        const logger = SecurityLogger.getInstance()
        
        logger.auth('ANONYMOUS_ACCESS')
        
        expect(console.error).toHaveBeenCalledWith(
          'SECURITY EVENT:',
          'AUTH: ANONYMOUS_ACCESS',
          expect.objectContaining({
            userId: undefined,
            ip: undefined
          })
        )
      })
    })
  })

  describe('withErrorHandler', () => {
    it('should handle successful requests', async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      )
      const wrappedHandler = withErrorHandler(mockHandler)
      
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Map([
          ['x-forwarded-for', '192.168.1.1'],
          ['user-agent', 'test-browser']
        ])
      } as unknown as NextRequest

      const result = await wrappedHandler(mockRequest)

      expect(mockHandler).toHaveBeenCalledWith(mockRequest)
      expect(result).toEqual(NextResponse.json({ success: true }))
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should handle handler errors and return generic error', async () => {
      const error = new Error('Database error')
      const mockHandler = vi.fn().mockRejectedValue(error)
      const wrappedHandler = withErrorHandler(mockHandler)
      
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/users',
        headers: new Map([
          ['x-forwarded-for', '10.0.0.1'],
          ['user-agent', 'test-client']
        ])
      } as unknown as NextRequest

      const result = await wrappedHandler(mockRequest)

      expect(console.error).toHaveBeenCalledWith(
        'Security Error:',
        'API route error',
        {
          error: {
            name: 'Error',
            message: 'Database error',
            stack: error.stack
          },
          method: 'POST',
          url: 'http://localhost/api/users',
          ip: '10.0.0.1',
          userAgent: 'test-client'
        }
      )

      expect(result).toEqual(NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      ))
    })

    it('should extract IP from various headers', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Test'))
      const wrappedHandler = withErrorHandler(mockHandler)
      
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Map([
          ['x-real-ip', '172.16.0.1'],
          ['user-agent', 'test']
        ])
      } as unknown as NextRequest

      await wrappedHandler(mockRequest)

      const logCall = (console.error as any).mock.calls[0]
      expect(logCall[2].ip).toBe('172.16.0.1')
    })

    it('should handle missing headers gracefully', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Test'))
      const wrappedHandler = withErrorHandler(mockHandler)
      
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Map()
      } as unknown as NextRequest

      await wrappedHandler(mockRequest)

      const logCall = (console.error as any).mock.calls[0]
      expect(logCall[2].ip).toBe('unknown')
      expect(logCall[2].userAgent).toBe('unknown')
    })
  })

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: new Map([
          ['x-forwarded-for', '192.168.1.1, 10.0.0.1']
        ])
      } as unknown as NextRequest

      const ip = getClientIP(mockRequest)

      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header when x-forwarded-for is not available', () => {
      const mockRequest = {
        headers: new Map([
          ['x-real-ip', '172.16.0.1']
        ])
      } as unknown as NextRequest

      const ip = getClientIP(mockRequest)

      expect(ip).toBe('172.16.0.1')
    })

    it('should extract IP from cf-connecting-ip header', () => {
      const mockRequest = {
        headers: new Map([
          ['cf-connecting-ip', '203.0.113.1']
        ])
      } as unknown as NextRequest

      const ip = getClientIP(mockRequest)

      expect(ip).toBe('203.0.113.1')
    })

    it('should return unknown when no IP headers are present', () => {
      const mockRequest = {
        headers: new Map()
      } as unknown as NextRequest

      const ip = getClientIP(mockRequest)

      expect(ip).toBe('unknown')
    })

    it('should handle empty x-forwarded-for header', () => {
      const mockRequest = {
        headers: new Map([
          ['x-forwarded-for', '']
        ])
      } as unknown as NextRequest

      const ip = getClientIP(mockRequest)

      expect(ip).toBe('unknown')
    })
  })

  describe('PerformanceMonitor', () => {
    beforeEach(() => {
      // Clear any existing timers
      ;(PerformanceMonitor as any).timers.clear()
    })

    describe('Timer Management', () => {
      it('should start and end timer correctly', () => {
        PerformanceMonitor.startTimer('test-operation')
        
        // Simulate some time passing
        const duration = PerformanceMonitor.endTimer('test-operation')
        
        expect(duration).toBeGreaterThanOrEqual(0)
        expect(duration).toBeLessThan(100) // Should be very fast
      })

      it('should return 0 for non-existent timer', () => {
        const duration = PerformanceMonitor.endTimer('non-existent')
        
        expect(duration).toBe(0)
      })

      it('should clean up timer after ending', () => {
        PerformanceMonitor.startTimer('cleanup-test')
        PerformanceMonitor.endTimer('cleanup-test')
        
        // Second call should return 0 since timer was cleaned up
        const duration = PerformanceMonitor.endTimer('cleanup-test')
        expect(duration).toBe(0)
      })

      it('should handle multiple concurrent timers', () => {
        PerformanceMonitor.startTimer('timer1')
        PerformanceMonitor.startTimer('timer2')
        
        const duration1 = PerformanceMonitor.endTimer('timer1')
        const duration2 = PerformanceMonitor.endTimer('timer2')
        
        expect(duration1).toBeGreaterThanOrEqual(0)
        expect(duration2).toBeGreaterThanOrEqual(0)
      })
    })

    describe('Slow Operation Detection', () => {
      it('should log warning for slow operations', () => {
        // Mock Date.now to simulate slow operation
        const originalNow = Date.now
        let currentTime = 1000
        Date.now = vi.fn(() => currentTime)
        
        PerformanceMonitor.startTimer('slow-operation')
        currentTime += 1500 // Simulate 1.5 second operation
        PerformanceMonitor.endTimer('slow-operation')
        
        expect(console.warn).toHaveBeenCalledWith(
          'Security Warning:',
          'Slow operation detected',
          {
            operation: 'slow-operation',
            duration: 1500,
            performance: true
          }
        )
        
        Date.now = originalNow
      })

      it('should not log warning for fast operations', () => {
        PerformanceMonitor.startTimer('fast-operation')
        PerformanceMonitor.endTimer('fast-operation')
        
        expect(console.warn).not.toHaveBeenCalled()
      })
    })

    describe('measureAsync', () => {
      it('should measure async operation duration', async () => {
        const mockOperation = vi.fn().mockResolvedValue('result')
        
        const result = await PerformanceMonitor.measureAsync(
          'async-test',
          mockOperation
        )
        
        expect(mockOperation).toHaveBeenCalled()
        expect(result).toBe('result')
      })

      it('should measure duration even when operation throws', async () => {
        const error = new Error('Operation failed')
        const mockOperation = vi.fn().mockRejectedValue(error)
        
        await expect(
          PerformanceMonitor.measureAsync('failing-operation', mockOperation)
        ).rejects.toThrow('Operation failed')
        
        expect(mockOperation).toHaveBeenCalled()
      })

      it('should detect slow async operations', async () => {
        const originalNow = Date.now
        let currentTime = 1000
        Date.now = vi.fn(() => {
          const time = currentTime
          currentTime += 1200 // Each call advances time
          return time
        })
        
        const mockOperation = vi.fn().mockResolvedValue('result')
        
        await PerformanceMonitor.measureAsync('slow-async', mockOperation)
        
        expect(console.warn).toHaveBeenCalledWith(
          'Security Warning:',
          'Slow operation detected',
          expect.objectContaining({
            operation: 'slow-async',
            performance: true
          })
        )
        
        Date.now = originalNow
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed x-forwarded-for header', () => {
      const mockRequest = {
        headers: new Map([
          ['x-forwarded-for', 'invalid,, , 192.168.1.1']
        ])
      } as unknown as NextRequest

      const ip = getClientIP(mockRequest)

      expect(ip).toBe('invalid') // Takes first value even if invalid
    })

    it('should handle null values in headers', () => {
      const mockRequest = {
        headers: new Map([
          ['x-forwarded-for', null as any]
        ])
      } as unknown as NextRequest

      const ip = getClientIP(mockRequest)

      expect(ip).toBe('unknown')
    })

    it('should handle SecurityLogger with different NODE_ENV values', () => {
      const testEnvs = ['development', 'test', 'staging', undefined]
      
      testEnvs.forEach(env => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = env
        
        const logger = SecurityLogger.getInstance()
        const error = new Error('Test error')
        
        logger.error('Test', error)
        
        process.env.NODE_ENV = originalEnv
      })
      
      expect(console.error).toHaveBeenCalled()
    })
  })
})