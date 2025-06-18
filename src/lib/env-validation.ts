/**
 * Simplified environment variable validation
 */

import { z } from 'zod';

// Create environment-specific schema
const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  
  // Required in all environments
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  
  // Feature flags with sensible defaults
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  MAX_FILE_SIZE: z.coerce.number().default(104857600), // 100MB
});

const developmentSchema = baseSchema.extend({
  // Optional in development
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MAIN_WEBSITE_API_URL: z.string().optional(),
  MAIN_WEBSITE_API_KEY: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  CSRF_SECRET: z.string().min(32).optional(),
});

const productionSchema = baseSchema.extend({
  // Required in production for security
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL in production'),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters in production'),
  
  // Recommended in production
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID recommended for production OAuth'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET required when GOOGLE_CLIENT_ID is set'),
  
  // Optional external services
  MAIN_WEBSITE_API_URL: z.string().optional(),
  MAIN_WEBSITE_API_KEY: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

// Select schema based on environment
const envSchema = process.env.NODE_ENV === 'production' ? productionSchema : developmentSchema;

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
    const errorMessage = `Environment validation failed: ${missingVars}`;
    
    // Use structured logging for production
    if (process.env.NODE_ENV === 'production') {
      // Write to stderr for container logging systems
      const logOutput = `${JSON.stringify({
        level: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        service: 'admin-tattoo-website',
        validationErrors: error.errors
      })}\n`;
      process.stderr.write(logOutput);
      
      process.exit(1);
    } else {
      // Development-friendly console output
      console.error(`❌ ${errorMessage}`);
      console.warn('⚠️  Continuing with potentially invalid environment in development');
      
      // Fall back to partial validation in development only
      validatedEnv = envSchema.partial().parse(process.env) as Env;
    }
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