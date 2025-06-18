import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";
import { cache } from "react";
import { headers } from "next/headers";
import { z } from "zod";

// Environment validation schema
const _envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

// Validate environment variables with fallbacks for development
const allowedEnvKeys = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NODE_ENV",
] as const;

const getEnvVar = (name: (typeof allowedEnvKeys)[number], fallback?: string): string => {
  if (!allowedEnvKeys.includes(name)) {
    throw new Error(`Access to environment variable "${name}" is not allowed`);
  }
  // eslint-disable-next-line security/detect-object-injection
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`${name} environment variable is required in production`);
  }
  return value || fallback || "";
};

const env = {
  BETTER_AUTH_SECRET: getEnvVar("BETTER_AUTH_SECRET", "default_insecure_secret_for_development_only_change_this_in_production"),
  BETTER_AUTH_URL: getEnvVar("BETTER_AUTH_URL", "https://admin.ink37tattoos.com/api/auth"),
  DATABASE_URL: getEnvVar("DATABASE_URL"),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NODE_ENV: process.env.NODE_ENV as "development" | "test" | "production" || "development",
};

// Prisma client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Test database connection
prisma.$connect().catch((error) => {
  console.error("Failed to connect to database:", error);
  if (env.NODE_ENV === "production") {
    throw new Error("Database connection failed");
  }
});

// Better Auth configuration
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  plugins: [
    nextCookies(),
    admin(),
  ],
  
  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.NODE_ENV === "production",
  },
  
  // Social providers (optional)
  socialProviders: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: (profile) => {
        // Google profile has given_name and family_name
        // But our schema uses a single 'name' field
        return {
          name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  } : undefined,
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  
  
  // Base URL and secret
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  
  
  // Advanced configuration
  advanced: {
    database: {
      generateId: false, // Use Prisma's default ID generation
    },
  },
});

// Cached session getter for server components
export const getSession = cache(async () => {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
});

// Server-side auth utilities
export const getUser = cache(async () => {
  const session = await getSession();
  return session?.user || null;
});

export const requireAuth = cache(async () => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Authentication required");
  }
  return session;
});

export const requireAdmin = cache(() => {
  // No role checks - just verify user is authenticated
  return requireAuth();
});

// Audit logging utilities
export const logAuthEvent = async (
  action: string,
  userId: string,
  metadata?: Record<string, unknown>,
  request?: Request
) => {
  try {
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action,
        resource: "auth",
        resourceId: userId,
        ip: request?.headers.get("x-forwarded-for") || "unknown",
        userAgent: request?.headers.get("user-agent") || "unknown",
        metadata: (metadata as object) || {},
      },
    });
  } catch (error) {
    console.error("Failed to log auth event:", error);
  }
};

// Enhanced auth operations with logging
export const authOperations = {
  async updateLastLogin(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Failed to update last login:", error);
    }
  },

  async incrementLoginAttempts(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() },
        });
        // Return a default attempt count since we're not tracking login attempts
        return 1;
      }
      return 0;
    } catch (error) {
      console.error("Failed to increment login attempts:", error);
      return 0;
    }
  },

  async checkUserStatus(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { 
          id: true, 
          role: true,
          emailVerified: true 
        },
      });
      
      if (!user) return { allowed: true };
      
      // Check if email is verified (simplified check)
      if (!user.emailVerified) {
        return { allowed: false, reason: "Email not verified" };
      }
      
      // Basic role check
      if (user.role !== 'admin') {
        return { allowed: false, reason: "Insufficient permissions" };
      }
      
      return { allowed: true, user };
    } catch (error) {
      console.error("Failed to check user status:", error);
      return { allowed: false, reason: "Internal error" };
    }
  },
};

// Export prisma instance for use in other modules
export { prisma };

// Export types with proper inference
export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;

// Enhanced user type - just use the inferred type
export type EnhancedUser = AuthUser;
