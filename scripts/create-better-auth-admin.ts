#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createBetterAuthAdmin() {
  try {
    const email = 'admin@ink37tattoos.com';
    const password = 'admin123456';

    console.log('🔐 Creating admin user with Better Auth compatible format...\n');

    // Delete existing user and accounts
    console.log('Cleaning up existing user...');
    await prisma.account.deleteMany({
      where: {
        user: { email }
      }
    });
    
    await prisma.user.deleteMany({
      where: { email }
    });

    // Create user with Better Auth expected format
    const user = await prisma.user.create({
      data: {
        id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
        isActive: true,
        loginAttempts: 0,
      }
    });

    console.log(`Created user: ${user.id}`);

    // Create account without password - let Better Auth handle it on first login
    await prisma.account.create({
      data: {
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        accountId: email,
        providerId: 'credential',
        type: 'credential',
        // Don't set password here - Better Auth will set it on login
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\nNOTE: You may need to reset your password on first login.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBetterAuthAdmin();