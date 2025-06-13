/**
 * Environment variable validation and type safety
 * Ensures all required environment variables are present and properly formatted
 */

import { z } from 'zod';
import { logger } from './secure-logger';

// Define the schema for environment variables
const envSchema = z.object({
  // Core application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  
  // Server configuration
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // Authentication
  BETTER_AUTH_SECRET: z.string().min(32, 'Auth secret must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url().optional(),
  
  // OAuth providers (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // External services
  MAIN_WEBSITE_API_URL: z.string().url().optional(),
  MAIN_WEBSITE_API_KEY: z.string().optional(),
  
  // Security (required in production)
  CSRF_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  
  // Monitoring and logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // File upload
  MAX_FILE_SIZE: z.string().regex(/^\d+$/).transform(Number).default('104857600'), // 100MB
  UPLOAD_DIR: z.string().default('./public/uploads'),
  
  // Analytics
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  
  // Feature flags
  ENABLE_REGISTRATION: z.string().transform(val => val === 'true').default('false'),
  ENABLE_EMAIL_VERIFICATION: z.string().transform(val => val === 'true').default('true'),
  ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_AUDIT_LOGGING: z.string().transform(val => val === 'true').default('true'),
  
  // Development only
  SKIP_ENV_VALIDATION: z.string().transform(val => val === 'true').default('false'),
});

export type Env = z.infer<typeof envSchema>;

// Production-specific schema with stricter requirements
const productionEnvSchema = z.object({
  // Core application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  
  // Server configuration
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // Authentication
  BETTER_AUTH_SECRET: z.string().min(32, 'Auth secret must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url().optional(),
  
  // OAuth providers (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // External services
  MAIN_WEBSITE_API_URL: z.string().url().optional(),
  MAIN_WEBSITE_API_KEY: z.string().optional(),
  
  // Security (required in production)
  CSRF_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  
  // Monitoring and logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // File upload
  MAX_FILE_SIZE: z.string().regex(/^\d+$/).transform(Number).default('104857600'), // 100MB
  UPLOAD_DIR: z.string().default('./public/uploads'),
  
  // Analytics
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  
  // Feature flags
  ENABLE_REGISTRATION: z.string().transform(val => val === 'true').default('false'),
  ENABLE_EMAIL_VERIFICATION: z.string().transform(val => val === 'true').default('true'),
  ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_AUDIT_LOGGING: z.string().transform(val => val === 'true').default('true'),
  
  // Development only
  SKIP_ENV_VALIDATION: z.string().transform(val => val === 'true').default('false'),
});

// Validate and parse environment variables
let validatedEnv: Env;

// Check if we're on the client side
const isClientSide = typeof window !== 'undefined';
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

if (isClientSide) {
  // On client side, use very minimal validation with safe defaults
  validatedEnv = {
    NODE_ENV: 'production',
    PORT: 3001,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: '', // Not available on client
    BETTER_AUTH_SECRET: '', // Not available on client
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: '', // Not available on client
    MAIN_WEBSITE_API_URL: process.env.MAIN_WEBSITE_API_URL,
    MAIN_WEBSITE_API_KEY: '', // Not available on client
    CSRF_SECRET: '', // Not available on client
    ENCRYPTION_KEY: '', // Not available on client
    LOG_LEVEL: 'info',
    MAX_FILE_SIZE: 104857600,
    UPLOAD_DIR: './public/uploads',
    GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    ENABLE_REGISTRATION: false,
    ENABLE_EMAIL_VERIFICATION: true,
    ENABLE_RATE_LIMITING: true,
    ENABLE_AUDIT_LOGGING: true,
    SKIP_ENV_VALIDATION: false,
  } as Env;
} else {
  // Server-side validation
  try {
    let schema;
    
    if (isBuildTime || process.env.SKIP_ENV_VALIDATION === 'true') {
      // During build time or when explicitly skipped, use very lenient validation
      schema = envSchema;
    } else if (process.env.NODE_ENV === 'production' && !isBuildTime) {
      schema = productionEnvSchema;
    } else {
      schema = envSchema;
    }
    
    validatedEnv = schema.parse(process.env) as Env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map(err => `${err.path.join('.')}: ${err.message}`);
      
      let errorMessage = 'Environment validation failed:\n';
      
      if (missingVars.length > 0) {
        errorMessage += `Missing required variables: ${missingVars.join(', ')}\n`;
      }
      
      if (invalidVars.length > 0) {
        errorMessage += `Invalid variables: ${invalidVars.join(', ')}\n`;
      }
      
      // Only crash in production on the server side
      if (process.env.NODE_ENV === 'production') {
        console.error(errorMessage);
        if (typeof process !== 'undefined' && process.exit) {
          process.exit(1);
        }
      } else {
        console.warn(errorMessage);
        console.warn('Continuing with potentially invalid environment');
        // Use partial validation for fallback
        validatedEnv = envSchema.partial().parse(process.env) as Env;
      }
    } else {
      console.error('Failed to parse environment variables:', error);
      if (typeof process !== 'undefined' && process.exit) {
        process.exit(1);
      }
    }
  }
}

/**
 * Validated environment variables
 * All variables are type-safe and validated
 */
export const env = validatedEnv!;

/**
 * Check if we're in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if we're in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Get database configuration
 */
export function getDatabaseConfig() {
  return {
    url: env.DATABASE_URL,
    // Production SSL settings
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    pool: {
      min: 2,
      max: 10,
    },
  };
}

/**
 * Get authentication configuration
 */
export function getAuthConfig() {
  // Determine the correct base URL for Better Auth
  // Priority: explicit BETTER_AUTH_URL > PUBLIC_APP_URL > Vercel URL > production fallback
  const baseUrl = process.env.BETTER_AUTH_URL || 
                  process.env.NEXT_PUBLIC_APP_URL ||
                  (process.env.VERCEL_URL === 'https://admin.ink37tattoos.com' ? process.env.VERCEL_URL : undefined) ||
                  'https://admin.ink37tattoos.com';
  
  return {
    secret: process.env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET,
    baseUrl,
    providers: {
      google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      } : undefined,
    },
  };
}

/**
 * Get rate limiting configuration
 */
export function getRateLimitConfig() {
  return {
    enabled: env.ENABLE_RATE_LIMITING,
    // Using in-memory store only - no Redis dependency
  };
}

/**
 * Get file upload configuration
 */
export function getUploadConfig() {
  return {
    maxFileSize: env.MAX_FILE_SIZE,
    uploadDir: env.UPLOAD_DIR,
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mov',
      'video/webm',
    ] as const,
  };
}

/**
 * Get logging configuration
 */
export function getLoggingConfig() {
  return {
    level: env.LOG_LEVEL,
    enableAuditLogging: env.ENABLE_AUDIT_LOGGING,
    // Using console logging only - no external monitoring services
  };
}

/**
 * Get external service configuration
 */
export function getExternalServiceConfig() {
  return {
    mainWebsite: env.MAIN_WEBSITE_API_URL && env.MAIN_WEBSITE_API_KEY ? {
      apiUrl: env.MAIN_WEBSITE_API_URL,
      apiKey: env.MAIN_WEBSITE_API_KEY,
    } : undefined,
  };
}

/**
 * Validate that sensitive environment variables are properly configured
 */
export function validateSecurityConfig(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let valid = true;
  
  // Check authentication secret strength
  if (env.BETTER_AUTH_SECRET.length < 64) {
    warnings.push('AUTH_SECRET should be at least 64 characters for better security');
  }
  
  // Check for development values in production
  if (isProduction) {
    if (env.BETTER_AUTH_SECRET.includes('development') || 
        env.BETTER_AUTH_SECRET.includes('localhost')) {
      warnings.push('AUTH_SECRET appears to contain development values in production');
      valid = false;
    }
    
    if (env.DATABASE_URL.includes('localhost') || 
        env.DATABASE_URL.includes('127.0.0.1') ||
        env.DATABASE_URL.includes(':5432@localhost')) {
      warnings.push('DATABASE_URL points to localhost in production');
      valid = false;
    }
    
    if (!env.DATABASE_URL.includes('ssl=true') && !env.DATABASE_URL.includes('sslmode')) {
      warnings.push('DATABASE_URL should use SSL in production');
    }
  }
  
  // No warnings for optional services in production - we have fallbacks
  
  return { valid, warnings };
}

/**
 * Log environment validation results
 */
export function logEnvironmentStatus(): void {
  const { valid, warnings } = validateSecurityConfig();
  
  logger.info('Environment validation completed', {
    nodeEnv: env.NODE_ENV,
    valid,
    warningCount: warnings.length,
  });
  
  if (warnings.length > 0) {
    warnings.forEach(warning => {
      logger.warn(`Environment warning: ${warning}`);
    });
  }
  
  if (!valid && isProduction && typeof window === 'undefined') {
    logger.error('Critical environment issues detected in production');
    throw new Error('Environment validation failed for production deployment');
  }
}

// Automatically validate on import in production (but not during build or on client side)
if (isProduction && !env.SKIP_ENV_VALIDATION && !isBuildTime && !isClientSide) {
  logEnvironmentStatus();
}

export default env;
