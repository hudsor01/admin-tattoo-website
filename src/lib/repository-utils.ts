import { prisma } from '@/lib/database';
import { Prisma } from '@prisma/client';

/**
 * Generic repository pattern for common database operations
 * Reduces duplication in database operations
 */
export class GenericRepository<
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereUniqueInput = { id: string },
  TWhereInput = any,
  TOrderByInput = any
> {
  constructor(
    private modelName: Prisma.ModelName,
    private defaultInclude?: any,
    private defaultSelect?: any
  ) {}

  /**
   * Get model delegate from prisma client
   */
  private get model() {
    return (prisma as any)[this.modelName];
  }

  /**
   * Find many records with filters
   */
  async findMany(options: {
    where?: TWhereInput;
    orderBy?: TOrderByInput;
    include?: any;
    select?: any;
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
      include?: any;
      select?: any;
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
      include?: any;
      select?: any;
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
      include?: any;
      select?: any;
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
      include?: any;
      select?: any;
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
      include?: any;
      select?: any;
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
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereUniqueInput = { id: string },
  TWhereInput = any,
  TOrderByInput = any
>(
  modelName: Prisma.ModelName,
  defaultInclude?: any,
  defaultSelect?: any
) {
  return new GenericRepository<
    TModel,
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
  async transaction<T>(operations: (tx: typeof prisma) => Promise<T>): Promise<T> {
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
  async queryRaw<T = unknown>(query: string, values?: any[]): Promise<T> {
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
    'client',
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
    'appointment',
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
    'tattooSession',
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
    'tattooArtist',
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
