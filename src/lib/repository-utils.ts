import { prisma } from '@/lib/database';
import type { Prisma } from '@prisma/client';
import { env, isProduction } from '@/lib/env-validation';

// Redis client for production
let redis: unknown = null;

// Initialize Redis in production
async function getRedisClient() {
  if (!isProduction) return null;
  
  if (!redis && env.REDIS_URL) {
    try {
      const { Redis } = await import('ioredis');
      redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      await (redis as {ping(): Promise<string>}).ping();
    } catch {
      // Redis connection failed, using memory cache fallback
      redis = null;
    }
  }
  
  return redis;
}

// Simple in-memory cache fallback
const memoryCache = new Map<string, { data: unknown; timestamp: number }>();

// Cache TTL constants in milliseconds
export const CACHE_TTL = {
  DASHBOARD_STATS: 5 * 60 * 1000, // 5 minutes
  RECENT_APPOINTMENTS: 1 * 60 * 1000, // 1 minute
  DEFAULT: 5 * 60 * 1000 // 5 minutes
};

// Generic caching wrapper with Redis support
export function withCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyFn: (...args: TArgs) => string,
  ttl: number = CACHE_TTL.DEFAULT
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const key = keyFn(...args);
    const now = Date.now();
    
    // Try Redis first in production
    const redisClient = await getRedisClient();
    if (redisClient) {
      try {
        const cached = await (redisClient as {get(key: string): Promise<string | null>}).get(key);
        if (cached) {
          return JSON.parse(cached) as TResult;
        }
      } catch {
        // Redis operation failed, using memory cache fallback
      }
    }
    
    // Fallback to memory cache
    const cached = memoryCache.get(key);
    if (cached && now - cached.timestamp < ttl) {
      return cached.data as TResult;
    }
    
    // Call function and cache result
    const result = await fn(...args);
    
    // Store in Redis if available
    if (redisClient) {
      try {
        await (redisClient as {setex(key: string, seconds: number, value: string): Promise<unknown>}).setex(key, Math.floor(ttl / 1000), JSON.stringify(result));
      } catch {
        // Redis set operation failed
      }
    }
    
    // Always store in memory cache as fallback
    memoryCache.set(key, { data: result, timestamp: now });
    
    return result;
  };
}

// Clear cache utility
export async function clearCache(pattern?: string) {
  const redisClient = await getRedisClient();
  
  if (redisClient) {
    try {
      if (pattern) {
        const keys = await (redisClient as {keys(pattern: string): Promise<string[]>}).keys(`*${pattern}*`);
        if (keys.length > 0) {
          await (redisClient as {del(...keys: string[]): Promise<number>}).del(...keys);
        }
      } else {
        await (redisClient as {flushdb(): Promise<string>}).flushdb();
      }
    } catch {
      // Redis clear operation failed
    }
  }
  
  // Clear memory cache
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  
  // Clear entries matching pattern
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
}

// Generic type for Prisma model delegates
type PrismaModelDelegate = {
  findMany: (args?: unknown) => Promise<unknown[]>;
  findUnique: (args: { where: unknown; include?: unknown; select?: unknown }) => Promise<unknown | null>;
  findFirst: (args: { where: unknown; include?: unknown; select?: unknown }) => Promise<unknown | null>;
  create: (args: { data: unknown; include?: unknown; select?: unknown }) => Promise<unknown>;
  update: (args: { where: unknown; data: unknown; include?: unknown; select?: unknown }) => Promise<unknown>;
  delete: (args: { where: unknown }) => Promise<unknown>;
  count: (args?: { where?: unknown }) => Promise<number>;
};

export class GenericRepository<
  TCreateInput,
  TUpdateInput,
  TWhereUniqueInput = { id: string },
  TWhereInput = Record<string, unknown>,
  TOrderByInput = Record<string, unknown>
> {
  constructor(
    private modelName: Prisma.ModelName,
    private defaultInclude?: Record<string, unknown>,
    private defaultSelect?: Record<string, unknown>
  ) {}

  /**
   * Get model delegate from prisma client
   */
  private get model(): PrismaModelDelegate {
    const modelDelegate = (prisma as unknown as Record<string, PrismaModelDelegate>)[this.modelName];
    if (!modelDelegate) {
      throw new Error(`Model ${this.modelName} not found in Prisma client`);
    }
    return modelDelegate;
  }

  /**
   * Find many records with filters
   */
  async findMany(options: {
    where?: TWhereInput;
    orderBy?: TOrderByInput;
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
    take?: number;
    skip?: number;
  } = {}) {
    return this.model.findMany({
      include: options.include || this.defaultInclude,
      select: options.select || this.defaultSelect,
      ...options,
    });
  }

  /**
   * Find unique record
   */
  async findUnique(
    where: TWhereUniqueInput,
    options: {
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
    } = {}
  ) {
    return this.model.findUnique({
      where,
      include: options.include || this.defaultInclude,
      select: options.select || this.defaultSelect,
    });
  }

  /**
   * Create new record
   */
  async create(
    data: TCreateInput,
    options: {
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
    } = {}
  ) {
    return this.model.create({
      data,
      include: options.include || this.defaultInclude,
      select: options.select || this.defaultSelect,
    });
  }

  /**
   * Update record
   */
  async update(
    where: TWhereUniqueInput,
    data: TUpdateInput,
    options: {
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
    } = {}
  ) {
    return this.model.update({
      where,
      data,
      include: options.include || this.defaultInclude,
      select: options.select || this.defaultSelect,
    });
  }

  /**
   * Delete record
   */
  async delete(where: TWhereUniqueInput) {
    return this.model.delete({ where });
  }

  /**
   * Count records
   */
  async count(where?: TWhereInput) {
    return this.model.count({ where });
  }

  /**
   * Check if record exists
   */
  async exists(where: TWhereInput): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Find or create record
   */
  async findOrCreate(
    where: TWhereInput,
    createData: TCreateInput,
    options: {
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
    } = {}
  ) {
    let record = await this.model.findFirst({
      where,
      include: options.include || this.defaultInclude,
      select: options.select || this.defaultSelect,
    });

    if (!record) {
      record = await this.create(createData, options);
    }

    return record;
  }

  /**
   * Soft delete (if deletedAt field exists)
   */
  async softDelete(where: TWhereUniqueInput) {
    return this.model.update({
      where,
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Paginated results
   */
  async findManyPaginated(
    options: {
      where?: TWhereInput;
      orderBy?: TOrderByInput;
      include?: Record<string, unknown>;
      select?: Record<string, unknown>;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.findMany({
        ...options,
        take: limit,
        skip,
      }),
      this.count(options.where),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    };
  }
}

/**
 * Utility function to create typed repository instances
 */
export function createRepository<
  TCreateInput,
  TUpdateInput,
  TWhereUniqueInput = { id: string },
  TWhereInput = Record<string, unknown>,
  TOrderByInput = Record<string, unknown>
>(
  modelName: Prisma.ModelName,
  defaultInclude?: Record<string, unknown>,
  defaultSelect?: Record<string, unknown>
) {
  return new GenericRepository<
    TCreateInput,
    TUpdateInput,
    TWhereUniqueInput,
    TWhereInput,
    TOrderByInput
  >(modelName, defaultInclude, defaultSelect);
}

/**
 * Common database utilities
 */
export const dbUtils = {
  /**
   * Execute multiple operations in a transaction
   */
  async transaction<T>(operations: (tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>): Promise<T> {
    return prisma.$transaction(operations);
  },

  /**
   * Disconnect from database
   */
  async disconnect() {
    await prisma.$disconnect();
  },

  /**
   * Execute raw query
   */
  async queryRaw<T = unknown>(query: string, values?: unknown[]): Promise<T> {
    return prisma.$queryRawUnsafe(query, ...(values || []));
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Pre-configured repositories for common models
 */
export const repositories = {
  clients: createRepository(
    'Client',
    {
      appointments: {
        select: {
          id: true,
          scheduledDate: true,
          status: true,
        },
      },
      sessions: {
        select: {
          id: true,
          appointmentDate: true,
          status: true,
        },
      },
      _count: {
        select: {
          appointments: true,
          sessions: true,
        },
      },
    }
  ),

  appointments: createRepository(
    'Appointment',
    {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      artist: {
        select: {
          id: true,
          name: true,
        },
      },
    }
  ),

  sessions: createRepository(
    'TattooSession',
    {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      artist: {
        select: {
          id: true,
          name: true,
        },
      },
    }
  ),

  artists: createRepository(
    'TattooArtist',
    {
      _count: {
        select: {
          appointments: true,
          sessions: true,
        },
      },
    }
  ),
};
