/**
 * Consolidated API Core System
 * Merges functionality from api-response.ts, error-handling.ts, and api-helpers.ts
 * Provides unified API response handling, error management, and route helpers
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import { toast } from "sonner";
import { logger } from './logger';

/**
 * Standardized API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
  timestamp: string;
  requestId?: string;
}

/**
 * Enhanced error types for security
 */
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
  type: ErrorType;
  statusCode: number;
  isOperational: boolean;
  context?: Record<string, unknown>;
  userId?: string;
  ip?: string;
}

/**
 * Custom Error Classes
 */
export class ApiError extends Error {
  public status: number;
  public statusCode: number;
  public code: string | undefined;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = statusCode;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends Error {
  public fields: Record<string, string[]>;

  constructor(message: string, fields: Record<string, string[]>) {
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `req_${crypto.randomUUID()}`;
  }
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract request ID from request headers or generate new one
 */
export function getRequestId(request: Request): string {
  return request.headers.get('x-request-id') || generateRequestId();
}

/**
 * Success response creator
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data: data === undefined ? null as T : data,
    status: 200,
    timestamp: new Date().toISOString(),
  };
  
  if (message) response.message = message;
  if (requestId) response.requestId = requestId;
  
  return response;
}

/**
 * Error response creator
 */
export function createErrorResponse(
  error: string | Error,
  statusCode: number = 500,
  requestId?: string
): ApiResponse {
  const message = error instanceof Error ? error.message : error;
  
  return {
    success: false,
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * Create a standardized NextResponse with proper headers
 */
export function createStandardResponse<T>(
  response: ApiResponse<T>,
  headers?: Record<string, string>
): NextResponse {
  const res = NextResponse.json(response, { status: response.status });
  
  // Add standard headers
  res.headers.set('Content-Type', 'application/json');
  res.headers.set('X-Timestamp', response.timestamp);
  
  if (response.requestId) {
    res.headers.set('X-Request-ID', response.requestId);
  }
  
  // Add any custom headers
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
  }
  
  return res;
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  message?: string,
  headers?: Record<string, string>,
  requestId?: string
): NextResponse {
  const response = createSuccessResponse(data, message, requestId);
  return createStandardResponse(response, headers);
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  headers?: Record<string, string>,
  requestId?: string
): NextResponse {
  const response = createErrorResponse(message, statusCode, requestId);
  
  // Log error for monitoring
  logger.error('API Error Response', new Error(message), {
    statusCode,
    requestId,
  });
  
  return createStandardResponse(response, headers);
}

/**
 * Validation error response helper
 */
export function validationErrorResponse(
  errors: Record<string, string[]>,
  requestId?: string
): NextResponse {
  return errorResponse(
    `Validation failed: ${Object.keys(errors).join(', ')}`,
    400,
    undefined,
    requestId
  );
}

/**
 * Unauthorized error response helper
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized',
  requestId?: string
): NextResponse {
  return errorResponse(message, 401, undefined, requestId);
}

/**
 * Forbidden error response helper
 */
export function forbiddenResponse(
  message: string = 'Forbidden',
  requestId?: string
): NextResponse {
  return errorResponse(message, 403, undefined, requestId);
}

/**
 * Not found error response helper
 */
export function notFoundResponse(
  resource: string = 'Resource',
  requestId?: string
): NextResponse {
  return errorResponse(
    `${resource} not found`,
    404,
    undefined,
    requestId
  );
}

/**
 * Rate limit error response helper
 */
export function rateLimitResponse(
  retryAfter?: number,
  requestId?: string
): NextResponse {
  const headers: Record<string, string> = {};
  
  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }
  
  return errorResponse(
    'Too many requests',
    429,
    headers,
    requestId
  );
}

/**
 * Internal server error response helper
 */
export function internalErrorResponse(
  message: string = 'Internal server error',
  requestId?: string
): NextResponse {
  return errorResponse(message, 500, undefined, requestId);
}

/**
 * Error handling utilities
 */
export function handleZodError(error: ZodError): ValidationError {
  const fields: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!Object.prototype.hasOwnProperty.call(fields, path)) {
      fields[path] = [];
    }
    const fieldErrors = fields[path];
    if (fieldErrors) {
      fieldErrors.push(err.message);
    }
  });

  return new ValidationError("Validation failed", fields);
}

export function handleApiError(error: unknown): { status: number; body: ApiResponse } {
  let apiError: ApiError;
  
  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof ZodError) {
    throw handleZodError(error);
  } else if (error instanceof Error) {
    apiError = new ApiError(error.message, 500);
  } else {
    apiError = new ApiError("An unexpected error occurred", 500);
  }
  
  return {
    status: apiError.status,
    body: createErrorResponse(apiError.message, apiError.status)
  };
}

/**
 * API Handler type and configuration
 */
export type ApiHandler<T = void> = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<T>;

export interface ApiRouteConfig {
  validateBody?: ZodSchema;
  validateQuery?: ZodSchema;
}

/**
 * Wrapper for API routes to reduce boilerplate code
 * Handles validation, error handling, and response formatting
 */
export function withApiHandler<T>(
  handler: ApiHandler<T>,
  config: ApiRouteConfig = {}
) {
  return async function(
    request: NextRequest,
    context?: { params: Record<string, string> }
  ): Promise<NextResponse> {
    const requestId = getRequestId(request);
    
    try {
      let validatedBody;
      let validatedQuery;

      // Validate request body if schema provided
      if (config.validateBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const body = await request.json();
        validatedBody = config.validateBody.parse(body);
      }

      // Validate query parameters if schema provided
      if (config.validateQuery) {
        const { searchParams } = new URL(request.url);
        const queryObject = Object.fromEntries(searchParams.entries());
        validatedQuery = config.validateQuery.parse(queryObject);
      }

      // Add validated data to request for handler use
      (request as NextRequest & { validatedBody?: unknown; validatedQuery?: unknown }).validatedBody = validatedBody;
      (request as NextRequest & { validatedBody?: unknown; validatedQuery?: unknown }).validatedQuery = validatedQuery;

      const result = await handler(request, context);
      
      // If result is already a NextResponse, return it
      if (result instanceof NextResponse) {
        return result;
      }

      // Otherwise wrap in success response
      return successResponse(result, undefined, undefined, requestId);
    } catch (error) {
      logger.error('API route error', error, { requestId });

      if (error instanceof ZodError) {
        const validationError = handleZodError(error);
        return validationErrorResponse(validationError.fields, requestId);
      }

      const errorResult = handleApiError(error);
      return NextResponse.json(errorResult.body, { status: errorResult.status });
    }
  };
}

/**
 * Higher-order function for CRUD operations
 */
export function createCrudHandlers<T>(
  entityName: string,
  operations: {
    getAll?: (filters?: Record<string, unknown>) => Promise<T[]>;
    getById?: (id: string) => Promise<T>;
    create?: (data: Record<string, unknown>) => Promise<T>;
    update?: (id: string, data: Record<string, unknown>) => Promise<T>;
    delete?: (id: string) => Promise<void>;
  },
  schemas: {
    create?: ZodSchema;
    update?: ZodSchema;
    query?: ZodSchema;
  } = {}
) {
  const handlers: Record<string, (req: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse>> = {};

  // GET handler (list all)
  if (operations.getAll) {
    handlers.GET = withApiHandler(
      async (request: NextRequest) => {
        const { searchParams } = new URL(request.url);
        const filters = Object.fromEntries(searchParams.entries());
        return operations.getAll!(filters);
      },
      { validateQuery: schemas.query }
    );
  }

  // POST handler (create)
  if (operations.create) {
    handlers.POST = withApiHandler(
      async (request: NextRequest) => {
        const data = (request as NextRequest & { validatedBody?: Record<string, unknown> }).validatedBody || {};
        const result = await operations.create!(data);
        const requestId = getRequestId(request);
        return successResponse(
          result,
          `${entityName} created successfully`,
          { 'status': '201' },
          requestId
        );
      },
      { validateBody: schemas.create }
    );
  }

  return handlers;
}

/**
 * Higher-order function for single resource handlers
 */
export function createResourceHandlers<T>(
  entityName: string,
  operations: {
    getById?: (id: string) => Promise<T>;
    update?: (id: string, data: Record<string, unknown>) => Promise<T>;
    delete?: (id: string) => Promise<void>;
  },
  schemas: {
    update?: ZodSchema;
  } = {}
) {
  const handlers: Record<string, (req: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse>> = {};

  // GET handler (single item)
  if (operations.getById) {
    handlers.GET = withApiHandler(
      async (_request: NextRequest, context) => {
        const id = context?.params?.id;
        if (!id) {
          throw new Error(`${entityName} ID is required`);
        }
        return operations.getById!(id);
      }
    );
  }

  // PATCH handler (update)
  if (operations.update) {
    handlers.PATCH = withApiHandler(
      async (request: NextRequest, context) => {
        const id = context?.params?.id;
        if (!id) {
          throw new Error(`${entityName} ID is required`);
        }
        const data = (request as NextRequest & { validatedBody?: Record<string, unknown> }).validatedBody || {};
        const result = await operations.update!(id, data);
        const requestId = getRequestId(request);
        return successResponse(
          result,
          `${entityName} updated successfully`,
          undefined,
          requestId
        );
      },
      { validateBody: schemas.update }
    );
  }

  // DELETE handler
  if (operations.delete) {
    handlers.DELETE = withApiHandler(
      async (request: NextRequest, context) => {
        const id = context?.params?.id;
        if (!id) {
          throw new Error(`${entityName} ID is required`);
        }
        await operations.delete!(id);
        const requestId = getRequestId(request);
        return successResponse(
          null,
          `${entityName} deleted successfully`,
          undefined,
          requestId
        );
      }
    );
  }

  return handlers;
}

/**
 * Middleware helper to add request ID to all API responses
 */
export function withRequestId(
  handler: (request: Request, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: Request, ...args: unknown[]): Promise<NextResponse> => {
    const requestId = getRequestId(request);
    
    try {
      const response = await handler(request, ...args);
      
      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);
      
      return response;
    } catch (error) {
      // Return standardized error response
      return internalErrorResponse(
        error instanceof Error ? error.message : 'Unknown error',
        requestId
      );
    }
  };
}

/**
 * Client-side error handling
 */
export function showErrorToast(error: unknown, fallbackMessage = "Something went wrong") {
  let message = fallbackMessage;
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object" && "message" in error && error.message) {
    message = String(error.message);
  }
  
  toast.error(message);
}

export function showSuccessToast(message: string) {
  toast.success(message);
}

export function showInfoToast(message: string) {
  toast.info(message);
}

export function showWarningToast(message: string) {
  toast.warning(message);
}

/**
 * Async error wrapper
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    showErrorToast(error, errorMessage);
    return null;
  }
}

/**
 * Form validation helper
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ValidationError) {
    const fieldErrors: Record<string, string> = {};
    Object.entries(error.fields).forEach(([field, messages]) => {
      fieldErrors[field] = messages[0] || 'Validation error';
    });
    return fieldErrors;
  }
  return {};
}

/**
 * Network error helper
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && 
    (error.message.includes("fetch") || 
     error.message.includes("network") ||
     error.message.includes("offline"));
}

/**
 * Retry helper
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw lastError;
}

/**
 * Type guards
 */
export function isApiError(response: ApiResponse<unknown>): boolean {
  return !response.success;
}

export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
  return response.success && response.data !== undefined;
}
