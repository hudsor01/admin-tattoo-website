import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/database";

export const auth = betterAuth({
    database: prismaAdapter(prisma, { 
        provider: "postgresql" 
    }),
    emailAndPassword: { 
        enabled: true,
        requireEmailVerification: false, // Disable for admin setup
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user",
            }
        }
    },
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001",
    trustedOrigins: [
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
    ],
    plugins: [
        nextCookies() // Enables automatic cookie setting for server actions
    ],
});
