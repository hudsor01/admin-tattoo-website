import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

// Optimized Prisma client configuration
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// Single instance pattern
export const prismaClient = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prismaClient;
}

// Graceful shutdown handler
if (typeof window === "undefined") {
  process.on("beforeExit", async () => {
    await prismaClient.$disconnect();
  });
  
  process.on("SIGINT", async () => {
    await prismaClient.$disconnect();
    process.exit(0);
  });
  
  process.on("SIGTERM", async () => {
    await prismaClient.$disconnect();
    process.exit(0);
  });
}

// Re-export for compatibility
export const prisma = prismaClient;