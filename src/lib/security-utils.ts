/**
 * Security Utilities and Enhanced Error Handling
 * 
 * Provides security-focused logging, monitoring, and error handling
 * specifically for the tattoo admin system.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Security-focused logger with structured output
 */
export class SecurityLogger {
  private static instance: SecurityLogger
  private logLevel: string

  private constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info'
  }

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger()
    }
    return SecurityLogger.instance
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevel = levels.indexOf(level)
    return messageLevel <= currentLevelIndex
  }

  private sanitizeData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization', 
      'cookie', 'session', 'ssn', 'phone', 'email'
    ]

    const sanitized: Record<string, unknown> = { ...(data as Record<string, unknown>) }
    
    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key])
      }
    }

    return sanitized
  }

  private formatLogEntry(level: string, message: string, metadata?: Record<string, unknown>) {
    const sanitizedMeta = this.sanitizeData(metadata ?? {});
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(typeof sanitizedMeta === 'object' && sanitizedMeta !== null ? sanitizedMeta : {}),
      environment: process.env.NODE_ENV,
      service: 'tattoo-admin'
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>) {
    if (!this.shouldLog('error')) return

    const logEntry = this.formatLogEntry('error', message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : undefined
    })

    console.error(JSON.stringify(logEntry))

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      this.sendToMonitoring('error', logEntry)
    }
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    if (!this.shouldLog('warn')) return
    const logEntry = this.formatLogEntry('warn', message, metadata)
    console.warn(JSON.stringify(logEntry))
  }

  info(message: string, metadata?: Record<string, unknown>) {
    if (!this.shouldLog('info')) return
    const logEntry = this.formatLogEntry('info', message, metadata)
    console.info(JSON.stringify(logEntry))
  }

  /**
   * Log security events with high priority
   */
  security(event: string, metadata?: Record<string, unknown>) {
    const logEntry = this.formatLogEntry('security', `SECURITY: ${event}`, {
      ...metadata,
      securityEvent: true,
      priority: 'high'
    })

    console.error(JSON.stringify(logEntry))

    // Always send security events to monitoring
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring('security', logEntry)
    }
  }

  /**
   * Log authentication events
   */
  auth(action: string, userId?: string, ip?: string, metadata?: Record<string, unknown>) {
    this.security(`AUTH: ${action}`, {
      userId,
      ip,
      ...metadata
    })
  }

  private async sendToMonitoring(_level: string, logEntry: Record<string, unknown>) {
    try {
      // Custom monitoring webhook
      if (process.env.MONITORING_WEBHOOK) {
        await fetch(process.env.MONITORING_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        })
      }
    } catch (error) {
      console.error('Failed to send log to monitoring:', error)
    }
  }
}

/**
 * Global error handler for API routes
 */
export function withErrorHandler(
  handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return async function(req: NextRequest, ...args: unknown[]): Promise<NextResponse> {
    const logger = SecurityLogger.getInstance()
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'

    try {
      return await handler(req, ...args)
    } catch (error) {
      logger.error('API route error', error as Error, {
        method: req.method,
        url: req.url,
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown'
      })

      // Generic server error for security
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Utility function to get client IP from request
 */
export function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown'
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>()

  static startTimer(key: string): void {
    this.timers.set(key, Date.now())
  }

  static endTimer(key: string): number {
    const startTime = this.timers.get(key)
    if (!startTime) return 0

    const duration = Date.now() - startTime
    this.timers.delete(key)

    // Log slow operations
    if (duration > 1000) {
      SecurityLogger.getInstance().warn('Slow operation detected', {
        operation: key,
        duration,
        performance: true
      })
    }

    return duration
  }

  static async measureAsync<T>(key: string, operation: () => Promise<T>): Promise<T> {
    this.startTimer(key)
    try {
      const result = await operation()
      return result
    } finally {
      this.endTimer(key)
    }
  }
}
