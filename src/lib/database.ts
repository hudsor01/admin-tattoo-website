import { PrismaClient } from '@prisma/client'
import { env, isProduction, isDevelopment } from './env-validation'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  })

if (!isProduction) globalForPrisma.prisma = prisma

// Enhanced error handling for database connections
if (isDevelopment) {
  prisma.$on('error' as never, (e) => {
    console.error('Database error:', e)
  })
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown handling
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error disconnecting from database:', error)
  }
}

// Setup graceful shutdown
if (isProduction) {
  process.on('SIGTERM', disconnectDatabase)
  process.on('SIGINT', disconnectDatabase)
}