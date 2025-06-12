import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // First, let's clean up the existing admin user completely
    await prisma.account.deleteMany({
      where: { 
        accountId: "admin@ink37tattoos.com"
      }
    });
    
    await prisma.user.deleteMany({
      where: { 
        email: "admin@ink37tattoos.com"
      }
    });

    // Now create a proper admin user through Better Auth's sign-up endpoint
    const signUpResponse = await fetch("http://localhost:3001/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@ink37tattoos.com",
        password: "adminpassword123",
        name: "Admin User",
      }),
    });

    if (!signUpResponse.ok) {
      const error = await signUpResponse.text();
      throw new Error(`Sign up failed: ${error}`);
    }

    const { user } = await signUpResponse.json();

    // Update the user role to admin
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        role: "admin",
        emailVerified: true 
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Admin user created successfully",
      credentials: {
        email: "admin@ink37tattoos.com",
        password: "adminpassword123"
      }
    });

  } catch (error: any) {
    console.error("Error creating admin:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}