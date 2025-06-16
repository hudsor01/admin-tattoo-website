import { vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { type NextRequest } from 'next/server'

// Mock Prisma
export const mockPrisma = {
  client: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
  tattooSession: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  appointment: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  tattooDesign: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  account: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  session: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}

// Mock auth system
export const mockAuth = {
  api: {
    getSession: vi.fn(),
  },
}

// Mock user data
export const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@ink37tattoos.com',
  name: 'Admin User',
  role: 'admin',
  emailVerified: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockRegularUser = {
  id: 'user-456',
  email: 'user@example.com',
  name: 'Regular User',
  role: 'user',
  emailVerified: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockUnverifiedUser = {
  id: 'unverified-789',
  email: 'unverified@example.com',
  name: 'Unverified User',
  role: 'admin',
  emailVerified: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Mock session data
export const mockAdminSession = {
  user: mockAdminUser,
  session: {
    id: 'session-123',
    userId: mockAdminUser.id,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    token: 'mock-session-token',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

export const mockRegularSession = {
  user: mockRegularUser,
  session: {
    id: 'session-456',
    userId: mockRegularUser.id,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    token: 'mock-session-token-2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

// Mock database data
export const mockClients = [
  {
    id: 'client-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    sessions: [{
      style: 'Traditional',
      totalCost: 500,
    }],
  },
  {
    id: 'client-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '555-0124',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    sessions: [{
      style: 'Realism',
      totalCost: 750,
    }],
  },
]

export const mockAppointments = [
  {
    id: 'appointment-1',
    clientId: 'client-1',
    artistId: 'artist-1',
    scheduledDate: new Date('2024-02-01T10:00:00Z'),
    type: 'SESSION',
    status: 'CONFIRMED',
    duration: 180,
    depositAmount: 100,
    notes: 'First session for sleeve tattoo',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'appointment-2',
    clientId: 'client-2',
    artistId: 'artist-1',
    scheduledDate: new Date('2024-02-05T14:00:00Z'),
    type: 'CONSULTATION',
    status: 'PENDING',
    duration: 60,
    depositAmount: 0,
    notes: 'Initial consultation for back piece',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
]

export const mockTattooSessions = [
  {
    id: 'session-1',
    clientId: 'client-1',
    artistId: 'artist-1',
    appointmentDate: new Date('2024-01-15T10:00:00Z'),
    style: 'Traditional',
    status: 'COMPLETED',
    totalCost: 500,
    notes: 'Traditional sailor tattoo',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    client: mockClients[0],
    artist: { name: 'Mike Johnson' },
  },
  {
    id: 'session-2',
    clientId: 'client-2',
    artistId: 'artist-1',
    appointmentDate: new Date('2024-01-20T14:00:00Z'),
    style: 'Realism',
    status: 'IN_PROGRESS',
    totalCost: 750,
    notes: 'Portrait tattoo in progress',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    client: mockClients[1],
    artist: { name: 'Mike Johnson' },
  },
]

// Helper to create mock NextRequest
export function createMockRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3001/api/test',
  body?: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  const request = new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  
  return request as NextRequest
}

// Helper to reset all mocks
export function resetMocks() {
  vi.clearAllMocks()
  
  // Reset Prisma mocks to return empty arrays/null by default
  Object.values(mockPrisma).forEach(model => {
    if (typeof model === 'object') {
      Object.values(model).forEach(method => {
        if (typeof method === 'function') {
          method.mockReset()
        }
      })
    }
  })
  
  // Reset auth mock
  mockAuth.api.getSession.mockReset()
}

// Helper to setup successful Prisma mocks with default data
export function setupDefaultMocks() {
  // Client operations
  mockPrisma.client.findMany.mockResolvedValue(mockClients)
  mockPrisma.client.count.mockResolvedValue(mockClients.length)
  mockPrisma.client.findUnique.mockResolvedValue(mockClients[0])
  
  // Appointment operations
  mockPrisma.appointment.findMany.mockResolvedValue(mockAppointments)
  mockPrisma.appointment.count.mockResolvedValue(mockAppointments.length)
  mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointments[0])
  
  // Tattoo session operations
  mockPrisma.tattooSession.findMany.mockResolvedValue(mockTattooSessions)
  mockPrisma.tattooSession.count.mockResolvedValue(mockTattooSessions.length)
  mockPrisma.tattooSession.aggregate.mockResolvedValue({
    _sum: { totalCost: 1250 }
  })
  
  // Database health check
  mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }])
  
  // Auth session - default to admin
  mockAuth.api.getSession.mockResolvedValue(mockAdminSession)
}

// Helper to setup auth failure
export function setupAuthFailure() {
  mockAuth.api.getSession.mockResolvedValue(null)
}

// Helper to setup non-admin user
export function setupNonAdminUser() {
  mockAuth.api.getSession.mockResolvedValue(mockRegularSession)
}

// Helper to setup unverified admin
export function setupUnverifiedAdmin() {
  mockAuth.api.getSession.mockResolvedValue({
    user: mockUnverifiedUser,
    session: {
      id: 'session-789',
      userId: mockUnverifiedUser.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      token: 'mock-session-token-3',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

// Helper to setup database failure
export function setupDatabaseFailure() {
  const dbError = new Error('Database connection failed')
  
  Object.values(mockPrisma).forEach(model => {
    if (typeof model === 'object') {
      Object.values(model).forEach(method => {
        if (typeof method === 'function') {
          method.mockRejectedValue(dbError)
        }
      })
    }
  })
}

// Export mock implementations for vi.mock()
export const mockImplementations = {
  '@/lib/prisma': {
    prisma: mockPrisma,
  },
  '@/lib/auth': {
    auth: mockAuth,
  },
}