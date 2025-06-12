import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    // Check what columns exist in the session table
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'session'
      ORDER BY ordinal_position;
    `;

    return NextResponse.json({
      message: "Session table columns",
      columns: result
    });
  } catch (error) {
    console.error("Database debug error:", error);
    return NextResponse.json({
      error: "Database debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
