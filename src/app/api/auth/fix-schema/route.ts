import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(_request: NextRequest) {
  try {
    // Add the missing sessionToken column to the session table
    await prisma.$executeRaw`
      ALTER TABLE session
      ADD COLUMN IF NOT EXISTS "sessionToken" TEXT UNIQUE;
    `;

    return NextResponse.json({
      success: true,
      message: "Added sessionToken column to session table"
    });
  } catch (error) {
    console.error("Schema fix error:", error);
    return NextResponse.json({
      error: "Schema fix failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
