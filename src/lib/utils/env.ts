/**
 * Environment utilities for secure environment variable access
 */

export function getEnvSafe(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  return value;
}

export function getEnvOptional(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

export function getEnvBoolean(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  return value.toLowerCase() === 'true' || value === '1';
}

export function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  const numValue = parseInt(value, 10);
  
  if (isNaN(numValue)) {
    throw new Error(`Environment variable ${key} must be a valid number, got: ${value}`);
  }
  
  return numValue;
}

// Common environment variables used in the admin dashboard
export const ENV = {
  // Database
  DATABASE_URL: getEnvSafe('DATABASE_URL'),
  
  // Auth
  BETTER_AUTH_URL: getEnvOptional('BETTER_AUTH_URL', 'http://localhost:3001'),
  BETTER_AUTH_SECRET: getEnvSafe('BETTER_AUTH_SECRET', 'fallback-secret-for-dev'),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: getEnvOptional('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getEnvOptional('GOOGLE_CLIENT_SECRET'),
  
  // Application
  NODE_ENV: getEnvOptional('NODE_ENV', 'development'),
  PORT: getEnvNumber('PORT', 3001),
  
  // External services
  UPLOADTHING_SECRET: getEnvOptional('UPLOADTHING_SECRET'),
  UPLOADTHING_APP_ID: getEnvOptional('UPLOADTHING_APP_ID'),
  
  // Stripe (for payments)
  STRIPE_SECRET_KEY: getEnvOptional('STRIPE_SECRET_KEY'),
  STRIPE_PUBLISHABLE_KEY: getEnvOptional('STRIPE_PUBLISHABLE_KEY'),
  STRIPE_WEBHOOK_SECRET: getEnvOptional('STRIPE_WEBHOOK_SECRET'),
} as const;

export const isDevelopment = ENV.NODE_ENV === 'development';
export const isProduction = ENV.NODE_ENV === 'production';
export const isTest = ENV.NODE_ENV === 'test';