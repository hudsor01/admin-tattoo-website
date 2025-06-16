import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/admin/dashboard/route'
import { 
  createMockRequest, 
  resetMocks, 
  setupDefaultMocks, 
  setupAuthFailure, 
  setupNonAdminUser, 
  setupUnverifiedAdmin,
  setupDatabaseFailure,
  mockPrisma,
  mockAuth,
  mockClients,
  mockTattooSessions,
  mockAppointments
} from '../test-utils'

// Mock the dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/authorization', () => ({
  isVerifiedAdmin: vi.fn((user) => user?.role === 'admin' && user?.emailVerified === true),
  toBetterAuthUser: vi.fn((user) => user),
}))

describe('/api/admin/dashboard', () => {
  beforeEach(() => {
    resetMocks()
    setupDefaultMocks()
  })

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard data for authenticated admin', async () => {
      // Setup specific mock data for dashboard aggregation
      mockPrisma.tattooSession.aggregate
        .mockResolvedValueOnce({ _sum: { totalCost: 1500 } }) // current month
        .mockResolvedValueOnce({ _sum: { totalCost: 1200 } }) // last month
      
      mockPrisma.client.count
        .mockResolvedValueOnce(5) // current month new clients
        .mockResolvedValueOnce(150) // total clients
        .mockResolvedValueOnce(3) // last month new clients
      
      mockPrisma.appointment.count
        .mockResolvedValueOnce(12) // current month appointments
        .mockResolvedValueOnce(8) // last month appointments
      
      // Mock recent data
      mockPrisma.client.findMany.mockResolvedValueOnce(mockClients.slice(0, 5))
      mockPrisma.tattooSession.findMany
        .mockResolvedValueOnce(mockTattooSessions.slice(0, 10)) // recent sessions
        .mockResolvedValueOnce([]) // chart data sessions
      
      mockPrisma.appointment.findMany.mockResolvedValueOnce([]) // chart data appointments

      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('stats')
      expect(data).toHaveProperty('recentClients')
      expect(data).toHaveProperty('chartData')
      expect(data).toHaveProperty('recentSessions')
      
      // Verify stats structure
      expect(data.stats).toHaveProperty('revenue')
      expect(data.stats).toHaveProperty('revenueChange')
      expect(data.stats).toHaveProperty('totalClients')
      expect(data.stats).toHaveProperty('clientsChange')
      expect(data.stats).toHaveProperty('monthlyAppointments')
      expect(data.stats).toHaveProperty('appointmentsChange')
      expect(data.stats).toHaveProperty('averageRating')
      expect(data.stats).toHaveProperty('ratingChange')
      
      // Verify calculations
      expect(data.stats.revenue).toBe(1500)
      expect(data.stats.totalClients).toBe(150)
      expect(data.stats.monthlyAppointments).toBe(12)
    })

    it('should return 401 for unauthenticated requests', async () => {
      setupAuthFailure()
      
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Unauthorized')
    })

    it('should return 403 for non-admin users', async () => {
      setupNonAdminUser()
      
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard')
      const response = await GET(request)
      
      expect(response.status).toBe(403)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Admin access required')
    })

    it('should return 403 for unverified admin users', async () => {
      setupUnverifiedAdmin()
      
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard')
      const response = await GET(request)
      
      expect(response.status).toBe(403)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Admin access required')
    })

    it('should handle database errors gracefully', async () => {
      setupDatabaseFailure()
      
      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard')
      const response = await GET(request)
      
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Failed to fetch dashboard data')
    })

    it('should calculate percentage changes correctly', async () => {
      // Setup specific values for percentage calculations
      mockPrisma.tattooSession.aggregate
        .mockResolvedValueOnce({ _sum: { totalCost: 1200 } }) // current: $1200
        .mockResolvedValueOnce({ _sum: { totalCost: 1000 } }) // last: $1000 = +20%
      
      mockPrisma.client.count
        .mockResolvedValueOnce(8) // current month: 8 new clients
        .mockResolvedValueOnce(100) // total clients
        .mockResolvedValueOnce(5) // last month: 5 new clients = +60%
      
      mockPrisma.appointment.count
        .mockResolvedValueOnce(15) // current: 15 appointments
        .mockResolvedValueOnce(10) // last: 10 appointments = +50%
      
      // Mock other required data
      mockPrisma.client.findMany.mockResolvedValueOnce([])
      mockPrisma.tattooSession.findMany.mockResolvedValue([])
      mockPrisma.appointment.findMany.mockResolvedValueOnce([])

      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard')
      const response = await GET(request)
      
      const data = await response.json()
      
      expect(data.stats.revenueChange).toBe('+20.0%')
      expect(data.stats.clientsChange).toBe('+60')
      expect(data.stats.appointmentsChange).toBe('+50.0%')
    })

    it('should handle zero division in percentage calculations', async () => {
      // Setup zero values for last month to test division by zero handling
      mockPrisma.tattooSession.aggregate
        .mockResolvedValueOnce({ _sum: { totalCost: 1000 } }) // current
        .mockResolvedValueOnce({ _sum: { totalCost: null } }) // last: null
      
      mockPrisma.client.count
        .mockResolvedValueOnce(5) // current
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(0) // last: 0
      
      mockPrisma.appointment.count
        .mockResolvedValueOnce(10) // current
        .mockResolvedValueOnce(0) // last: 0
      
      // Mock other required data
      mockPrisma.client.findMany.mockResolvedValueOnce([])
      mockPrisma.tattooSession.findMany.mockResolvedValue([])
      mockPrisma.appointment.findMany.mockResolvedValueOnce([])

      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard')
      const response = await GET(request)
      
      const data = await response.json()
      
      // Should handle division by zero gracefully
      expect(data.stats.revenueChange).toBe('0.0%')
      expect(data.stats.appointmentsChange).toBe('0%')
    })

    it('should return properly formatted recent clients data', async () => {
      const mockRecentClients = [
        {
          id: 'client-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          sessions: [{ style: 'Traditional', totalCost: 500 }]
        },
        {
          id: 'client-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          sessions: []
        }
      ]
      
      mockPrisma.client.findMany.mockResolvedValueOnce(mockRecentClients)
      mockPrisma.tattooSession.findMany.mockResolvedValue([])
      mockPrisma.appointment.findMany.mockResolvedValueOnce([])

      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard')
      const response = await GET(request)
      
      const data = await response.json()
      
      expect(data.recentClients).toHaveLength(2)
      expect(data.recentClients[0]).toEqual({
        id: 'client-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        lastSessionType: 'Traditional',
        lastPayment: 500
      })
      expect(data.recentClients[1]).toEqual({
        id: 'client-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        lastSessionType: null,
        lastPayment: null
      })
    })

    it('should return chart data for the last 30 days', async () => {
      // Mock sessions and appointments for chart data
      const chartSessions = [
        {
          appointmentDate: new Date('2024-01-15'),
          totalCost: 500
        },
        {
          appointmentDate: new Date('2024-01-16'),
          totalCost: 750
        }
      ]
      
      const chartAppointments = [
        { scheduledDate: new Date('2024-01-15') },
        { scheduledDate: new Date('2024-01-15') },
        { scheduledDate: new Date('2024-01-16') }
      ]
      
      mockPrisma.client.findMany.mockResolvedValueOnce([])
      mockPrisma.tattooSession.findMany
        .mockResolvedValueOnce([]) // recent sessions call
        .mockResolvedValueOnce(chartSessions) // chart data call
      mockPrisma.appointment.findMany.mockResolvedValueOnce(chartAppointments)

      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard')
      const response = await GET(request)
      
      const data = await response.json()
      
      expect(data.chartData).toBeInstanceOf(Array)
      expect(data.chartData).toHaveLength(30) // 30 days of data
      
      // Check that each day has the required structure
      data.chartData.forEach((day: any) => {
        expect(day).toHaveProperty('date')
        expect(day).toHaveProperty('revenue')
        expect(day).toHaveProperty('appointments')
        expect(typeof day.revenue).toBe('number')
        expect(typeof day.appointments).toBe('number')
      })
    })

    it('should calculate satisfaction rating based on completion rate', async () => {
      // Mock satisfaction rating calculation
      mockPrisma.tattooSession.count
        .mockResolvedValueOnce(8) // completed sessions
        .mockResolvedValueOnce(10) // total sessions
        .mockResolvedValueOnce(6) // this month completed
        .mockResolvedValueOnce(8) // this month total
        .mockResolvedValueOnce(4) // last month completed
        .mockResolvedValueOnce(5) // last month total
      
      // Mock other required data
      mockPrisma.client.findMany.mockResolvedValueOnce([])
      mockPrisma.tattooSession.findMany.mockResolvedValue([])
      mockPrisma.appointment.findMany.mockResolvedValueOnce([])

      const request = createMockRequest('GET', 'http://localhost:3001/api/admin/dashboard')
      const response = await GET(request)
      
      const data = await response.json()
      
      expect(data.stats.averageRating).toBeDefined()
      expect(data.stats.ratingChange).toBeDefined()
      
      // Rating should be between 3.0 and 5.0 based on completion rate
      const rating = parseFloat(data.stats.averageRating)
      expect(rating).toBeGreaterThanOrEqual(3.0)
      expect(rating).toBeLessThanOrEqual(5.0)
    })
  })
})