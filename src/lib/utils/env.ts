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
  BETTER_AUTH_URL: getEnvSafe('BETTER_AUTH_URL'),
  BETTER_AUTH_SECRET: getEnvSafe('BETTER_AUTH_SECRET'),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: getEnvOptional('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getEnvOptional('GOOGLE_CLIENT_SECRET'),
  
  // Application
  NODE_ENV: getEnvOptional('NODE_ENV', 'production'),
  PORT: getEnvNumber('PORT', 3001),
  
  // External services
  UPLOADTHING_SECRET: getEnvOptional('UPLOADTHING_SECRET'),
  UPLOADTHING_APP_ID: getEnvOptional('UPLOADTHING_APP_ID'),
  
} as const;

export const isDevelopment = false;
export const isProduction = true;
export const isTest = false;
