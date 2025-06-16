import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  logger,
  logRequest,
  logError,
  logPerformance,
  logSecurityEvent,
  logAudit,
  sanitizeLogData,
  getLogLevel,
  createRequestContext
} from '@/lib/logger'

// Mock console methods
const originalConsole = { ...console }

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore original console
    Object.assign(console, originalConsole)
    vi.restoreAllMocks()
  })

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      logger.info('Test info message', { userId: '123' })
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Test info message'),
        expect.objectContaining({ userId: '123' })
      )
    })

    it('should log error messages', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', { error, userId: '123' })
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Error occurred'),
        expect.objectContaining({ 
          userId: '123',
          error: expect.objectContaining({
            message: 'Test error',
            stack: expect.any(String)
          })
        })
      )
    })

    it('should log warning messages', () => {
      logger.warn('Warning message', { action: 'deprecated_feature' })
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining('Warning message'),
        expect.objectContaining({ action: 'deprecated_feature' })
      )
    })

    it('should log debug messages', () => {
      logger.debug('Debug info', { component: 'auth' })
      
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining('Debug info'),
        expect.objectContaining({ component: 'auth' })
      )
    })
  })

  describe('Log Levels', () => {
    it('should respect LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'error'
      
      const level = getLogLevel()
      expect(level).toBe('error')
      
      delete process.env.LOG_LEVEL
    })

    it('should default to info level in production', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.LOG_LEVEL
      
      const level = getLogLevel()
      expect(level).toBe('info')
      
      process.env.NODE_ENV = 'test'
    })

    it('should default to debug level in development', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.LOG_LEVEL
      
      const level = getLogLevel()
      expect(level).toBe('debug')
      
      process.env.NODE_ENV = 'test'
    })

    it('should not log below configured level', () => {
      process.env.LOG_LEVEL = 'warn'
      
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')
      
      expect(console.debug).not.toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
      
      delete process.env.LOG_LEVEL
    })
  })

  describe('Request Logging', () => {
    it('should log HTTP requests with sanitized data', () => {
      const mockRequest = {
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'user-agent': 'test-agent',
          'authorization': 'Bearer secret-token',
          'x-forwarded-for': '192.168.1.1'
        },
        body: {
          email: 'user@example.com',
          password: 'secret123'
        }
      }

      logRequest(mockRequest, 200, 150, '12345')

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[REQUEST]'),
        expect.stringContaining('POST /api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          url: '/api/auth/login',
          statusCode: 200,
          responseTime: 150,
          requestId: '12345',
          userAgent: 'test-agent',
          ipAddress: '192.168.1.1',
          body: expect.objectContaining({
            email: 'user@example.com',
            password: '[REDACTED]'
          })
        })
      )
    })

    it('should handle requests without sensitive data', () => {
      const mockRequest = {
        method: 'GET',
        url: '/api/customers',
        headers: {},
        query: { page: '1', limit: '10' }
      }

      logRequest(mockRequest, 200, 50)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[REQUEST]'),
        expect.stringContaining('GET /api/customers'),
        expect.objectContaining({
          method: 'GET',
          url: '/api/customers',
          statusCode: 200,
          responseTime: 50,
          query: { page: '1', limit: '10' }
        })
      )
    })

    it('should log request errors', () => {
      const mockRequest = {
        method: 'POST',
        url: '/api/appointments',
        headers: {}
      }

      const error = new Error('Validation failed')

      logRequest(mockRequest, 400, 25, '67890', error)

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[REQUEST_ERROR]'),
        expect.stringContaining('POST /api/appointments'),
        expect.objectContaining({
          method: 'POST',
          url: '/api/appointments',
          statusCode: 400,
          responseTime: 25,
          requestId: '67890',
          error: expect.objectContaining({
            message: 'Validation failed'
          })
        })
      )
    })
  })

  describe('Error Logging', () => {
    it('should log errors with context', () => {
      const error = new Error('Database connection failed')
      error.stack = 'Error: Database connection failed\n    at test.js:10:5'

      logError(error, {
        operation: 'fetchCustomers',
        userId: 'user-123',
        requestId: 'req-456'
      })

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Database connection failed'),
        expect.objectContaining({
          operation: 'fetchCustomers',
          userId: 'user-123',
          requestId: 'req-456',
          error: expect.objectContaining({
            message: 'Database connection failed',
            stack: expect.stringContaining('Error: Database connection failed')
          })
        })
      )
    })

    it('should handle non-Error objects', () => {
      const errorObj = { message: 'Custom error', code: 'CUSTOM_ERROR' }

      logError(errorObj, { context: 'api-call' })

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Unknown error'),
        expect.objectContaining({
          context: 'api-call',
          error: errorObj
        })
      )
    })

    it('should handle string errors', () => {
      logError('Simple error message', { component: 'auth' })

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Simple error message'),
        expect.objectContaining({
          component: 'auth'
        })
      )
    })
  })

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      const metrics = {
        operation: 'database_query',
        duration: 250,
        query: 'SELECT * FROM clients',
        recordCount: 45
      }

      logPerformance(metrics)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE]'),
        expect.stringContaining('database_query completed in 250ms'),
        expect.objectContaining({
          operation: 'database_query',
          duration: 250,
          query: 'SELECT * FROM clients',
          recordCount: 45
        })
      )
    })

    it('should warn on slow operations', () => {
      const slowMetrics = {
        operation: 'slow_api_call',
        duration: 5000, // 5 seconds
        threshold: 1000
      }

      logPerformance(slowMetrics)

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[SLOW_OPERATION]'),
        expect.stringContaining('slow_api_call took 5000ms (threshold: 1000ms)'),
        expect.objectContaining(slowMetrics)
      )
    })

    it('should handle memory usage metrics', () => {
      const memoryMetrics = {
        operation: 'memory_check',
        duration: 5,
        memoryUsage: {
          heapUsed: 50 * 1024 * 1024, // 50MB
          heapTotal: 100 * 1024 * 1024, // 100MB
          external: 5 * 1024 * 1024 // 5MB
        }
      }

      logPerformance(memoryMetrics)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE]'),
        expect.any(String),
        expect.objectContaining({
          operation: 'memory_check',
          memoryUsage: expect.objectContaining({
            heapUsed: 50 * 1024 * 1024,
            heapTotal: 100 * 1024 * 1024
          })
        })
      )
    })
  })

  describe('Security Event Logging', () => {
    it('should log authentication events', () => {
      logSecurityEvent('LOGIN_ATTEMPT', {
        userId: 'user-123',
        email: 'user@example.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        success: true
      })

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY]'),
        expect.stringContaining('LOGIN_ATTEMPT'),
        expect.objectContaining({
          event: 'LOGIN_ATTEMPT',
          userId: 'user-123',
          email: 'user@example.com',
          ipAddress: '192.168.1.100',
          success: true
        })
      )
    })

    it('should log failed login attempts', () => {
      logSecurityEvent('LOGIN_FAILED', {
        email: 'attacker@evil.com',
        ipAddress: '10.0.0.1',
        reason: 'Invalid credentials',
        attemptCount: 3
      })

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY_ALERT]'),
        expect.stringContaining('LOGIN_FAILED'),
        expect.objectContaining({
          event: 'LOGIN_FAILED',
          email: 'attacker@evil.com',
          ipAddress: '10.0.0.1',
          reason: 'Invalid credentials',
          attemptCount: 3
        })
      )
    })

    it('should log permission violations', () => {
      logSecurityEvent('PERMISSION_DENIED', {
        userId: 'user-456',
        resource: '/admin/users',
        action: 'DELETE',
        requiredRole: 'admin',
        userRole: 'user'
      })

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY_ALERT]'),
        expect.stringContaining('PERMISSION_DENIED'),
        expect.objectContaining({
          event: 'PERMISSION_DENIED',
          userId: 'user-456',
          resource: '/admin/users',
          action: 'DELETE'
        })
      )
    })

    it('should log rate limiting events', () => {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ipAddress: '192.168.1.200',
        endpoint: '/api/auth/login',
        requestCount: 10,
        timeWindow: '1 minute'
      })

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY]'),
        expect.stringContaining('RATE_LIMIT_EXCEEDED'),
        expect.objectContaining({
          event: 'RATE_LIMIT_EXCEEDED',
          ipAddress: '192.168.1.200',
          endpoint: '/api/auth/login'
        })
      )
    })
  })

  describe('Audit Logging', () => {
    it('should log data modifications', () => {
      logAudit('UPDATE', 'Client', 'client-123', 'user-456', {
        before: { email: 'old@example.com' },
        after: { email: 'new@example.com' },
        fields: ['email']
      })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]'),
        expect.stringContaining('UPDATE Client client-123'),
        expect.objectContaining({
          action: 'UPDATE',
          entityType: 'Client',
          entityId: 'client-123',
          userId: 'user-456',
          changes: expect.objectContaining({
            before: { email: 'old@example.com' },
            after: { email: 'new@example.com' }
          })
        })
      )
    })

    it('should log record creation', () => {
      logAudit('CREATE', 'Appointment', 'appointment-789', 'user-456', {
        data: {
          clientId: 'client-123',
          artistId: 'artist-1',
          scheduledDate: '2024-03-15T10:00:00Z'
        }
      })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]'),
        expect.stringContaining('CREATE Appointment appointment-789'),
        expect.objectContaining({
          action: 'CREATE',
          entityType: 'Appointment',
          entityId: 'appointment-789',
          userId: 'user-456'
        })
      )
    })

    it('should log record deletion', () => {
      logAudit('DELETE', 'Client', 'client-123', 'admin-1', {
        reason: 'User requested account deletion',
        relatedData: {
          appointmentsDeleted: 3,
          sessionsDeleted: 5
        }
      })

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]'),
        expect.stringContaining('DELETE Client client-123'),
        expect.objectContaining({
          action: 'DELETE',
          entityType: 'Client',
          entityId: 'client-123',
          userId: 'admin-1',
          changes: expect.objectContaining({
            reason: 'User requested account deletion'
          })
        })
      )
    })
  })

  describe('Data Sanitization', () => {
    it('should sanitize sensitive fields', () => {
      const sensitiveData = {
        email: 'user@example.com',
        password: 'secret123',
        token: 'jwt-token-here',
        apiKey: 'api-key-123',
        authorization: 'Bearer token',
        cookie: 'session=abc123',
        medicalInfo: { conditions: ['diabetes'] },
        publicField: 'safe data'
      }

      const sanitized = sanitizeLogData(sensitiveData)

      expect(sanitized.email).toBe('user@example.com') // Email allowed
      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.token).toBe('[REDACTED]')
      expect(sanitized.apiKey).toBe('[REDACTED]')
      expect(sanitized.authorization).toBe('[REDACTED]')
      expect(sanitized.cookie).toBe('[REDACTED]')
      expect(sanitized.medicalInfo).toBe('[REDACTED]')
      expect(sanitized.publicField).toBe('safe data')
    })

    it('should handle nested objects', () => {
      const nestedData = {
        user: {
          email: 'test@example.com',
          password: 'secret',
          profile: {
            name: 'John Doe',
            ssn: '123-45-6789'
          }
        },
        request: {
          headers: {
            authorization: 'Bearer token'
          }
        }
      }

      const sanitized = sanitizeLogData(nestedData)

      expect(sanitized.user.email).toBe('test@example.com')
      expect(sanitized.user.password).toBe('[REDACTED]')
      expect(sanitized.user.profile.name).toBe('John Doe')
      expect(sanitized.user.profile.ssn).toBe('[REDACTED]')
      expect(sanitized.request.headers.authorization).toBe('[REDACTED]')
    })

    it('should handle arrays', () => {
      const arrayData = {
        users: [
          { email: 'user1@example.com', password: 'secret1' },
          { email: 'user2@example.com', password: 'secret2' }
        ],
        tokens: ['token1', 'token2']
      }

      const sanitized = sanitizeLogData(arrayData)

      expect(sanitized.users[0].email).toBe('user1@example.com')
      expect(sanitized.users[0].password).toBe('[REDACTED]')
      expect(sanitized.users[1].password).toBe('[REDACTED]')
      expect(sanitized.tokens).toEqual(['token1', 'token2']) // Not a sensitive field name
    })

    it('should truncate long strings', () => {
      const longData = {
        description: 'a'.repeat(1000),
        notes: 'b'.repeat(500)
      }

      const sanitized = sanitizeLogData(longData)

      expect(sanitized.description.length).toBeLessThanOrEqual(500)
      expect(sanitized.description).toMatch(/\.\.\.$/)
      expect(sanitized.notes.length).toBeLessThanOrEqual(500)
    })

    it('should handle circular references', () => {
      const circularData: any = { name: 'test' }
      circularData.self = circularData

      const sanitized = sanitizeLogData(circularData)

      expect(sanitized.name).toBe('test')
      expect(sanitized.self).toBe('[Circular Reference]')
    })
  })

  describe('Request Context', () => {
    it('should create request context with ID', () => {
      const context = createRequestContext('req-123')

      expect(context).toEqual({
        requestId: 'req-123',
        timestamp: expect.any(Date),
        startTime: expect.any(Number)
      })
    })

    it('should generate request ID if not provided', () => {
      const context = createRequestContext()

      expect(context.requestId).toMatch(/^req-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)
      expect(context.timestamp).toBeInstanceOf(Date)
      expect(context.startTime).toBeGreaterThan(0)
    })

    it('should include additional context data', () => {
      const additionalData = {
        userId: 'user-123',
        operation: 'fetchCustomers'
      }

      const context = createRequestContext('req-456', additionalData)

      expect(context).toEqual({
        requestId: 'req-456',
        timestamp: expect.any(Date),
        startTime: expect.any(Number),
        userId: 'user-123',
        operation: 'fetchCustomers'
      })
    })
  })

  describe('Error Boundaries', () => {
    it('should handle logging failures gracefully', () => {
      // Mock console.error to throw
      vi.spyOn(console, 'error').mockImplementation(() => {
        throw new Error('Console error failed')
      })

      // Should not throw when logger.error fails
      expect(() => {
        logger.error('Test message', { data: 'test' })
      }).not.toThrow()
    })

    it('should handle sanitization failures', () => {
      const problematicData = {
        get problematic() {
          throw new Error('Getter failed')
        }
      }

      // Should not throw when sanitization fails
      expect(() => {
        const sanitized = sanitizeLogData(problematicData)
        expect(sanitized.problematic).toBe('[Sanitization Error]')
      }).not.toThrow()
    })
  })

  describe('Environment-Specific Behavior', () => {
    it('should include stack traces in development', () => {
      process.env.NODE_ENV = 'development'
      
      const error = new Error('Test error')
      logError(error)

      expect(console.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(String)
          })
        })
      )

      process.env.NODE_ENV = 'test'
    })

    it('should limit stack traces in production', () => {
      process.env.NODE_ENV = 'production'
      
      const error = new Error('Test error')
      logError(error)

      expect(console.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Test error'
          })
        })
      )

      process.env.NODE_ENV = 'test'
    })
  })
})