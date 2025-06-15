import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple readiness check for container orchestration
export async function GET() {
  try {
    // Quick database connectivity check
    await prisma.$queryRaw`SELECT 1`;
    
    // Check critical environment variables
    const criticalVars = ['DATABASE_URL', 'BETTER_AUTH_SECRET'];
    const missing = criticalVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      return NextResponse.json(
        { 
          status: 'not ready', 
          reason: `Missing critical environment variables: ${missing.join(', ')}` 
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ 
      status: 'ready',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Readiness Check] Failed:', error);
    
    return NextResponse.json(
      { 
        status: 'not ready',
        reason: error instanceof Error ? error.message : 'Database connection failed'
      },
      { status: 503 }
    );
  }
}