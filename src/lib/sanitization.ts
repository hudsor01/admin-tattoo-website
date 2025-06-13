import DOMPurify from 'isomorphic-dompurify';

// Comprehensive sanitization functions for security
export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>"'`]/g, '') // Remove HTML/script injection chars
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .slice(0, 10000); // Limit length to prevent DoS
};

export const sanitizeHtml = (html: string): string => {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'style']
  });
};

export const sanitizeFilename = (filename: string): string => {
  if (typeof filename !== 'string') return '';
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Only allow safe characters
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .replace(/^[._]+/, '') // Remove leading dots/underscores
    .slice(0, 255); // Limit length
};

export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._-]/g, '') // Only allow valid email chars
    .slice(0, 254); // RFC limit
};

export const sanitizePhone = (phone: string): string => {
  if (typeof phone !== 'string') return '';
  return phone
    .replace(/[^0-9+\-\s\(\)\.]/g, '') // Only allow phone number chars
    .trim()
    .slice(0, 20);
};

export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    // Only allow safe protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

// SQL injection prevention (for raw queries)
export const sanitizeSqlString = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[';\"\\]/g, '') // Remove SQL injection chars
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .replace(/\*\//g, '')
    .slice(0, 1000);
};

// XSS prevention for search queries
export const sanitizeSearchQuery = (query: string): string => {
  if (typeof query !== 'string') return '';
  return query
    .trim()
    .replace(/[<>"'`]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, 200);
};

// Content Security Policy helpers
export const sanitizeCSP = (directive: string): string => {
  if (typeof directive !== 'string') return '';
  return directive
    .replace(/[<>"'`]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim();
};

// Sanitize numbers with bounds checking
export const sanitizeNumber = (
  value: unknown, 
  min = Number.MIN_SAFE_INTEGER, 
  max = Number.MAX_SAFE_INTEGER
): number => {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.max(min, Math.min(max, num));
};

// Sanitize boolean values
export const sanitizeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  return Boolean(value);
};

// Rate limiting helper - sanitize IP addresses
export const sanitizeIP = (ip: string): string => {
  if (typeof ip !== 'string') return '';
  
  // Remove any non-IP characters
  const cleanIP = ip.replace(/[^0-9a-f:.]/gi, '');
  
  // Basic IPv4/IPv6 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;
  
  if (ipv4Regex.test(cleanIP) || ipv6Regex.test(cleanIP)) {
    return cleanIP;
  }
  
  return '';
};

// Sanitize User-Agent strings
export const sanitizeUserAgent = (userAgent: string): string => {
  if (typeof userAgent !== 'string') return '';
  return userAgent
    .replace(/[<>"'`]/g, '') // Remove script injection chars
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, 500); // Limit length
};

// Sanitize JSON objects recursively
export const sanitizeObject = (obj: unknown, maxDepth = 5): unknown => {
  if (maxDepth <= 0) return null;
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number') {
    return sanitizeNumber(obj);
  }
  
  if (typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.slice(0, 100).map(item => sanitizeObject(item, maxDepth - 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    const entries = Object.entries(obj).slice(0, 50); // Limit object size
    
    for (const [key, value] of entries) {
      const sanitizedKey = sanitizeString(key);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeObject(value, maxDepth - 1);
      }
    }
    
    return sanitized;
  }
  
  return null;
};

// Validation helpers for common attack patterns
export const containsSuspiciousPatterns = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  
  const suspiciousPatterns = [
    /script/i,
    /javascript:/i,
    /vbscript:/i,
    /<.*>/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /expression\(/i,
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /\.\.\//g, // Directory traversal
    /\x00/, // Null bytes
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

// OWASP security headers sanitization
export const sanitizeSecurityHeaders = (headers: Record<string, string>): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    const sanitizedKey = key.toLowerCase().replace(/[^a-z-]/g, '');
    const sanitizedValue = sanitizeString(value);
    
    if (sanitizedKey && sanitizedValue) {
      sanitized[sanitizedKey] = sanitizedValue;
    }
  }
  
  return sanitized;
};

// Sanitize array of strings
export const sanitizeArrayOfStrings = (arr: unknown): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(item => typeof item === 'string')
    .map(item => sanitizeString(item))
    .slice(0, 100); // Limit array size
};

// Content validation for file uploads
export const validateFileContent = (content: Buffer, allowedTypes: string[]): boolean => {
  if (!Buffer.isBuffer(content)) return false;
  
  // Check file signatures (magic numbers)
  const signatures: Record<string, number[]> = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'image/webp': [0x57, 0x45, 0x42, 0x50],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
    'video/mp4': [0x00, 0x00, 0x00],
  };
  
  for (const mimeType of allowedTypes) {
    const signature = signatures[mimeType];
    if (signature && content.length >= signature.length) {
      const matches = signature.every((byte, index) => content[index] === byte);
      if (matches) return true;
    }
  }
  
  return false;
};

// Export all sanitization functions
const sanitizationUtils = {
  sanitizeString,
  sanitizeHtml,
  sanitizeFilename,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeSqlString,
  sanitizeSearchQuery,
  sanitizeCSP,
  sanitizeNumber,
  sanitizeBoolean,
  sanitizeIP,
  sanitizeUserAgent,
  sanitizeObject,
  containsSuspiciousPatterns,
  sanitizeSecurityHeaders,
  validateFileContent,
};

export default sanitizationUtils;