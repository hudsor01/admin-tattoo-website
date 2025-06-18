import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const start = Date.now();
    
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Test table access and get basic stats
    const [clientCount, sessionCount, appointmentCount] = await Promise.all([
      prisma.clients.count(),
      prisma.tattoo_sessions.count(),
      prisma.appointments.count()
    ]);
    
    const responseTime = Date.now() - start;
    
    // Check database performance
    const performanceStatus = responseTime < 500 ? 'excellent' : 
                             responseTime < 1000 ? 'good' : 
                             responseTime < 2000 ? 'slow' : 'poor';
    
    return NextResponse.json({
      status: 'connected',
      responseTime,
      performance: performanceStatus,
      statistics: {
        clients: clientCount,
        sessions: sessionCount,
        appointments: appointmentCount
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Database Health] Check failed:', error);
    
    return NextResponse.json(
      {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
