/**
 * Security headers configuration for production-ready application
 * Implements comprehensive security headers following OWASP recommendations
 */

import { isProduction } from './env-validation';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  contentTypeOptions?: boolean;
  referrerPolicy?: string;
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  permissionsPolicy?: Record<string, string[]>;
  crossOriginEmbedderPolicy?: 'require-corp' | 'credentialless' | 'unsafe-none';
  crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin';
}

/**
 * Default security headers configuration
 */
export const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  // Content Security Policy - Strict policy for admin dashboard
  contentSecurityPolicy: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "connect-src 'self' https://api.ink37tattoos.com wss: ws:",
    "frame-src 'self' https://accounts.google.com https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
  
  // Prevent iframe embedding
  frameOptions: 'DENY',
  
  // Prevent MIME type sniffing
  contentTypeOptions: true,
  
  // Referrer policy
  referrerPolicy: 'strict-origin-when-cross-origin',
  
  // HSTS - HTTP Strict Transport Security
  strictTransportSecurity: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },
  
  // Permissions Policy (formerly Feature Policy)
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    bluetooth: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: [],
    ambient_light_sensor: [],
    autoplay: ['self'],
    encrypted_media: ['self'],
    fullscreen: ['self'],
    picture_in_picture: [],
  },
  
  // Cross-Origin policies
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
};

/**
 * Development security headers (more permissive)
 */
export const DEVELOPMENT_SECURITY_HEADERS: SecurityHeadersConfig = {
  contentSecurityPolicy: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "connect-src 'self' https://admin.ink37tattoos.com wss: ws:",
    "frame-src 'self'",
    "object-src 'none'",
  ].join('; '),
  
  frameOptions: 'SAMEORIGIN',
  contentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  
  // No HSTS in development
  strictTransportSecurity: undefined,
  
  // More permissive in development
  crossOriginEmbedderPolicy: 'unsafe-none',
  crossOriginOpenerPolicy: 'unsafe-none',
  crossOriginResourcePolicy: 'cross-origin',
};

/**
 * Convert security headers config to HTTP headers object
 */
export function createSecurityHeaders(config: SecurityHeadersConfig = {}): Record<string, string> {
  const headers: Record<string, string> = {};
  
  const finalConfig = isProduction 
    ? { ...DEFAULT_SECURITY_HEADERS, ...config }
    : { ...DEVELOPMENT_SECURITY_HEADERS, ...config };
  
  // Content Security Policy
  if (finalConfig.contentSecurityPolicy) {
    headers['Content-Security-Policy'] = finalConfig.contentSecurityPolicy;
  }
  
  // X-Frame-Options
  if (finalConfig.frameOptions) {
    headers['X-Frame-Options'] = finalConfig.frameOptions;
  }
  
  // X-Content-Type-Options
  if (finalConfig.contentTypeOptions) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }
  
  // Referrer-Policy
  if (finalConfig.referrerPolicy) {
    headers['Referrer-Policy'] = finalConfig.referrerPolicy;
  }
  
  // Strict-Transport-Security (HSTS)
  if (finalConfig.strictTransportSecurity && isProduction) {
    const hsts = finalConfig.strictTransportSecurity;
    let hstsValue = `max-age=${hsts.maxAge}`;
    if (hsts.includeSubDomains) hstsValue += '; includeSubDomains';
    if (hsts.preload) hstsValue += '; preload';
    headers['Strict-Transport-Security'] = hstsValue;
  }
  
  // Permissions-Policy
  if (finalConfig.permissionsPolicy) {
    const policies = Object.entries(finalConfig.permissionsPolicy)
      .map(([directive, allowlist]) => {
        if (allowlist.length === 0) return `${directive}=()`;
        return `${directive}=(${allowlist.map(origin => `"${origin}"`).join(' ')})`;
      });
    headers['Permissions-Policy'] = policies.join(', ');
  }
  
  // Cross-Origin-Embedder-Policy
  if (finalConfig.crossOriginEmbedderPolicy) {
    headers['Cross-Origin-Embedder-Policy'] = finalConfig.crossOriginEmbedderPolicy;
  }
  
  // Cross-Origin-Opener-Policy
  if (finalConfig.crossOriginOpenerPolicy) {
    headers['Cross-Origin-Opener-Policy'] = finalConfig.crossOriginOpenerPolicy;
  }
  
  // Cross-Origin-Resource-Policy
  if (finalConfig.crossOriginResourcePolicy) {
    headers['Cross-Origin-Resource-Policy'] = finalConfig.crossOriginResourcePolicy;
  }
  
  // Additional security headers
  headers['X-Permitted-Cross-Domain-Policies'] = 'none';
  headers['X-XSS-Protection'] = '1; mode=block';
  headers['X-DNS-Prefetch-Control'] = 'off';
  headers['X-Download-Options'] = 'noopen';
  
  return headers;
}

/**
 * Middleware function to apply security headers
 */
export function withSecurityHeaders(customConfig?: SecurityHeadersConfig) {
  const headers = createSecurityHeaders(customConfig);
  
  return function applySecurityHeaders(response: Response): Response {
    // Clone response to avoid modifying the original
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
    
    // Apply security headers
    Object.entries(headers).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    
    return newResponse;
  };
}

/**
 * Create Content Security Policy nonce for inline scripts
 */
export function createCSPNonce(): string {
  // Generate cryptographically secure random nonce
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Update CSP with nonce for inline scripts
 */
export function updateCSPWithNonce(csp: string, nonce: string): string {
  return csp.replace(
    /script-src ([^;]*)/,
    `script-src $1 'nonce-${nonce}'`
  );
}

/**
 * Validate security headers configuration
 */
export function validateSecurityConfig(config: SecurityHeadersConfig): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  let valid = true;
  
  // Check CSP
  if (config.contentSecurityPolicy) {
    if (config.contentSecurityPolicy.includes("'unsafe-eval'")) {
      warnings.push('CSP allows unsafe-eval which may be dangerous');
    }
    if (config.contentSecurityPolicy.includes("'unsafe-inline'")) {
      warnings.push('CSP allows unsafe-inline which reduces security');
    }
    if (!config.contentSecurityPolicy.includes("object-src 'none'")) {
      warnings.push('CSP should include object-src none to prevent object injection');
    }
  } else {
    errors.push('Content Security Policy is not defined');
    valid = false;
  }
  
  // Check Frame Options
  if (!config.frameOptions) {
    warnings.push('X-Frame-Options not set - clickjacking protection missing');
  }
  
  // Check HSTS in production
  if (isProduction && !config.strictTransportSecurity) {
    warnings.push('HSTS not configured for production');
  }
  
  // Check HTTPS enforcement
  if (isProduction && config.frameOptions !== 'DENY' && config.frameOptions !== 'SAMEORIGIN') {
    warnings.push('Frame options should be DENY or SAMEORIGIN in production');
  }
  
  return { valid, warnings, errors };
}

/**
 * Log security configuration status
 */
export function logSecurityHeadersStatus(config: SecurityHeadersConfig): void {
  const { valid, warnings, errors } = validateSecurityConfig(config);
  
  // Security validation completed
  
  if (warnings.length > 0) {
    // Security warnings present
    // Security warnings logged
  }
  
  if (errors.length > 0) {
    // Security errors present
    // Security errors logged
  }
  
  if (valid && warnings.length === 0) {
    // Security headers configured
  }
}

// Export default configuration based on environment
export const securityHeaders = isProduction 
  ? DEFAULT_SECURITY_HEADERS 
  : DEVELOPMENT_SECURITY_HEADERS;
