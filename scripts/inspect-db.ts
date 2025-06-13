#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectDatabase() {
  try {
    console.log('🔍 Inspecting Production Database...\n');
    
    // Count total users
    const userCount = await prisma.user.count();
    console.log(`📊 Total Users: ${userCount}\n`);
    
    // Get users with roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            sessions: true,
            accounts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('👥 Users:');
    console.log('='.repeat(80));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'Not set'}`);
      console.log(`   Role: ${user.role} ${user.role === 'admin' ? '🔑' : '👤'}`);
      console.log(`   Email Verified: ${user.emailVerified ? '✅' : '❌'}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log(`   Sessions: ${user._count.sessions}, Accounts: ${user._count.accounts}`);
      console.log('-'.repeat(40));
    });

    // Check for admin users specifically
    const adminUsers = users.filter(user => user.role === 'admin');
    console.log(`\n🔑 Admin Users: ${adminUsers.length}`);
    if (adminUsers.length === 0) {
      console.log('⚠️  WARNING: No admin users found! You need to create an admin user.');
    } else {
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.name || 'No name'})`);
      });
    }

    // Check recent sessions
    const recentSessions = await prisma.session.findMany({
      select: {
        id: true,
        user: {
          select: {
            email: true,
            role: true
          }
        },
        createdAt: true,
        expiresAt: true,
        ipAddress: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`\n🕒 Recent Sessions (last 5):`);
    recentSessions.forEach((session, index) => {
      const isExpired = session.expiresAt < new Date();
      console.log(`${index + 1}. ${session.user.email} (${session.user.role})`);
      console.log(`   Created: ${session.createdAt.toISOString()}`);
      console.log(`   Expires: ${session.expiresAt.toISOString()} ${isExpired ? '❌ EXPIRED' : '✅ ACTIVE'}`);
      console.log(`   IP: ${session.ipAddress || 'Unknown'}`);
    });

  } catch (error) {
    console.error('❌ Error inspecting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDatabase();
