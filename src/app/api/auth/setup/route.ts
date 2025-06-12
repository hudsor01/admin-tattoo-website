import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Delete existing admin user
    await prisma.user.deleteMany({
      where: { email: "admin@ink37tattoos.com" }
    });

    // Hash the password
    const hashedPassword = await bcrypt.hash("adminpassword123", 10);

    // Create fresh admin user
    const admin = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: "admin@ink37tattoos.com",
        name: "Admin User",
        role: "admin",
        emailVerified: true,
      },
    });

    // Create account for password auth
    await prisma.account.create({
      data: {
        userId: admin.id,
        accountId: admin.email,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin setup complete",
      credentials: {
        email: "admin@ink37tattoos.com",
        password: "adminpassword123"
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
