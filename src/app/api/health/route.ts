import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    auth: HealthCheckResult;
    environment: HealthCheckResult;
  };
}

interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail';
  responseTime?: number;
  details?: string;
  error?: string;
}

// Cache health check results for 30 seconds to avoid overwhelming the system
let healthCheckCache: { result: HealthCheck; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Simple database connectivity check
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if we can query main tables
    const clientCount = await prisma.client.count();
    const appointmentCount = await prisma.appointment.count();
    
    const responseTime = Date.now() - start;
    
    return {
      status: responseTime < 1000 ? 'pass' : 'warn',
      responseTime,
      details: `Database responsive. ${clientCount} clients, ${appointmentCount} appointments.`
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkAuth(): Promise<HealthCheckResult> {
  try {
    // Check if auth environment variables are present
    const authUrl = process.env.BETTER_AUTH_URL;
    const authSecret = process.env.BETTER_AUTH_SECRET;
    
    if (!authUrl || !authSecret) {
      return {
        status: 'fail',
        error: 'Auth environment variables missing'
      };
    }

    // Simple auth endpoint availability check
    const start = Date.now();
    try {
      const response = await fetch(`${authUrl}/api/auth/session`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const responseTime = Date.now() - start;
      
      return {
        status: response.ok ? 'pass' : 'warn',
        responseTime,
        details: `Auth service reachable (${response.status})`
      };
    } catch {
      return {
        status: 'warn',
        responseTime: Date.now() - start,
        details: 'Auth service not reachable, but configuration present'
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Auth check failed'
    };
  }
}

async function checkEnvironment(): Promise<HealthCheckResult> {
  try {
    const requiredEnvVars = [
      'DATABASE_URL',
      'BETTER_AUTH_SECRET',
      'BETTER_AUTH_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return {
        status: 'fail',
        error: `Missing environment variables: ${missingVars.join(', ')}`
      };
    }

    // Check optional but important variables
    const optionalVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];
    
    const missingOptional = optionalVars.filter(varName => !process.env[varName]);
    
    return {
      status: missingOptional.length === 0 ? 'pass' : 'warn',
      details: missingOptional.length > 0 
        ? `Optional variables missing: ${missingOptional.join(', ')}`
        : 'All environment variables present'
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Environment check failed'
    };
  }
}


async function performHealthCheck(): Promise<HealthCheck> {
  // Run all checks in parallel for better performance
  const [database, auth, environment] = await Promise.all([
    checkDatabase(),
    checkAuth(),
    checkEnvironment()
  ]);

  const checks = { database, auth, environment };
  
  // Determine overall status
  const hasFailures = Object.values(checks).some(check => check.status === 'fail');
  const hasWarnings = Object.values(checks).some(check => check.status === 'warn');
  
  const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 
    hasFailures ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks
  };
}

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (healthCheckCache && (now - healthCheckCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json(healthCheckCache.result);
    }

    // Perform health check
    const healthCheck = await performHealthCheck();
    
    // Update cache
    healthCheckCache = {
      result: healthCheck,
      timestamp: now
    };

    // Set appropriate HTTP status based on health
    const httpStatus = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, { status: httpStatus });
    
  } catch (error) {
    console.error('[Health Check] Unexpected error:', error);
    
    const errorResponse: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: { status: 'fail', error: 'Health check system error' },
        auth: { status: 'fail', error: 'Health check system error' },
        environment: { status: 'fail', error: 'Health check system error' }
      }
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}