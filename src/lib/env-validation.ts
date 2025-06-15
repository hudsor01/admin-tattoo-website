/**
 * Simplified environment variable validation
 */

import { z } from 'zod';

// Simple schema for all environments
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  
  // Required in all environments
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  
  // Optional but recommended
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Optional external services
  MAIN_WEBSITE_API_URL: z.string().optional(),
  MAIN_WEBSITE_API_KEY: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  CSRF_SECRET: z.string().min(32).optional(),
  
  // Feature flags with sensible defaults
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  MAX_FILE_SIZE: z.coerce.number().default(104857600), // 100MB
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
    console.error(`❌ Environment validation failed: ${missingVars}`);
    
    // Only exit in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    // Fall back to partial validation in development
    console.warn('⚠️  Continuing with potentially invalid environment in development');
    validatedEnv = envSchema.partial().parse(process.env) as Env;
  } else {
    throw error;
  }
}

export const env = validatedEnv;

// Simple environment checks
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Simple configuration getters
export function getAuthConfig() {
  return {
    secret: env.BETTER_AUTH_SECRET,
    baseUrl: env.NEXT_PUBLIC_APP_URL || (isProduction ? 'https://admin.ink37tattoos.com' : `http://localhost:${env.PORT}`),
  };
}

export function getUploadConfig() {
  return {
    maxFileSize: env.MAX_FILE_SIZE,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'] as const,
  };
}

export default env;