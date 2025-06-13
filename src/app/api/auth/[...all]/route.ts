import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const authHandler = toNextJsHandler(auth.handler);

export async function GET(req: NextRequest) {
  try {
    console.log("Auth GET request:", req.method, req.url, req.headers.get('user-agent'));
    const result = await authHandler.GET(req);
    console.log("Auth GET success:", result.status);
    return result;
  } catch (error) {
    console.error("Auth GET error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: "Authentication service unavailable", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Auth POST request:", req.method, req.url, req.headers.get('user-agent'));
    const body = await req.text();
    console.log("Auth POST body length:", body.length);
    
    // Create new request with the body
    const newReq = new NextRequest(req.url, {
      method: req.method,
      headers: req.headers,
      body: body
    });
    
    const result = await authHandler.POST(newReq);
    console.log("Auth POST success:", result.status);
    return result;
  } catch (error) {
    console.error("Auth POST error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: "Authentication service unavailable", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
