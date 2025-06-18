import { type NextRequest, NextResponse } from "next/server";
import { auth } from "./src/lib/auth";
import { getClientIP, logger } from "./src/lib/logger";

export async function middleware(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const clientIP = getClientIP(request);
  
  try {
    // Use Better Auth's server-side session validation
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // If no valid session, redirect to login with security logging
    if (!session?.user) {
      logger.security('Unauthorized access attempt', {
        path: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer')
      }, {
        requestId,
        ip: clientIP
      });
      
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Verify admin role for admin routes
    if (request.nextUrl.pathname.startsWith('/api/admin') || 
        request.nextUrl.pathname.startsWith('/dashboard')) {
      
      // Check if user has admin role from session
      if (!session.user.role || session.user.role !== 'admin') {
        logger.security('Non-admin user attempted admin access', {
          userId: session.user.id,
          userEmail: session.user.email,
          userRole: session.user.role,
          path: request.nextUrl.pathname
        }, {
          requestId,
          ip: clientIP
        });
        
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }
    }

    // Log successful authentication for audit trail
    logger.auth('Access granted', session.user.id, clientIP, {
      path: request.nextUrl.pathname,
      method: request.method,
      userRole: session.user.role
    });

    // If user has valid session and proper role, allow access
    const response = NextResponse.next();
    response.headers.set('X-Request-ID', requestId);
    return response;
    
  } catch (error) {
    logger.error("Middleware authentication failed", error, {
      requestId,
      ip: clientIP,
      path: request.nextUrl.pathname,
      method: request.method
    });
    
    // On authentication error, redirect to login
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};
