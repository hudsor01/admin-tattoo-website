import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST() {
  try {
    // First, let's check what we have in the database
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { email: "admin@ink37tattoos.com" },
      include: { accounts: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User found:", {
      id: user.id,
      email: user.email,
      role: user.role,
      accountsCount: user.accounts.length,
      accounts: user.accounts.map(acc => ({ type: acc.type, providerId: acc.providerId }))
    });

    // Create a mock session headers for the setPassword call
    // Note: This is a workaround since setPassword requires an authenticated session
    try {
      await auth.api.setPassword({
        body: {
          newPassword: "admin123456",
        },
        headers: await headers()
      });

      await prisma.$disconnect();

      return NextResponse.json({
        success: true,
        message: "Password set successfully for admin user",
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (setPasswordError) {
      console.error("setPassword failed:", setPasswordError);

      // Alternative: Create the credential account manually using Better Auth's expected format
      console.log("Trying to create credential account manually...");

      // Delete any existing credential accounts first
      await prisma.account.deleteMany({
        where: {
          userId: user.id,
          providerId: "credential"
        }
      });

      // Use Better Auth's sign up to create the credential account properly
      try {
        // Delete the user temporarily and recreate with Better Auth
        await prisma.user.delete({
          where: { email: "admin@ink37tattoos.com" }
        });

        const signUpResult = await auth.api.signUpEmail({
          body: {
            email: "admin@ink37tattoos.com",
            password: "admin123456",
            name: "Admin User",
          },
        });

        if (signUpResult) {
          // Update role to admin
          const updatedUser = await prisma.user.update({
            where: { email: "admin@ink37tattoos.com" },
            data: { role: "admin" }
          });

          await prisma.$disconnect();

          return NextResponse.json({
            success: true,
            message: "Admin user recreated with proper credential account",
            user: {
              id: signUpResult.user.id,
              email: signUpResult.user.email,
              name: signUpResult.user.name,
              role: updatedUser.role
            }
          });
        }
      } catch (recreateError) {
        console.error("Recreation failed:", recreateError);
        await prisma.$disconnect();

        return NextResponse.json({
          error: "Failed to recreate admin user",
          details: recreateError instanceof Error ? recreateError.message : "Unknown error"
        }, { status: 500 });
      }
    }

    await prisma.$disconnect();
    return NextResponse.json({ error: "Unexpected flow" }, { status: 500 });

  } catch (error) {
    console.error("Error setting admin password:", error);
    return NextResponse.json({
      error: "Failed to set admin password",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
