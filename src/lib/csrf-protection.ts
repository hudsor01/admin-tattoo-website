/**
 * CSRF (Cross-Site Request Forgery) protection implementation
 * Generates and validates CSRF tokens to prevent unauthorized requests
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';
import { env } from './env-validation';
import { logger } from './logger';

// CSRF token configuration
const CSRF_CONFIG = {
  tokenLength: 32,
  maxAge: 60 * 60 * 1000, // 1 hour
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  secretKey: env.CSRF_SECRET || env.BETTER_AUTH_SECRET.substring(0, 64),
} as const;

export interface CSRFTokenData {
  token: string;
  expires: number;
  sessionId?: string;
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(sessionId?: string): CSRFTokenData {
  const randomToken = randomBytes(CSRF_CONFIG.tokenLength).toString('hex');
  const timestamp = Date.now();
  const expires = timestamp + CSRF_CONFIG.maxAge;
  
  // Create a hash that includes the token, timestamp, session, and secret
  const payload = `${randomToken}:${timestamp}:${sessionId || ''}`;
  const signature = createHash('sha256')
    .update(payload)
    .update(CSRF_CONFIG.secretKey)
    .digest('hex');
  
  const token = `${randomToken}.${timestamp}.${signature}`;
  
  return {
    token,
    expires,
    sessionId,
  };
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(
  token: string, 
  sessionId?: string
): { valid: boolean; expired?: boolean; error?: string } {
  try {
    if (!token) {
      return { valid: false, error: 'No CSRF token provided' };
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [randomToken, timestampStr, providedSignature] = parts;
    
    if (!providedSignature || !timestampStr) {
      return { valid: false, error: 'Invalid token format' };
    }
    const timestamp = parseInt(timestampStr!, 10);
    
    if (isNaN(timestamp)) {
      return { valid: false, error: 'Invalid timestamp in token' };
    }
    
    // Check if token has expired
    if (Date.now() > timestamp + CSRF_CONFIG.maxAge) {
      return { valid: false, expired: true, error: 'Token expired' };
    }
    
    // Recreate the signature
    const payload = `${randomToken}:${timestamp}:${sessionId || ''}`;
    const expectedSignature = createHash('sha256')
      .update(payload)
      .update(CSRF_CONFIG.secretKey)
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    const isValid = timingSafeEqual(signatureBuffer, expectedBuffer);
    
    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    return { valid: true };
    
  } catch (error) {
    logger.error('CSRF token validation error', { error });
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Extract CSRF token from request headers or body
 */
export function extractCSRFToken(request: NextRequest): string | null {
  // Check header first
  const headerToken = request.headers.get(CSRF_CONFIG.headerName);
  if (headerToken) {
    return headerToken;
  }
  
  // Check form data if it's a form submission
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const url = new URL(request.url);
      return url.searchParams.get('_csrf') || null;
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Validate CSRF token from request
 */
export async function validateRequestCSRF(
  request: NextRequest,
  sessionId?: string
): Promise<{ valid: boolean; error?: string }> {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }
  
  const token = extractCSRFToken(request);
  
  if (!token) {
    return { 
      valid: false, 
      error: 'CSRF token required for this request' 
    };
  }
  
  const validation = validateCSRFToken(token, sessionId);
  
  if (!validation.valid) {
    logger.warn('CSRF validation failed', {
      method: request.method,
      url: request.url,
      error: validation.error,
      expired: validation.expired,
      hasSessionId: !!sessionId,
    });
  }
  
  return {
    valid: validation.valid,
    error: validation.error,
  };
}

/**
 * Generate CSRF token for API response
 */
export function generateCSRFTokenForResponse(sessionId?: string): {
  token: string;
  cookieValue: string;
  headerValue: string;
} {
  const tokenData = generateCSRFToken(sessionId);
  
  return {
    token: tokenData.token,
    cookieValue: `${tokenData.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${CSRF_CONFIG.maxAge / 1000}`,
    headerValue: tokenData.token,
  };
}

/**
 * CSRF protection middleware
 */
export function withCSRFProtection(options: {
  skipRoutes?: RegExp[];
  skipMethods?: string[];
  customSessionExtractor?: (request: NextRequest) => string | undefined;
} = {}) {
  const {
    skipRoutes = [],
    skipMethods = ['GET', 'HEAD', 'OPTIONS'],
    customSessionExtractor,
  } = options;
  
  return async function(request: NextRequest): Promise<{
    valid: boolean;
    token?: string;
    error?: string;
    headers?: Record<string, string>;
  }> {
    const url = new URL(request.url);
    
    // Skip CSRF protection for specified routes
    if (skipRoutes.some(pattern => pattern.test(url.pathname))) {
      return { valid: true };
    }
    
    // Skip CSRF protection for safe methods
    if (skipMethods.includes(request.method)) {
      // Generate a new token for safe requests to include in response
      const sessionId = customSessionExtractor?.(request);
      const { token, headerValue } = generateCSRFTokenForResponse(sessionId);
      
      return {
        valid: true,
        token,
        headers: {
          [CSRF_CONFIG.headerName]: headerValue,
        },
      };
    }
    
    // Validate CSRF token for unsafe methods
    const sessionId = customSessionExtractor?.(request);
    const validation = await validateRequestCSRF(request, sessionId);
    
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error || 'CSRF validation failed',
      };
    }
    
    // Generate a new token for the next request
    const { token, headerValue } = generateCSRFTokenForResponse(sessionId);
    
    return {
      valid: true,
      token,
      headers: {
        [CSRF_CONFIG.headerName]: headerValue,
      },
    };
  };
}

/**
 * Create CSRF protection for API routes
 */
export function createCSRFProtection(sessionExtractor?: (request: NextRequest) => string | undefined) {
  return withCSRFProtection({
    skipRoutes: [
      /^\/api\/health/, // Health check endpoints
      /^\/api\/auth\//, // Auth endpoints handle CSRF differently
    ],
    customSessionExtractor: sessionExtractor,
  });
}

/**
 * React hook for CSRF token management (client-side)
 */
export const CSRFTokenManager = {
  /**
   * Get CSRF token from cookie or API
   */
  async getToken(): Promise<string | null> {
    // Try to get from cookie first
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies
      .find(cookie => cookie.trim().startsWith(`${CSRF_CONFIG.cookieName}=`));
    
    if (csrfCookie) {
      const token = csrfCookie.split('=')[1];
      if (token && this.isValidTokenFormat(token)) {
        return token;
      }
    }
    
    // Fetch new token from API
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'same-origin',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
    } catch (error) {
      logger.error('Failed to fetch CSRF token', { error });
    }
    
    return null;
  },
  
  /**
   * Add CSRF token to request headers
   */
  async addTokenToHeaders(headers: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await this.getToken();
    
    if (token) {
      headers[CSRF_CONFIG.headerName] = token;
    }
    
    return headers;
  },
  
  /**
   * Create fetch wrapper with automatic CSRF token
   */
  async secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = await this.addTokenToHeaders(
      options.headers as Record<string, string> || {}
    );
    
    return fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
    });
  },
  
  /**
   * Validate token format (client-side basic check)
   */
  isValidTokenFormat(token: string): boolean {
    return token.split('.').length === 3;
  },
};

export { CSRF_CONFIG };