import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'
import type {
  ClientFilters,
  ClientResponse,
  PaginatedResponse
} from '@/types/database'
import { ApiError } from './api-core'

interface CacheEntry<T> {
  data: T
  timestamp: number
  accessCount: number
  lastAccessed: number
}

class ProductionCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly maxSize: number
  private readonly defaultTtl: number

  constructor(maxSize: number = 1000, defaultTtl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.defaultTtl = defaultTtl
  }

  get(key: string, ttl: number = this.defaultTtl): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }

    entry.lastAccessed = now
    entry.accessCount++
    return entry.data
  }

  set(key: string, data: T): void {
    const now = Date.now()
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed()
    }
    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    })
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTtl) {
        this.cache.delete(key)
      }
    }
  }
}

const dbCache = new ProductionCache<Record<string, unknown>>(1000, 5 * 60 * 1000)
export const clearCache = () => dbCache.clear()

const CACHE_TTL = {
  DASHBOARD_STATS: 5 * 60 * 1000,
  RECENT_APPOINTMENTS: 2 * 60 * 1000,
  CUSTOMER_LIST: 3 * 60 * 1000,
  APPOINTMENT_LIST: 2 * 60 * 1000,
} as const

async function _withCache<T extends Record<string, unknown>>(
  fn: () => Promise<T>,
  keyFn: () => string,
  ttl: number = CACHE_TTL.DASHBOARD_STATS
): Promise<T> {
  const key = keyFn()
  const cached = dbCache.get(key, ttl) as T | null
  if (cached !== null) {
    return cached
  }
  const data = await fn()
  dbCache.set(key, data)
  return data
}

// Input sanitization helper
function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/[%_\\]/g, '\\$&')
    .replace(/[<>]/g, '')
    .substring(0, 100)
    .trim()
}

// Customer creation function
export async function createCustomer(customerData: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  address?: string
  emergencyContact?: string
  medicalConditions?: string
  allergies?: string
  notes?: string
}): Promise<{
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: Date
  emergencyName: string
  emergencyPhone: string
  emergencyRel: string
  allergies: string[]
  medicalConds: string[]
  preferredArtist: string | null
  createdAt: Date
  updatedAt: Date
}> {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      emergencyContact,
      medicalConditions,
      allergies
    } = customerData

    // Check if customer already exists
    const existingCustomer = await prisma.clients.findUnique({
      where: { email }
    })

    if (existingCustomer) {
      throw new ApiError('Customer with this email already exists', 400)
    }

    // Create new customer
    const customer = await prisma.clients.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || '',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1990-01-01'),
        emergencyName: emergencyContact || '',
        emergencyPhone: '',
        emergencyRel: '',
        allergies: allergies ? [allergies] : [],
        medicalConds: medicalConditions ? [medicalConditions] : [],
        preferredArtist: null
      }
    })

    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      emergencyName: customer.emergencyName,
      emergencyPhone: customer.emergencyPhone,
      emergencyRel: customer.emergencyRel,
      allergies: customer.allergies,
      medicalConds: customer.medicalConds,
      preferredArtist: customer.preferredArtist,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }
  } catch (err) {
    console.error('createCustomer error:', err)
    if (err instanceof ApiError) throw err
    throw new ApiError('Failed to create customer', 500)
  }
}

// Customer operations
export async function getCustomers(filters: ClientFilters): Promise<PaginatedResponse<ClientResponse>> {
  try {
    const { search, hasAppointments, limit, offset } = filters
    const where: Prisma.clientsWhereInput = {}

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
      where.appointments = hasAppointments ? { some: {} } : { none: {} }
    }

    const [customers, total] = await Promise.all([
      prisma.clients.findMany({
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
              tattoo_sessions: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.clients.count({ where })
    ])

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
      tattoo_sessions: []
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
  } catch (err) {
    console.error('getCustomers error:', err)
    throw new ApiError('Failed to fetch customers', 500)
  }
}

// Appointment operations
export async function getAppointments(filters: {
  status?: string[]
  startDate?: string
  endDate?: string
  customerId?: string
  limit?: number
  offset?: number
}): Promise<PaginatedResponse<{
  id: string
  clientId: string
  customerId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  type: string
  status: string
  appointmentDate: Date
  startDate: Date
  duration: number
  estimatedDuration: number
  notes: string | null
  artistId: string
  artistName: string
  createdAt: Date
  updatedAt: Date
}>> {
  try {
    const { status, startDate, endDate, customerId, limit = 20, offset = 0 } = filters
    const where: Prisma.appointmentsWhereInput = {}

    if (status && status.length > 0) {
      where.status = { in: status as Prisma.EnumAppointmentStatusFilter['in'] }
    }

    if (startDate || endDate) {
      where.scheduledDate = {}
      if (startDate) {
        where.scheduledDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.scheduledDate.lte = new Date(endDate)
      }
    }

    if (customerId) {
      where.clientId = customerId
    }

    const [appointments, total] = await Promise.all([
      prisma.appointments.findMany({
        where,
        include: {
          clients: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          tattoo_artists: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { scheduledDate: 'desc' },
          { id: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.appointments.count({ where })
    ])

    return {
      success: true,
      data: appointments.map(appointment => ({
        id: appointment.id,
        clientId: appointment.clientId,
        customerId: appointment.clientId, // alias for compatibility
        firstName: appointment.clients.firstName,
        lastName: appointment.clients.lastName,
        email: appointment.clients.email,
        phone: appointment.clients.phone,
        type: appointment.type,
        status: appointment.status,
        appointmentDate: appointment.scheduledDate,
        startDate: appointment.scheduledDate, // alias for compatibility
        duration: appointment.duration,
        estimatedDuration: appointment.duration, // alias for compatibility
        notes: appointment.notes,
        artistId: appointment.artistId,
        artistName: appointment.tattoo_artists.name,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
  } catch (err) {
    console.error('getAppointments error:', err)
    throw new ApiError('Failed to fetch appointments', 500)
  }
}

export async function createAppointment(appointmentData: {
  clientId?: string
  customerId?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  type: 'CONSULTATION' | 'TATTOO_SESSION' | 'TOUCH_UP' | 'REMOVAL'
  description?: string
  appointmentDate: Date
  startDate?: Date
  notes?: string
  estimatedDuration?: number
  duration?: number
  artistId?: string
  status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}): Promise<{
  id: string
  clientId: string
  customerId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  type: string
  status: string
  appointmentDate: Date
  startDate: Date
  duration: number
  estimatedDuration: number
  notes: string | null
  artistId: string
  artistName: string
  createdAt: Date
  updatedAt: Date
}> {
  try {
    const {
      clientId: providedClientId,
      customerId,
      firstName,
      lastName,
      email,
      phone,
      type,
      appointmentDate,
      startDate,
      notes,
      description,
      estimatedDuration,
      duration,
      artistId: providedArtistId,
      status
    } = appointmentData

    let clientId = providedClientId || customerId

    // If no client ID provided, try to find existing client by email
    if (!clientId) {
      const existingClient = await prisma.clients.findUnique({
        where: { email }
      })
      
      if (existingClient) {
        clientId = existingClient.id
      } else {
        // Create new client
        const newClient = await prisma.clients.create({
          data: {
            firstName,
            lastName,
            email,
            phone: phone || '',
            dateOfBirth: new Date('1990-01-01'), // Default date, should be updated
            emergencyName: '',
            emergencyPhone: '',
            emergencyRel: '',
            allergies: [],
            medicalConds: [],
            preferredArtist: providedArtistId
          }
        })
        clientId = newClient.id
      }
    }

    // Get a default artist if none provided
    let artistId = providedArtistId
    if (!artistId) {
      const firstArtist = await prisma.tattoo_artists.findFirst({
        where: { isActive: true }
      })
      if (!firstArtist) {
        throw new ApiError('No active artists available', 400)
      }
      artistId = firstArtist.id
    }

    const appointment = await prisma.appointments.create({
      data: {
        clientId,
        artistId,
        scheduledDate: appointmentDate || startDate || new Date(),
        duration: duration || estimatedDuration || 60,
        type,
        status: status || 'SCHEDULED',
        notes: notes || description,
        reminderSent: false
      },
      include: {
        clients: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        tattoo_artists: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return {
      id: appointment.id,
      clientId: appointment.clientId,
      customerId: appointment.clientId,
      firstName: appointment.clients.firstName,
      lastName: appointment.clients.lastName,
      email: appointment.clients.email,
      phone: appointment.clients.phone,
      type: appointment.type,
      status: appointment.status,
      appointmentDate: appointment.scheduledDate,
      startDate: appointment.scheduledDate,
      duration: appointment.duration,
      estimatedDuration: appointment.duration,
      notes: appointment.notes,
      artistId: appointment.artistId,
      artistName: appointment.tattoo_artists.name,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    }
  } catch (err) {
    console.error('createAppointment error:', err)
    if (err instanceof ApiError) throw err
    throw new ApiError('Failed to create appointment', 500)
  }
}

export async function updateAppointment(
  id: string, 
  updateData: {
    clientId?: string
    customerId?: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    type?: 'CONSULTATION' | 'TATTOO_SESSION' | 'TOUCH_UP' | 'REMOVAL'
    description?: string
    appointmentDate?: Date
    startDate?: Date
    notes?: string
    estimatedDuration?: number
    duration?: number
    artistId?: string
    status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  }
): Promise<{
  id: string
  clientId: string
  customerId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  type: string
  status: string
  appointmentDate: Date
  startDate: Date
  duration: number
  estimatedDuration: number
  notes: string | null
  artistId: string
  artistName: string
  createdAt: Date
  updatedAt: Date
}> {
  try {
    // First check if appointment exists
    const existingAppointment = await prisma.appointments.findUnique({
      where: { id },
      include: {
        clients: true
      }
    })

    if (!existingAppointment) {
      throw new ApiError('Appointment not found', 404)
    }

    // Prepare appointment update data
    const appointmentUpdateData: Partial<Prisma.appointmentsUpdateInput> = {}
    
    const {
      appointmentDate,
      startDate,
      duration,
      estimatedDuration,
      type,
      status,
      notes,
      description,
      artistId,
      firstName,
      lastName,
      email,
      phone
    } = updateData

    if (appointmentDate || startDate) {
      appointmentUpdateData.scheduledDate = appointmentDate || startDate
    }
    
    if (duration || estimatedDuration) {
      appointmentUpdateData.duration = duration || estimatedDuration
    }
    
    if (type) {
      appointmentUpdateData.type = type
    }
    
    if (status) {
      appointmentUpdateData.status = status
    }
    
    if (notes || description) {
      appointmentUpdateData.notes = notes || description
    }
    
    if (artistId) {
      appointmentUpdateData.tattoo_artists = { connect: { id: artistId } }
    }

    // Prepare client update data if any client fields are provided
    const clientUpdateData: Partial<Prisma.clientsUpdateInput> = {}
    
    if (firstName) clientUpdateData.firstName = firstName
    if (lastName) clientUpdateData.lastName = lastName
    if (email) clientUpdateData.email = email
    if (phone) clientUpdateData.phone = phone

    // Use transaction to update both appointment and client data
    const result = await prisma.$transaction(async (tx) => {
      // Update client data if needed
      if (Object.keys(clientUpdateData).length > 0) {
        await tx.clients.update({
          where: { id: existingAppointment.clientId },
          data: clientUpdateData
        })
      }

      // Update appointment
      const updatedAppointment = await tx.appointments.update({
        where: { id },
        data: appointmentUpdateData,
        include: {
          clients: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          tattoo_artists: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      return updatedAppointment
    })

    return {
      id: result.id,
      clientId: result.clientId,
      customerId: result.clientId,
      firstName: result.clients.firstName,
      lastName: result.clients.lastName,
      email: result.clients.email,
      phone: result.clients.phone,
      type: result.type,
      status: result.status,
      appointmentDate: result.scheduledDate,
      startDate: result.scheduledDate,
      duration: result.duration,
      estimatedDuration: result.duration,
      notes: result.notes,
      artistId: result.artistId,
      artistName: result.tattoo_artists.name,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }
  } catch (err) {
    console.error('updateAppointment error:', err)
    if (err instanceof ApiError) throw err
    throw new ApiError('Failed to update appointment', 500)
  }
}

// Customer management functions for the customers API
export async function getCustomerById(id: string): Promise<ClientResponse | null> {
  try {
    const customer = await prisma.clients.findUnique({
      where: { id },
      include: {
        appointments: true,
        tattoo_sessions: true
      }
    })

    if (!customer) {
      return null
    }

    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      emergencyName: customer.emergencyName,
      emergencyPhone: customer.emergencyPhone,
      emergencyRel: customer.emergencyRel,
      allergies: customer.allergies,
      medicalConds: customer.medicalConds,
      preferredArtist: customer.preferredArtist,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      appointments: customer.appointments,
      sessions: customer.tattoo_sessions
    }
  } catch (err) {
    console.error('getCustomerById error:', err)
    throw new ApiError('Failed to fetch customer', 500)
  }
}

export async function updateCustomer(id: string, updateData: {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dateOfBirth?: Date | string
  emergencyName?: string
  emergencyPhone?: string
  emergencyRel?: string
  allergies?: string[]
  medicalConds?: string[]
  preferredArtist?: string | null
}): Promise<ClientResponse> {
  try {
    const customer = await prisma.clients.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateData.dateOfBirth && {
          dateOfBirth: typeof updateData.dateOfBirth === 'string' 
            ? new Date(updateData.dateOfBirth) 
            : updateData.dateOfBirth
        })
      },
      include: {
        appointments: true,
        tattoo_sessions: true
      }
    })

    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      emergencyName: customer.emergencyName,
      emergencyPhone: customer.emergencyPhone,
      emergencyRel: customer.emergencyRel,
      allergies: customer.allergies,
      medicalConds: customer.medicalConds,
      preferredArtist: customer.preferredArtist,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      appointments: customer.appointments,
      sessions: customer.tattoo_sessions
    }
  } catch (err) {
    console.error('updateCustomer error:', err)
    if (err instanceof ApiError) throw err
    throw new ApiError('Failed to update customer', 500)
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    // Check if customer has any appointments or sessions
    const customer = await prisma.clients.findUnique({
      where: { id },
      include: {
        appointments: { take: 1 },
        tattoo_sessions: { take: 1 }
      }
    })

    if (!customer) {
      throw new ApiError('Customer not found', 404)
    }

    if (customer.appointments.length > 0 || customer.tattoo_sessions.length > 0) {
      throw new ApiError('Cannot delete customer with existing appointments or sessions', 400)
    }

    await prisma.clients.delete({
      where: { id }
    })
  } catch (err) {
    console.error('deleteCustomer error:', err)
    if (err instanceof ApiError) throw err
    throw new ApiError('Failed to delete customer', 500)
  }
}
