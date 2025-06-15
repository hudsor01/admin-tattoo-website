import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? 'SET' : 'MISSING',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ? 'SET' : 'MISSING',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'MISSING',
    };

    // Try to import auth
    let authImportError = null;
    try {
      await import("@/lib/auth");
      console.log("Auth imported successfully");
    } catch (error) {
      authImportError = error instanceof Error ? error.message : 'Unknown import error';
    }

    // Try to connect to database
    let dbConnectionError = null;
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$connect();
      await prisma.$disconnect();
      console.log("Database connection successful");
    } catch (error) {
      dbConnectionError = error instanceof Error ? error.message : 'Unknown database error';
    }

    return NextResponse.json({
      status: "debug",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      authImportError,
      dbConnectionError,
    });

  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { 
        error: "Debug endpoint failed",
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
