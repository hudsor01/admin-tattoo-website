import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Rate limiting storage (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security configuration
const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  suspiciousIPs: new Set<string>(), // Track suspicious IPs
  allowedUserAgents: [
    /Mozilla/,
    /Chrome/,
    /Safari/,
    /Edge/,
    /Firefox/,
    /curl/, // For health checks
  ],
  blockedUserAgents: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
  ],
};

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `rate_limit_${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + SECURITY_CONFIG.rateLimitWindow });
    return true;
  }

  if (current.count >= SECURITY_CONFIG.maxLoginAttempts) {
    SECURITY_CONFIG.suspiciousIPs.add(ip);
    return false;
  }

  current.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

function isSecureRoute(pathname: string): boolean {
  const securePatterns = ['/api/', '/admin/', '/dashboard/'];
  return securePatterns.some(pattern => pathname.startsWith(pattern));
}

function validateUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;
  
  // Block known bad user agents
  const isBlocked = SECURITY_CONFIG.blockedUserAgents.some(pattern => 
    pattern.test(userAgent)
  );
  
  if (isBlocked) return false;
  
  // For health checks and legitimate automation
  if (userAgent.includes('curl') || userAgent.includes('health')) {
    return true;
  }
  
  // Check if it's a legitimate browser
  return SECURITY_CONFIG.allowedUserAgents.some(pattern => 
    pattern.test(userAgent)
  );
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Additional runtime security headers
  response.headers.set('X-Request-ID', `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  response.headers.set('X-Response-Time', Date.now().toString());
  
  return response;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Create response with security headers
    let response = NextResponse.next();
    
    // Block suspicious IPs
    if (SECURITY_CONFIG.suspiciousIPs.has(clientIP)) {
        // Suspicious IP blocked
        return new NextResponse('Access Denied - IP Blocked', { status: 429 });
    }

    // Validate user agent for non-API routes (exclude auth and health)
    if (!pathname.startsWith('/api/health/') && !pathname.startsWith('/api/auth/') && !validateUserAgent(userAgent)) {
        // Suspicious user agent blocked
        SECURITY_CONFIG.suspiciousIPs.add(clientIP);
        return new NextResponse('Access Denied - Invalid Client', { status: 403 });
    }

    // Allow auth routes to pass through without restrictions
    if (pathname.startsWith('/api/auth/')) {
        return addSecurityHeaders(response);
    }

    // Rate limiting for other API routes
    if (pathname.startsWith('/api/') && request.method === 'POST') {
        if (!rateLimit(clientIP)) {
            // Rate limit exceeded
            return new NextResponse('Too Many Requests - Rate Limited', { status: 429 });
        }
    }

    // Allow API routes, static files to pass through
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
        return addSecurityHeaders(response);
    }

    try {
        // Check for session cookie using Better Auth helper
        const sessionCookie = getSessionCookie(request);

        // Allow public access to home page (login page)
        if (pathname === "/") {
            return response;
        }

        // If no session and not on home page, redirect to home (login)
        if (!sessionCookie) {
            const url = new URL('/', request.url);
            // Add return URL for better UX
            url.searchParams.set('from', pathname);
            return NextResponse.redirect(url);
        }

        // Log security events for audit
        if (isSecureRoute(pathname)) {
            // Security access logged
        }

        // Allow access if session cookie exists
        // Role verification will happen on the server side in protected routes
        return addSecurityHeaders(response);
    } catch {
        // Auth check failed
        // On error, redirect to home (login) unless already there
        if (pathname !== '/') {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return addSecurityHeaders(response);
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) - but we need to allow auth routes
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)',
    ],
};
