/**
 * Enhanced API Error Handling & Network Resilience
 * Production-ready error handling with circuit breaker, timeouts, and proper Zod integration
 */

import { z } from 'zod'
import { toast } from 'sonner'
import { ApiError, isNetworkError } from '@/lib/api-core'

// Enhanced error response schema with Zod validation
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  status: z.number(),
  timestamp: z.string(),
  requestId: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  retryAfter: z.number().optional(),
})

export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T): z.ZodObject<{
  success: z.ZodLiteral<true>;
  data: T;
  message: z.ZodOptional<z.ZodString>;
  status: z.ZodNumber;
  timestamp: z.ZodString;
  requestId: z.ZodOptional<z.ZodString>;
}> => z.object({
  success: z.literal(true),
  data: dataSchema,
  message: z.string().optional(),
  status: z.number(),
  timestamp: z.string(),
  requestId: z.string().optional(),
})

export type ApiErrorResponse = z.infer<typeof ApiErrorSchema>
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
  status: number
  timestamp: string
  requestId?: string
}

// Circuit breaker implementation for failing endpoints
export class CircuitBreaker {
  private failures = 0
  private lastFailure = 0
  private nextAttempt = 0
  
  constructor(
    private readonly maxFailures = 5,
    private readonly timeout = 60000, // 1 minute
    private readonly resetTimeout = 300000 // 5 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new ApiError('Service temporarily unavailable (circuit breaker open)', 503, 'CIRCUIT_BREAKER_OPEN')
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private isOpen(): boolean {
    const now = Date.now()
    if (this.failures >= this.maxFailures) {
      if (now < this.nextAttempt) {
        return true
      }
      // Half-open state: allow one request to test if service is back
      this.failures = this.maxFailures - 1
    }
    return false
  }

  private onSuccess(): void {
    this.failures = 0
    this.lastFailure = 0
    this.nextAttempt = 0
  }

  private onFailure(): void {
    this.failures += 1
    this.lastFailure = Date.now()
    this.nextAttempt = this.lastFailure + this.resetTimeout
  }

  getStatus(): { failures: number; isOpen: boolean; nextAttempt: number } {
    return {
      failures: this.failures,
      isOpen: this.isOpen(),
      nextAttempt: this.nextAttempt,
    }
  }
}

// Global circuit breakers for different services
const circuitBreakers = new Map<string, CircuitBreaker>()

export function getCircuitBreaker(service: string): CircuitBreaker {
  if (!circuitBreakers.has(service)) {
    circuitBreakers.set(service, new CircuitBreaker())
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return circuitBreakers.get(service)!
}

// Enhanced retry configuration with different strategies
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  jitter: boolean
  retryCondition?: (error: unknown) => boolean
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error) => {
    // Retry on network errors and 5xx server errors
    if (isNetworkError(error)) return true
    if (error instanceof ApiError) {
      return error.status >= 500 && error.status !== 501 // Don't retry on "Not Implemented"
    }
    return true
  }
}

export async function withEnhancedRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: unknown

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry if it's the last attempt or retry condition fails
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (attempt === finalConfig.maxRetries || !finalConfig.retryCondition!(error)) {
        throw error
      }

      // Calculate delay with exponential backoff and optional jitter
      let delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt),
        finalConfig.maxDelay
      )

      if (finalConfig.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5) // Add ±50% jitter
      }

      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Request timeout wrapper
export function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  errorMessage = 'Request timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new ApiError(errorMessage, 408, 'TIMEOUT'))
      }, timeout)
    })
  ])
}

// Request deduplication for rapid successive identical requests
const pendingRequests = new Map<string, Promise<unknown>>()

export function withDeduplication<T>(
  key: string,
  operation: () => Promise<T>,
  ttl = 5000 // 5 seconds
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>
  }

  const promise = operation()
  pendingRequests.set(key, promise)

  // Clean up after TTL or completion
  const cleanup = (): boolean => pendingRequests.delete(key)
  setTimeout(cleanup, ttl)
  promise.finally(cleanup)

  return promise
}

// Enhanced fetch wrapper with all resilience features
export interface FetchConfig {
  timeout?: number
  retryConfig?: Partial<RetryConfig>
  circuitBreakerService?: string
  deduplicationKey?: string
  validateResponse?: z.ZodSchema
}

export function resilientFetch<T = unknown>(
  url: string,
  options: RequestInit & FetchConfig = {}
): Promise<T> {
  const {
    timeout = 30000,
    retryConfig,
    circuitBreakerService,
    deduplicationKey,
    validateResponse,
    ...fetchOptions
  } = options

  const operation = async (): Promise<T> => {
    const fetchPromise = fetch(url, fetchOptions)
    const response = await withTimeout(fetchPromise, timeout)

    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        `HTTP_${response.status}`
      )
    }

    let data: unknown
    try {
      const text = await response.text()
      data = text ? JSON.parse(text) : null
    } catch {
      throw new ApiError('Invalid JSON response', 422, 'INVALID_JSON')
    }

    // Validate response with Zod if schema provided
    if (validateResponse) {
      try {
        data = validateResponse.parse(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ApiError(
            `Response validation failed: ${error.errors.map(e => e.message).join(', ')}`,
            422,
            'VALIDATION_ERROR'
          )
        }
        throw error
      }
    }

    return data as T
  }

  // Apply resilience patterns
  let wrappedOperation = operation

  // 1. Deduplication
  if (deduplicationKey) {
    wrappedOperation = (): Promise<T> => withDeduplication(deduplicationKey, operation)
  }

  // 2. Retry logic
  if (retryConfig !== undefined && retryConfig !== null) {
    const currentOperation = wrappedOperation
    wrappedOperation = (): Promise<T> => withEnhancedRetry(currentOperation, retryConfig)
  }

  // 3. Circuit breaker
  if (circuitBreakerService) {
    const currentOperation = wrappedOperation
    const circuitBreaker = getCircuitBreaker(circuitBreakerService)
    wrappedOperation = (): Promise<T> => circuitBreaker.execute(currentOperation)
  }

  return wrappedOperation()
}

// Error categorization for better user experience
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  TIMEOUT = 'timeout',
  CIRCUIT_BREAKER = 'circuit_breaker',
  UNKNOWN = 'unknown'
}

export function categorizeError(error: unknown): ErrorCategory {
  if (isNetworkError(error)) return ErrorCategory.NETWORK

  if (error instanceof ApiError) {
    if (error.code === 'TIMEOUT') return ErrorCategory.TIMEOUT
    if (error.code === 'CIRCUIT_BREAKER_OPEN') return ErrorCategory.CIRCUIT_BREAKER
    if (error.status === 401) return ErrorCategory.AUTHENTICATION
    if (error.status === 403) return ErrorCategory.AUTHORIZATION
    if (error.status === 422 || error.status === 400) return ErrorCategory.VALIDATION
    if (error.status === 429) return ErrorCategory.RATE_LIMIT
    if (error.status >= 500) return ErrorCategory.SERVER_ERROR
    if (error.status >= 400) return ErrorCategory.CLIENT_ERROR
  }

  return ErrorCategory.UNKNOWN
}

// User-friendly error messages
export const ERROR_MESSAGES: Record<ErrorCategory, string> = {
  [ErrorCategory.NETWORK]: 'Network connection problem. Please check your internet connection.',
  [ErrorCategory.VALIDATION]: 'The information provided is invalid. Please check and try again.',
  [ErrorCategory.AUTHENTICATION]: 'You need to sign in to access this feature.',
  [ErrorCategory.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
  [ErrorCategory.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ErrorCategory.SERVER_ERROR]: 'Server error occurred. Our team has been notified.',
  [ErrorCategory.CLIENT_ERROR]: 'Request error. Please check your input and try again.',
  [ErrorCategory.TIMEOUT]: 'Request timed out. Please try again.',
  [ErrorCategory.CIRCUIT_BREAKER]: 'Service temporarily unavailable. Please try again later.',
  [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again.',
}

// Enhanced error notification system
export interface ErrorNotificationOptions {
  showToast?: boolean
  toastDuration?: number
  logError?: boolean
  category?: ErrorCategory
}

export function handleError(
  error: unknown,
  options: ErrorNotificationOptions = {}
): ErrorCategory {
  const {
    showToast = true,
    toastDuration = 5000,
    logError = true,
    category: providedCategory
  } = options

  const category = providedCategory || categorizeError(error)
  // eslint-disable-next-line security/detect-object-injection
  const message = ERROR_MESSAGES[category]

  if (logError) {
    console.error(`[${category.toUpperCase()}]`, error)
  }

  if (showToast) {
    // Don't show toasts for authentication errors (handled by auth system)
    if (category !== ErrorCategory.AUTHENTICATION) {
      toast.error(message, {
        duration: toastDuration,
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return category
}

// Health check utility for monitoring API status
export interface HealthCheckResult {
  service: string
  healthy: boolean
  responseTime: number
  error?: string
  timestamp: string
}

export async function checkServiceHealth(
  service: string,
  endpoint: string,
  timeout = 5000
): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    await withTimeout(fetch(endpoint, { method: 'HEAD' }), timeout)
    return {
      service,
      healthy: true,
      responseTime: Date.now() - start,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      service,
      healthy: false,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

// Export utility for testing circuit breaker status
export function getCircuitBreakerStatus(): Record<string, ReturnType<CircuitBreaker['getStatus']>> {
  const status: Record<string, ReturnType<CircuitBreaker['getStatus']>> = {}
  
  for (const [service, breaker] of circuitBreakers) {
    // eslint-disable-next-line security/detect-object-injection
    status[service] = breaker.getStatus()
  }
  
  return status
}