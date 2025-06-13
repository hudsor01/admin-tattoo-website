#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { auth } from '../src/lib/auth';

const prisma = new PrismaClient();

async function fixAuthPassword() {
  try {
    const email = 'admin@ink37tattoos.com';
    const password = 'admin123456';

    console.log('🔐 Fixing password using Better Auth hash...\n');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    });

    if (!user) {
      console.log('Creating new admin user...');
      // Create user through Better Auth
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: 'Admin User'
        }
      });
      
      if (result) {
        // Update role to admin
        await prisma.user.update({
          where: { email },
          data: { role: 'admin' }
        });
        console.log('✅ Admin user created successfully!');
      }
    } else {
      console.log(`Found user: ${email} (ID: ${user.id})`);
      
      // Delete existing credential account
      const credentialAccount = user.accounts.find(acc => acc.providerId === 'credential');
      if (credentialAccount) {
        console.log('Deleting old credential account...');
        await prisma.account.delete({
          where: { id: credentialAccount.id }
        });
      }

      // Create new account with Better Auth's password format
      console.log('Creating new credential account with Better Auth...');
      
      // Use Better Auth's internal password hashing
      const hasher = await auth.options.emailAndPassword?.hash;
      if (!hasher) {
        // Fallback to using the auth adapter directly
        const adapter = auth.options.database;
        
        // Create account through adapter
        await adapter.createAccount({
          userId: user.id,
          accountId: email,
          providerId: 'credential',
          password: password // Better Auth will hash this internally
        });
      } else {
        // Use the hasher if available
        const hashedPassword = await hasher(password);
        
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
      
      console.log('✅ Password updated with Better Auth format!');
    }

    console.log('\n✅ Auth password fix completed!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAuthPassword();