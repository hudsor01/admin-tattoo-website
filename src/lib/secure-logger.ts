/**
 * Secure logging utility that sanitizes sensitive data before logging
 * Prevents accidental exposure of secrets, PII, and credentials in logs
 */

// import { sanitizeString } from './sanitization';

// Sensitive patterns to redact from logs
const SENSITIVE_PATTERNS = [
  // Credentials and secrets
  /password\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  /token\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  /secret\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  /key\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  /api_key\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  /apikey\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  
  // Authentication headers
  /authorization\s*[:=]\s*["']?([^"',\s]+)["']?/gi,
  /bearer\s+([a-zA-Z0-9._-]+)/gi,
  /basic\s+([a-zA-Z0-9+/=]+)/gi,
  
  // Database connection strings
  /postgresql:\/\/[^:\s]+:[^@\s]+@[^\/\s]+/gi,
  /mysql:\/\/[^:\s]+:[^@\s]+@[^\/\s]+/gi,
  /mongodb:\/\/[^:\s]+:[^@\s]+@[^\/\s]+/gi,
  
  // Email addresses (partial redaction)
  /([a-zA-Z0-9._%+-]{1,3})[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  
  // Phone numbers
  /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  
  // Credit card numbers (basic pattern)
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  
  // SSN pattern
  /\b\d{3}-\d{2}-\d{4}\b/g,
  
  // IP addresses (partial redaction)
  /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/g,
  
  // JWT tokens
  /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  
  // AWS keys
  /AKIA[0-9A-Z]{16}/g,
  /AWS[0-9A-Z]{36}/g,
  
  // Session IDs and UUIDs (partial redaction)
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
];

// Fields that should be completely redacted
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'session',
  'csrf',
  'nonce',
  'hash',
  'salt',
  'privateKey',
  'private_key',
  'clientSecret',
  'client_secret',
];

// Fields that should have partial redaction (show first/last few chars)
const PARTIALLY_REDACTABLE_FIELDS = [
  'email',
  'phone',
  'ip',
  'userId',
  'user_id',
  'id',
];

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
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
export function sanitizeLogData(data: string): string {
  let sanitized = data;
  
  // Apply all sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match, captured) => {
      if (!captured) return '[REDACTED]';
      
      // For tokens/secrets, show only first and last 2 chars if longer than 8
      if (captured.length > 8) {
        return match.replace(captured, `${captured.substring(0, 2)}***${captured.substring(captured.length - 2)}`);
      }
      return match.replace(captured, '[REDACTED]');
    });
  }
  
  return sanitized;
}

/**
 * Recursively sanitize an object, removing or redacting sensitive fields
 */
export function sanitizeObject(obj: unknown, maxDepth = 10): unknown {
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
        sanitized[key] = '[REDACTED]';
      } else if (PARTIALLY_REDACTABLE_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = redactPartially(String(value));
      } else {
        sanitized[key] = sanitizeObject(value, maxDepth - 1);
      }
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Partially redact a value (show first and last few characters)
 */
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
 * Enhanced logger with automatic sanitization
 */
export class SecureLogger {
  private context: LogContext;
  
  constructor(context: LogContext = {}) {
    this.context = {
      ...context,
      timestamp: new Date().toISOString(),
    };
  }
  
  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const sanitizedContext = sanitizeObject(this.context);
    const sanitizedData = data ? sanitizeObject(data) : undefined;
    
    const logEntry = {
      level,
      message: sanitizeLogData(message),
      context: sanitizedContext,
      ...(sanitizedData !== undefined && { data: sanitizedData }),
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify(logEntry, null, process.env.NODE_ENV === 'development' ? 2 : undefined);
  }
  
  error(message: string, data?: unknown): void {
    const formatted = this.formatMessage(LogLevel.ERROR, message, data);
    console.error(formatted);
  }
  
  warn(message: string, data?: unknown): void {
    const formatted = this.formatMessage(LogLevel.WARN, message, data);
    console.warn(formatted);
  }
  
  info(message: string, data?: unknown): void {
    const formatted = this.formatMessage(LogLevel.INFO, message, data);
    console.info(formatted);
  }
  
  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage(LogLevel.DEBUG, message, data);
      console.debug(formatted);
    }
  }
  
  // Create a child logger with additional context
  child(additionalContext: LogContext): SecureLogger {
    return new SecureLogger({
      ...this.context,
      ...additionalContext,
    });
  }
}

/**
 * Create a logger instance with request context
 */
export function createRequestLogger(request: Request, additionalContext: LogContext = {}): SecureLogger {
  const url = new URL(request.url);
  
  return new SecureLogger({
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
 * Global logger instance
 */
export const logger = new SecureLogger({
  service: 'admin-tattoo-website',
  environment: process.env.NODE_ENV || 'development',
});

/**
 * Express-style middleware for request logging
 */
export function requestLoggingMiddleware(request: Request): SecureLogger {
  const requestLogger = createRequestLogger(request);
  
  requestLogger.info('Request started', {
    method: request.method,
    url: request.url,
  });
  
  return requestLogger;
}

/**
 * Sanitize error objects for logging
 */
export function sanitizeError(error: unknown): unknown {
  if (error instanceof Error) {
    return sanitizeObject({
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      cause: error.cause,
    });
  }
  
  return sanitizeObject(error);
}

/**
 * Log API response (automatically sanitizes)
 */
export function logApiResponse(
  logger: SecureLogger, 
  status: number, 
  response: unknown, 
  duration?: number
): void {
  const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
  const message = `API response: ${status}`;
  
  logger[level](message, {
    status,
    response: sanitizeObject(response),
    duration: duration ? `${duration}ms` : undefined,
  });
}

/**
 * Log database operation (automatically sanitizes)
 */
export function logDatabaseOperation(
  logger: SecureLogger,
  operation: string,
  table: string,
  data?: unknown,
  error?: unknown
): void {
  const sanitizedData = data ? sanitizeObject(data) : undefined;
  
  if (error) {
    logger.error(`Database ${operation} failed on ${table}`, {
      operation,
      table,
      data: sanitizedData,
      error: sanitizeError(error),
    });
  } else {
    logger.info(`Database ${operation} on ${table}`, {
      operation,
      table,
      data: sanitizedData,
    });
  }
}

export default SecureLogger;