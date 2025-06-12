import { prisma } from './database'
import {
  CreateClientData,
  CreateAppointmentData,
  ClientFilters,
  AppointmentFilters,
  PaginatedResponse
} from '@/types/database'
import { ApiError } from './error-handling'

// Legacy type aliases for backward compatibility
type CreateCustomer = CreateClientData
type CustomerFilter = ClientFilters
type CreateAppointment = CreateAppointmentData
type AppointmentFilter = AppointmentFilters

interface CreatePayment {
  amount: number
  sessionId?: string
  clientId?: string
  method?: string
}

// Customer operations
export async function getCustomers(filters: CustomerFilter): Promise<PaginatedResponse<any>> {
  try {
    const { search, hasAppointments, limit, offset } = filters

    const where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
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
        include: {
          appointments: {
            select: { id: true },
            take: 1
          },
          _count: {
            select: { appointments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.client.count({ where })
    ])

    // Transform the data to match expected format
    const transformedCustomers = customers.map(client => ({
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
      hasAppointments: client._count.appointments > 0,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
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
  } catch (error) {
    console.error('getCustomers error:', error)
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
  } catch (error) {
    console.error('createCustomer error:', error)
    throw new ApiError('Failed to create customer', 500)
  }
}

export async function updateCustomer(id: string, data: Partial<CreateCustomer>) {
  try {
    const updateData: any = {}

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
    if (data.allergies !== undefined) updateData.allergies = data.allergies
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
  } catch (error) {
    console.error('updateCustomer error:', error)
    throw new ApiError('Failed to update customer', 500)
  }
}

export async function deleteCustomer(id: string) {
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

    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('Failed to delete customer', 500)
  }
}

// Appointment operations
export async function getAppointments(filters: AppointmentFilter): Promise<PaginatedResponse<any>> {
  try {
    const { status, dateFrom, dateTo, clientId, limit = 20, page = 1 } = filters
    const offset = (page - 1) * limit

    const where: any = {}

    if (status && status.length > 0) {
      where.status = { in: status }
    }

    if (dateFrom) {
      where.scheduledDate = { gte: new Date(dateFrom) }
    }

    if (dateTo) {
      where.scheduledDate = {
        ...where.scheduledDate,
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
  } catch (error) {
    console.error('getAppointments error:', error)
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
    const updateData: any = {}

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
  } catch (error) {
    throw new ApiError('Failed to update appointment', 500)
  }
}

export async function deleteAppointment(id: string) {
  try {
    await prisma.appointment.delete({
      where: { id }
    })

    return { success: true }
  } catch (error) {
    throw new ApiError('Failed to delete appointment', 500)
  }
}

// Payment operations - Temporarily disabled as Payment model is not in current schema
// TODO: Implement payment tracking with proper schema
export async function createPayment(data: CreatePayment) {
  try {
    // For now, return a mock payment object
    return {
      id: 'temp-payment-' + Date.now(),
      amount: data.amount || 0,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    throw new ApiError('Failed to create payment', 500)
  }
}

// Dashboard analytics
export async function getDashboardStats() {
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
  } catch (error) {
    console.error('getDashboardStats error:', error)
    throw new ApiError('Failed to fetch dashboard stats', 500)
  }
}

export async function getRecentAppointments(limit: number = 5) {
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
  } catch (error) {
    console.error('getRecentAppointments error:', error)
    throw new ApiError('Failed to fetch recent appointments', 500)
  }
}
