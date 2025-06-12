import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/auth-client";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log("Attempting login with:", { email, password: "***" });
    
    // Try the exact same login method as the main login page
    const result = await authClient.signIn.email({
      email,
      password,
    });

    console.log("Login result:", {
      error: result.error,
      hasUser: !!result.data?.user,
      userRole: result.data?.user ? (result.data.user as any).role : null
    });

    if (result.error) {
      return NextResponse.json({ 
        error: result.error.message || "Login failed",
        details: result.error
      }, { status: 401 });
    }

    if (result.data?.user) {
      const user = result.data.user as any;
      return NextResponse.json({ 
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    }

    return NextResponse.json({ error: "No user data returned" }, { status: 401 });
  } catch (error) {
    console.error("Debug login error:", error);
    return NextResponse.json({ 
      error: "Debug login failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}