import { NextResponse } from "next/server";

export function middleware() {
  // Temporarily disable auth checks for testing
  return NextResponse.next();
  
  // try {
  //   // Use Better Auth's server-side session validation
  //   const session: Session | null = await auth.api.getSession({
  //     headers: request.headers,
  //   });

  //   // If no valid session, redirect to login
  //   if (!session) {
  //     return NextResponse.redirect(new URL("/", request.url));
  //   }

  //   // If user has a valid session, they can access dashboard
  //   return NextResponse.next();
  // } catch (error) {
  //   console.error("Middleware auth check failed:", error);
  //   return NextResponse.redirect(new URL("/", request.url));
  // }
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};
