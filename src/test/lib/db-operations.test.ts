import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getDashboardStats,
  getRecentAppointments
} from '@/lib/db-operations'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn(() => ({
    client: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    appointment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    tattooSession: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn()
    },
    tattooArtist: {
      findFirst: vi.fn()
    }
  }))
}))

// Mock API core
vi.mock('@/lib/api-core', () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string, public status: number) {
      super(message)
      this.name = 'ApiError'
    }
  }
}))

// Mock repository utils
vi.mock('@/lib/repository-utils', () => ({
  withCache: vi.fn((fn) => fn),
  CACHE_TTL: {
    DASHBOARD_STATS: 300000,
    RECENT_APPOINTMENTS: 60000
  }
}))

// Mock data
const mockClient = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-1234',
  dateOfBirth: new Date('1985-05-15'),
  emergencyName: 'Jane Doe',
  emergencyPhone: '555-5678',
  emergencyRel: 'Spouse',
  allergies: ['latex'],
  medicalConds: [],
  preferredArtist: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  _count: {
    appointments: 2,
    sessions: 1
  }
}

const mockAppointment = {
  id: '1',
  clientId: '1',
  artistId: '1',
  scheduledDate: new Date('2024-03-15T10:00:00Z'),
  duration: 180,
  status: 'SCHEDULED',
  type: 'SESSION',
  notes: 'First session',
  reminderSent: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  client: {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-1234'
  },
  artist: {
    id: '1',
    name: 'Fernando Govea',
    email: 'fernando@ink37tattoos.com'
  }
}

describe('Database Operations', () => {
  let mockPrisma: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { getPrismaClient } = await import('@/lib/prisma')
    mockPrisma = getPrismaClient()
  })

  describe('Customer Operations', () => {
    describe('getCustomers', () => {
      it('should fetch customers with pagination', async () => {
        const mockCustomers = [mockClient]
        mockPrisma.client.findMany.mockResolvedValue(mockCustomers)
        mockPrisma.client.count.mockResolvedValue(25)

        const result = await getCustomers({ 
          limit: 10, 
          offset: 0 
        })

        expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
          where: {},
          select: expect.objectContaining({
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }),
          orderBy: [
            { createdAt: 'desc' },
            { id: 'desc' }
          ],
          take: 10,
          skip: 0
        })

        expect(result).toEqual({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: '1',
              firstName: 'John',
              lastName: 'Doe'
            })
          ]),
          pagination: {
            total: 25,
            limit: 10,
            offset: 0,
            hasMore: true
          }
        })
      })

      it('should handle search filtering', async () => {
        mockPrisma.client.findMany.mockResolvedValue([mockClient])
        mockPrisma.client.count.mockResolvedValue(1)

        await getCustomers({ 
          limit: 10, 
          offset: 0, 
          search: 'john'
        })

        expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
          where: {
            OR: [
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
              { phone: { contains: 'john', mode: 'insensitive' } }
            ]
          },
          select: expect.any(Object),
          orderBy: expect.any(Array),
          take: 10,
          skip: 0
        })
      })

      it('should handle database errors', async () => {
        mockPrisma.client.findMany.mockRejectedValue(new Error('DB Error'))

        await expect(getCustomers({ limit: 10, offset: 0 }))
          .rejects.toThrow('Failed to fetch customers')
      })
    })

    describe('getCustomerById', () => {
      it('should fetch single customer with relations', async () => {
        const fullClient = {
          ...mockClient,
          appointments: [mockAppointment],
          sessions: []
        }
        mockPrisma.client.findUnique.mockResolvedValue(fullClient)

        const result = await getCustomerById('1')

        expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
          where: { id: '1' },
          include: {
            appointments: {
              include: {
                artist: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              },
              orderBy: { scheduledDate: 'desc' }
            },
            sessions: {
              include: {
                artist: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              },
              orderBy: { appointmentDate: 'desc' }
            },
            _count: {
              select: {
                appointments: true,
                sessions: true
              }
            }
          }
        })

        expect(result).toEqual(expect.objectContaining({
          id: '1',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe'
        }))
      })

      it('should return null for non-existent customer', async () => {
        mockPrisma.client.findUnique.mockResolvedValue(null)

        await expect(getCustomerById('999')).rejects.toThrow('Customer not found')
      })
    })

    describe('createCustomer', () => {
      it('should create customer successfully', async () => {
        const customerData = {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '555-5678',
          dateOfBirth: new Date('1990-08-20')
        }

        mockPrisma.client.create.mockResolvedValue({
          ...mockClient,
          ...customerData
        })

        const result = await createCustomer(customerData)

        expect(mockPrisma.client.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com'
          }),
          include: {
            _count: {
              select: {
                appointments: true,
                sessions: true
              }
            }
          }
        })

        expect(result).toEqual(expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith'
        }))
      })

      it('should handle database errors', async () => {
        mockPrisma.client.create.mockRejectedValue(new Error('DB Error'))

        await expect(createCustomer({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com'
        })).rejects.toThrow('Failed to create customer')
      })
    })

    describe('updateCustomer', () => {
      it('should update customer successfully', async () => {
        const updateData = {
          firstName: 'John Updated',
          phone: '555-9999'
        }

        mockPrisma.client.update.mockResolvedValue({
          ...mockClient,
          ...updateData
        })

        const result = await updateCustomer('1', updateData)

        expect(mockPrisma.client.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: expect.objectContaining({
            firstName: 'John Updated',
            phone: '555-9999'
          }),
          include: {
            _count: {
              select: {
                appointments: true,
                sessions: true
              }
            }
          }
        })

        expect(result).toEqual(expect.objectContaining(updateData))
      })
    })

    describe('deleteCustomer', () => {
      it('should delete customer after checking constraints', async () => {
        mockPrisma.appointment.count.mockResolvedValue(0)
        mockPrisma.tattooSession.count.mockResolvedValue(0)
        mockPrisma.client.delete.mockResolvedValue(mockClient)

        await deleteCustomer('1')

        expect(mockPrisma.appointment.count).toHaveBeenCalledWith({
          where: { clientId: '1' }
        })
        expect(mockPrisma.tattooSession.count).toHaveBeenCalledWith({
          where: { clientId: '1' }
        })
        expect(mockPrisma.client.delete).toHaveBeenCalledWith({
          where: { id: '1' }
        })
      })

      it('should prevent deletion with existing appointments', async () => {
        mockPrisma.appointment.count.mockResolvedValue(1)

        await expect(deleteCustomer('1'))
          .rejects.toThrow('Cannot delete customer with existing appointments')
      })

      it('should prevent deletion with existing sessions', async () => {
        mockPrisma.appointment.count.mockResolvedValue(0)
        mockPrisma.tattooSession.count.mockResolvedValue(1)

        await expect(deleteCustomer('1'))
          .rejects.toThrow('Cannot delete customer with existing sessions')
      })
    })
  })

  describe('Appointment Operations', () => {
    describe('getAppointments', () => {
      it('should fetch appointments with filters', async () => {
        const mockAppointments = [mockAppointment]
        mockPrisma.appointment.findMany.mockResolvedValue(mockAppointments)
        mockPrisma.appointment.count.mockResolvedValue(1)

        const result = await getAppointments({
          status: ['SCHEDULED'],
          limit: 20,
          page: 1
        })

        expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
          where: {
            status: { in: ['SCHEDULED'] }
          },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            artist: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { scheduledDate: 'desc' },
          take: 20,
          skip: 0
        })

        expect(result).toEqual({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: '1',
              status: 'SCHEDULED'
            })
          ]),
          pagination: {
            total: 1,
            limit: 20,
            offset: 0,
            hasMore: false
          }
        })
      })

      it('should handle date range filters', async () => {
        mockPrisma.appointment.findMany.mockResolvedValue([])
        mockPrisma.appointment.count.mockResolvedValue(0)

        await getAppointments({
          dateFrom: '2024-03-01',
          dateTo: '2024-03-31',
          limit: 20,
          page: 1
        })

        expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
          where: {
            scheduledDate: {
              gte: new Date('2024-03-01'),
              lte: new Date('2024-03-31')
            }
          },
          include: expect.any(Object),
          orderBy: { scheduledDate: 'desc' },
          take: 20,
          skip: 0
        })
      })
    })

    describe('createAppointment', () => {
      it('should create appointment successfully', async () => {
        const appointmentData = {
          customerId: '1',
          appointmentDate: '2024-04-15T14:00:00Z',
          estimatedDuration: 240,
          type: 'SESSION',
          notes: 'Second session'
        }

        // Mock client exists
        mockPrisma.client.findUnique.mockResolvedValue(mockClient)
        
        // Mock artist exists
        mockPrisma.tattooArtist.findFirst.mockResolvedValue({
          id: '1',
          name: 'Fernando Govea'
        })

        // Mock no conflicts
        mockPrisma.appointment.findFirst.mockResolvedValue(null)

        // Mock creation
        mockPrisma.appointment.create.mockResolvedValue({
          ...mockAppointment,
          scheduledDate: new Date(appointmentData.appointmentDate)
        })

        const result = await createAppointment(appointmentData)

        expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
          where: { id: '1' }
        })

        expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            clientId: '1',
            artistId: '1',
            scheduledDate: new Date(appointmentData.appointmentDate),
            duration: 240,
            status: 'SCHEDULED',
            type: 'SESSION'
          }),
          include: expect.any(Object)
        })

        expect(result).toEqual(expect.objectContaining({
          id: expect.any(String),
          title: expect.stringContaining('SESSION')
        }))
      })

      it('should handle client not found', async () => {
        mockPrisma.client.findUnique.mockResolvedValue(null)

        await expect(createAppointment({
          customerId: '999',
          appointmentDate: '2024-04-15T14:00:00Z',
          type: 'SESSION'
        })).rejects.toThrow('Client not found')
      })

      it('should handle scheduling conflicts', async () => {
        mockPrisma.client.findUnique.mockResolvedValue(mockClient)
        mockPrisma.tattooArtist.findFirst.mockResolvedValue({ id: '1', name: 'Fernando' })
        mockPrisma.appointment.findFirst.mockResolvedValue(mockAppointment)

        await expect(createAppointment({
          customerId: '1',
          appointmentDate: '2024-03-15T10:00:00Z', // Same time as existing
          type: 'SESSION'
        })).rejects.toThrow('Time slot is already booked')
      })
    })

    describe('updateAppointment', () => {
      it('should update appointment successfully', async () => {
        const updateData = {
          status: 'CONFIRMED',
          notes: 'Updated notes'
        }

        mockPrisma.appointment.update.mockResolvedValue({
          ...mockAppointment,
          ...updateData
        })

        const result = await updateAppointment('1', updateData)

        expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: expect.objectContaining(updateData),
          include: expect.any(Object)
        })

        expect(result).toEqual(expect.objectContaining({
          status: 'confirmed'
        }))
      })
    })

    describe('deleteAppointment', () => {
      it('should delete appointment successfully', async () => {
        mockPrisma.appointment.delete.mockResolvedValue(mockAppointment)

        const result = await deleteAppointment('1')

        expect(mockPrisma.appointment.delete).toHaveBeenCalledWith({
          where: { id: '1' }
        })

        expect(result).toEqual({ success: true })
      })
    })
  })

  describe('Dashboard Operations', () => {
    describe('getDashboardStats', () => {
      it('should fetch comprehensive dashboard statistics', async () => {
        // Mock all the aggregation queries
        mockPrisma.client.count.mockResolvedValue(45)
        mockPrisma.appointment.count.mockResolvedValue(25)
        mockPrisma.tattooSession.count.mockResolvedValue(42)
        mockPrisma.tattooSession.aggregate.mockResolvedValue({
          _sum: { totalCost: 12500 }
        })

        const result = await getDashboardStats()

        expect(result).toEqual({
          totalCustomers: 45,
          monthlyAppointments: 25,
          monthlySessions: 42,
          monthlyRevenue: 12500,
          averageRating: 4.9
        })
      })

      it('should handle zero revenue gracefully', async () => {
        mockPrisma.client.count.mockResolvedValue(0)
        mockPrisma.appointment.count.mockResolvedValue(0)
        mockPrisma.tattooSession.count.mockResolvedValue(0)
        mockPrisma.tattooSession.aggregate.mockResolvedValue({
          _sum: { totalCost: null }
        })

        const result = await getDashboardStats()

        expect(result.monthlyRevenue).toBe(0)
        expect(result.averageRating).toBe(4.9)
      })
    })

    describe('getRecentAppointments', () => {
      it('should fetch recent appointments', async () => {
        const mockAppointments = [mockAppointment]
        mockPrisma.appointment.findMany.mockResolvedValue(mockAppointments)

        const result = await getRecentAppointments(5)

        expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            artist: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          where: {
            scheduledDate: {
              gte: expect.any(Date)
            }
          }
        })

        expect(result).toEqual([
          expect.objectContaining({
            id: '1',
            title: expect.stringContaining('SESSION')
          })
        ])
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockPrisma.client.findMany.mockRejectedValue(new Error('Connection failed'))

      await expect(getCustomers({ limit: 10, offset: 0 }))
        .rejects.toThrow('Failed to fetch customers')
    })

    it('should handle constraint violations gracefully', async () => {
      mockPrisma.client.create.mockRejectedValue(new Error('Constraint violation'))

      await expect(createCustomer({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      })).rejects.toThrow('Failed to create customer')
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize search input', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      await getCustomers({ 
        limit: 10, 
        offset: 0, 
        search: '<script>alert("xss")</script>' 
      })

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { firstName: { contains: 'scriptalert("xss")/script', mode: 'insensitive' } },
            { lastName: { contains: 'scriptalert("xss")/script', mode: 'insensitive' } },
            { email: { contains: 'scriptalert("xss")/script', mode: 'insensitive' } },
            { phone: { contains: 'scriptalert("xss")/script', mode: 'insensitive' } }
          ]
        },
        select: expect.any(Object),
        orderBy: expect.any(Array),
        take: 10,
        skip: 0
      })
    })
  })
})
