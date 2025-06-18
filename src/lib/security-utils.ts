/**
 * Security Utilities and Enhanced Error Handling
 * 
 * Provides security-focused logging, monitoring, and error handling
 * specifically for the tattoo admin system.
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

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



  error(message: string, error?: Error, metadata?: Record<string, unknown>) {
    if (!this.shouldLog('error')) return

    // Security error logged
    console.error('Security Error:', message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      } : undefined
    })
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    if (!this.shouldLog('warn')) return
    console.warn('Security Warning:', message, metadata)
  }

  info(message: string, metadata?: Record<string, unknown>) {
    if (!this.shouldLog('info')) return
    console.info('Security Info:', message, metadata)
  }

  /**
   * Log security events with high priority
   */
  security(event: string, metadata?: Record<string, unknown>) {
    // Security error logged
    console.error('SECURITY EVENT:', event, {
      ...metadata,
      securityEvent: true,
      priority: 'high',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      service: 'tattoo-admin'
    })
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
