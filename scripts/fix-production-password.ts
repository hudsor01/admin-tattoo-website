#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function fixProductionPassword() {
  try {
    const email = 'admin@ink37tattoos.com';
    const password = 'admin123456';

    console.log('🔐 Fixing production admin password...\n');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log(`Found user: ${email} (ID: ${user.id})`);
    console.log(`Current accounts: ${user.accounts.length}`);

    // Hash the password with bcryptjs (what Better Auth expects)
    const hashedPassword = await hash(password, 12);
    console.log('Generated new bcrypt hash');

    // Find credential account
    const credentialAccount = user.accounts.find(acc => acc.providerId === 'credential');

    if (credentialAccount) {
      console.log('📝 Updating existing credential account...');
      await prisma.account.update({
        where: { id: credentialAccount.id },
        data: { 
          password: hashedPassword,
          accountId: email // Ensure accountId matches email
        }
      });
      console.log('✅ Password updated successfully!');
    } else {
      console.log('➕ Creating new credential account...');
      await prisma.account.create({
        data: {
          id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          accountId: email,
          providerId: 'credential',
          type: 'credential',
          password: hashedPassword,
        }
      });
      console.log('✅ New credential account created!');
    }

    // Also remove any old password field from user if it exists
    if ('password' in user && (user as any).password) {
      console.log('🧹 Cleaning up old password field on user...');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // Remove any password field that might exist on user model
          password: null
        } as any
      });
    }

    console.log('\n✅ Production password fix completed!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('   Hash: bcryptjs format');

  } catch (error) {
    console.error('❌ Error fixing production password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductionPassword();