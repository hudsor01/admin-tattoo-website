import { prisma } from './database'
import type { Prisma } from '@prisma/client'
import {
  CreateClientData,
  CreateAppointmentData,
  ClientFilters,
  AppointmentFilters,
  PaginatedResponse,
  ClientResponse
} from '@/types/database'
import { ApiError } from './error-handling'
import { withCache, CACHE_TTL } from './repository-utils'

// Legacy type aliases for backward compatibility
type CreateCustomer = CreateClientData
type CustomerFilter = ClientFilters
type CreateAppointment = CreateAppointmentData
type AppointmentFilter = AppointmentFilters

// Input sanitization helper
function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/[%_\\]/g, '\\$&')
    .replace(/[<>]/g, '')
    .substring(0, 100)
    .trim()
}


// Customer operations
export async function getCustomers(filters: CustomerFilter): Promise<PaginatedResponse<ClientResponse>> {
  try {
    const { search, hasAppointments, limit, offset } = filters

    const where: Prisma.ClientWhereInput = {}

    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search)
      if (sanitizedSearch) {
        where.OR = [
          { firstName: { contains: sanitizedSearch, mode: 'insensitive' } },
          { lastName: { contains: sanitizedSearch, mode: 'insensitive' } },
          { email: { contains: sanitizedSearch, mode: 'insensitive' } },
          { phone: { contains: sanitizedSearch, mode: 'insensitive' } }
        ]
      }
    }

    if (hasAppointments !== undefined) {
      if (hasAppointments) {
        where.appointments = { some: {} }
      } else {
        where.appointments = { none: {} }
      }
    }

    const [customers, total] = await Promise.all([
      prisma.client.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          emergencyName: true,
          emergencyPhone: true,
          emergencyRel: true,
          allergies: true,
          medicalConds: true,
          preferredArtist: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { 
              appointments: true,
              sessions: true 
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' } // Secondary sort for consistency
        ],
        take: limit,
        skip: offset
      }),
      prisma.client.count({ where })
    ])

    // Transform the data to match expected format (optimized for list view)
    const transformedCustomers: ClientResponse[] = customers.map(client => ({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      dateOfBirth: client.dateOfBirth,
      emergencyName: client.emergencyName,
      emergencyPhone: client.emergencyPhone,
      emergencyRel: client.emergencyRel,
      allergies: client.allergies,
      medicalConds: client.medicalConds,
      preferredArtist: client.preferredArtist,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      appointments: [],
      sessions: []
    }))

    return {
      success: true,
      data: transformedCustomers,
      pagination: {
        total,
        limit: limit || 20,
        offset: offset || 0,
        hasMore: (offset || 0) + (limit || 20) < total
      }
    }
  } catch {
    // Database error logged
    throw new ApiError('Failed to fetch customers', 500)
  }
}

export async function getCustomerById(id: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id },
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

    if (!client) {
      throw new ApiError('Customer not found', 404)
    }

    // Transform the data to match expected format
    return {
      id: client.id,
      name: `${client.firstName} ${client.lastName}`,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      dateOfBirth: client.dateOfBirth,
      emergencyName: client.emergencyName,
      emergencyPhone: client.emergencyPhone,
      emergencyRel: client.emergencyRel,
      allergies: client.allergies,
      medicalConds: client.medicalConds,
      preferredArtist: client.preferredArtist,
      appointments: client.appointments,
      sessions: client.sessions,
      appointmentCount: client._count.appointments,
      sessionCount: client._count.sessions,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('Failed to fetch customer', 500)
  }
}

export async function createCustomer(data: CreateCustomer) {
  try {
    const client = await prisma.client.create({
      data: {
        firstName: data.firstName || data.name?.split(' ')[0] || '',
        lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
        email: data.email || '',
        phone: data.phone || '',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : data.birthDate ? new Date(data.birthDate) : new Date(),
        emergencyName: data.emergencyName || '',
        emergencyPhone: data.emergencyPhone || '',
        emergencyRel: data.emergencyRel || '',
        allergies: Array.isArray(data.allergies) ? data.allergies : data.allergies ? [data.allergies] : [],
        medicalConds: data.medicalConds || [],
        preferredArtist: data.preferredArtist
      },
      include: {
        _count: {
          select: {
            appointments: true,
            sessions: true
          }
        }
      }
    })

    // Transform the data to match expected format
    return {
      id: client.id,
      name: `${client.firstName} ${client.lastName}`,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      dateOfBirth: client.dateOfBirth,
      emergencyName: client.emergencyName,
      emergencyPhone: client.emergencyPhone,
      emergencyRel: client.emergencyRel,
      allergies: client.allergies,
      medicalConds: client.medicalConds,
      preferredArtist: client.preferredArtist,
      appointmentCount: client._count.appointments,
      sessionCount: client._count.sessions,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    }
  } catch {
    // Database error logged
    throw new ApiError('Failed to create customer', 500)
  }
}

export async function updateCustomer(id: string, data: Partial<CreateCustomer>) {
  try {
    const updateData: Prisma.ClientUpdateInput = {}

    if (data.firstName) updateData.firstName = data.firstName
    if (data.lastName) updateData.lastName = data.lastName
    if (data.name && !data.firstName && !data.lastName) {
      updateData.firstName = data.name.split(' ')[0] || ''
      updateData.lastName = data.name.split(' ').slice(1).join(' ') || ''
    }
    if (data.email) updateData.email = data.email
    if (data.phone) updateData.phone = data.phone
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth)
    if (data.emergencyName !== undefined) updateData.emergencyName = data.emergencyName
    if (data.emergencyPhone !== undefined) updateData.emergencyPhone = data.emergencyPhone
    if (data.emergencyRel !== undefined) updateData.emergencyRel = data.emergencyRel
    if (data.allergies !== undefined) {
      updateData.allergies = Array.isArray(data.allergies) ? data.allergies : [data.allergies]
    }
    if (data.medicalConds !== undefined) updateData.medicalConds = data.medicalConds
    if (data.preferredArtist !== undefined) updateData.preferredArtist = data.preferredArtist

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            appointments: true,
            sessions: true
          }
        }
      }
    })

    // Transform the data to match expected format
    return {
      id: client.id,
      name: `${client.firstName} ${client.lastName}`,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      dateOfBirth: client.dateOfBirth,
      emergencyName: client.emergencyName,
      emergencyPhone: client.emergencyPhone,
      emergencyRel: client.emergencyRel,
      allergies: client.allergies,
      medicalConds: client.medicalConds,
      preferredArtist: client.preferredArtist,
      appointmentCount: client._count.appointments,
      sessionCount: client._count.sessions,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    }
  } catch {
    // Database error logged
    throw new ApiError('Failed to update customer', 500)
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    // Check if customer has appointments
    const appointmentCount = await prisma.appointment.count({
      where: { clientId: id }
    })

    if (appointmentCount > 0) {
      throw new ApiError('Cannot delete customer with existing appointments', 400)
    }

    // Check if customer has sessions
    const sessionCount = await prisma.tattooSession.count({
      where: { clientId: id }
    })

    if (sessionCount > 0) {
      throw new ApiError('Cannot delete customer with existing sessions', 400)
    }

    await prisma.client.delete({
      where: { id }
    })
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('Failed to delete customer', 500)
  }
}

// Appointment operations
export async function getAppointments(filters: AppointmentFilter): Promise<PaginatedResponse<Record<string, unknown>>> {
  try {
    const { status, dateFrom, dateTo, clientId, limit = 20, page = 1 } = filters
    const offset = (page - 1) * limit

    const where: Prisma.AppointmentWhereInput = {}

    if (status && status.length > 0) {
      where.status = { in: status }
    }

    if (dateFrom) {
      where.scheduledDate = { gte: new Date(dateFrom) }
    }

    if (dateTo) {
      where.scheduledDate = {
        ...(where.scheduledDate as Prisma.DateTimeFilter || {}),
        lte: new Date(dateTo)
      }
    }

    if (clientId) {
      where.clientId = clientId
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
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
        take: limit,
        skip: offset
      }),
      prisma.appointment.count({ where })
    ])

    // Transform the data to match expected format
    const transformedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      clientId: appointment.clientId,
      artistId: appointment.artistId,
      scheduledDate: appointment.scheduledDate,
      duration: appointment.duration,
      status: appointment.status,
      type: appointment.type,
      notes: appointment.notes,
      reminderSent: appointment.reminderSent,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      client: appointment.client,
      artist: appointment.artist
    }))

    return {
      success: true,
      data: transformedAppointments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
  } catch {
    // Database error logged
    throw new ApiError('Failed to fetch appointments', 500)
  }
}

export async function getAppointmentById(id: string) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
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
      }
    })

    if (!appointment) {
      throw new ApiError('Appointment not found', 404)
    }

    // Transform the data to match expected format
    return {
      id: appointment.id,
      title: `${appointment.type} - ${appointment.client.firstName} ${appointment.client.lastName}`,
      status: appointment.status.toLowerCase(),
      scheduledDate: appointment.scheduledDate,
      duration: appointment.duration,
      type: appointment.type,
      notes: appointment.notes,
      customer: {
        id: appointment.client.id,
        name: `${appointment.client.firstName} ${appointment.client.lastName}`,
        email: appointment.client.email,
        phone: appointment.client.phone
      },
      artist: appointment.artist,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('Failed to fetch appointment', 500)
  }
}

export async function createAppointment(data: CreateAppointment) {
  try {
    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId || data.customerId }
    })

    if (!client) {
      throw new ApiError('Client not found', 404)
    }

    // Get Fernando's artist ID (only one artist in the system)
    const artist = await prisma.tattooArtist.findFirst({
      where: { name: 'Fernando Govea' }
    })

    if (!artist) {
      throw new ApiError('Artist not found', 404)
    }

    // Check for scheduling conflicts
    const scheduledDate = new Date(data.appointmentDate)
    const endDate = new Date(scheduledDate.getTime() + (data.estimatedDuration || 60) * 60 * 1000)

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        artistId: artist.id,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        scheduledDate: {
          gte: scheduledDate,
          lt: endDate
        }
      }
    })

    if (conflictingAppointment) {
      throw new ApiError('Time slot is already booked', 400)
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: data.clientId || data.customerId!,
        artistId: artist.id,
        scheduledDate: scheduledDate,
        duration: data.estimatedDuration || 60,
        status: 'SCHEDULED',
        type: data.type,
        notes: data.notes
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
      }
    })

    // Transform the data to match expected format
    return {
      id: appointment.id,
      title: `${appointment.type} - ${appointment.client.firstName} ${appointment.client.lastName}`,
      status: appointment.status.toLowerCase(),
      scheduledDate: appointment.scheduledDate,
      duration: appointment.duration,
      type: appointment.type,
      notes: appointment.notes,
      customer: {
        id: appointment.client.id,
        name: `${appointment.client.firstName} ${appointment.client.lastName}`,
        email: appointment.client.email,
        phone: appointment.client.phone
      },
      artist: appointment.artist,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('Failed to create appointment', 500)
  }
}

export async function updateAppointment(id: string, data: Partial<CreateAppointment>) {
  try {
    const updateData: Prisma.AppointmentUpdateInput = {}

    if (data.appointmentDate) {
      updateData.scheduledDate = new Date(data.appointmentDate)
    }

    if (data.estimatedDuration) {
      updateData.duration = data.estimatedDuration
    }

    if (data.status) {
      updateData.status = data.status
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes
    }

    if (data.type) {
      updateData.type = data.type
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
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
      }
    })

    // Transform the data to match expected format
    return {
      id: appointment.id,
      title: `${appointment.type} - ${appointment.client.firstName} ${appointment.client.lastName}`,
      status: appointment.status.toLowerCase(),
      scheduledDate: appointment.scheduledDate,
      duration: appointment.duration,
      type: appointment.type,
      notes: appointment.notes,
      customer: {
        id: appointment.client.id,
        name: `${appointment.client.firstName} ${appointment.client.lastName}`,
        email: appointment.client.email,
        phone: appointment.client.phone
      },
      artist: appointment.artist,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    }
  } catch {
    throw new ApiError('Failed to update appointment', 500)
  }
}

export async function deleteAppointment(id: string) {
  try {
    await prisma.appointment.delete({
      where: { id }
    })

    return { success: true }
  } catch {
    throw new ApiError('Failed to delete appointment', 500)
  }
}


// Dashboard analytics with caching
const _getDashboardStatsUncached = async () => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalCustomers, totalAppointments, totalSessions, totalRevenue] = await Promise.all([
      prisma.client.count(),
      prisma.appointment.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.tattooSession.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.tattooSession.aggregate({
        _sum: { totalCost: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo }
        }
      })
    ])

    return {
      totalCustomers,
      monthlyAppointments: totalAppointments,
      monthlySessions: totalSessions,
      monthlyRevenue: totalRevenue._sum.totalCost || 0,
      averageRating: 4.9 // Default rating until we implement reviews
    }
  } catch {
    // Database error logged
    throw new ApiError('Failed to fetch dashboard stats', 500)
  }
}

export const getDashboardStats = withCache(
  _getDashboardStatsUncached,
  () => 'dashboard:stats',
  CACHE_TTL.DASHBOARD_STATS
);

const _getRecentAppointmentsUncached = async (limit: number = 5) => {
  try {
    const appointments = await prisma.appointment.findMany({
      take: limit,
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
          gte: new Date()
        }
      }
    })

    // Transform the data to match expected format
    return appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.type} - ${appointment.client.firstName} ${appointment.client.lastName}`,
      status: appointment.status.toLowerCase(),
      scheduledDate: appointment.scheduledDate,
      duration: appointment.duration,
      type: appointment.type,
      notes: appointment.notes,
      customer: {
        id: appointment.client.id,
        name: `${appointment.client.firstName} ${appointment.client.lastName}`,
        email: appointment.client.email,
        phone: appointment.client.phone
      },
      artist: appointment.artist,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    }))
  } catch {
    // Database error logged
    throw new ApiError('Failed to fetch recent appointments', 500)
  }
}

export const getRecentAppointments = withCache(
  _getRecentAppointmentsUncached,
  (limit: number) => `recent:appointments:${limit}`,
  CACHE_TTL.RECENT_APPOINTMENTS
);
