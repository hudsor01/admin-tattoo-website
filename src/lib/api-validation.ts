import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';
import { z } from 'zod';
import { createErrorResponse } from './api-core';

export interface ValidationConfig {
  bodySchema?: ZodSchema;
  querySchema?: ZodSchema;
  allowedMethods?: readonly string[];
  maxBodySize?: number;
}

// Simple validation middleware for basic request validation
export function withValidation(config: ValidationConfig = {}) {
  return function (handler: (request: NextRequest, validatedData?: Record<string, unknown>) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      try {
        // Method validation
        if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
          return NextResponse.json(
            createErrorResponse('Method not allowed'),
            { status: 405 }
          );
        }

        // Content validation
        const validatedData: Record<string, unknown> = {};

        // Body validation
        if (config.bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const bodyResult = await validateRequestBody(request, config.bodySchema, config.maxBodySize);
          if (!bodyResult.isValid) {
            return NextResponse.json(
              createErrorResponse(bodyResult.error || 'Body validation failed'),
              { status: 400 }
            );
          }
          validatedData.body = bodyResult.data;
        }

        // Query validation
        if (config.querySchema) {
          const queryResult = validateQueryParams(request, config.querySchema);
          if (!queryResult.isValid) {
            return NextResponse.json(
              createErrorResponse(queryResult.error || 'Query validation failed'),
              { status: 400 }
            );
          }
          validatedData.query = queryResult.data;
        }

        // Execute the handler with validated data
        const response = await handler(request, validatedData);
        
        return response;

      } catch (error) {
        console.error('API validation error:', error);
        return NextResponse.json(
          createErrorResponse('Internal server error'),
          { status: 500 }
        );
      }
    };
  };
}

// Request body validation
async function validateRequestBody(
  request: NextRequest, 
  schema: ZodSchema,
  maxSize = 1024 * 1024 // 1MB default
): Promise<{ isValid: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      return { isValid: false, error: 'Request body too large' };
    }

    const body = await request.json();
    const validatedData = schema.parse(body);
    return { isValid: true, data: validatedData };

  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        isValid: false, 
        error: `Validation error: ${firstError?.message || 'Unknown validation error'}` 
      };
    }
    return { isValid: false, error: 'Invalid request body format' };
  }
}

// Query parameters validation
function validateQueryParams(
  request: NextRequest, 
  schema: ZodSchema
): { isValid: boolean; data?: Record<string, unknown>; error?: string } {
  try {
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    
    const validatedData = schema.parse(queryObject);
    return { isValid: true, data: validatedData };

  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        isValid: false, 
        error: `Query validation error: ${firstError?.message || 'Unknown validation error'}` 
      };
    }
    return { isValid: false, error: 'Invalid query parameters' };
  }
}

// Simple security presets
export const ValidationPresets = {
  PUBLIC_READ: {
    allowedMethods: ['GET'] as const,
  },
  
  PUBLIC_WRITE: {
    allowedMethods: ['POST', 'PUT', 'PATCH'] as const,
    maxBodySize: 1 * 1024 * 1024 // 1MB
  },

  FILE_UPLOAD: {
    allowedMethods: ['POST'] as const,
    maxBodySize: 10 * 1024 * 1024 // 10MB
  },

  // Additional presets for admin routes
  ANALYTICS_READ: {
    allowedMethods: ['GET'] as const,
  },

  APPOINTMENT_READ: {
    allowedMethods: ['GET'] as const,
  },

  CUSTOMER_READ: {
    allowedMethods: ['GET'] as const,
  },

  CUSTOMER_WRITE: {
    allowedMethods: ['POST', 'PUT', 'PATCH'] as const,
    maxBodySize: 1 * 1024 * 1024 // 1MB
  },

  DASHBOARD_READ: {
    allowedMethods: ['GET'] as const,
  },

  MEDIA_READ: {
    allowedMethods: ['GET'] as const,
  },

  MEDIA_UPLOAD: {
    allowedMethods: ['POST'] as const,
    maxBodySize: 10 * 1024 * 1024 // 10MB
  },

  SYSTEM_ADMIN: {
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const,
    maxBodySize: 10 * 1024 * 1024 // 10MB
  }
} as const;

// Alias for backward compatibility with existing API routes
export const SecurityPresets = ValidationPresets;

// Alias for existing withValidation function
export const withSecurityValidation = withValidation;

// File validation functions for media uploads
export function validateFileUpload(file: File, options?: { maxSize?: number; allowedTypes?: string[]; maxFilenameLength?: number; allowedExtensions?: string[] }): { isValid: boolean; error?: string } {
  const allowedTypes = options?.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File too large. Maximum size is 10MB.' };
  }

  return { isValid: true };
}

export async function validateFileContent(file: File): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Basic file signature validation
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for basic image file signatures
    if (file.type === 'image/jpeg' && (bytes[0] !== 0xFF || bytes[1] !== 0xD8)) {
      return { isValid: false, error: 'Invalid JPEG file signature' };
    }

    if (file.type === 'image/png' && 
        (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47)) {
      return { isValid: false, error: 'Invalid PNG file signature' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Failed to validate file content' };
  }
}