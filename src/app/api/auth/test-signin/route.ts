import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(_request: NextRequest) {
  try {
    // Try to sign in with the admin user we created
    const result = await auth.api.signInEmail({
      body: {
        email: "admin@ink37tattoos.com",
        password: "admin123456",
      },
    });

    if (result) {
      return NextResponse.json({
        success: true,
        message: "Admin sign-in successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        session: {
          id: result.token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Set expiry to 24 hours from now
        }
      });
    }

    return NextResponse.json({ error: "Sign-in failed" }, { status: 401 });
  } catch (error) {
    console.error("Error signing in admin user:", error);
    return NextResponse.json({
      error: "Failed to sign in admin user",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
