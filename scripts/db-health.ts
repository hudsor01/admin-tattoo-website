#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/prisma';

async function checkDatabaseHealth() {
  console.log('🔍 Checking database connection health...');
  
  try {
    const start = Date.now();
    
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1 as test`;
    
    const basicTime = Date.now() - start;
    console.log(`✅ Basic connection: ${basicTime}ms`);
    
    // Test with a simple query
    const queryStart = Date.now();
    const userCount = await prisma.user.count();
    const queryTime = Date.now() - queryStart;
    
    console.log(`✅ Query test (user count: ${userCount}): ${queryTime}ms`);
    
    // Test connection pool
    const poolStart = Date.now();
    const promises = Array.from({ length: 5 }, () => 
      prisma.$queryRaw`SELECT pg_backend_pid() as pid`
    );
    await Promise.all(promises);
    const poolTime = Date.now() - poolStart;
    
    console.log(`✅ Connection pool test (5 concurrent): ${poolTime}ms`);
    
    // Summary
    console.log('\n📊 Database Health Summary:');
    console.log(`• Basic connectivity: ${basicTime}ms`);
    console.log(`• Query performance: ${queryTime}ms`);
    console.log(`• Pool performance: ${poolTime}ms`);
    
    if (basicTime > 1000) {
      console.warn('⚠️  Warning: Basic connection is slow (>1s)');
    }
    
    if (queryTime > 500) {
      console.warn('⚠️  Warning: Query performance is slow (>500ms)');
    }
    
    console.log('✅ Database health check completed successfully!');
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseHealth();