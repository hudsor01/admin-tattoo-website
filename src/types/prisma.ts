import type { 
  Account,
  AppointmentStatus,
  AppointmentType,
  Prisma,
  Session,
  SessionStatus,
  User,
  appointments,
  clients,
  tattoo_artists,
  tattoo_sessions
} from '@prisma/client'

// Re-export core Prisma types
export type {
  User,
  Session,
  Account,
  appointments as Appointment,
  clients as Client,
  tattoo_artists as TattooArtist,
  tattoo_sessions as TattooSession,
  AppointmentStatus,
  AppointmentType,
  SessionStatus,
  Prisma
}

// Extended types with relations
export type ClientWithRelations = Prisma.clientsGetPayload<{
  include: {
    appointments: true
    tattoo_sessions: true
  }
}>

export type AppointmentWithRelations = Prisma.appointmentsGetPayload<{
  include: {
    clients: true
    tattoo_artists: true
  }
}>

// Filter types for API
export interface FilterParams {
  page?: number
  limit?: number
  search?: string
  status?: AppointmentStatus | SessionStatus
  startDate?: string
  endDate?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Query result types
export interface QueryResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
