import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/database";
import { env, getAuthConfig } from "@/lib/env-validation";

export const auth = betterAuth({
    database: prismaAdapter(prisma, { 
        provider: "postgresql" 
    }),
    emailAndPassword: { 
        enabled: true,
        requireEmailVerification: false, // Disable for admin setup
        minPasswordLength: 8,
        maxPasswordLength: 128,
    },
    socialProviders: {
        google: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
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
            name: "__Secure-ink37-session",
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "strict", // More secure than lax for admin panel
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            domain: env.NODE_ENV === "production" ? ".ink37tattoos.com" : undefined
        },
        // Additional CSRF token cookie
        csrfToken: {
            name: "__Host-csrf-token",
            httpOnly: false, // Accessible to JavaScript for CSRF protection
            secure: env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24, // 24 hours
        }
    },
    baseURL: getAuthConfig().baseUrl,
    trustedOrigins: [
        env.NEXT_PUBLIC_APP_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
        "https://admin.ink37tattoos.com"
    ].filter((origin): origin is string => Boolean(origin)),
    ratelimit: {
        enabled: true,
        window: 60, // 1 minute
        max: 100, // 100 requests per minute
    },
    logger: {
        disabled: env.NODE_ENV === "production",
    },
    advanced: {
        generateId: () => `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        crossSubDomainCookies: {
            enabled: false, // We're using a single domain
        }
    },
    plugins: [
        nextCookies() // Enables automatic cookie setting for server actions
    ],
});
