'use client';

import { logger } from "@/lib/logger";

/**
 * Utility Hooks and Helper Functions
 * 
 * Production-ready utility functions for React hooks:
 * - Error handling utilities
 * - String handling utilities
 * - Type checking utilities
 * - Object manipulation utilities
 */

/**
 * Comprehensive error handler for callbacks
 * Provides detailed error reporting and integrates with monitoring
 */
export function handleCallbackError(
  error: unknown, 
  context: { 
    callback: unknown; 
    args: unknown[]; 
    context?: string;
  }
): void {
  // Preserve the original error stack
  void logger.error(`Callback execution failed in ${context.context ?? 'unknown context'}:`, error);
  
  // Normalize the error to standard Error object
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  
  // Capture error source
  const errorSource = new Error().stack?.split('\n').slice(2).join('\n');
  
  // Extract error details for better debugging
  const errorInfo = {
    message: normalizedError.message,
    stack: normalizedError.stack,
    
    // Handle Error.cause safely (ES2022 feature)
    cause: hasErrorCause(normalizedError) ? normalizedError.cause : undefined,
    
    componentStack: errorSource,
    callbackName: typeof context.callback === 'function' 
      ? context.callback.name ?? 'anonymous' 
      : 'not-a-function',
    timestamp: new Date().toISOString(),
    context: context.context ?? 'unknown',
    
    // Safely stringify args with circular reference handling
    args: safeStringify(context.args)
  };
  
  // Send to error monitoring service in production (Sentry, LogRocket, etc.)
  // errorMonitoringService.captureError(normalizedError, errorInfo);
  
  // Log detailed info for development
  if (process.env.NODE_ENV !== 'production') {
    void logger.error('Error details:', errorInfo);
  }
}

/**
 * Type guard to check if an Error has the cause property (ES2022)
 */
export function hasErrorCause(error: Error): error is Error & { cause: unknown } {
  return 'cause' in error;
}

/**
 * Safely stringify objects with circular references and function handling
 */
export function safeStringify(obj: unknown, maxLength = 200): string {
  const seen = new WeakSet();
  const stringified = JSON.stringify(obj, (key, value) => {
    // Handle special types
    if (typeof value === 'function') return '[Function]';
    if (value instanceof Error) return `[Error: ${value.message}]`;
    if (value instanceof Date) return value.toISOString();
    if (value instanceof RegExp) return value.toString();
    if (value instanceof Map) return `[Map: ${value.size} entries]`;
    if (value instanceof Set) return `[Set: ${value.size} entries]`;
    
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    
    return value;
  });
  
  return stringified ? stringified.slice(0, maxLength) + (stringified.length > maxLength ? '...' : '') : 'undefined';
}

/**
 * Deep equality comparison utility
 * 
 * Performs a proper deep comparison between two values
 * Handles objects, arrays, primitives, and special cases
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  // Handle identical references and primitive equality
  if (a === b) return true;
  
  // Handle null/undefined cases
  if (a === null || a === undefined || b === null || b === undefined) return a === b;
  
  // Handle different types
  if (typeof a !== typeof b) return false;
  
  // Handle different primitive values
  if (typeof a !== 'object') return a === b;
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  // Handle RegExp objects
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }
  
  // Handle plain objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * A type-safe shallow equality comparison function for objects
 * Used as fallback when no custom comparison is provided
 */
export function shallowEqual(objA: unknown, objB: unknown): boolean {
  // Same reference or same primitive value
  if (Object.is(objA, objB)) {
    return true;
  }
  
  // If either isn't an object (including null check)
  if (typeof objA !== 'object' || objA === null ||
      typeof objB !== 'object' || objB === null) {
    return false;
  }
  
  // Safely cast to records after type check
  const objARecord = objA as Record<string, unknown>;
  const objBRecord = objB as Record<string, unknown>;
  
  const keysA = Object.keys(objARecord);
  const keysB = Object.keys(objBRecord);
  
  // Different number of keys
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  // Check each key and value for equality
  return keysA.every(key => (
    Object.prototype.hasOwnProperty.call(objBRecord, key) &&
    Object.is(objARecord[key], objBRecord[key])
  ));
}

/**
 * Preload an image to browser cache for faster rendering
 */
export function preloadImage(url: string): void {
  if (typeof window === 'undefined') return;
  
  const img = new Image();
  img.src = url;
}