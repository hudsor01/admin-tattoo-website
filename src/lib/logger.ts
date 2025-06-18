/**
 * Unified Logger System
 * Consolidates logging functionality from logger.ts, secure-logger.ts, and security-utils.ts
 * Provides structured logging, data sanitization, security events, and performance monitoring
 */

// Sensitive patterns to redact from logs
const SENSITIVE_PATTERNS = [
  /password\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  /token\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  /secret\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  /key\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  /authorization\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  /bearer\s+([a-zA-Z0-9._-]+)/gi,
  /basic\s+([a-zA-Z0-9+/=]+)/gi,
  /postgresql:\/\/[^:\s]+:[^@\s]+@[^\/\s]+/gi,
  /mysql:\/\/[^:\s]+:[^@\s]+@[^\/\s]+/gi,
  /([a-zA-Z0-9._%+-]{1,3})[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  /AKIA[0-9A-Z]{16}/g,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
];

const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'key', 'apiKey', 'api_key', 
  'authorization', 'cookie', 'session', 'csrf', 'hash', 'salt'
];

const PARTIALLY_REDACTABLE_FIELDS = [
  'email', 'phone', 'ip', 'userId', 'user_id', 'id'
];

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Sanitize sensitive data from a string
 */
function sanitizeLogData(data: string): string {
  let sanitized = data;
  
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match, captured) => {
      if (!captured) return '[REDACTED]';
      
      if (captured.length > 8) {
        return match.replace(captured, `${captured.substring(0, 2)}***${captured.substring(captured.length - 2)}`);
      }
      return match.replace(captured, '[REDACTED]');
    });
  }
  
  return sanitized;
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: unknown, maxDepth = 10): unknown {
  if (maxDepth <= 0 || obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeLogData(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.slice(0, 100).map(item => sanitizeObject(item, maxDepth - 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        // eslint-disable-next-line security/detect-object-injection
        sanitized[key] = '[REDACTED]';
      } else if (PARTIALLY_REDACTABLE_FIELDS.some(field => lowerKey.includes(field))) {
        // eslint-disable-next-line security/detect-object-injection
        sanitized[key] = redactPartially(String(value));
      } else {
        // eslint-disable-next-line security/detect-object-injection
        sanitized[key] = sanitizeObject(value, maxDepth - 1);
      }
    }
    
    return sanitized;
  }
  
  return obj;
}

function redactPartially(value: string): string {
  if (!value || value.length <= 4) {
    return '[REDACTED]';
  }
  
  if (value.length <= 8) {
    return `${value.charAt(0)}***${value.charAt(value.length - 1)}`;
  }
  
  return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static startTimer(key: string): void {
    this.timers.set(key, Date.now());
  }

  static endTimer(key: string): number {
    const startTime = this.timers.get(key);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;
    this.timers.delete(key);

    if (duration > 1000) {
      logger.warn('Slow operation detected', {
        operation: key,
        duration,
        performance: true
      });
    }

    return duration;
  }

  static async measureAsync<T>(key: string, operation: () => Promise<T>): Promise<T> {
    this.startTimer(key);
    try {
      const result = await operation();
      return result;
    } finally {
      this.endTimer(key);
    }
  }
}

/**
 * Unified Logger Class
 */
export class UnifiedLogger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private context: LogContext;

  constructor(context: LogContext = {}, logLevel?: LogLevel) {
    this.context = {
      ...context,
      timestamp: new Date().toISOString(),
    };
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = logLevel || this.validateLogLevel(process.env.LOG_LEVEL || 'info');
  }

  private validateLogLevel(level: string): LogLevel {
    const validLevels: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    if (validLevels.includes(level as LogLevel)) {
      return level as LogLevel;
    }
    return LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    };
    // eslint-disable-next-line security/detect-object-injection
    return levels[level] >= levels[this.logLevel];
  }

  private formatLog(level: LogLevel, message: string, data?: unknown, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const sanitizedContext = sanitizeObject({ ...this.context, ...context });
    const sanitizedData = data ? sanitizeObject(data) : undefined;
    
    const logEntry = {
      timestamp,
      level,
      message: sanitizeLogData(message),
      context: sanitizedContext,
      ...(sanitizedData !== undefined && { data: sanitizedData }),
      environment: process.env.NODE_ENV,
      service: 'admin-tattoo-website'
    };

    if (this.isDevelopment) {
      // eslint-disable-next-line security/detect-object-injection
      const emoji = {
        [LogLevel.DEBUG]: '🐛',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.ERROR]: '❌'
      }[level] as string;
      
      // eslint-disable-next-line no-console
      console.log(`${emoji} [${level.toUpperCase()}] ${message}`);
      if (sanitizedData && Object.keys(sanitizedData).length > 0) {
        // eslint-disable-next-line no-console
        console.log('Data:', sanitizedData);
      }
      if (sanitizedContext && Object.keys(sanitizedContext).length > 0) {
        // eslint-disable-next-line no-console
        console.log('Context:', sanitizedContext);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, data?: unknown, context?: LogContext) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.formatLog(LogLevel.DEBUG, message, data, context);
    }
  }

  info(message: string, data?: unknown, context?: LogContext) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.formatLog(LogLevel.INFO, message, data, context);
    }
  }

  warn(message: string, data?: unknown, context?: LogContext) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.formatLog(LogLevel.WARN, message, data, context);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorData = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        cause: error.cause
      } : error;
      
      this.formatLog(LogLevel.ERROR, message, errorData, context);
    }
  }

  /**
   * Log security events with high priority
   */
  security(event: string, data?: unknown, context?: LogContext) {
    const securityContext = {
      ...context,
      securityEvent: true,
      priority: 'high',
      timestamp: new Date().toISOString()
    };
    
    this.formatLog(LogLevel.ERROR, `SECURITY EVENT: ${event}`, data, securityContext);
  }

  /**
   * Log authentication events
   */
  auth(action: string, userId?: string, ip?: string, data?: unknown) {
    this.security(`AUTH: ${action}`, data, {
      userId,
      ip
    });
  }

  /**
   * Log API responses
   */
  apiResponse(status: number, response: unknown, duration?: number, context?: LogContext) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API response: ${status}`;
    
    // eslint-disable-next-line security/detect-object-injection
    this[level](message, {
      status,
      response: sanitizeObject(response),
      duration: duration ? `${duration}ms` : undefined,
    }, context);
  }

  /**
   * Log database operations
   */
  dbOperation(operation: string, table: string, data?: unknown, error?: unknown, context?: LogContext) {
    const sanitizedData = data ? sanitizeObject(data) : undefined;
    
    if (error) {
      this.error(`Database ${operation} failed on ${table}`, error, {
        ...context,
        operation,
        table,
        data: sanitizedData,
      });
    } else {
      this.info(`Database ${operation} on ${table}`, {
        operation,
        table,
        data: sanitizedData,
      }, context);
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): UnifiedLogger {
    return new UnifiedLogger({
      ...this.context,
      ...additionalContext,
    }, this.logLevel);
  }

  /**
   * Create request-scoped logger
   */
  withContext(baseContext: LogContext) {
    return {
      debug: (message: string, data?: unknown, context?: LogContext) =>
        this.debug(message, data, { ...baseContext, ...context }),
      info: (message: string, data?: unknown, context?: LogContext) =>
        this.info(message, data, { ...baseContext, ...context }),
      warn: (message: string, data?: unknown, context?: LogContext) =>
        this.warn(message, data, { ...baseContext, ...context }),
      error: (message: string, error?: Error | unknown, context?: LogContext) =>
        this.error(message, error, { ...baseContext, ...context }),
      security: (event: string, data?: unknown, context?: LogContext) =>
        this.security(event, data, { ...baseContext, ...context }),
      auth: (action: string, userId?: string, ip?: string, data?: unknown) =>
        this.auth(action, userId, ip, data)
    };
  }
}

/**
 * Create a logger instance with request context
 */
export function createRequestLogger(request: Request, additionalContext: LogContext = {}): UnifiedLogger {
  const url = new URL(request.url);
  
  return new UnifiedLogger({
    method: request.method,
    url: url.pathname,
    userAgent: redactPartially(request.headers.get('user-agent') || 'unknown'),
    ip: redactPartially(
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown'
    ),
    requestId: request.headers.get('x-request-id') || generateRequestId(),
    ...additionalContext,
  });
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get client IP from request
 */
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

/**
 * Global logger instance
 */
export const logger = new UnifiedLogger({
  service: 'admin-tattoo-website',
  environment: process.env.NODE_ENV || 'development'
});

// Export types and utilities
export { sanitizeObject, sanitizeLogData };
