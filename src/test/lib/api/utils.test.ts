import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  showErrorToast,
  showSuccessToast,
  showLoadingToast,
  createSuccessResponse,
  createErrorResponse,
  createPaginationParams,
  buildQueryString,
  createOptimisticUpdate,
  createOptimisticDelete,
  type ApiResponse,
  type PaginationParams,
  type PaginatedResponse
} from '@/lib/api/utils'

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(() => 'loading-toast-id')
  }
}))

describe('API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Toast Utilities', () => {
    it('should show error toast with string message', () => {
      showErrorToast('Error message')

      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith('Error message')
    })

    it('should show error toast with Error object', () => {
      const error = new Error('Error message')
      showErrorToast(error)

      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith('Error message')
    })

    it('should show error toast with ApiError object', () => {
      const apiError = { message: 'API Error' } as any
      showErrorToast(apiError)

      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith('API Error')
    })

    it('should show default error message for unknown error type', () => {
      showErrorToast(null as any)

      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith('An error occurred')
    })

    it('should show success toast', () => {
      showSuccessToast('Success message')

      expect(vi.mocked(require('sonner').toast.success)).toHaveBeenCalledWith('Success message')
    })

    it('should show loading toast and return ID', () => {
      const id = showLoadingToast('Loading message')

      expect(vi.mocked(require('sonner').toast.loading)).toHaveBeenCalledWith('Loading message')
      expect(id).toBe('loading-toast-id')
    })
  })

  describe('API Response Helpers', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' }
      const response = createSuccessResponse(data, 'Success message')

      expect(response).toEqual({
        success: true,
        data,
        message: 'Success message',
        status: 200,
        timestamp: expect.any(String)
      })
    })

    it('should create success response without message', () => {
      const data = { id: 1 }
      const response = createSuccessResponse(data)

      expect(response).toEqual({
        success: true,
        data,
        status: 200,
        timestamp: expect.any(String)
      })
      expect(response.message).toBeUndefined()
    })

    it('should create error response with custom status', () => {
      const response = createErrorResponse('Error message', 400, 'req-123')

      expect(response).toEqual({
        success: false,
        error: 'Error message',
        status: 400,
        timestamp: expect.any(String),
        requestId: 'req-123',
        data: null
      })
    })

    it('should create error response with default status', () => {
      const response = createErrorResponse('Error message')

      expect(response).toEqual({
        success: false,
        error: 'Error message',
        status: 500,
        timestamp: expect.any(String),
        data: null
      })
    })
  })

  describe('Pagination Utilities', () => {
    it('should create pagination params with defaults', () => {
      const params = createPaginationParams()

      expect(params).toEqual({
        page: 1,
        limit: 10,
        offset: 0
      })
    })

    it('should create pagination params with custom values', () => {
      const params = createPaginationParams(3, 20)

      expect(params).toEqual({
        page: 3,
        limit: 20,
        offset: 40
      })
    })

    it('should enforce minimum page of 1', () => {
      const params = createPaginationParams(0, 10)

      expect(params).toEqual({
        page: 1,
        limit: 10,
        offset: 0
      })
    })

    it('should enforce minimum limit of 1', () => {
      const params = createPaginationParams(1, 0)

      expect(params).toEqual({
        page: 1,
        limit: 1,
        offset: 0
      })
    })

    it('should cap limit at 100', () => {
      const params = createPaginationParams(1, 200)

      expect(params).toEqual({
        page: 1,
        limit: 100,
        offset: 0
      })
    })

    it('should handle negative page numbers', () => {
      const params = createPaginationParams(-5, 10)

      expect(params).toEqual({
        page: 1,
        limit: 10,
        offset: 0
      })
    })
  })

  describe('Query String Builder', () => {
    it('should build query string from simple params', () => {
      const params = { name: 'test', age: 25, active: true }
      const result = buildQueryString(params)

      expect(result).toBe('name=test&age=25&active=true')
    })

    it('should handle array values', () => {
      const params = { tags: ['red', 'blue', 'green'] }
      const result = buildQueryString(params)

      expect(result).toBe('tags=red&tags=blue&tags=green')
    })

    it('should handle object values', () => {
      const params = { filter: { status: 'active', category: 'test' } }
      const result = buildQueryString(params)

      expect(result).toBe('filter=%7B%22status%22%3A%22active%22%2C%22category%22%3A%22test%22%7D')
    })

    it('should skip undefined, null, and empty string values', () => {
      const params = {
        name: 'test',
        age: undefined,
        status: null,
        description: '',
        active: true
      }
      const result = buildQueryString(params)

      expect(result).toBe('name=test&active=true')
    })

    it('should handle empty params object', () => {
      const result = buildQueryString({})

      expect(result).toBe('')
    })

    it('should handle mixed data types', () => {
      const params = {
        string: 'test',
        number: 42,
        boolean: false,
        array: [1, 2],
        object: { nested: 'value' }
      }
      const result = buildQueryString(params)

      expect(result).toContain('string=test')
      expect(result).toContain('number=42')
      expect(result).toContain('boolean=false')
      expect(result).toContain('array=1&array=2')
      expect(result).toContain('object=')
    })
  })

  describe('Optimistic Update Utilities', () => {
    interface TestItem {
      id: number
      name: string
    }

    const getId = (item: TestItem) => item.id

    describe('createOptimisticUpdate', () => {
      it('should add new item to empty array', () => {
        const currentData: TestItem[] = []
        const newItem = { id: 1, name: 'New Item' }
        
        const result = createOptimisticUpdate(currentData, newItem, getId)

        expect(result).toEqual([newItem])
      })

      it('should add new item to existing array', () => {
        const currentData = [{ id: 1, name: 'Existing' }]
        const newItem = { id: 2, name: 'New Item' }
        
        const result = createOptimisticUpdate(currentData, newItem, getId)

        expect(result).toEqual([
          { id: 1, name: 'Existing' },
          { id: 2, name: 'New Item' }
        ])
      })

      it('should update existing item', () => {
        const currentData = [
          { id: 1, name: 'Original' },
          { id: 2, name: 'Other' }
        ]
        const updatedItem = { id: 1, name: 'Updated' }
        
        const result = createOptimisticUpdate(currentData, updatedItem, getId)

        expect(result).toEqual([
          { id: 1, name: 'Updated' },
          { id: 2, name: 'Other' }
        ])
      })

      it('should handle undefined current data', () => {
        const newItem = { id: 1, name: 'New Item' }
        
        const result = createOptimisticUpdate(undefined, newItem, getId)

        expect(result).toEqual([newItem])
      })

      it('should work with string IDs', () => {
        const getStringId = (item: { id: string; name: string }) => item.id
        const currentData = [{ id: 'a', name: 'Item A' }]
        const newItem = { id: 'b', name: 'Item B' }
        
        const result = createOptimisticUpdate(currentData, newItem, getStringId)

        expect(result).toEqual([
          { id: 'a', name: 'Item A' },
          { id: 'b', name: 'Item B' }
        ])
      })
    })

    describe('createOptimisticDelete', () => {
      it('should remove item from array', () => {
        const currentData = [
          { id: 1, name: 'Keep' },
          { id: 2, name: 'Delete' },
          { id: 3, name: 'Keep' }
        ]
        
        const result = createOptimisticDelete(currentData, 2, getId)

        expect(result).toEqual([
          { id: 1, name: 'Keep' },
          { id: 3, name: 'Keep' }
        ])
      })

      it('should handle non-existent item ID', () => {
        const currentData = [{ id: 1, name: 'Item' }]
        
        const result = createOptimisticDelete(currentData, 999, getId)

        expect(result).toEqual([{ id: 1, name: 'Item' }])
      })

      it('should handle undefined current data', () => {
        const result = createOptimisticDelete(undefined, 1, getId)

        expect(result).toEqual([])
      })

      it('should handle empty array', () => {
        const result = createOptimisticDelete([], 1, getId)

        expect(result).toEqual([])
      })

      it('should work with string IDs', () => {
        const getStringId = (item: { id: string; name: string }) => item.id
        const currentData = [
          { id: 'a', name: 'Item A' },
          { id: 'b', name: 'Item B' }
        ]
        
        const result = createOptimisticDelete(currentData, 'a', getStringId)

        expect(result).toEqual([{ id: 'b', name: 'Item B' }])
      })

      it('should remove all matching items', () => {
        const currentData = [
          { id: 1, name: 'Item 1' },
          { id: 1, name: 'Duplicate' },
          { id: 2, name: 'Item 2' }
        ]
        
        const result = createOptimisticDelete(currentData, 1, getId)

        expect(result).toEqual([{ id: 2, name: 'Item 2' }])
      })
    })
  })

  describe('Type Definitions', () => {
    it('should define ApiResponse interface correctly', () => {
      const response: ApiResponse = {
        success: true,
        status: 200,
        timestamp: '2024-01-01T00:00:00Z'
      }

      expect(response.success).toBe(true)
      expect(response.status).toBe(200)
      expect(response.timestamp).toBe('2024-01-01T00:00:00Z')
    })

    it('should define PaginationParams interface correctly', () => {
      const params: PaginationParams = {
        page: 1,
        limit: 10,
        offset: 0
      }

      expect(params.page).toBe(1)
      expect(params.limit).toBe(10)
      expect(params.offset).toBe(0)
    })

    it('should define PaginatedResponse interface correctly', () => {
      const response: PaginatedResponse<{ id: number }> = {
        data: [{ id: 1 }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }

      expect(response.data).toHaveLength(1)
      expect(response.pagination.page).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large numbers in pagination', () => {
      const params = createPaginationParams(Number.MAX_SAFE_INTEGER, 50)

      expect(params.page).toBe(Number.MAX_SAFE_INTEGER)
      expect(params.limit).toBe(50)
      expect(params.offset).toBe((Number.MAX_SAFE_INTEGER - 1) * 50)
    })

    it('should handle special characters in query string', () => {
      const params = {
        search: 'hello world!',
        special: '@#$%^&*()',
        unicode: '🚀🌟'
      }
      const result = buildQueryString(params)

      expect(result).toContain('search=hello+world%21')
      expect(result).toContain('special=%40%23%24%25%5E%26*%28%29')
      expect(result).toContain('unicode=%F0%9F%9A%80%F0%9F%8C%9F')
    })

    it('should handle circular references in object values', () => {
      const circular: any = { name: 'test' }
      circular.self = circular

      const params = { circular }

      expect(() => buildQueryString(params)).not.toThrow()
    })
  })
})