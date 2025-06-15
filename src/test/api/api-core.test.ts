import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiError, createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-core'
import { z } from 'zod'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Core', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('ApiError', () => {
    it('should create ApiError with message and status', () => {
      const error = new ApiError('Test error', 400)
      
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(400)
      expect(error.name).toBe('ApiError')
      expect(error).toBeInstanceOf(Error)
    })

    it('should default to 500 status', () => {
      const error = new ApiError('Server error')
      
      expect(error.status).toBe(500)
    })
  })

  describe('API Response Functions', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' }
      const response = createSuccessResponse(data)
      
      expect(response.success).toBe(true)
      expect(response.data).toEqual(data)
      expect(response.error).toBeUndefined()
    })

    it('should create success response without data', () => {
      const response = createSuccessResponse(undefined)
      
      expect(response.success).toBe(true)
      expect(response.data).toBeNull()
      expect(response.error).toBeUndefined()
    })

    it('should create error response', () => {
      const response = createErrorResponse('Something went wrong', 400)
      
      expect(response.success).toBe(false)
      expect(response.data).toBeUndefined()
      expect(response.error).toBe('Something went wrong')
      expect(response.status).toBe(400)
    })

    it('should create error response with default status', () => {
      const response = createErrorResponse('Server error')
      
      expect(response.success).toBe(false)
      expect(response.error).toBe('Server error')
      expect(response.status).toBe(500)
    })
  })

  describe('handleApiError', () => {
    it('should handle ApiError', () => {
      const apiError = new ApiError('API Error', 404)
      const response = handleApiError(apiError)
      
      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('API Error')
      expect(response.body.status).toBe(404)
    })

    it('should handle Zod validation error', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number'
        }
      ])
      
      expect(() => handleApiError(zodError)).toThrow('Validation failed')
    })

    it('should handle generic Error', () => {
      const error = new Error('Generic error')
      const response = handleApiError(error)
      
      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Generic error')
      expect(response.body.status).toBe(500)
    })

    it('should handle unknown error', () => {
      const error = 'String error'
      const response = handleApiError(error)
      
      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('An unexpected error occurred')
      expect(response.body.status).toBe(500)
    })

    it('should handle error in development mode', () => {
      const error = new Error('Development error')
      const response = handleApiError(error)
      
      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Development error')
    })
  })

  describe('Error Handling', () => {
    it('should handle Zod validation errors', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number'
        }
      ])
      
      expect(() => handleApiError(zodError)).toThrow('Validation failed')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete error flow', () => {
      try {
        throw new ApiError('Test error', 422)
      } catch (error) {
        const response = handleApiError(error)
        
        expect(response.status).toBe(422)
        expect(response.body.success).toBe(false)
        expect(response.body.error).toBe('Test error')
      }
    })

    it('should create and handle validation errors', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      })

      // Create invalid data that will fail validation
      const invalidData = {
        email: 'invalid',
        password: '123'
      }

      try {
        schema.parse(invalidData)
      } catch (error) {
        if (error instanceof z.ZodError) {
          expect(() => handleApiError(error)).toThrow('Validation failed')
        }
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle null data in success response', () => {
      const response = createSuccessResponse(null)
      
      expect(response.data).toBeNull()
      expect(response.success).toBe(true)
    })

    it('should handle undefined data in success response', () => {
      const response = createSuccessResponse(undefined)
      
      expect(response.data).toBeNull()
      expect(response.success).toBe(true)
    })

    it('should handle empty string error', () => {
      const response = createErrorResponse('')
      
      expect(response.error).toBe('')
      expect(response.success).toBe(false)
    })

    it('should handle complex nested data', () => {
      const complexData = {
        user: {
          id: 1,
          profile: {
            settings: {
              theme: 'dark',
              notifications: ['email', 'push']
            }
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      }

      const response = createSuccessResponse(complexData)
      
      expect(response.data).toEqual(complexData)
      expect(response.success).toBe(true)
    })
  })
})
