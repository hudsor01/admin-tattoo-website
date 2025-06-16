import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  withCache,
  clearCache,
  CACHE_TTL,
  GenericRepository,
  createRepository,
  dbUtils,
  repositories
} from '@/lib/repository-utils'

// Mock prisma
const mockPrisma = {
  $transaction: vi.fn(),
  $disconnect: vi.fn(),
  $queryRawUnsafe: vi.fn(),
  $queryRaw: vi.fn(),
  Client: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn()
  },
  Appointment: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn()
  }
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

describe('Repository Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCache() // Clear cache between tests
  })

  describe('Cache Utilities', () => {
    describe('withCache', () => {
      it('should cache function results', async () => {
        const mockFn = vi.fn().mockResolvedValue('result')
        const keyFn = (arg: string) => `test-${arg}`
        const cachedFn = withCache(mockFn, keyFn, 1000)

        const result1 = await cachedFn('arg1')
        const result2 = await cachedFn('arg1')

        expect(mockFn).toHaveBeenCalledTimes(1)
        expect(result1).toBe('result')
        expect(result2).toBe('result')
      })

      it('should not cache results for different arguments', async () => {
        const mockFn = vi.fn()
          .mockResolvedValueOnce('result1')
          .mockResolvedValueOnce('result2')
        const keyFn = (arg: string) => `test-${arg}`
        const cachedFn = withCache(mockFn, keyFn, 1000)

        const result1 = await cachedFn('arg1')
        const result2 = await cachedFn('arg2')

        expect(mockFn).toHaveBeenCalledTimes(2)
        expect(result1).toBe('result1')
        expect(result2).toBe('result2')
      })

      it('should expire cache after TTL', async () => {
        const mockFn = vi.fn()
          .mockResolvedValueOnce('result1')
          .mockResolvedValueOnce('result2')
        const keyFn = (arg: string) => `test-${arg}`
        const cachedFn = withCache(mockFn, keyFn, 100) // 100ms TTL

        const result1 = await cachedFn('arg1')
        
        // Wait for cache to expire
        await new Promise(resolve => setTimeout(resolve, 150))
        
        const result2 = await cachedFn('arg1')

        expect(mockFn).toHaveBeenCalledTimes(2)
        expect(result1).toBe('result1')
        expect(result2).toBe('result2')
      })

      it('should use default TTL when not specified', async () => {
        const mockFn = vi.fn().mockResolvedValue('result')
        const keyFn = (arg: string) => `test-${arg}`
        const cachedFn = withCache(mockFn, keyFn)

        await cachedFn('arg1')
        await cachedFn('arg1')

        expect(mockFn).toHaveBeenCalledTimes(1)
      })

      it('should handle function errors correctly', async () => {
        const error = new Error('Function failed')
        const mockFn = vi.fn().mockRejectedValue(error)
        const keyFn = (arg: string) => `test-${arg}`
        const cachedFn = withCache(mockFn, keyFn, 1000)

        await expect(cachedFn('arg1')).rejects.toThrow('Function failed')
        await expect(cachedFn('arg1')).rejects.toThrow('Function failed')

        // Should call function both times since error wasn't cached
        expect(mockFn).toHaveBeenCalledTimes(2)
      })

      it('should handle complex arguments', async () => {
        const mockFn = vi.fn().mockResolvedValue('result')
        const keyFn = (obj: Record<string, any>, arr: number[]) => 
          `${JSON.stringify(obj)}-${arr.join(',')}`
        const cachedFn = withCache(mockFn, keyFn, 1000)

        await cachedFn({ id: 1, name: 'test' }, [1, 2, 3])
        await cachedFn({ id: 1, name: 'test' }, [1, 2, 3])

        expect(mockFn).toHaveBeenCalledTimes(1)
      })
    })

    describe('clearCache', () => {
      it('should clear all cache when no pattern provided', async () => {
        const mockFn = vi.fn().mockResolvedValue('result')
        const keyFn = (arg: string) => `test-${arg}`
        const cachedFn = withCache(mockFn, keyFn, 10000)

        await cachedFn('arg1')
        await cachedFn('arg2')
        
        clearCache()
        
        await cachedFn('arg1')
        await cachedFn('arg2')

        expect(mockFn).toHaveBeenCalledTimes(4) // 2 before clear + 2 after clear
      })

      it('should clear cache matching pattern', async () => {
        const mockFn = vi.fn().mockResolvedValue('result')
        const keyFn = (prefix: string, arg: string) => `${prefix}-${arg}`
        const cachedFn = withCache(mockFn, keyFn, 10000)

        await cachedFn('test', 'arg1')
        await cachedFn('other', 'arg1')
        
        clearCache('test')
        
        await cachedFn('test', 'arg1')    // Should call function (cache cleared)
        await cachedFn('other', 'arg1')   // Should use cache (not cleared)

        expect(mockFn).toHaveBeenCalledTimes(3)
      })
    })

    describe('CACHE_TTL constants', () => {
      it('should have expected TTL values', () => {
        expect(CACHE_TTL.DASHBOARD_STATS).toBe(5 * 60 * 1000)
        expect(CACHE_TTL.RECENT_APPOINTMENTS).toBe(1 * 60 * 1000)
        expect(CACHE_TTL.DEFAULT).toBe(5 * 60 * 1000)
      })
    })
  })

  describe('GenericRepository', () => {
    let repository: GenericRepository<any, any>

    beforeEach(() => {
      repository = new GenericRepository('Client')
    })

    describe('findMany', () => {
      it('should call model findMany with correct options', async () => {
        const mockResult = [{ id: '1', name: 'Test' }]
        mockPrisma.Client.findMany.mockResolvedValueOnce(mockResult)

        const result = await repository.findMany({
          where: { active: true },
          orderBy: { name: 'asc' },
          take: 10,
          skip: 5
        })

        expect(mockPrisma.Client.findMany).toHaveBeenCalledWith({
          where: { active: true },
          orderBy: { name: 'asc' },
          take: 10,
          skip: 5,
          include: undefined,
          select: undefined
        })
        expect(result).toEqual(mockResult)
      })

      it('should use default include/select options', async () => {
        const repositoryWithDefaults = new GenericRepository(
          'Client',
          { appointments: true },
          { id: true, name: true }
        )
        mockPrisma.Client.findMany.mockResolvedValueOnce([])

        await repositoryWithDefaults.findMany()

        expect(mockPrisma.Client.findMany).toHaveBeenCalledWith({
          include: { appointments: true },
          select: { id: true, name: true }
        })
      })
    })

    describe('findUnique', () => {
      it('should call model findUnique with correct parameters', async () => {
        const mockResult = { id: '1', name: 'Test' }
        mockPrisma.Client.findUnique.mockResolvedValueOnce(mockResult)

        const result = await repository.findUnique(
          { id: '1' },
          { include: { appointments: true } }
        )

        expect(mockPrisma.Client.findUnique).toHaveBeenCalledWith({
          where: { id: '1' },
          include: { appointments: true },
          select: undefined
        })
        expect(result).toEqual(mockResult)
      })
    })

    describe('create', () => {
      it('should call model create with correct data', async () => {
        const createData = { name: 'New Client', email: 'test@example.com' }
        const mockResult = { id: '1', ...createData }
        mockPrisma.Client.create.mockResolvedValueOnce(mockResult)

        const result = await repository.create(createData)

        expect(mockPrisma.Client.create).toHaveBeenCalledWith({
          data: createData,
          include: undefined,
          select: undefined
        })
        expect(result).toEqual(mockResult)
      })
    })

    describe('update', () => {
      it('should call model update with correct parameters', async () => {
        const updateData = { name: 'Updated Name' }
        const mockResult = { id: '1', name: 'Updated Name' }
        mockPrisma.Client.update.mockResolvedValueOnce(mockResult)

        const result = await repository.update({ id: '1' }, updateData)

        expect(mockPrisma.Client.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: updateData,
          include: undefined,
          select: undefined
        })
        expect(result).toEqual(mockResult)
      })
    })

    describe('delete', () => {
      it('should call model delete with correct where clause', async () => {
        const mockResult = { id: '1' }
        mockPrisma.Client.delete.mockResolvedValueOnce(mockResult)

        const result = await repository.delete({ id: '1' })

        expect(mockPrisma.Client.delete).toHaveBeenCalledWith({
          where: { id: '1' }
        })
        expect(result).toEqual(mockResult)
      })
    })

    describe('count', () => {
      it('should call model count with correct where clause', async () => {
        mockPrisma.Client.count.mockResolvedValueOnce(5)

        const result = await repository.count({ active: true })

        expect(mockPrisma.Client.count).toHaveBeenCalledWith({
          where: { active: true }
        })
        expect(result).toBe(5)
      })

      it('should call count without where clause when not provided', async () => {
        mockPrisma.Client.count.mockResolvedValueOnce(10)

        const result = await repository.count()

        expect(mockPrisma.Client.count).toHaveBeenCalledWith({
          where: undefined
        })
        expect(result).toBe(10)
      })
    })

    describe('exists', () => {
      it('should return true when count > 0', async () => {
        mockPrisma.Client.count.mockResolvedValueOnce(1)

        const result = await repository.exists({ id: '1' })

        expect(result).toBe(true)
      })

      it('should return false when count = 0', async () => {
        mockPrisma.Client.count.mockResolvedValueOnce(0)

        const result = await repository.exists({ id: '1' })

        expect(result).toBe(false)
      })
    })

    describe('findOrCreate', () => {
      it('should return existing record when found', async () => {
        const existingRecord = { id: '1', name: 'Existing' }
        mockPrisma.Client.findFirst.mockResolvedValueOnce(existingRecord)

        const result = await repository.findOrCreate(
          { name: 'Existing' },
          { name: 'Existing', email: 'test@example.com' }
        )

        expect(mockPrisma.Client.findFirst).toHaveBeenCalledWith({
          where: { name: 'Existing' },
          include: undefined,
          select: undefined
        })
        expect(mockPrisma.Client.create).not.toHaveBeenCalled()
        expect(result).toEqual(existingRecord)
      })

      it('should create new record when not found', async () => {
        const createData = { name: 'New', email: 'new@example.com' }
        const newRecord = { id: '2', ...createData }
        
        mockPrisma.Client.findFirst.mockResolvedValueOnce(null)
        mockPrisma.Client.create.mockResolvedValueOnce(newRecord)

        const result = await repository.findOrCreate(
          { name: 'New' },
          createData
        )

        expect(mockPrisma.Client.findFirst).toHaveBeenCalled()
        expect(mockPrisma.Client.create).toHaveBeenCalledWith({
          data: createData,
          include: undefined,
          select: undefined
        })
        expect(result).toEqual(newRecord)
      })
    })

    describe('softDelete', () => {
      it('should update record with deletedAt timestamp', async () => {
        const mockResult = { id: '1', deletedAt: expect.any(Date) }
        mockPrisma.Client.update.mockResolvedValueOnce(mockResult)

        const result = await repository.softDelete({ id: '1' })

        expect(mockPrisma.Client.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: { deletedAt: expect.any(Date) }
        })
        expect(result).toEqual(mockResult)
      })
    })

    describe('findManyPaginated', () => {
      it('should return paginated results with correct metadata', async () => {
        const mockData = [{ id: '1' }, { id: '2' }]
        mockPrisma.Client.findMany.mockResolvedValueOnce(mockData)
        mockPrisma.Client.count.mockResolvedValueOnce(25)

        const result = await repository.findManyPaginated({
          where: { active: true },
          page: 2,
          limit: 10
        })

        expect(mockPrisma.Client.findMany).toHaveBeenCalledWith({
          where: { active: true },
          take: 10,
          skip: 10,
          include: undefined,
          select: undefined
        })
        
        expect(result).toEqual({
          data: mockData,
          pagination: {
            page: 2,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasMore: true
          }
        })
      })

      it('should use default pagination values', async () => {
        mockPrisma.Client.findMany.mockResolvedValueOnce([])
        mockPrisma.Client.count.mockResolvedValueOnce(5)

        const result = await repository.findManyPaginated()

        expect(mockPrisma.Client.findMany).toHaveBeenCalledWith({
          take: 10,
          skip: 0,
          include: undefined,
          select: undefined
        })
        
        expect(result.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1,
          hasMore: false
        })
      })
    })

    describe('Error Handling', () => {
      it('should throw error for non-existent model', () => {
        expect(() => {
          new GenericRepository('NonExistentModel')
        }).not.toThrow() // Constructor doesn't validate model existence

        // But accessing the model should throw
        const invalidRepo = new GenericRepository('NonExistentModel')
        expect(async () => {
          await invalidRepo.findMany()
        }).rejects.toThrow('Model NonExistentModel not found in Prisma client')
      })
    })
  })

  describe('createRepository', () => {
    it('should create repository with correct configuration', () => {
      const repo = createRepository(
        'Appointment',
        { client: true },
        { id: true, date: true }
      )

      expect(repo).toBeInstanceOf(GenericRepository)
    })
  })

  describe('dbUtils', () => {
    describe('transaction', () => {
      it('should execute transaction with callback', async () => {
        const mockResult = { success: true }
        mockPrisma.$transaction.mockImplementation(async (cb) => {
          return await cb(mockPrisma)
        })

        const result = await dbUtils.transaction(async (tx) => {
          await tx.Client.create({ data: { name: 'Test' } })
          return mockResult
        })

        expect(mockPrisma.$transaction).toHaveBeenCalled()
        expect(result).toEqual(mockResult)
      })
    })

    describe('disconnect', () => {
      it('should call prisma disconnect', async () => {
        await dbUtils.disconnect()

        expect(mockPrisma.$disconnect).toHaveBeenCalled()
      })
    })

    describe('queryRaw', () => {
      it('should execute raw query with values', async () => {
        const mockResult = [{ count: 5 }]
        mockPrisma.$queryRawUnsafe.mockResolvedValueOnce(mockResult)

        const result = await dbUtils.queryRaw(
          'SELECT COUNT(*) as count FROM clients WHERE active = ?',
          [true]
        )

        expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
          'SELECT COUNT(*) as count FROM clients WHERE active = ?',
          true
        )
        expect(result).toEqual(mockResult)
      })

      it('should execute raw query without values', async () => {
        const mockResult = []
        mockPrisma.$queryRawUnsafe.mockResolvedValueOnce(mockResult)

        const result = await dbUtils.queryRaw('SELECT 1')

        expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1')
        expect(result).toEqual(mockResult)
      })
    })

    describe('healthCheck', () => {
      it('should return true when database is healthy', async () => {
        mockPrisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }])

        const result = await dbUtils.healthCheck()

        expect(mockPrisma.$queryRaw).toHaveBeenCalled()
        expect(result).toBe(true)
      })

      it('should return false when database is unhealthy', async () => {
        mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Connection failed'))

        const result = await dbUtils.healthCheck()

        expect(result).toBe(false)
      })
    })
  })

  describe('Pre-configured Repositories', () => {
    it('should have clients repository with correct configuration', () => {
      expect(repositories.clients).toBeInstanceOf(GenericRepository)
    })

    it('should have appointments repository with correct configuration', () => {
      expect(repositories.appointments).toBeInstanceOf(GenericRepository)
    })

    it('should have sessions repository with correct configuration', () => {
      expect(repositories.sessions).toBeInstanceOf(GenericRepository)
    })

    it('should have artists repository with correct configuration', () => {
      expect(repositories.artists).toBeInstanceOf(GenericRepository)
    })
  })
})