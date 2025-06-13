#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminViaBetterAuth() {
  try {
    const email = 'admin@ink37tattoos.com';
    const password = 'admin123456';

    console.log('🔐 Creating admin user via Better Auth API...\\n');

    // Clean up existing user first
    console.log('Cleaning up existing user...');
    await prisma.account.deleteMany({
      where: {
        user: { email }
      }
    });
    
    await prisma.session.deleteMany({
      where: {
        user: { email }
      }
    });
    
    await prisma.user.deleteMany({
      where: { email }
    });

    // Use Better Auth's sign-up endpoint directly
    console.log('Creating user via Better Auth sign-up...');
    
    const signUpResponse = await fetch(`${process.env.BETTER_AUTH_URL}/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: 'Admin User',
      })
    });

    if (!signUpResponse.ok) {
      const errorText = await signUpResponse.text();
      console.error('Sign-up failed:', errorText);
      throw new Error(`Sign-up failed with status ${signUpResponse.status}: ${errorText}`);
    }

    const signUpResult = await signUpResponse.json();
    console.log('Sign-up response:', signUpResult);

    // Update the user to have admin role
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { 
        role: 'admin',
        emailVerified: true,
        isActive: true,
        loginAttempts: 0
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   User ID: ${updatedUser.id}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Password: ${password}`);
    console.log('\\n🎉 You can now login with these credentials!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    // Fallback: try to create user manually with proper Better Auth format
    console.log('\\n🔄 Trying fallback method...');
    
    try {
      const email = 'admin@ink37tattoos.com';
      
      // Create user first
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

      console.log(`✅ Fallback: Created user ${user.id}`);
      console.log('⚠️  You may need to set the password manually via the Better Auth API');
      
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminViaBetterAuth();