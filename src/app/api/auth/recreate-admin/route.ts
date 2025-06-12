import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

export async function POST() {
  try {
    const prisma = new PrismaClient();
    
    // Delete existing admin user and all related data
    await prisma.user.deleteMany({
      where: { email: "admin@ink37tattoos.com" }
    });
    
    console.log("Deleted existing admin user");
    
    // Wait a moment for the deletion to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create new admin user with credential account using Better Auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: "admin@ink37tattoos.com",
        password: "admin123456", 
        name: "Admin User"
      }
    });
    
    console.log("Created new admin user:", signUpResult);
    
    if (signUpResult && signUpResult.user) {
      // Update role to admin
      const updatedUser = await prisma.user.update({
        where: { email: "admin@ink37tattoos.com" },
        data: { role: "admin" }
      });
      
      console.log("Updated user role to admin:", updatedUser);
      
      // Verify the account was created
      const userWithAccount = await prisma.user.findUnique({
        where: { email: "admin@ink37tattoos.com" },
        include: { accounts: true }
      });
      
      await prisma.$disconnect();
      
      return NextResponse.json({
        success: true,
        message: "Admin user recreated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        },
        accounts: userWithAccount?.accounts.map(acc => ({
          type: acc.type,
          providerId: acc.providerId
        }))
      });
    }
    
    await prisma.$disconnect();
    return NextResponse.json({ error: "Sign up failed" }, { status: 500 });
    
  } catch (error) {
    console.error("Error recreating admin:", error);
    return NextResponse.json({
      error: "Failed to recreate admin user",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}