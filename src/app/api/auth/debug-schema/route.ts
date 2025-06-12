import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Try to get session info to understand the expected schema
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return NextResponse.json({ 
      message: "Auth working",
      session: session || "No session found"
    });
  } catch (error) {
    console.error("Auth debug error:", error);
    return NextResponse.json({ 
      error: "Auth debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}