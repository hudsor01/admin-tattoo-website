import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Get the admin user
    const user = await prisma.user.findUnique({
      where: { email: "admin@ink37tattoos.com" },
      include: { accounts: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if credential account already exists
    const existingAccount = user.accounts.find(account => account.type === "credential");
    if (existingAccount) {
      return NextResponse.json({
        message: "Credential account already exists",
        account: existingAccount
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("admin123456", 12);

    // Create credential account for email/password authentication
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        type: "credential",
        providerId: "credential",
        accountId: user.email,
        // Store hashed password in the account
        refreshToken: hashedPassword, // Better Auth uses this field for password storage
      }
    });

    return NextResponse.json({
      success: true,
      message: "Credential account created",
      account: {
        id: account.id,
        type: account.type,
        provider: account.providerId,
        providerAccountId: account.accountId
      }
    });
  } catch (error) {
    console.error("Error creating credential account:", error);
    return NextResponse.json({
      error: "Failed to create credential account",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
