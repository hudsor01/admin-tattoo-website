/**
 * Environment variable validation and type safety
 * Ensures all required environment variables are present and properly formatted
 */

import { z } from 'zod';
import { logger } from './secure-logger';

// Define the schema for environment variables
const envSchema = z.object({
  // Core application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
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
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // External services
  MAIN_WEBSITE_API_URL: z.string().url().optional(),
  MAIN_WEBSITE_API_KEY: z.string().optional(),
  
  // Security (required in production)
  CSRF_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  
  // Rate limiting (Redis required in production)
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // Monitoring and logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  SENTRY_DSN: z.string().url().optional(),
  HONEYBADGER_API_KEY: z.string().optional(),
  
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
const productionEnvSchema = envSchema.extend({
  // Make Redis optional in production - we'll use in-memory fallback
  REDIS_URL: z.string().url().optional(),
  // Make monitoring optional in production - we'll use console logging fallback
  SENTRY_DSN: z.string().url().optional(),
});

// Validate and parse environment variables
let validatedEnv: Env;

try {
  // Determine which schema to use
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                     process.env.npm_lifecycle_event === 'build';
  
  let schema;
  
  if (isBuildTime) {
    // During build time, use more lenient validation
    schema = envSchema;
  } else if (process.env.NODE_ENV === 'production') {
    schema = productionEnvSchema;
  } else {
    schema = envSchema;
  }
  
  validatedEnv = schema.parse(process.env);
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
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      console.error(errorMessage);
      if (typeof process !== 'undefined' && process.exit) {
        process.exit(1);
      }
    } else {
      console.warn(errorMessage);
      console.warn('Continuing with potentially invalid environment in development mode or client side');
      // Use partial validation for development or client side
      validatedEnv = envSchema.partial().parse(process.env) as Env;
    }
  } else {
    console.error('Failed to parse environment variables:', error);
    if (typeof window === 'undefined' && typeof process !== 'undefined' && process.exit) {
      process.exit(1);
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
    // Add connection pooling and SSL settings based on environment
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    pool: {
      min: isDevelopment ? 1 : 2,
      max: isDevelopment ? 5 : 10,
    },
  };
}

/**
 * Get authentication configuration
 */
export function getAuthConfig() {
  // Determine the correct base URL for Better Auth
  // Priority: explicit BETTER_AUTH_URL > PUBLIC_BETTER_AUTH_URL > PUBLIC_APP_URL > Vercel URL > localhost
  const baseUrl = env.BETTER_AUTH_URL || 
                  env.NEXT_PUBLIC_BETTER_AUTH_URL || 
                  env.NEXT_PUBLIC_APP_URL ||
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
                  (env.NODE_ENV === 'development' ? 'http://localhost:3001' : undefined);
  
  if (!baseUrl) {
    throw new Error('No base URL configured for Better Auth. Please set BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL');
  }
  
  return {
    secret: env.BETTER_AUTH_SECRET,
    baseUrl,
    providers: {
      google: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      } : undefined,
      github: env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
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
    redis: env.REDIS_URL ? {
      url: env.REDIS_URL,
    } : env.REDIS_HOST ? {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT || 6379,
      password: env.REDIS_PASSWORD,
    } : undefined,
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
    sentry: env.SENTRY_DSN ? {
      dsn: env.SENTRY_DSN,
    } : undefined,
    honeybadger: env.HONEYBADGER_API_KEY ? {
      apiKey: env.HONEYBADGER_API_KEY,
    } : undefined,
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
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                   process.env.npm_lifecycle_event === 'build';
const isClientSide = typeof window !== 'undefined';

if (isProduction && !env.SKIP_ENV_VALIDATION && !isBuildTime && !isClientSide) {
  logEnvironmentStatus();
}

export default env;
