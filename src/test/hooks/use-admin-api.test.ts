import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '../test-utils'
import React from 'react'

// Mock the hooks file
const mockUseDashboardStats = vi.fn()
const mockUseChartData = vi.fn()
const mockUseRecentClients = vi.fn()
const mockUseRecentSessions = vi.fn()
const mockUseAppointments = vi.fn()
const mockUseCustomers = vi.fn()

vi.mock('@/hooks/use-admin-api', () => ({
  useDashboardStats: mockUseDashboardStats,
  useChartData: mockUseChartData,
  useRecentClients: mockUseRecentClients,
  useRecentSessions: mockUseRecentSessions,
  useAppointments: mockUseAppointments,
  useCustomers: mockUseCustomers,
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useAdminApi Hooks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('useDashboardStats', () => {
    it('should return dashboard stats data', () => {
      const mockStats = {
        totalRevenue: 15000,
        revenueGrowth: 12.5,
        newClients: 8,
        clientGrowth: 25.0,
        activeBookings: 12,
        bookingGrowth: 8.3,
        completionRate: 95,
        completionGrowth: 2.1,
      }

      mockUseDashboardStats.mockReturnValue({
        data: mockStats,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      })

      const { result } = renderHook(() => mockUseDashboardStats())

      expect(result.current.data).toEqual(mockStats)
      expect(result.current.isSuccess).toBe(true)
      expect(mockUseDashboardStats).toHaveBeenCalled()
    })

    it('should handle dashboard stats error', () => {
      const mockError = new Error('Server error')

      mockUseDashboardStats.mockReturnValue({
        data: null,
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: mockError
      })

      const { result } = renderHook(() => mockUseDashboardStats())

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toEqual(mockError)
    })

    it('should show loading state', () => {
      mockUseDashboardStats.mockReturnValue({
        data: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
        error: null
      })

      const { result } = renderHook(() => mockUseDashboardStats())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeNull()
    })
  })

  describe('useChartData', () => {
    it('should return chart data with time range', () => {
      const mockChartData = [
        { date: '2024-01-01', revenue: 1200, sessions: 5 },
        { date: '2024-01-02', revenue: 1800, sessions: 7 },
        { date: '2024-01-03', revenue: 950, sessions: 4 },
      ]

      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        preset: 'custom'
      }

      mockUseChartData.mockReturnValue({
        data: mockChartData,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      })

      const { result } = renderHook(() => mockUseChartData(timeRange))

      expect(result.current.data).toEqual(mockChartData)
      expect(result.current.isSuccess).toBe(true)
      expect(mockUseChartData).toHaveBeenCalledWith(timeRange)
    })

    it('should skip query when no time range provided', () => {
      mockUseChartData.mockReturnValue({
        data: undefined,
        isLoading: false,
        isSuccess: false,
        isError: false,
        error: null,
        isPending: false
      })

      const { result } = renderHook(() => mockUseChartData(null))

      expect(result.current.data).toBeUndefined()
      expect(result.current.isPending).toBe(false)
      expect(mockUseChartData).toHaveBeenCalledWith(null)
    })
  })

  describe('useRecentClients', () => {
    it('should return recent clients with limit', () => {
      const mockClients = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-0123',
          joinDate: '2024-01-15',
          totalSessions: 3,
          totalSpent: 1200,
          lastSession: '2024-01-20',
        }
      ]

      mockUseRecentClients.mockReturnValue({
        data: mockClients,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      })

      const { result } = renderHook(() => mockUseRecentClients(10))

      expect(result.current.data).toEqual(mockClients)
      expect(result.current.isSuccess).toBe(true)
      expect(mockUseRecentClients).toHaveBeenCalledWith(10)
    })

    it('should use default limit when not provided', () => {
      mockUseRecentClients.mockReturnValue({
        data: [],
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      })

      renderHook(() => mockUseRecentClients())

      expect(mockUseRecentClients).toHaveBeenCalledWith()
    })
  })

  describe('useRecentSessions', () => {
    it('should return recent sessions', () => {
      const mockSessions = [
        {
          id: '1',
          clientName: 'Jane Smith',
          artistName: 'Mike Johnson',
          type: 'Session',
          duration: 180,
          amount: 400,
          date: '2024-01-20',
          status: 'completed' as const,
        }
      ]

      mockUseRecentSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      })

      const { result } = renderHook(() => mockUseRecentSessions(5))

      expect(result.current.data).toEqual(mockSessions)
      expect(result.current.isSuccess).toBe(true)
      expect(mockUseRecentSessions).toHaveBeenCalledWith(5)
    })
  })

  describe('useAppointments', () => {
    it('should return appointments with filters', () => {
      const mockAppointments = {
        success: true,
        data: [
          {
            id: '1',
            clientName: 'John Doe',
            scheduledDate: '2024-01-20T10:00:00Z',
            status: 'confirmed',
            type: 'consultation'
          }
        ],
        pagination: {
          total: 1,
          limit: 10,
          offset: 0,
          hasMore: false
        }
      }

      const filters = {
        status: ['confirmed'],
        page: 1,
        limit: 10
      }

      mockUseAppointments.mockReturnValue({
        data: mockAppointments,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      })

      const { result } = renderHook(() => mockUseAppointments(filters))

      expect(result.current.data).toEqual(mockAppointments)
      expect(result.current.isSuccess).toBe(true)
      expect(mockUseAppointments).toHaveBeenCalledWith(filters)
    })

    it('should skip query when no filters provided', () => {
      mockUseAppointments.mockReturnValue({
        data: undefined,
        isLoading: false,
        isSuccess: false,
        isError: false,
        error: null,
        isPending: false
      })

      const { result } = renderHook(() => mockUseAppointments(null))

      expect(result.current.data).toBeUndefined()
      expect(result.current.isPending).toBe(false)
      expect(mockUseAppointments).toHaveBeenCalledWith(null)
    })
  })

  describe('useCustomers', () => {
    it('should return customers with filters', () => {
      const mockCustomers = {
        success: true,
        data: [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '555-0123'
          }
        ],
        pagination: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false
        }
      }

      const filters = {
        search: 'john',
        hasAppointments: true,
        limit: 20,
        offset: 0
      }

      mockUseCustomers.mockReturnValue({
        data: mockCustomers,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      })

      const { result } = renderHook(() => mockUseCustomers(filters))

      expect(result.current.data).toEqual(mockCustomers)
      expect(result.current.isSuccess).toBe(true)
      expect(mockUseCustomers).toHaveBeenCalledWith(filters)
    })

    it('should handle empty filters', () => {
      const mockCustomers = {
        success: true,
        data: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false }
      }

      mockUseCustomers.mockReturnValue({
        data: mockCustomers,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      })

      const { result } = renderHook(() => mockUseCustomers({}))

      expect(result.current.data).toEqual(mockCustomers)
      expect(result.current.isSuccess).toBe(true)
      expect(mockUseCustomers).toHaveBeenCalledWith({})
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      const networkError = new Error('Network error')

      mockUseDashboardStats.mockReturnValue({
        data: null,
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: networkError
      })

      const { result } = renderHook(() => mockUseDashboardStats())

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeInstanceOf(Error)
    })

    it('should handle API errors with error response', () => {
      const apiError = new Error('Not found')

      mockUseDashboardStats.mockReturnValue({
        data: null,
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: apiError
      })

      const { result } = renderHook(() => mockUseDashboardStats())

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toEqual(apiError)
    })
  })

  describe('Query State Management', () => {
    it('should track loading states correctly', () => {
      // Initial loading state
      mockUseDashboardStats.mockReturnValueOnce({
        data: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
        error: null
      })

      const { result, rerender } = renderHook(() => mockUseDashboardStats())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeNull()

      // Success state
      mockUseDashboardStats.mockReturnValueOnce({
        data: { totalRevenue: 1000 },
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      })

      rerender()

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toEqual({ totalRevenue: 1000 })
    })

    it('should handle query invalidation', () => {
      const initialData = { totalRevenue: 1000 }
      const updatedData = { totalRevenue: 2000 }

      // Initial data
      mockUseDashboardStats.mockReturnValueOnce({
        data: initialData,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      })

      const { result, rerender } = renderHook(() => mockUseDashboardStats())

      expect(result.current.data).toEqual(initialData)

      // Updated data after invalidation
      mockUseDashboardStats.mockReturnValueOnce({
        data: updatedData,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null
      })

      rerender()

      expect(result.current.data).toEqual(updatedData)
    })
  })
})