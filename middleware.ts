import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { auth } from "./src/lib/auth";
import type { Session } from "./src/types/auth";

export async function middleware(request: NextRequest) {
  try {
    // Use Better Auth's server-side session validation
    const session: Session | null = await auth.api.getSession({
      headers: request.headers,
    });

    // If no valid session, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // If user has a valid session, they can access dashboard
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware auth check failed:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
