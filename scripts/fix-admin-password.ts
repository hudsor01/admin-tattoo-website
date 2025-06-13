#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    const email = 'admin@ink37tattoos.com';
    const password = 'admin123456';

    console.log('🔐 Fixing admin password...\n');

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

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Find or create credential account
    const credentialAccount = user.accounts.find(acc => acc.providerId === 'credential');

    if (credentialAccount) {
      console.log('📝 Updating existing credential account password...');
      await prisma.account.update({
        where: { id: credentialAccount.id },
        data: { 
          password: hashedPassword,
          accountId: email // Ensure accountId is the email
        }
      });
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
    }

    console.log('✅ Password fixed successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('❌ Error fixing password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();