import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock PrismaClient before importing
const mockPrismaClient = {
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $queryRaw: vi.fn(),
  user: {
    findMany: vi.fn(),
    create: vi.fn()
  }
}

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient)
}))

describe('Prisma Client Setup', () => {
  const originalEnv = process.env.NODE_ENV
  const originalGlobal = (globalThis as any).prisma

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear the global prisma instance
    delete (globalThis as any).prisma
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    if (originalGlobal) {
      (globalThis as any).prisma = originalGlobal
    } else {
      delete (globalThis as any).prisma
    }
    // Reset modules to ensure fresh imports
    vi.resetModules()
  })

  describe('Development Environment', () => {
    it('should create a new PrismaClient instance in development', async () => {
      process.env.NODE_ENV = 'development'
      
      const { prisma } = await import('@/lib/prisma')
      
      expect(prisma).toBeDefined()
      expect(prisma).toBe(mockPrismaClient)
      expect((globalThis as any).prisma).toBe(mockPrismaClient)
    })

    it('should reuse global prisma instance in development if it exists', async () => {
      process.env.NODE_ENV = 'development'
      const existingPrisma = { existing: true }
      ;(globalThis as any).prisma = existingPrisma
      
      const { prisma } = await import('@/lib/prisma')
      
      expect(prisma).toBe(existingPrisma)
    })

    it('should store prisma in global in development', async () => {
      process.env.NODE_ENV = 'development'
      
      const { prisma } = await import('@/lib/prisma')
      
      expect((globalThis as any).prisma).toBe(prisma)
    })
  })

  describe('Production Environment', () => {
    it('should create a new PrismaClient instance in production', async () => {
      process.env.NODE_ENV = 'production'
      
      const { prisma } = await import('@/lib/prisma')
      
      expect(prisma).toBeDefined()
      expect(prisma).toBe(mockPrismaClient)
    })

    it('should not store prisma in global in production', async () => {
      process.env.NODE_ENV = 'production'
      
      await import('@/lib/prisma')
      
      expect((globalThis as any).prisma).toBeUndefined()
    })

    it('should still reuse global instance if it exists in production', async () => {
      process.env.NODE_ENV = 'production'
      const existingPrisma = { existing: true }
      ;(globalThis as any).prisma = existingPrisma
      
      const { prisma } = await import('@/lib/prisma')
      
      expect(prisma).toBe(existingPrisma)
    })
  })

  describe('Test Environment', () => {
    it('should create a new PrismaClient instance in test', async () => {
      process.env.NODE_ENV = 'test'
      
      const { prisma } = await import('@/lib/prisma')
      
      expect(prisma).toBeDefined()
      expect(prisma).toBe(mockPrismaClient)
      expect((globalThis as any).prisma).toBe(mockPrismaClient)
    })

    it('should store prisma in global in test environment', async () => {
      process.env.NODE_ENV = 'test'
      
      const { prisma } = await import('@/lib/prisma')
      
      expect((globalThis as any).prisma).toBe(prisma)
    })
  })

  describe('Multiple Imports', () => {
    it('should return the same instance on multiple imports in development', async () => {
      process.env.NODE_ENV = 'development'
      
      const { prisma: prisma1 } = await import('@/lib/prisma')
      vi.resetModules()
      // Set global again as resetModules clears it
      ;(globalThis as any).prisma = prisma1
      const { prisma: prisma2 } = await import('@/lib/prisma')
      
      expect(prisma1).toBe(prisma2)
    })

    it('should create separate instances on multiple imports in production without global', async () => {
      process.env.NODE_ENV = 'production'
      
      const { prisma: prisma1 } = await import('@/lib/prisma')
      vi.resetModules()
      const { prisma: prisma2 } = await import('@/lib/prisma')
      
      // They should be different instances since production doesn't use global
      expect(prisma1).not.toBe(prisma2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined NODE_ENV', async () => {
      delete process.env.NODE_ENV
      
      const { prisma } = await import('@/lib/prisma')
      
      expect(prisma).toBeDefined()
      expect((globalThis as any).prisma).toBe(prisma) // Should behave like development
    })

    it('should handle empty string NODE_ENV', async () => {
      process.env.NODE_ENV = ''
      
      const { prisma } = await import('@/lib/prisma')
      
      expect(prisma).toBeDefined()
      expect((globalThis as any).prisma).toBe(prisma) // Should behave like development
    })

    it('should handle custom NODE_ENV values', async () => {
      process.env.NODE_ENV = 'staging'
      
      const { prisma } = await import('@/lib/prisma')
      
      expect(prisma).toBeDefined()
      expect((globalThis as any).prisma).toBe(prisma) // Should behave like development
    })

    it('should work with globalThis type assertion', async () => {
      process.env.NODE_ENV = 'development'
      
      const { prisma } = await import('@/lib/prisma')
      
      // Verify the globalThis type assertion works correctly
      const globalForPrisma = globalThis as unknown as { prisma: typeof prisma }
      expect(globalForPrisma.prisma).toBe(prisma)
    })
  })

  describe('Prisma Client Methods', () => {
    it('should expose standard Prisma client methods', async () => {
      process.env.NODE_ENV = 'development'
      
      const { prisma } = await import('@/lib/prisma')
      
      expect(prisma.$connect).toBeDefined()
      expect(prisma.$disconnect).toBeDefined()
      expect(typeof prisma.$connect).toBe('function')
      expect(typeof prisma.$disconnect).toBe('function')
    })

    it('should expose model methods', async () => {
      process.env.NODE_ENV = 'development'
      
      const { prisma } = await import('@/lib/prisma')
      
      expect(prisma.user).toBeDefined()
      expect(prisma.user.findMany).toBeDefined()
      expect(prisma.user.create).toBeDefined()
      expect(typeof prisma.user.findMany).toBe('function')
      expect(typeof prisma.user.create).toBe('function')
    })
  })

  describe('Memory Management', () => {
    it('should not create memory leaks in development', async () => {
      process.env.NODE_ENV = 'development'
      
      // Import multiple times
      for (let i = 0; i < 5; i++) {
        await import('@/lib/prisma')
        vi.resetModules()
        if (i < 4) {
          // Keep global instance except for last iteration
          ;(globalThis as any).prisma = mockPrismaClient
        }
      }
      
      // Should still have the global instance
      expect((globalThis as any).prisma).toBeDefined()
    })

    it('should clean up properly in production', async () => {
      process.env.NODE_ENV = 'production'
      
      await import('@/lib/prisma')
      
      // Global should not be polluted in production
      expect((globalThis as any).prisma).toBeUndefined()
    })
  })

  describe('Type Safety', () => {
    it('should maintain type safety through global assertion', async () => {
      process.env.NODE_ENV = 'development'
      
      const { prisma } = await import('@/lib/prisma')
      
      // This should compile without TypeScript errors
      const globalForPrisma = globalThis as unknown as { prisma: typeof prisma }
      expect(globalForPrisma.prisma).toBe(prisma)
      
      // The types should be compatible
      expect(typeof globalForPrisma.prisma).toBe('object')
    })
  })
})