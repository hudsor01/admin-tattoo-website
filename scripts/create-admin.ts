#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'Admin User';

    if (!email || !password) {
      console.log('Usage: npm run create-admin <email> <password> [name]');
      console.log('Example: npm run create-admin admin@ink37tattoos.com mypassword "Admin User"');
      return;
    }

    console.log('🔐 Creating admin user...\n');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists.`);
      console.log(`   Current role: ${existingUser.role}`);
      
      if (existingUser.role !== 'admin') {
        console.log('🔄 Updating user role to admin...');
        const updatedUser = await prisma.user.update({
          where: { email },
          data: { role: 'admin' }
        });
        console.log(`✅ User ${email} is now an admin!`);
      } else {
        console.log('✅ User is already an admin.');
      }
      return;
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name,
        role: 'admin',
        emailVerified: true,
      }
    });

    // Create account with password
    await prisma.account.create({
      data: {
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        type: 'credential',
        // Note: Better Auth handles password storage differently
        // This is just for initial setup
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: admin`);
    console.log(`   ID: ${user.id}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
