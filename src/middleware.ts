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

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const clientIP = getClientIP(request);

    // Security headers for all responses
    const response = NextResponse.next();
    
    // Block suspicious IPs
    if (SECURITY_CONFIG.suspiciousIPs.has(clientIP)) {
        return new NextResponse('Access Denied', { status: 429 });
    }

    // Rate limiting for auth routes
    if (pathname.startsWith('/api/auth/') && request.method === 'POST') {
        if (!rateLimit(clientIP)) {
            return new NextResponse('Too Many Requests', { status: 429 });
        }
    }

    // Allow API routes, static files, and auth to pass through
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
        return response;
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
            console.log(`[SECURITY] ${clientIP} accessed ${pathname} at ${new Date().toISOString()}`);
        }

        // Allow access if session cookie exists
        // Role verification will happen on the server side in protected routes
        return response;
    } catch (error) {
        console.error("Middleware auth check failed:", error);
        // On error, redirect to home (login) unless already there
        if (pathname !== '/') {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return response;
    }
}

export const config = {
    runtime: "nodejs",
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ]
};
