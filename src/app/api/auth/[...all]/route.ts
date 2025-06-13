import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const authHandler = toNextJsHandler(auth.handler);

export async function GET(req: NextRequest) {
  try {
    return await authHandler.GET(req);
  } catch (error) {
    console.error("Auth GET error:", error);
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await authHandler.POST(req);
  } catch (error) {
    console.error("Auth POST error:", error);
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 500 }
    );
  }
}
