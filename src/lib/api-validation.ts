import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { auth } from '@/lib/auth';
import { containsSuspiciousPatterns } from './sanitization';
import { createErrorResponse } from './error-handling';
import { Permission, isVerifiedAdmin, requirePermissions, BetterAuthUser, toBetterAuthUser } from './authorization';
import { withRateLimit, RateLimitConfig, RateLimitPresets } from './rate-limiter';
import { createRequestLogger, sanitizeError, logApiResponse } from './secure-logger';

// Legacy rate limiting function (replaced by new rate limiter)
// const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface ValidationConfig {
  bodySchema?: ZodSchema;
  querySchema?: ZodSchema;
  requireAuth?: boolean;
  requireAdmin?: boolean; // Legacy support
  requiredPermissions?: readonly Permission[];
  requireAllPermissions?: boolean; // If true, user must have ALL permissions; if false, ANY permission
  requireEmailVerification?: boolean;
  rateLimit?: RateLimitConfig | boolean; // Enhanced rate limiting
  allowedMethods?: readonly string[];
  requiredHeaders?: string[];
  maxBodySize?: number; // in bytes
  skipLogging?: boolean; // Skip request/response logging
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

// Enhanced security middleware
export function withSecurityValidation(config: ValidationConfig = {}) {
  return function (handler: (request: NextRequest, validatedData?: Record<string, unknown>) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const startTime = Date.now();
      const requestLogger = config.skipLogging ? null : createRequestLogger(request);
      
      try {
        // 1. Method validation
        if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
          return NextResponse.json(
            createErrorResponse('Method not allowed'),
            { status: 405 }
          );
        }

        // 2. Security headers validation
        const securityCheckResult = validateSecurityHeaders(request);
        if (!securityCheckResult.isValid) {
          return NextResponse.json(
            createErrorResponse(securityCheckResult.error || 'Security validation failed'),
            { status: 400 }
          );
        }

        // 3. Enhanced rate limiting
        if (config.rateLimit) {
          const rateLimitConfig = typeof config.rateLimit === 'boolean' 
            ? RateLimitPresets.API_READ 
            : config.rateLimit;
            
          const rateLimitCheck = withRateLimit(rateLimitConfig);
          const rateLimitResult = await rateLimitCheck(request);
          
          if (!rateLimitResult.allowed) {
            const response = NextResponse.json(
              createErrorResponse(rateLimitResult.error?.message || 'Too many requests'),
              { status: 429 }
            );
            
            // Add rate limit headers
            Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
            
            if (requestLogger) {
              requestLogger.warn('Rate limit exceeded', {
                url: request.url,
                method: request.method,
              });
            }
            
            return response;
          }
        }

        // 4. Enhanced authentication and authorization checks
        if (config.requireAuth || config.requireAdmin || config.requiredPermissions) {
          const authResult = await validateAuthentication(request, config);
          if (!authResult.isValid) {
            return NextResponse.json(
              createErrorResponse(authResult.error || 'Authentication failed'),
              { status: authResult.statusCode }
            );
          }
        }

        // 5. Content validation
        let validatedData: Record<string, unknown> = {};

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

        // 6. Required headers validation
        if (config.requiredHeaders) {
          const headerResult = validateRequiredHeaders(request, config.requiredHeaders);
          if (!headerResult.isValid) {
            return NextResponse.json(
              createErrorResponse(headerResult.error || 'Header validation failed'),
              { status: 400 }
            );
          }
        }

        // Execute the handler with validated data
        const response = await handler(request, validatedData);
        
        // Log successful response
        if (requestLogger && !config.skipLogging) {
          const duration = Date.now() - startTime;
          logApiResponse(requestLogger, response.status, null, duration);
        }
        
        return response;

      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (requestLogger) {
          requestLogger.error('API handler error', {
            error: sanitizeError(error),
            duration: `${duration}ms`,
            url: request.url,
            method: request.method,
          });
        } else {
          // Security validation error logged
        }
        
        return NextResponse.json(
          createErrorResponse('Internal server error'),
          { status: 500 }
        );
      }
    };
  };
}

// Security headers validation
function validateSecurityHeaders(request: NextRequest): { isValid: boolean; error?: string } {
  const userAgent = request.headers.get('user-agent') || '';
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';

  // Check for suspicious patterns in headers
  const suspiciousHeaders = [userAgent, origin, referer];
  for (const header of suspiciousHeaders) {
    if (containsSuspiciousPatterns(header)) {
      return { isValid: false, error: 'Suspicious request headers detected' };
    }
  }

  // Validate Content-Type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type') || '';
    const allowedContentTypes = [
      'application/json',
      'multipart/form-data',
      'application/x-www-form-urlencoded'
    ];
    
    if (!allowedContentTypes.some(type => contentType.includes(type))) {
      return { isValid: false, error: 'Invalid content type' };
    }
  }

  return { isValid: true };
}

// Legacy rate limiting function (replaced by enhanced rate limiter)
// Removed to avoid conflicts with new implementation

// Enhanced authentication and authorization validation
async function validateAuthentication(
  request: NextRequest, 
  config: ValidationConfig
): Promise<{ isValid: boolean; error: string; statusCode: number }> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return { 
        isValid: false, 
        error: 'Authentication required', 
        statusCode: 401 
      };
    }

    const user = toBetterAuthUser(session.user as BetterAuthUser);

    // Check email verification if required
    if (config.requireEmailVerification !== false && !user.emailVerified) {
      return { 
        isValid: false, 
        error: 'Email verification required', 
        statusCode: 403 
      };
    }

    // Legacy admin check
    if (config.requireAdmin && !isVerifiedAdmin(user)) {
      return { 
        isValid: false, 
        error: 'Admin access required', 
        statusCode: 403 
      };
    }

    // New permission-based authorization
    if (config.requiredPermissions && config.requiredPermissions.length > 0) {
      const authorizationValidator = requirePermissions(
        [...config.requiredPermissions],
        {
          requireAll: config.requireAllPermissions,
          requireEmailVerification: config.requireEmailVerification
        }
      );

      const authResult = authorizationValidator(user);
      if (!authResult.authorized) {
        return {
          isValid: false,
          error: authResult.error || 'Insufficient permissions',
          statusCode: 403
        };
      }
    }

    return { isValid: true, error: '', statusCode: 200 };
  } catch {
    return { 
      isValid: false, 
      error: 'Authentication validation failed', 
      statusCode: 401 
    };
  }
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
    
    // Additional security check for body content
    const bodyString = JSON.stringify(body);
    if (containsSuspiciousPatterns(bodyString)) {
      return { isValid: false, error: 'Request body contains suspicious content' };
    }

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
    
    // Security check for query parameters
    const queryString = request.nextUrl.search;
    if (containsSuspiciousPatterns(queryString)) {
      return { isValid: false, error: 'Query parameters contain suspicious content' };
    }

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

// Required headers validation
function validateRequiredHeaders(
  request: NextRequest, 
  requiredHeaders: string[]
): { isValid: boolean; error?: string } {
  for (const header of requiredHeaders) {
    const value = request.headers.get(header.toLowerCase());
    if (!value) {
      return { 
        isValid: false, 
        error: `Missing required header: ${header}` 
      };
    }
  }
  return { isValid: true };
}

// CSRF token validation helper
export function validateCSRFToken(request: NextRequest, expectedToken: string): boolean {
  const token = request.headers.get('x-csrf-token') || 
                request.headers.get('csrf-token') ||
                request.nextUrl.searchParams.get('csrf-token');
  
  return token === expectedToken;
}

// Content Security Policy validation
export function validateCSP(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type') || '';
  
  // Block requests with executable content types
  const blockedTypes = [
    'application/javascript',
    'text/javascript',
    'application/x-javascript',
    'text/vbscript',
    'application/vbscript'
  ];
  
  return !blockedTypes.some(type => contentType.includes(type));
}

// Enhanced file upload security validation
export function validateFileUpload(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  maxFilenameLength?: number;
} = {}): { isValid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/webm', 'video/quicktime'
    ],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm'],
    maxFilenameLength = 255
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return { isValid: false, error: `File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB` };
  }

  // Check minimum file size (prevent empty files)
  if (file.size < 100) {
    return { isValid: false, error: 'File is too small or empty' };
  }

  // Check filename length
  if (file.name.length > maxFilenameLength) {
    return { isValid: false, error: `Filename too long. Maximum ${maxFilenameLength} characters` };
  }

  // Check for dangerous filename patterns
  const dangerousPatterns = [
    /\.\./,           // Directory traversal
    /[\/\\]/,         // Path separators
    /\$\{/,           // Template injection
    /<%/,             // Server-side includes
    /\x00-\x1f/,      // Control characters
    /[<>:"|?*]/,      // Windows forbidden chars
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
    /^\./,            // Hidden files
    /\.$/             // Trailing dots
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(file.name)) {
      return { isValid: false, error: 'Invalid filename format' };
    }
  }

  // Check for suspicious patterns in filename
  if (containsSuspiciousPatterns(file.name)) {
    return { isValid: false, error: 'Filename contains suspicious content' };
  }

  // Validate MIME type
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }

  // Validate file extension against MIME type
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    return { isValid: false, error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}` };
  }

  // Cross-check MIME type with extension
  const mimeExtensionMap: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'video/mp4': ['.mp4'],
    'video/mov': ['.mov'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov']
  };

  const expectedExtensions = mimeExtensionMap[file.type];
  if (expectedExtensions && !expectedExtensions.includes(fileExtension)) {
    return { isValid: false, error: 'File extension does not match file type' };
  }

  return { isValid: true };
}

// Validate uploaded file content (magic number check)
export async function validateFileContent(file: File): Promise<{ isValid: boolean; error?: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for minimum file header
    if (bytes.length < 4) {
      return { isValid: false, error: 'File appears to be corrupted or empty' };
    }

    // Magic number validation for common file types
    const magicNumbers: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38], [0x47, 0x49, 0x46, 0x39]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header for WebP
      'video/mp4': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]], // ftyp box
      'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]] // EBML header
    };

    const expectedMagic = magicNumbers[file.type];
    if (expectedMagic) {
      const isValidMagic = expectedMagic.some(magic => 
        magic.every((byte, index) => bytes[index] === byte)
      );

      if (!isValidMagic) {
        return { isValid: false, error: 'File content does not match expected file type' };
      }
    }

    // Check for embedded executables or scripts
    const dangerousSignatures = [
      [0x4D, 0x5A], // PE executable (MZ)
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable
      [0xCF, 0xFA, 0xED, 0xFE], // Mach-O executable
      [0x50, 0x4B, 0x03, 0x04], // ZIP file (could contain executables)
    ];

    for (const signature of dangerousSignatures) {
      if (signature.every((byte, index) => bytes[index] === byte)) {
        return { isValid: false, error: 'File contains potentially dangerous content' };
      }
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Failed to validate file content' };
  }
}

// Export enhanced configuration presets with permission support
export const SecurityPresets = {
  PUBLIC_READ: {
    allowedMethods: ['GET'] as const,
    rateLimit: { windowMs: 60000, maxRequests: 100 }
  },
  
  AUTHENTICATED_READ: {
    allowedMethods: ['GET'] as const,
    requireAuth: true,
    rateLimit: { windowMs: 60000, maxRequests: 200 }
  },
  
  // Legacy admin write (for backward compatibility)
  ADMIN_WRITE: {
    allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'] as const,
    requireAuth: true,
    requireAdmin: true, // Legacy support
    rateLimit: { windowMs: 60000, maxRequests: 50 },
    maxBodySize: 5 * 1024 * 1024 // 5MB
  },
  
  // Legacy file upload (for backward compatibility)
  FILE_UPLOAD: {
    allowedMethods: ['POST'] as const,
    requireAuth: true,
    requireAdmin: true, // Legacy support
    rateLimit: { windowMs: 60000, maxRequests: 10 },
    maxBodySize: 100 * 1024 * 1024 // 100MB
  },

  // New permission-based presets
  DASHBOARD_READ: {
    allowedMethods: ['GET'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.READ_DASHBOARD],
    rateLimit: { windowMs: 60000, maxRequests: 200 }
  },

  CUSTOMER_READ: {
    allowedMethods: ['GET'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.READ_CUSTOMERS],
    rateLimit: { windowMs: 60000, maxRequests: 100 }
  },

  CUSTOMER_WRITE: {
    allowedMethods: ['POST', 'PUT', 'PATCH'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.CREATE_CUSTOMERS, Permission.UPDATE_CUSTOMERS],
    requireAllPermissions: false, // User needs ANY of these permissions
    rateLimit: { windowMs: 60000, maxRequests: 50 },
    maxBodySize: 1 * 1024 * 1024 // 1MB
  },

  CUSTOMER_DELETE: {
    allowedMethods: ['DELETE'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.DELETE_CUSTOMERS],
    rateLimit: { windowMs: 60000, maxRequests: 20 },
  },

  APPOINTMENT_READ: {
    allowedMethods: ['GET'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.READ_APPOINTMENTS],
    rateLimit: { windowMs: 60000, maxRequests: 100 }
  },

  APPOINTMENT_WRITE: {
    allowedMethods: ['POST', 'PUT', 'PATCH'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.CREATE_APPOINTMENTS, Permission.UPDATE_APPOINTMENTS],
    requireAllPermissions: false,
    rateLimit: { windowMs: 60000, maxRequests: 50 },
    maxBodySize: 1 * 1024 * 1024 // 1MB
  },

  PAYMENT_READ: {
    allowedMethods: ['GET'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.READ_PAYMENTS],
    rateLimit: { windowMs: 60000, maxRequests: 100 }
  },

  PAYMENT_WRITE: {
    allowedMethods: ['POST', 'PUT', 'PATCH'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.MANAGE_PAYMENTS],
    requireAllPermissions: false,
    rateLimit: { windowMs: 60000, maxRequests: 30 },
    maxBodySize: 512 * 1024 // 512KB
  },

  MEDIA_READ: {
    allowedMethods: ['GET'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.READ_MEDIA],
    rateLimit: { windowMs: 60000, maxRequests: 200 }
  },

  MEDIA_UPLOAD: {
    allowedMethods: ['POST'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.UPLOAD_MEDIA],
    rateLimit: { windowMs: 60000, maxRequests: 10 },
    maxBodySize: 100 * 1024 * 1024 // 100MB
  },

  ANALYTICS_READ: {
    allowedMethods: ['GET'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.READ_ANALYTICS],
    rateLimit: { windowMs: 60000, maxRequests: 50 }
  },

  SYSTEM_ADMIN: {
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const,
    requireAuth: true,
    requiredPermissions: [Permission.ADMIN_ACCESS],
    rateLimit: { windowMs: 60000, maxRequests: 100 },
    maxBodySize: 10 * 1024 * 1024 // 10MB
  }
} as const;