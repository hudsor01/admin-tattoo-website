import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST() {
  try {
    // Create admin user using Better Auth API
    const result = await auth.api.signUpEmail({
      body: {
        email: "admin@ink37tattoos.com",
        password: "admin123456",
        name: "Admin User",
      },
    });

    if (result) {
      return NextResponse.json({
        success: true,
        message: "Admin user created successfully",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        }
      });
    }

    return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json({
      error: "Failed to create admin user",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
