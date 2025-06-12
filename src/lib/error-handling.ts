import { toast } from "sonner"
import { ZodError } from "zod"
import { ApiResponse } from "@/types/database"

// Enhanced error types for security
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  INTERNAL = 'INTERNAL'
}

export interface SecurityError extends Error {
  type: ErrorType
  statusCode: number
  isOperational: boolean
  context?: Record<string, unknown>
  userId?: string
  ip?: string
}

// Error types
export class ApiError extends Error {
  public statusCode: number
  public code: string | undefined

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.code = code
  }
}

export class ValidationError extends Error {
  public fields: Record<string, string[]>

  constructor(message: string, fields: Record<string, string[]>) {
    super(message)
    this.name = "ValidationError"
    this.fields = fields
  }
}

// Error handling utilities
export function handleZodError(error: ZodError): ValidationError {
  const fields: Record<string, string[]> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join(".")
    if (!fields[path]) {
      fields[path] = []
    }
    fields[path].push(err.message)
  })

  return new ValidationError("Validation failed", fields)
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }
  
  if (error instanceof ZodError) {
    throw handleZodError(error)
  }
  
  if (error instanceof Error) {
    return new ApiError(error.message, 500)
  }
  
  return new ApiError("An unexpected error occurred", 500)
}

// Response helpers
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data
  }
  if (message !== undefined) {
    response.message = message
  }
  return response
}

export function createErrorResponse(error: string | Error): ApiResponse {
  const message = error instanceof Error ? error.message : error
  return {
    success: false,
    error: message
  }
}

// Client-side error handling
export function showErrorToast(error: unknown, fallbackMessage = "Something went wrong") {
  let message = fallbackMessage
  
  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === "string") {
    message = error
  } else if (error && typeof error === "object" && "message" in error && error.message) {
    message = String(error.message)
  }
  
  toast.error(message)
}

export function showSuccessToast(message: string) {
  toast.success(message)
}

export function showInfoToast(message: string) {
  toast.info(message)
}

export function showWarningToast(message: string) {
  toast.warning(message)
}

// Async error wrapper
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    showErrorToast(error, errorMessage)
    return null
  }
}

// Form validation helper
export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ValidationError) {
    const fieldErrors: Record<string, string> = {}
    Object.entries(error.fields).forEach(([field, messages]) => {
      fieldErrors[field] = messages[0] || 'Validation error' // Take first error message
    })
    return fieldErrors
  }
  return {}
}

// Network error helper
export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && 
    (error.message.includes("fetch") || 
     error.message.includes("network") ||
     error.message.includes("offline"))
}

// Retry helper
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (i === maxRetries - 1) {
        throw error
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
  
  throw lastError
}