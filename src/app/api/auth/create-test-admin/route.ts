import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // First, clean up any existing test admin
    await prisma.account.deleteMany({
      where: { 
        accountId: "testadmin@ink37tattoos.com"
      }
    });
    
    // Find user first to get their sessions
    const existingUser = await prisma.user.findUnique({
      where: { email: "testadmin@ink37tattoos.com" }
    });
    
    if (existingUser) {
      await prisma.session.deleteMany({
        where: { userId: existingUser.id }
      });
    }
    
    await prisma.user.deleteMany({
      where: { 
        email: "testadmin@ink37tattoos.com"
      }
    });

    // Create admin through Better Auth's sign-up endpoint
    const signUpResponse = await fetch("http://localhost:3001/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "testadmin@ink37tattoos.com",
        password: "testadmin123",
        name: "Test Admin",
      }),
    });

    if (!signUpResponse.ok) {
      const errorText = await signUpResponse.text();
      console.error("Sign up failed:", errorText);
      throw new Error(`Sign up failed: ${signUpResponse.status}`);
    }

    const signUpData = await signUpResponse.json();
    console.log("Sign up successful:", signUpData);

    // Update the user to have admin role
    if (signUpData.user?.id) {
      await prisma.user.update({
        where: { id: signUpData.user.id },
        data: { 
          role: "admin",
          emailVerified: true 
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Test admin created successfully",
      credentials: {
        email: "testadmin@ink37tattoos.com",
        password: "testadmin123"
      }
    });

  } catch (error: any) {
    console.error("Error in create-test-admin:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}