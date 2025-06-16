import { describe, it, expect } from 'vitest'
import type {
  DashboardStats,
  ChartDataPoint,
  RecentSession,
  RecentClient,
  AppointmentData,
  DashboardData
} from '@/types/dashboard'

describe('Dashboard Types', () => {
  describe('DashboardStats Interface', () => {
    it('should define complete dashboard statistics structure', () => {
      const dashboardStats: DashboardStats = {
        totalRevenue: 50000,
        revenueGrowth: 0.15,
        newClients: 25,
        clientGrowth: 0.08,
        activeBookings: 12,
        bookingGrowth: 0.12,
        completionRate: 0.95,
        completionGrowth: 0.02
      }

      expect(dashboardStats.totalRevenue).toBe(50000)
      expect(dashboardStats.revenueGrowth).toBe(0.15)
      expect(dashboardStats.newClients).toBe(25)
      expect(dashboardStats.clientGrowth).toBe(0.08)
      expect(dashboardStats.activeBookings).toBe(12)
      expect(dashboardStats.bookingGrowth).toBe(0.12)
      expect(dashboardStats.completionRate).toBe(0.95)
      expect(dashboardStats.completionGrowth).toBe(0.02)
    })

    it('should handle zero values', () => {
      const zeroStats: DashboardStats = {
        totalRevenue: 0,
        revenueGrowth: 0,
        newClients: 0,
        clientGrowth: 0,
        activeBookings: 0,
        bookingGrowth: 0,
        completionRate: 0,
        completionGrowth: 0
      }

      expect(zeroStats.totalRevenue).toBe(0)
      expect(zeroStats.revenueGrowth).toBe(0)
      expect(zeroStats.completionRate).toBe(0)
    })

    it('should handle negative growth values', () => {
      const negativeGrowthStats: DashboardStats = {
        totalRevenue: 45000,
        revenueGrowth: -0.10,
        newClients: 20,
        clientGrowth: -0.05,
        activeBookings: 10,
        bookingGrowth: -0.15,
        completionRate: 0.90,
        completionGrowth: -0.03
      }

      expect(negativeGrowthStats.revenueGrowth).toBe(-0.10)
      expect(negativeGrowthStats.clientGrowth).toBe(-0.05)
      expect(negativeGrowthStats.bookingGrowth).toBe(-0.15)
      expect(negativeGrowthStats.completionGrowth).toBe(-0.03)
    })

    it('should handle large revenue values', () => {
      const largeRevenueStats: DashboardStats = {
        totalRevenue: 1000000,
        revenueGrowth: 2.5,
        newClients: 500,
        clientGrowth: 1.2,
        activeBookings: 150,
        bookingGrowth: 0.8,
        completionRate: 0.98,
        completionGrowth: 0.1
      }

      expect(largeRevenueStats.totalRevenue).toBe(1000000)
      expect(largeRevenueStats.newClients).toBe(500)
      expect(largeRevenueStats.activeBookings).toBe(150)
    })

    it('should handle decimal completion rates', () => {
      const preciseStats: DashboardStats = {
        totalRevenue: 25000,
        revenueGrowth: 0.1234,
        newClients: 15,
        clientGrowth: 0.0567,
        activeBookings: 8,
        bookingGrowth: 0.0891,
        completionRate: 0.9876,
        completionGrowth: 0.0123
      }

      expect(preciseStats.completionRate).toBe(0.9876)
      expect(preciseStats.revenueGrowth).toBe(0.1234)
      expect(preciseStats.completionGrowth).toBe(0.0123)
    })
  })

  describe('ChartDataPoint Interface', () => {
    it('should define chart data point structure', () => {
      const chartPoint: ChartDataPoint = {
        date: '2024-01-15',
        revenue: 2500,
        sessions: 8
      }

      expect(chartPoint.date).toBe('2024-01-15')
      expect(chartPoint.revenue).toBe(2500)
      expect(chartPoint.sessions).toBe(8)
      expect(typeof chartPoint.date).toBe('string')
      expect(typeof chartPoint.revenue).toBe('number')
      expect(typeof chartPoint.sessions).toBe('number')
    })

    it('should handle zero revenue and sessions', () => {
      const zeroPoint: ChartDataPoint = {
        date: '2024-01-01',
        revenue: 0,
        sessions: 0
      }

      expect(zeroPoint.revenue).toBe(0)
      expect(zeroPoint.sessions).toBe(0)
    })

    it('should handle different date formats', () => {
      const dateFormats: ChartDataPoint[] = [
        { date: '2024-01-15', revenue: 1000, sessions: 4 },
        { date: '2024/01/15', revenue: 1500, sessions: 5 },
        { date: 'Jan 15, 2024', revenue: 2000, sessions: 6 },
        { date: '2024-01-15T10:00:00Z', revenue: 2500, sessions: 7 }
      ]

      dateFormats.forEach(point => {
        expect(typeof point.date).toBe('string')
        expect(point.date.length).toBeGreaterThan(0)
      })
    })

    it('should support large revenue values in chart data', () => {
      const highRevenuePoint: ChartDataPoint = {
        date: '2024-12-31',
        revenue: 50000,
        sessions: 100
      }

      expect(highRevenuePoint.revenue).toBe(50000)
      expect(highRevenuePoint.sessions).toBe(100)
    })

    it('should support decimal revenue values', () => {
      const decimalRevenuePoint: ChartDataPoint = {
        date: '2024-06-15',
        revenue: 1250.75,
        sessions: 5
      }

      expect(decimalRevenuePoint.revenue).toBe(1250.75)
    })
  })

  describe('RecentSession Interface', () => {
    it('should define recent session structure', () => {
      const recentSession: RecentSession = {
        id: 'session-123',
        clientName: 'John Doe',
        artistName: 'Jane Artist',
        type: 'Traditional Tattoo',
        duration: 240,
        amount: 800,
        date: '2024-01-15',
        status: 'completed'
      }

      expect(recentSession.id).toBe('session-123')
      expect(recentSession.clientName).toBe('John Doe')
      expect(recentSession.artistName).toBe('Jane Artist')
      expect(recentSession.type).toBe('Traditional Tattoo')
      expect(recentSession.duration).toBe(240)
      expect(recentSession.amount).toBe(800)
      expect(recentSession.date).toBe('2024-01-15')
      expect(recentSession.status).toBe('completed')
    })

    it('should support all session statuses', () => {
      const statuses: Array<'completed' | 'in-progress' | 'scheduled'> = [
        'completed',
        'in-progress',
        'scheduled'
      ]

      statuses.forEach(status => {
        const session: RecentSession = {
          id: `session-${status}`,
          clientName: 'Test Client',
          artistName: 'Test Artist',
          type: 'Test Tattoo',
          duration: 180,
          amount: 500,
          date: '2024-01-15',
          status
        }

        expect(session.status).toBe(status)
      })
    })

    it('should handle different session types', () => {
      const sessionTypes = [
        'Traditional Tattoo',
        'Realism Tattoo',
        'Blackwork',
        'Color Tattoo',
        'Touch-up',
        'Consultation',
        'Piercing'
      ]

      sessionTypes.forEach(type => {
        const session: RecentSession = {
          id: `session-${type.toLowerCase().replace(/\s+/g, '-')}`,
          clientName: 'Client Name',
          artistName: 'Artist Name',
          type,
          duration: 120,
          amount: 400,
          date: '2024-01-15',
          status: 'completed'
        }

        expect(session.type).toBe(type)
      })
    })

    it('should handle various duration and amount values', () => {
      const sessions: RecentSession[] = [
        {
          id: 'short-session',
          clientName: 'Quick Client',
          artistName: 'Fast Artist',
          type: 'Small Tattoo',
          duration: 60,
          amount: 200,
          date: '2024-01-15',
          status: 'completed'
        },
        {
          id: 'long-session',
          clientName: 'Patient Client',
          artistName: 'Detailed Artist',
          type: 'Full Sleeve',
          duration: 480,
          amount: 2000,
          date: '2024-01-16',
          status: 'in-progress'
        },
        {
          id: 'consultation',
          clientName: 'New Client',
          artistName: 'Consultant Artist',
          type: 'Consultation',
          duration: 30,
          amount: 50,
          date: '2024-01-17',
          status: 'scheduled'
        }
      ]

      expect(sessions[0].duration).toBe(60)
      expect(sessions[0].amount).toBe(200)
      expect(sessions[1].duration).toBe(480)
      expect(sessions[1].amount).toBe(2000)
      expect(sessions[2].duration).toBe(30)
      expect(sessions[2].amount).toBe(50)
    })

    it('should handle decimal amounts', () => {
      const sessionWithDecimal: RecentSession = {
        id: 'decimal-session',
        clientName: 'Precise Client',
        artistName: 'Precise Artist',
        type: 'Custom Design',
        duration: 150,
        amount: 750.50,
        date: '2024-01-15',
        status: 'completed'
      }

      expect(sessionWithDecimal.amount).toBe(750.50)
    })
  })

  describe('RecentClient Interface', () => {
    it('should define recent client structure', () => {
      const recentClient: RecentClient = {
        id: 'client-123',
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1234567890',
        joinDate: '2024-01-10',
        totalSessions: 5,
        totalSpent: 2500,
        lastSession: '2024-01-15'
      }

      expect(recentClient.id).toBe('client-123')
      expect(recentClient.name).toBe('John Smith')
      expect(recentClient.email).toBe('john.smith@example.com')
      expect(recentClient.phone).toBe('+1234567890')
      expect(recentClient.joinDate).toBe('2024-01-10')
      expect(recentClient.totalSessions).toBe(5)
      expect(recentClient.totalSpent).toBe(2500)
      expect(recentClient.lastSession).toBe('2024-01-15')
    })

    it('should handle client without phone or last session', () => {
      const minimalClient: RecentClient = {
        id: 'minimal-client',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        joinDate: '2024-01-01',
        totalSessions: 0,
        totalSpent: 0
      }

      expect(minimalClient.phone).toBeUndefined()
      expect(minimalClient.lastSession).toBeUndefined()
      expect(minimalClient.totalSessions).toBe(0)
      expect(minimalClient.totalSpent).toBe(0)
    })

    it('should handle various email formats', () => {
      const emailFormats = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example-domain.co.uk',
        'test.email@subdomain.example.org'
      ]

      emailFormats.forEach((email, index) => {
        const client: RecentClient = {
          id: `client-${index}`,
          name: `Client ${index}`,
          email,
          joinDate: '2024-01-01',
          totalSessions: 1,
          totalSpent: 500
        }

        expect(client.email).toBe(email)
        expect(client.email).toContain('@')
      })
    })

    it('should handle different phone number formats', () => {
      const phoneFormats = [
        '+1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '123.456.7890',
        '+1 (123) 456-7890'
      ]

      phoneFormats.forEach((phone, index) => {
        const client: RecentClient = {
          id: `client-phone-${index}`,
          name: `Phone Client ${index}`,
          email: `phone${index}@example.com`,
          phone,
          joinDate: '2024-01-01',
          totalSessions: 1,
          totalSpent: 300
        }

        expect(client.phone).toBe(phone)
      })
    })

    it('should handle high-value clients', () => {
      const highValueClient: RecentClient = {
        id: 'vip-client',
        name: 'VIP Customer',
        email: 'vip@example.com',
        phone: '+1555000000',
        joinDate: '2023-01-01',
        totalSessions: 25,
        totalSpent: 15000,
        lastSession: '2024-01-15'
      }

      expect(highValueClient.totalSessions).toBe(25)
      expect(highValueClient.totalSpent).toBe(15000)
    })

    it('should handle new clients with minimal data', () => {
      const newClient: RecentClient = {
        id: 'new-client',
        name: 'Brand New Client',
        email: 'new@example.com',
        joinDate: '2024-01-20',
        totalSessions: 0,
        totalSpent: 0
      }

      expect(newClient.totalSessions).toBe(0)
      expect(newClient.totalSpent).toBe(0)
      expect(newClient.lastSession).toBeUndefined()
    })
  })

  describe('AppointmentData Interface', () => {
    it('should define appointment data structure', () => {
      const appointmentData: AppointmentData = {
        id: 1,
        header: 'Tattoo Consultation',
        type: 'consultation',
        status: 'scheduled',
        target: 'client-123',
        limit: '60 minutes',
        reviewer: 'artist-456'
      }

      expect(appointmentData.id).toBe(1)
      expect(appointmentData.header).toBe('Tattoo Consultation')
      expect(appointmentData.type).toBe('consultation')
      expect(appointmentData.status).toBe('scheduled')
      expect(appointmentData.target).toBe('client-123')
      expect(appointmentData.limit).toBe('60 minutes')
      expect(appointmentData.reviewer).toBe('artist-456')
    })

    it('should handle different appointment types', () => {
      const appointmentTypes = [
        'consultation',
        'tattoo-session',
        'touch-up',
        'piercing',
        'removal'
      ]

      appointmentTypes.forEach((type, index) => {
        const appointment: AppointmentData = {
          id: index + 1,
          header: `${type} appointment`,
          type,
          status: 'scheduled',
          target: `client-${index}`,
          limit: '120 minutes',
          reviewer: `artist-${index}`
        }

        expect(appointment.type).toBe(type)
        expect(appointment.id).toBe(index + 1)
      })
    })

    it('should handle different appointment statuses', () => {
      const statuses = [
        'scheduled',
        'confirmed',
        'in-progress',
        'completed',
        'cancelled',
        'no-show'
      ]

      statuses.forEach((status, index) => {
        const appointment: AppointmentData = {
          id: index + 10,
          header: `Appointment ${index}`,
          type: 'tattoo-session',
          status,
          target: `client-${index}`,
          limit: '180 minutes',
          reviewer: `artist-${index}`
        }

        expect(appointment.status).toBe(status)
      })
    })

    it('should handle various time limits', () => {
      const timeLimits = [
        '30 minutes',
        '1 hour',
        '2 hours',
        '4 hours',
        '6 hours',
        'all day'
      ]

      timeLimits.forEach((limit, index) => {
        const appointment: AppointmentData = {
          id: index + 20,
          header: `Long Session ${index}`,
          type: 'tattoo-session',
          status: 'scheduled',
          target: `client-${index}`,
          limit,
          reviewer: `artist-${index}`
        }

        expect(appointment.limit).toBe(limit)
      })
    })
  })

  describe('DashboardData Interface', () => {
    it('should define complete dashboard data structure', () => {
      const dashboardData: DashboardData = {
        stats: {
          totalRevenue: 75000,
          revenueGrowth: 0.20,
          newClients: 30,
          clientGrowth: 0.15,
          activeBookings: 18,
          bookingGrowth: 0.10,
          completionRate: 0.92,
          completionGrowth: 0.03
        },
        chartData: [
          { date: '2024-01-01', revenue: 2000, sessions: 6 },
          { date: '2024-01-02', revenue: 2500, sessions: 8 },
          { date: '2024-01-03', revenue: 1800, sessions: 5 }
        ],
        recentSessions: [
          {
            id: 'session-1',
            clientName: 'Alice Johnson',
            artistName: 'Bob Artist',
            type: 'Color Tattoo',
            duration: 180,
            amount: 900,
            date: '2024-01-15',
            status: 'completed'
          }
        ],
        recentClients: [
          {
            id: 'client-1',
            name: 'Charlie Brown',
            email: 'charlie@example.com',
            joinDate: '2024-01-10',
            totalSessions: 3,
            totalSpent: 1500
          }
        ],
        appointments: [
          {
            id: 1,
            header: 'Full Sleeve Session',
            type: 'tattoo-session',
            status: 'confirmed',
            target: 'client-1',
            limit: '4 hours',
            reviewer: 'artist-1'
          }
        ]
      }

      expect(dashboardData.stats.totalRevenue).toBe(75000)
      expect(dashboardData.chartData).toHaveLength(3)
      expect(dashboardData.recentSessions).toHaveLength(1)
      expect(dashboardData.recentClients).toHaveLength(1)
      expect(dashboardData.appointments).toHaveLength(1)
    })

    it('should handle empty dashboard data', () => {
      const emptyDashboard: DashboardData = {
        stats: {
          totalRevenue: 0,
          revenueGrowth: 0,
          newClients: 0,
          clientGrowth: 0,
          activeBookings: 0,
          bookingGrowth: 0,
          completionRate: 0,
          completionGrowth: 0
        },
        chartData: [],
        recentSessions: [],
        recentClients: [],
        appointments: []
      }

      expect(emptyDashboard.stats.totalRevenue).toBe(0)
      expect(emptyDashboard.chartData).toHaveLength(0)
      expect(emptyDashboard.recentSessions).toHaveLength(0)
      expect(emptyDashboard.recentClients).toHaveLength(0)
      expect(emptyDashboard.appointments).toHaveLength(0)
    })

    it('should handle large dataset dashboard', () => {
      const chartData: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        sessions: Math.floor(Math.random() * 20) + 1
      }))

      const recentSessions: RecentSession[] = Array.from({ length: 10 }, (_, i) => ({
        id: `session-${i}`,
        clientName: `Client ${i}`,
        artistName: `Artist ${i}`,
        type: 'Various',
        duration: 120,
        amount: 600,
        date: '2024-01-15',
        status: 'completed'
      }))

      const largeDashboard: DashboardData = {
        stats: {
          totalRevenue: 100000,
          revenueGrowth: 0.25,
          newClients: 50,
          clientGrowth: 0.20,
          activeBookings: 25,
          bookingGrowth: 0.15,
          completionRate: 0.96,
          completionGrowth: 0.05
        },
        chartData,
        recentSessions,
        recentClients: [],
        appointments: []
      }

      expect(largeDashboard.chartData).toHaveLength(30)
      expect(largeDashboard.recentSessions).toHaveLength(10)
    })
  })

  describe('Type Safety and Validation', () => {
    it('should enforce number types for statistics', () => {
      const stats: DashboardStats = {
        totalRevenue: 25000,
        revenueGrowth: 0.1,
        newClients: 15,
        clientGrowth: 0.05,
        activeBookings: 8,
        bookingGrowth: 0.03,
        completionRate: 0.94,
        completionGrowth: 0.01
      }

      expect(typeof stats.totalRevenue).toBe('number')
      expect(typeof stats.revenueGrowth).toBe('number')
      expect(typeof stats.newClients).toBe('number')
      expect(typeof stats.completionRate).toBe('number')
    })

    it('should enforce string types for identifiers and names', () => {
      const session: RecentSession = {
        id: 'string-id',
        clientName: 'String Name',
        artistName: 'String Artist',
        type: 'String Type',
        duration: 120,
        amount: 500,
        date: 'string-date',
        status: 'completed'
      }

      expect(typeof session.id).toBe('string')
      expect(typeof session.clientName).toBe('string')
      expect(typeof session.artistName).toBe('string')
      expect(typeof session.type).toBe('string')
      expect(typeof session.date).toBe('string')
    })

    it('should enforce array types for dashboard collections', () => {
      const dashboard: DashboardData = {
        stats: {
          totalRevenue: 0,
          revenueGrowth: 0,
          newClients: 0,
          clientGrowth: 0,
          activeBookings: 0,
          bookingGrowth: 0,
          completionRate: 0,
          completionGrowth: 0
        },
        chartData: [],
        recentSessions: [],
        recentClients: [],
        appointments: []
      }

      expect(Array.isArray(dashboard.chartData)).toBe(true)
      expect(Array.isArray(dashboard.recentSessions)).toBe(true)
      expect(Array.isArray(dashboard.recentClients)).toBe(true)
      expect(Array.isArray(dashboard.appointments)).toBe(true)
    })
  })
})