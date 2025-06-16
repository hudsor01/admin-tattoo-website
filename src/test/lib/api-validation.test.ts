import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  withValidation,
  ValidationPresets,
  SecurityPresets,
  withSecurityValidation,
  validateFileUpload,
  validateFileContent
} from '@/lib/api-validation'

// Mock Next.js components
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, init) => ({ json: data, status: init?.status || 200 }))
  }
}))

describe('API Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('withValidation', () => {
    const mockHandler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    )

    it('should allow request with no validation config', async () => {
      const validator = withValidation()
      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/test'
      } as NextRequest

      const result = await validator(mockHandler)(request)

      expect(mockHandler).toHaveBeenCalledWith(request, {})
      expect(result).toEqual(NextResponse.json({ success: true }))
    })

    it('should validate allowed methods', async () => {
      const validator = withValidation({
        allowedMethods: ['GET', 'POST']
      })
      const request = {
        method: 'DELETE',
        url: 'http://localhost:3000/api/test'
      } as NextRequest

      const result = await validator(mockHandler)(request)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(result.status).toBe(405)
      expect(result.json).toEqual({
        success: false,
        error: 'Method not allowed',
        requestId: expect.any(String)
      })
    })

    it('should validate request body with schema', async () => {
      const bodySchema = z.object({
        name: z.string(),
        email: z.string().email()
      })

      const validator = withValidation({ bodySchema })
      const mockBody = { name: 'John', email: 'john@example.com' }
      
      const request = {
        method: 'POST',
        json: vi.fn().mockResolvedValue(mockBody),
        headers: new Map([['content-length', '100']])
      } as unknown as NextRequest

      const result = await validator(mockHandler)(request)

      expect(request.json).toHaveBeenCalled()
      expect(mockHandler).toHaveBeenCalledWith(request, {
        body: mockBody
      })
    })

    it('should handle invalid request body', async () => {
      const bodySchema = z.object({
        name: z.string(),
        email: z.string().email()
      })

      const validator = withValidation({ bodySchema })
      const invalidBody = { name: 'John', email: 'invalid-email' }
      
      const request = {
        method: 'POST',
        json: vi.fn().mockResolvedValue(invalidBody),
        headers: new Map([['content-length', '100']])
      } as unknown as NextRequest

      const result = await validator(mockHandler)(request)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(result.status).toBe(400)
      expect(result.json.error).toContain('Validation error')
    })

    it('should check max body size', async () => {
      const bodySchema = z.object({ data: z.string() })
      const validator = withValidation({ 
        bodySchema, 
        maxBodySize: 100 
      })
      
      const request = {
        method: 'POST',
        headers: new Map([['content-length', '200']])
      } as unknown as NextRequest

      const result = await validator(mockHandler)(request)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(result.status).toBe(400)
      expect(result.json.error).toBe('Request body too large')
    })

    it('should validate query parameters', async () => {
      const querySchema = z.object({
        page: z.string().transform(Number),
        limit: z.string().transform(Number)
      })

      const validator = withValidation({ querySchema })
      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/test?page=1&limit=10'
      } as NextRequest

      const result = await validator(mockHandler)(request)

      expect(mockHandler).toHaveBeenCalledWith(request, {
        query: { page: 1, limit: 10 }
      })
    })

    it('should handle invalid query parameters', async () => {
      const querySchema = z.object({
        page: z.string().transform(Number)
      })

      const validator = withValidation({ querySchema })
      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/test?page=invalid'
      } as NextRequest

      const result = await validator(mockHandler)(request)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(result.status).toBe(400)
      expect(result.json.error).toContain('Query validation error')
    })

    it('should handle JSON parsing errors', async () => {
      const bodySchema = z.object({ name: z.string() })
      const validator = withValidation({ bodySchema })
      
      const request = {
        method: 'POST',
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: new Map([['content-length', '100']])
      } as unknown as NextRequest

      const result = await validator(mockHandler)(request)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(result.status).toBe(400)
      expect(result.json.error).toBe('Invalid request body format')
    })

    it('should handle handler errors', async () => {
      const failingHandler = vi.fn().mockRejectedValue(new Error('Handler failed'))
      const validator = withValidation()
      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/test'
      } as NextRequest

      const result = await validator(failingHandler)(request)

      expect(result.status).toBe(500)
      expect(result.json.error).toBe('Internal server error')
      expect(console.error).toHaveBeenCalledWith('API validation error:', expect.any(Error))
    })

    it('should skip body validation for GET requests', async () => {
      const bodySchema = z.object({ name: z.string() })
      const validator = withValidation({ bodySchema })
      
      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/test'
      } as NextRequest

      const result = await validator(mockHandler)(request)

      expect(mockHandler).toHaveBeenCalledWith(request, {})
    })

    it('should handle missing content-length header', async () => {
      const bodySchema = z.object({ name: z.string() })
      const validator = withValidation({ bodySchema })
      
      const request = {
        method: 'POST',
        json: vi.fn().mockResolvedValue({ name: 'John' }),
        headers: new Map()
      } as unknown as NextRequest

      const result = await validator(mockHandler)(request)

      expect(mockHandler).toHaveBeenCalledWith(request, {
        body: { name: 'John' }
      })
    })
  })

  describe('ValidationPresets', () => {
    it('should have PUBLIC_READ preset', () => {
      expect(ValidationPresets.PUBLIC_READ).toEqual({
        allowedMethods: ['GET']
      })
    })

    it('should have PUBLIC_WRITE preset', () => {
      expect(ValidationPresets.PUBLIC_WRITE).toEqual({
        allowedMethods: ['POST', 'PUT', 'PATCH'],
        maxBodySize: 1 * 1024 * 1024
      })
    })

    it('should have FILE_UPLOAD preset', () => {
      expect(ValidationPresets.FILE_UPLOAD).toEqual({
        allowedMethods: ['POST'],
        maxBodySize: 10 * 1024 * 1024
      })
    })

    it('should have admin-specific presets', () => {
      expect(ValidationPresets.ANALYTICS_READ).toEqual({
        allowedMethods: ['GET']
      })

      expect(ValidationPresets.CUSTOMER_WRITE).toEqual({
        allowedMethods: ['POST', 'PUT', 'PATCH'],
        maxBodySize: 1 * 1024 * 1024
      })

      expect(ValidationPresets.SYSTEM_ADMIN).toEqual({
        allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        maxBodySize: 10 * 1024 * 1024
      })
    })

    it('should have SecurityPresets alias', () => {
      expect(SecurityPresets).toBe(ValidationPresets)
    })

    it('should have withSecurityValidation alias', () => {
      expect(withSecurityValidation).toBe(withValidation)
    })
  })

  describe('validateFileUpload', () => {
    it('should validate valid image file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })

      const result = validateFileUpload(file)

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid file type', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      const result = validateFileUpload(file)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
    })

    it('should reject oversized file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 })

      const result = validateFileUpload(file)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('File too large. Maximum size is 10MB.')
    })

    it('should accept custom options', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const result = validateFileUpload(file, {
        allowedTypes: ['application/pdf'],
        maxSize: 2048
      })

      expect(result.isValid).toBe(true)
    })

    it('should validate different image types', () => {
      const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      
      imageTypes.forEach(type => {
        const file = new File(['content'], `test.${type.split('/')[1]}`, { type })
        Object.defineProperty(file, 'size', { value: 1024 })

        const result = validateFileUpload(file)

        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('validateFileContent', () => {
    it('should validate JPEG file signature', async () => {
      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])
      const file = new File([jpegBytes], 'test.jpg', { type: 'image/jpeg' })

      const result = await validateFileContent(file)

      expect(result.isValid).toBe(true)
    })

    it('should reject invalid JPEG signature', async () => {
      const invalidBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00])
      const file = new File([invalidBytes], 'test.jpg', { type: 'image/jpeg' })

      const result = await validateFileContent(file)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid JPEG file signature')
    })

    it('should validate PNG file signature', async () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47])
      const file = new File([pngBytes], 'test.png', { type: 'image/png' })

      const result = await validateFileContent(file)

      expect(result.isValid).toBe(true)
    })

    it('should reject invalid PNG signature', async () => {
      const invalidBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00])
      const file = new File([invalidBytes], 'test.png', { type: 'image/png' })

      const result = await validateFileContent(file)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid PNG file signature')
    })

    it('should handle non-validated file types', async () => {
      const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38])
      const file = new File([gifBytes], 'test.gif', { type: 'image/gif' })

      const result = await validateFileContent(file)

      expect(result.isValid).toBe(true)
    })

    it('should handle file reading errors', async () => {
      const file = {
        type: 'image/jpeg',
        arrayBuffer: vi.fn().mockRejectedValue(new Error('Read failed'))
      } as unknown as File

      const result = await validateFileContent(file)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Failed to validate file content')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty query string', async () => {
      const querySchema = z.object({
        page: z.string().optional()
      })

      const validator = withValidation({ querySchema })
      const request = {
        method: 'GET',
        url: 'http://localhost:3000/api/test'
      } as NextRequest

      const result = await validator(mockHandler)(request)

      expect(mockHandler).toHaveBeenCalledWith(request, {
        query: {}
      })
    })

    it('should handle complex nested schema validation', async () => {
      const bodySchema = z.object({
        user: z.object({
          name: z.string(),
          settings: z.object({
            theme: z.enum(['light', 'dark']),
            notifications: z.boolean()
          })
        })
      })

      const validator = withValidation({ bodySchema })
      const validBody = {
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true
          }
        }
      }
      
      const request = {
        method: 'POST',
        json: vi.fn().mockResolvedValue(validBody),
        headers: new Map([['content-length', '200']])
      } as unknown as NextRequest

      const result = await validator(mockHandler)(request)

      expect(mockHandler).toHaveBeenCalledWith(request, {
        body: validBody
      })
    })

    it('should handle zero-length file', () => {
      const file = new File([], 'empty.jpg', { type: 'image/jpeg' })

      const result = validateFileUpload(file)

      expect(result.isValid).toBe(true)
    })

    it('should handle file with no extension', () => {
      const file = new File(['content'], 'image', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const result = validateFileUpload(file)

      expect(result.isValid).toBe(true)
    })
  })
})