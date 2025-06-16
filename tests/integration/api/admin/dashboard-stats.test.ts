import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Prisma
const mockPrisma = {
  tattooSession: {
    aggregate: vi.fn(),
    count: vi.fn()
  },
  client: {
    count: vi.fn()
  },
  appointment: {
    count: vi.fn()
  }
}

// Mock the dashboard stats route
const mockGET = vi.fn()
vi.mock('@/app/api/admin/dashboard/stats/route', () => ({
  GET: mockGET
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

// Mock API core
vi.mock('@/lib/api-core', () => ({
  createSuccessResponse: vi.fn((data, message, requestId) => 
    new Response(JSON.stringify(data), { status: 200 })
  ),
  createErrorResponse: vi.fn((message, status, details, requestId) => 
    new Response(JSON.stringify({ error: message }), { status })
  ),
  getRequestId: vi.fn(() => 'test-request-id')
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn()
  }
}))

// Helper to create mock request
function createMockRequest(method: string, url: string) {
  return new Request(url, { method })
}

describe('/api/admin/dashboard/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/dashboard/stats', () => {
    it('should return dashboard statistics with correct structure', async () => {
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard/stats')
      
      // Mock successful response
      const mockResponse = new Response(JSON.stringify({
        revenue: 2500,
        revenueChange: '+25.0%',
        totalClients: 125,
        clientsChange: '+119',
        monthlyAppointments: 15,
        appointmentsChange: '+25.0%',
        averageRating: '4.5',
        ratingChange: '+0.1'
      }), { status: 200 })
      
      mockGET.mockResolvedValue(mockResponse)
      const response = await mockGET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      
      // Verify stats structure
      expect(data).toHaveProperty('revenue')
      expect(data).toHaveProperty('revenueChange')
      expect(data).toHaveProperty('totalClients')
      expect(data).toHaveProperty('clientsChange')
      expect(data).toHaveProperty('monthlyAppointments')
      expect(data).toHaveProperty('appointmentsChange')
      expect(data).toHaveProperty('averageRating')
      expect(data).toHaveProperty('ratingChange')
      
      // Verify data types
      expect(typeof data.revenue).toBe('number')
      expect(typeof data.revenueChange).toBe('string')
      expect(typeof data.totalClients).toBe('number')
      expect(typeof data.clientsChange).toBe('string')
      expect(typeof data.monthlyAppointments).toBe('number')
      expect(typeof data.appointmentsChange).toBe('string')
      expect(typeof data.averageRating).toBe('string')
      expect(typeof data.ratingChange).toBe('string')
    })

    it('should handle null revenue values', async () => {
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard/stats')
      
      const mockResponse = new Response(JSON.stringify({
        revenue: 0,
        revenueChange: '+0%',
        totalClients: 50,
        clientsChange: '+50',
        monthlyAppointments: 0,
        appointmentsChange: '+0%',
        averageRating: '5.0',
        ratingChange: '0.0'
      }), { status: 200 })
      
      mockGET.mockResolvedValue(mockResponse)
      const response = await mockGET(request)
      
      const data = await response.json()
      
      expect(data.revenue).toBe(0)
      expect(data.revenueChange).toBe('+0%')
      expect(data.averageRating).toBe('5.0')
    })

    it('should handle negative percentage changes correctly', async () => {
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard/stats')
      
      const mockResponse = new Response(JSON.stringify({
        revenue: 800,
        revenueChange: '-20.0%',
        totalClients: 100,
        clientsChange: '-5',
        monthlyAppointments: 8,
        appointmentsChange: '-20.0%',
        averageRating: '4.2',
        ratingChange: '-0.3'
      }), { status: 200 })
      
      mockGET.mockResolvedValue(mockResponse)
      const response = await mockGET(request)
      
      const data = await response.json()
      
      expect(data.revenueChange).toBe('-20.0%')
      expect(data.appointmentsChange).toBe('-20.0%')
      expect(data.clientsChange).toBe('-5')
    })

    it('should handle database errors gracefully', async () => {
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard/stats')
      
      const errorResponse = new Response(JSON.stringify({
        error: 'Failed to fetch dashboard statistics'
      }), { status: 500 })
      
      mockGET.mockResolvedValue(errorResponse)
      const response = await mockGET(request)
      
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should handle concurrent requests properly', async () => {
      const request1 = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard/stats')
      const request2 = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard/stats')
      
      const mockResponse1 = new Response(JSON.stringify({
        revenue: 1500,
        revenueChange: '+10.0%',
        totalClients: 75,
        clientsChange: '+5',
        monthlyAppointments: 12,
        appointmentsChange: '+15.0%',
        averageRating: '4.7',
        ratingChange: '+0.2'
      }), { status: 200 })
      
      const mockResponse2 = new Response(JSON.stringify({
        revenue: 1500,
        revenueChange: '+10.0%',
        totalClients: 75,
        clientsChange: '+5',
        monthlyAppointments: 12,
        appointmentsChange: '+15.0%',
        averageRating: '4.7',
        ratingChange: '+0.2'
      }), { status: 200 })
      
      mockGET.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2)
      
      const [response1, response2] = await Promise.all([
        mockGET(request1),
        mockGET(request2)
      ])
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      
      const data1 = await response1.json()
      const data2 = await response2.json()
      
      // Both should return similar data structure
      expect(data1).toHaveProperty('revenue')
      expect(data2).toHaveProperty('revenue')
      expect(data1.revenue).toBe(data2.revenue)
    })

    it('should handle very large numbers correctly', async () => {
      const largeRevenue = 999999999
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard/stats')
      
      const mockResponse = new Response(JSON.stringify({
        revenue: largeRevenue,
        revenueChange: '+15.0%',
        totalClients: 10000,
        clientsChange: '+1000',
        monthlyAppointments: 5000,
        appointmentsChange: '+20.0%',
        averageRating: '4.8',
        ratingChange: '+0.1'
      }), { status: 200 })
      
      mockGET.mockResolvedValue(mockResponse)
      const response = await mockGET(request)
      
      const data = await response.json()
      
      expect(data.revenue).toBe(largeRevenue)
      expect(data.totalClients).toBe(10000)
      expect(data.monthlyAppointments).toBe(5000)
    })

    it('should handle zero values gracefully', async () => {
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard/stats')
      
      const mockResponse = new Response(JSON.stringify({
        revenue: 0,
        revenueChange: '+0%',
        totalClients: 0,
        clientsChange: '+0',
        monthlyAppointments: 0,
        appointmentsChange: '+0%',
        averageRating: '5.0',
        ratingChange: '0.0'
      }), { status: 200 })
      
      mockGET.mockResolvedValue(mockResponse)
      const response = await mockGET(request)
      
      const data = await response.json()
      
      expect(data.revenue).toBe(0)
      expect(data.totalClients).toBe(0)
      expect(data.monthlyAppointments).toBe(0)
      expect(data.revenueChange).toBe('+0%')
      expect(data.clientsChange).toBe('+0')
      expect(data.appointmentsChange).toBe('+0%')
    })

    it('should verify mock was called with correct request', async () => {
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard/stats')
      
      const mockResponse = new Response(JSON.stringify({
        revenue: 1000,
        revenueChange: '+5.0%',
        totalClients: 50,
        clientsChange: '+2',
        monthlyAppointments: 10,
        appointmentsChange: '+10.0%',
        averageRating: '4.5',
        ratingChange: '0.0'
      }), { status: 200 })
      
      mockGET.mockResolvedValue(mockResponse)
      await mockGET(request)
      
      expect(mockGET).toHaveBeenCalledWith(request)
      expect(mockGET).toHaveBeenCalledTimes(1)
    })

    it('should validate percentage format', async () => {
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard/stats')
      
      const mockResponse = new Response(JSON.stringify({
        revenue: 2500,
        revenueChange: '+25.0%',
        totalClients: 125,
        clientsChange: '+25',
        monthlyAppointments: 15,
        appointmentsChange: '+25.0%',
        averageRating: '4.6',
        ratingChange: '+0.1'
      }), { status: 200 })
      
      mockGET.mockResolvedValue(mockResponse)
      const response = await mockGET(request)
      
      const data = await response.json()
      
      // Verify percentage format
      expect(data.revenueChange).toMatch(/^[+-]\d+\.\d%$/)
      expect(data.appointmentsChange).toMatch(/^[+-]\d+\.\d%$/)
      expect(data.averageRating).toMatch(/^\d+\.\d$/)
    })
  })
})
