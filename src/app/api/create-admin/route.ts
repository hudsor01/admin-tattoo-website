import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json().catch(() => ({}));
    const adminPassword = password || "adminpassword123";

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "admin@ink37tattoos.com" }
    });

    if (existingUser) {
      // Update existing user to admin role
      const admin = await prisma.user.update({
        where: { email: "admin@ink37tattoos.com" },
        data: {
          role: "admin",
          name: "Admin User",
          emailVerified: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "User already exists, updated to admin role",
        user: admin,
        note: `Login with admin@ink37tattoos.com and password: ${adminPassword}`
      });
    }

    // Create new admin user directly with Better Auth schema
    const admin = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: "admin@ink37tattoos.com",
        name: "Admin User",
        role: "admin",
        emailVerified: true,
      },
    });

    // Try to create auth credentials via Better Auth
    try {
      await fetch(`http://localhost:3001/api/auth/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: "admin@ink37tattoos.com",
          password: adminPassword,
          name: "Admin User",
        }),
      });
    } catch (authError) {
      // Auth creation failed, but user exists in DB
      console.log('Auth creation failed, but user exists:', authError);
    }

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: admin,
      note: `Login with admin@ink37tattoos.com and password: ${adminPassword}`
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to create admin user"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
