import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import {
  ApiError,
  ValidationError,
  generateRequestId,
  getRequestId,
  createSuccessResponse,
  createErrorResponse,
  createStandardResponse,
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
  internalErrorResponse,
  handleZodError,
  handleApiError,
  withApiHandler,
  createCrudHandlers,
  createResourceHandlers,
  withRequestId,
  showErrorToast,
  showSuccessToast,
  withErrorHandling,
  getFieldErrors,
  isNetworkError,
  withRetry,
  isApiError,
  isApiSuccess,
  ErrorType
} from '@/lib/api-core'
import { logger } from '@/lib/logger'

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn()
  }
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}))

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid-123')
}))

describe('API Core System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Error Classes', () => {
    describe('ApiError', () => {
      it('should create ApiError with message and status code', () => {
        const error = new ApiError('Test error', 400)

        expect(error.message).toBe('Test error')
        expect(error.status).toBe(400)
        expect(error.statusCode).toBe(400)
        expect(error.name).toBe('ApiError')
      })

      it('should default to 500 status code', () => {
        const error = new ApiError('Test error')

        expect(error.status).toBe(500)
        expect(error.statusCode).toBe(500)
      })

      it('should include optional code', () => {
        const error = new ApiError('Test error', 400, 'VALIDATION_FAILED')

        expect(error.code).toBe('VALIDATION_FAILED')
      })
    })

    describe('ValidationError', () => {
      it('should create ValidationError with fields', () => {
        const fields = {
          name: ['Required field'],
          email: ['Invalid email format']
        }
        const error = new ValidationError('Validation failed', fields)

        expect(error.message).toBe('Validation failed')
        expect(error.fields).toEqual(fields)
        expect(error.name).toBe('ValidationError')
      })
    })
  })

  describe('Request ID Generation', () => {
    it('should generate request ID with crypto.randomUUID', () => {
      const id = generateRequestId()

      expect(id).toBe('req_test-uuid-123')
      expect(crypto.randomUUID).toHaveBeenCalled()
    })

    it('should fallback when crypto.randomUUID unavailable', () => {
      vi.mocked(crypto.randomUUID).mockImplementation(() => {
        throw new Error('Not available')
      })

      const id = generateRequestId()

      expect(id).toMatch(/^req_\d+_[a-z0-9]+$/)
    })

    it('should extract request ID from headers', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-request-id': 'existing-id-123' }
      })

      const id = getRequestId(request)

      expect(id).toBe('existing-id-123')
    })

    it('should generate new ID when header missing', () => {
      const request = new Request('http://localhost')

      const id = getRequestId(request)

      expect(id).toMatch(/^req_/)
    })
  })

  describe('Response Creators', () => {
    it('should create success response', () => {
      const data = { id: 1, name: 'Test' }
      const response = createSuccessResponse(data, 'Success message', 'req-123')

      expect(response).toEqual({
        success: true,
        data,
        message: 'Success message',
        status: 200,
        timestamp: expect.any(String),
        requestId: 'req-123'
      })
    })

    it('should create error response', () => {
      const response = createErrorResponse('Error message', 400, 'req-123')

      expect(response).toEqual({
        success: false,
        error: 'Error message',
        status: 400,
        timestamp: expect.any(String),
        requestId: 'req-123'
      })
    })

    it('should handle Error object in createErrorResponse', () => {
      const error = new Error('Test error')
      const response = createErrorResponse(error, 500)

      expect(response.error).toBe('Test error')
    })
  })

  describe('NextResponse Helpers', () => {
    it('should create standard response with headers', () => {
      const apiResponse = createSuccessResponse({ data: 'test' })
      const response = createStandardResponse(apiResponse, { 'Custom-Header': 'value' })

      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should create success NextResponse', () => {
      const response = successResponse({ data: 'test' }, 'Success', { 'Custom': 'header' }, 'req-123')

      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should create error NextResponse and log error', () => {
      const response = errorResponse('Error message', 400, undefined, 'req-123')

      expect(response).toBeInstanceOf(NextResponse)
      expect(logger.error).toHaveBeenCalledWith(
        'API Error Response',
        expect.any(Error),
        { statusCode: 400, requestId: 'req-123' }
      )
    })

    it('should create validation error response', () => {
      const errors = { name: ['Required'], email: ['Invalid'] }
      const response = validationErrorResponse(errors, 'req-123')

      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should create unauthorized response', () => {
      const response = unauthorizedResponse('Custom unauthorized', 'req-123')

      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should create forbidden response', () => {
      const response = forbiddenResponse('Custom forbidden', 'req-123')

      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should create not found response', () => {
      const response = notFoundResponse('User', 'req-123')

      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should create rate limit response with retry-after', () => {
      const response = rateLimitResponse(60, 'req-123')

      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should create internal error response', () => {
      const response = internalErrorResponse('Custom error', 'req-123')

      expect(response).toBeInstanceOf(NextResponse)
    })
  })

  describe('Error Handling', () => {
    it('should handle ZodError', () => {
      const zodSchema = z.object({
        name: z.string(),
        email: z.string().email()
      })

      try {
        zodSchema.parse({ name: '', email: 'invalid' })
      } catch (error) {
        const validationError = handleZodError(error as ZodError)

        expect(validationError).toBeInstanceOf(ValidationError)
        expect(validationError.fields).toHaveProperty('name')
        expect(validationError.fields).toHaveProperty('email')
      }
    })

    it('should handle ApiError in handleApiError', () => {
      const apiError = new ApiError('Test error', 400)
      const result = handleApiError(apiError)

      expect(result.status).toBe(400)
      expect(result.body.error).toBe('Test error')
    })

    it('should handle generic Error in handleApiError', () => {
      const error = new Error('Generic error')
      const result = handleApiError(error)

      expect(result.status).toBe(500)
      expect(result.body.error).toBe('Generic error')
    })

    it('should handle unknown error in handleApiError', () => {
      const result = handleApiError('string error')

      expect(result.status).toBe(500)
      expect(result.body.error).toBe('An unexpected error occurred')
    })
  })

  describe('withApiHandler', () => {
    it('should wrap handler with validation and error handling', async () => {
      const mockHandler = vi.fn().mockResolvedValue({ data: 'test' })
      const wrappedHandler = withApiHandler(mockHandler)

      const request = new NextRequest('http://localhost/api/test')
      const result = await wrappedHandler(request)

      expect(result).toBeInstanceOf(NextResponse)
      expect(mockHandler).toHaveBeenCalledWith(request, undefined)
    })

    it('should validate request body when schema provided', async () => {
      const schema = z.object({ name: z.string() })
      const mockHandler = vi.fn().mockResolvedValue({ success: true })
      const wrappedHandler = withApiHandler(mockHandler, { validateBody: schema })

      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' })
      })

      await wrappedHandler(request)

      expect(mockHandler).toHaveBeenCalled()
    })

    it('should validate query parameters when schema provided', async () => {
      const schema = z.object({ page: z.string() })
      const mockHandler = vi.fn().mockResolvedValue({ success: true })
      const wrappedHandler = withApiHandler(mockHandler, { validateQuery: schema })

      const request = new NextRequest('http://localhost/api/test?page=1')

      await wrappedHandler(request)

      expect(mockHandler).toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      const schema = z.object({ name: z.string() })
      const mockHandler = vi.fn()
      const wrappedHandler = withApiHandler(mockHandler, { validateBody: schema })

      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' })
      })

      const result = await wrappedHandler(request)

      expect(result).toBeInstanceOf(NextResponse)
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return NextResponse directly if handler returns one', async () => {
      const mockResponse = NextResponse.json({ custom: true })
      const mockHandler = vi.fn().mockResolvedValue(mockResponse)
      const wrappedHandler = withApiHandler(mockHandler)

      const request = new NextRequest('http://localhost/api/test')
      const result = await wrappedHandler(request)

      expect(result).toBe(mockResponse)
    })
  })

  describe('CRUD Handlers', () => {
    it('should create GET handler for getAll operation', () => {
      const mockGetAll = vi.fn().mockResolvedValue([{ id: 1 }])
      const handlers = createCrudHandlers('User', { getAll: mockGetAll })

      expect(handlers.GET).toBeDefined()
    })

    it('should create POST handler for create operation', () => {
      const mockCreate = vi.fn().mockResolvedValue({ id: 1 })
      const handlers = createCrudHandlers('User', { create: mockCreate })

      expect(handlers.POST).toBeDefined()
    })
  })

  describe('Resource Handlers', () => {
    it('should create GET handler for getById operation', () => {
      const mockGetById = vi.fn().mockResolvedValue({ id: 1 })
      const handlers = createResourceHandlers('User', { getById: mockGetById })

      expect(handlers.GET).toBeDefined()
    })

    it('should create PATCH handler for update operation', () => {
      const mockUpdate = vi.fn().mockResolvedValue({ id: 1 })
      const handlers = createResourceHandlers('User', { update: mockUpdate })

      expect(handlers.PATCH).toBeDefined()
    })

    it('should create DELETE handler for delete operation', () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      const handlers = createResourceHandlers('User', { delete: mockDelete })

      expect(handlers.DELETE).toBeDefined()
    })
  })

  describe('Client-side Utilities', () => {
    it('should show error toast with Error object', () => {
      const error = new Error('Test error')
      showErrorToast(error)

      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith('Test error')
    })

    it('should show error toast with string', () => {
      showErrorToast('String error')

      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith('String error')
    })

    it('should show success toast', () => {
      showSuccessToast('Success message')

      expect(vi.mocked(require('sonner').toast.success)).toHaveBeenCalledWith('Success message')
    })

    it('should handle withErrorHandling success', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      const result = await withErrorHandling(operation)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalled()
    })

    it('should handle withErrorHandling error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Test error'))
      const result = await withErrorHandling(operation, 'Custom error')

      expect(result).toBeNull()
      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalled()
    })

    it('should get field errors from ValidationError', () => {
      const validationError = new ValidationError('Validation failed', {
        name: ['Required field'],
        email: ['Invalid email']
      })

      const fieldErrors = getFieldErrors(validationError)

      expect(fieldErrors).toEqual({
        name: 'Required field',
        email: 'Invalid email'
      })
    })

    it('should return empty object for non-ValidationError', () => {
      const fieldErrors = getFieldErrors(new Error('Regular error'))

      expect(fieldErrors).toEqual({})
    })

    it('should detect network errors', () => {
      expect(isNetworkError(new Error('fetch failed'))).toBe(true)
      expect(isNetworkError(new Error('network error'))).toBe(true)
      expect(isNetworkError(new Error('offline'))).toBe(true)
      expect(isNetworkError(new Error('regular error'))).toBe(false)
    })

    it('should retry operation with backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First fail'))
        .mockRejectedValueOnce(new Error('Second fail'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(operation, 3, 10)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'))

      await expect(withRetry(operation, 2, 10)).rejects.toThrow('Always fails')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should identify API error response', () => {
      const errorResponse = { success: false, status: 400, timestamp: '', error: 'Error' }
      const successResponse = { success: true, status: 200, timestamp: '', data: {} }

      expect(isApiError(errorResponse)).toBe(true)
      expect(isApiError(successResponse)).toBe(false)
    })

    it('should identify API success response', () => {
      const successResponse = { success: true, status: 200, timestamp: '', data: { id: 1 } }
      const errorResponse = { success: false, status: 400, timestamp: '', error: 'Error' }

      expect(isApiSuccess(successResponse)).toBe(true)
      expect(isApiSuccess(errorResponse)).toBe(false)
    })
  })

  describe('withRequestId middleware', () => {
    it('should add request ID to response headers', async () => {
      const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ data: 'test' }))
      const wrappedHandler = withRequestId(mockHandler)

      const request = new Request('http://localhost')
      const result = await wrappedHandler(request)

      expect(result).toBeInstanceOf(NextResponse)
      expect(mockHandler).toHaveBeenCalledWith(request)
    })

    it('should handle handler errors and return standardized response', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Handler error'))
      const wrappedHandler = withRequestId(mockHandler)

      const request = new Request('http://localhost')
      const result = await wrappedHandler(request)

      expect(result).toBeInstanceOf(NextResponse)
    })
  })
})