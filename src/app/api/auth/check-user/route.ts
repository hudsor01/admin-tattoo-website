import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check if the admin user exists and what role they have
    const user = await prisma.user.findUnique({
      where: { email: "admin@ink37tattoos.com" },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json({ 
      error: "Failed to check user",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Update the admin user to have admin role
    const user = await prisma.user.update({
      where: { email: "admin@ink37tattoos.com" },
      data: { role: "admin" },
      select: { id: true, email: true, name: true, role: true }
    });

    return NextResponse.json({ 
      success: true,
      message: "User role updated to admin",
      user 
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ 
      error: "Failed to update user role",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}