import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Simply update the existing user to have admin role
    const admin = await prisma.user.update({
      where: { email: "admin@ink37tattoos.com" },
      data: { 
        role: "admin",
        emailVerified: true 
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "User updated to admin",
      user: admin
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