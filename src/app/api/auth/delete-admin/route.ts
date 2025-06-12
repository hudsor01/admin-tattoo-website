import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Delete the user and all related records (accounts, sessions)
    const deletedUser = await prisma.user.delete({
      where: { email: "admin@ink37tattoos.com" }
    });

    return NextResponse.json({ 
      success: true,
      message: "Admin user deleted successfully",
      deletedUser: {
        id: deletedUser.id,
        email: deletedUser.email
      }
    });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    return NextResponse.json({ 
      error: "Failed to delete admin user",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}