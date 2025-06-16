import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import {
  queryClient,
  apiFetch,
  ApiError,
  queryKeys,
  invalidateQueries,
  prefetchQuery
} from '@/lib/api/client'
import { authClient } from '@/lib/auth-client'

// Mock dependencies
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: vi.fn()
  }
}))

// Mock fetch
global.fetch = vi.fn()

// Mock console
const originalConsoleWarn = console.warn

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.warn = vi.fn()
    // Reset fetch mock
    vi.mocked(global.fetch).mockReset()
  })

  afterEach(() => {
    console.warn = originalConsoleWarn
  })

  describe('QueryClient configuration', () => {
    it('should create query client with correct defaults', () => {
      expect(queryClient).toBeInstanceOf(QueryClient)
      
      const options = queryClient.getDefaultOptions()
      expect(options.queries?.staleTime).toBe(5 * 60 * 1000) // 5 minutes
      expect(options.queries?.refetchOnWindowFocus).toBe(false)
      expect(options.mutations?.retry).toBe(false)
    })

    it('should not retry on 4xx errors', () => {
      const options = queryClient.getDefaultOptions()
      const retryFn = options.queries?.retry as Function
      
      // Should not retry on 4xx
      expect(retryFn(1, { status: 400 })).toBe(false)
      expect(retryFn(1, { status: 404 })).toBe(false)
      expect(retryFn(1, { status: 499 })).toBe(false)
      
      // Should retry on 5xx (up to 3 times)
      expect(retryFn(1, { status: 500 })).toBe(true)
      expect(retryFn(2, { status: 500 })).toBe(true)
      expect(retryFn(3, { status: 500 })).toBe(false)
    })
  })

  describe('ApiError class', () => {
    it('should create ApiError with all properties', () => {
      const error = new ApiError('Test error', 404, 'NOT_FOUND', { field: 'value' })
      
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.details).toEqual({ field: 'value' })
      expect(error.name).toBe('ApiError')
    })
  })

  describe('apiFetch', () => {
    it('should make authenticated request with session token', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        token: 'test-token'
      }
      vi.mocked(authClient.getSession).mockResolvedValue(mockSession as any)
      
      const mockResponse = { data: { result: 'success' } }
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await apiFetch('/api/test')

      expect(authClient.getSession).toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      )
      expect(result).toEqual({ result: 'success' })
    })

    it('should make unauthenticated request when requireAuth is false', async () => {
      const mockResponse = { data: 'public' }
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      await apiFetch('/api/public', { requireAuth: false })

      expect(authClient.getSession).not.toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/public',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      )
    })

    it('should handle auth session error gracefully', async () => {
      vi.mocked(authClient.getSession).mockRejectedValueOnce(new Error('Auth failed'))
      
      const mockResponse = { data: 'test' }
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      await apiFetch('/api/test')

      expect(console.warn).toHaveBeenCalledWith('Failed to get auth session:', expect.any(Error))
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should use absolute URL when provided', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      } as Response)

      await apiFetch('https://external.api/data', { requireAuth: false })

      expect(global.fetch).toHaveBeenCalledWith(
        'https://external.api/data',
        expect.any(Object)
      )
    })

    it('should merge custom headers', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      } as Response)

      await apiFetch('/api/test', {
        requireAuth: false,
        headers: {
          'X-Custom': 'value',
          'Content-Type': 'text/plain'
        }
      })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'value',
            'Content-Type': 'text/plain' // Custom overrides default
          })
        })
      )
    })

    it('should handle JSON error response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid input', code: 'VALIDATION_ERROR' })
      } as Response)

      try {
        await apiFetch('/api/test', { requireAuth: false })
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).message).toBe('Invalid input')
        expect((error as ApiError).status).toBe(400)
      }
    })

    it('should handle non-JSON error response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Not JSON') }
      } as Response)

      try {
        await apiFetch('/api/test', { requireAuth: false })
      } catch (error) {
        expect((error as ApiError).message).toBe('Internal Server Error')
        expect((error as ApiError).status).toBe(500)
      }
    })

    it('should handle standardized API error response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Operation failed',
          code: 'OP_FAILED'
        })
      } as Response)

      try {
        await apiFetch('/api/test', { requireAuth: false })
      } catch (error) {
        expect((error as ApiError).message).toBe('Operation failed')
        expect((error as ApiError).code).toBe('OP_FAILED')
      }
    })

    it('should return data from data property', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 1, name: 'Test' }
        })
      } as Response)

      const result = await apiFetch('/api/test', { requireAuth: false })
      
      expect(result).toEqual({ id: 1, name: 'Test' })
    })

    it('should return raw response when parseResponse is false', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers()
      }
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as Response)

      const result = await apiFetch('/api/test', { 
        requireAuth: false,
        parseResponse: false 
      })
      
      expect(result).toBe(mockResponse)
    })

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network failure'))

      try {
        await apiFetch('/api/test', { requireAuth: false })
      } catch (error) {
        expect((error as ApiError).message).toBe('Network failure')
        expect((error as ApiError).status).toBe(0)
        expect((error as ApiError).code).toBe('NETWORK_ERROR')
      }
    })

    it('should handle unknown errors', async () => {
      vi.mocked(global.fetch).mockRejectedValue('Unknown error')

      try {
        await apiFetch('/api/test', { requireAuth: false })
      } catch (error) {
        expect((error as ApiError).message).toBe('An unexpected error occurred')
        expect((error as ApiError).code).toBe('UNKNOWN_ERROR')
      }
    })
  })

  describe('Query keys', () => {
    it('should generate correct auth keys', () => {
      expect(queryKeys.auth.all).toEqual(['api', 'auth'])
      expect(queryKeys.auth.session()).toEqual(['api', 'auth', 'session'])
      expect(queryKeys.auth.user()).toEqual(['api', 'auth', 'user'])
    })

    it('should generate correct dashboard keys', () => {
      expect(queryKeys.dashboard.all).toEqual(['api', 'dashboard'])
      expect(queryKeys.dashboard.stats()).toEqual(['api', 'dashboard', 'stats', undefined])
      expect(queryKeys.dashboard.stats({ range: '7d' })).toEqual(['api', 'dashboard', 'stats', { range: '7d' }])
      expect(queryKeys.dashboard.recentSessions()).toEqual(['api', 'dashboard', 'recent-sessions'])
    })

    it('should generate correct customers keys', () => {
      expect(queryKeys.customers.list()).toEqual(['api', 'customers', 'list', undefined])
      expect(queryKeys.customers.list({ search: 'test' })).toEqual(['api', 'customers', 'list', { search: 'test' }])
      expect(queryKeys.customers.detail('123')).toEqual(['api', 'customers', 'detail', '123'])
    })

    it('should generate correct appointments keys', () => {
      expect(queryKeys.appointments.stats({ status: 'pending' })).toEqual(
        ['api', 'appointments', 'stats', { status: 'pending' }]
      )
      expect(queryKeys.appointments.detail('456')).toEqual(['api', 'appointments', 'detail', '456'])
    })

    it('should generate correct media keys', () => {
      expect(queryKeys.media.list({ type: 'image' })).toEqual(
        ['api', 'media', 'list', { type: 'image' }]
      )
    })

    it('should generate correct analytics keys', () => {
      expect(queryKeys.analytics.data({ metric: 'revenue' })).toEqual(
        ['api', 'analytics', 'data', { metric: 'revenue' }]
      )
    })
  })

  describe('Utility functions', () => {
    it('should invalidate queries', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      await invalidateQueries(queryKeys.dashboard.all)
      
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['api', 'dashboard']
      })
    })

    it('should prefetch query', async () => {
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery')
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' })
      
      await prefetchQuery(
        queryKeys.customers.detail('123'),
        fetcher,
        { staleTime: 10000 }
      )
      
      expect(prefetchSpy).toHaveBeenCalledWith({
        queryKey: ['api', 'customers', 'detail', '123'],
        queryFn: fetcher,
        staleTime: 10000
      })
    })
  })
})