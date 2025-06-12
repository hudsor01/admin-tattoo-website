import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow API routes, static files, and auth to pass through
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
        return NextResponse.next();
    }

    // Allow test-auth page without authentication
    if (pathname === '/test-auth') {
        return NextResponse.next();
    }

    try {
        // Check for session cookie using Better Auth helper
        const sessionCookie = getSessionCookie(request);

        // If no session and not on login page, redirect to login
        if (!sessionCookie && pathname !== '/login') {
            const url = new URL('/login', request.url);
            // Add return URL for better UX
            url.searchParams.set('from', pathname);
            return NextResponse.redirect(url);
        }

        // If has session and on login page, redirect to dashboard
        if (sessionCookie && pathname === '/login') {
            // Check if there's a return URL
            const returnUrl = request.nextUrl.searchParams.get('from') || '/';
            return NextResponse.redirect(new URL(returnUrl, request.url));
        }

        // Allow access if session cookie exists
        // Role verification will happen on the server side in protected routes
        return NextResponse.next();
    } catch (error) {
        console.error("Middleware auth check failed:", error);
        // On error, redirect to login unless already there
        if (pathname !== '/login') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
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
