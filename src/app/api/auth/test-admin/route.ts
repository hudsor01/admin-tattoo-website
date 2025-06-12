import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(_req: NextRequest) {
  try {
    // Create an admin user for testing
    const user = await auth.api.signUpEmail({
      body: {
        email: "admin@ink37tattoos.com",
        password: "admin123456",
        name: "Admin User",
      },
    });

    if (user) {
      // Set admin role using Better Auth admin plugin
      await auth.api.setRole({
        body: {
          userId: user.user.id,
          role: "admin",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Admin user created successfully",
        user: {
          id: user.user.id,
          email: user.user.email,
          name: user.user.name,
          role: "admin"
        }
      });
    }

    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json({
      error: "Failed to create admin user",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
