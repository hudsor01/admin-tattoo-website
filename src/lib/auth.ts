import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { PrismaClient } from "@prisma/client";
import { getAuthConfig } from "@/lib/env-validation";

// Use the main DATABASE_URL which is Prisma Accelerate compatible
const authPrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'info', 'warn'] : ['error']
});

console.log("Auth Prisma client initialized with default DATABASE_URL");

export const auth = betterAuth({
    database: prismaAdapter(authPrisma, { 
        provider: "postgresql" 
    }),
    emailAndPassword: { 
        enabled: true,
        requireEmailVerification: false, // Disable for admin setup
        minPasswordLength: 8,
        maxPasswordLength: 128,
    },
    socialProviders: {
        google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            scope: ["email", "profile"],
        } : undefined
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user",
            },
            lastLoginAt: {
                type: "date",
                required: false,
            },
            loginAttempts: {
                type: "number",
                defaultValue: 0,
            },
            isActive: {
                type: "boolean",
                defaultValue: true,
            }
        }
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 2, // Update session every 2 hours for security
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5 // 5 minutes
        }
    },
    cookies: {
        sessionToken: {
            name: "better-auth.session-token",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax", // Changed from strict to lax for better compatibility
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
        csrfToken: {
            name: "better-auth.csrf-token",
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24, // 24 hours
        }
    },
    baseURL: getAuthConfig().baseUrl,
    trustedOrigins: [
        "https://admin.ink37tattoos.com",
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
    ].filter((origin): origin is string => Boolean(origin)),
    ratelimit: {
        enabled: false, // Disable Better Auth rate limiting for admin dashboard
    },
    logger: {
        disabled: process.env.NODE_ENV === "production",
    },
    advanced: {
        generateId: () => `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        crossSubDomainCookies: {
            enabled: false,
        }
    },
    plugins: [
        nextCookies()
    ],
});
