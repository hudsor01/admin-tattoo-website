import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getRequestId, internalErrorResponse, successResponse, unauthorizedResponse } from '@/lib/api-core';
import { getClientIP, logger } from '@/lib/logger';

/**
 * POST /api/admin/verify-access
 * Verifies if the current user has admin access
 * This endpoint provides server-side admin role verification
 */
export async function GET(request: NextRequest): Promise<Response> {
  const requestId = getRequestId(request);
  const clientIP = getClientIP(request);
  
  try {
    // Get the current session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Check if user is authenticated
    if (!session?.user) {
      logger.security('Admin verification failed: No valid session', {
        path: '/api/admin/verify-access',
        method: 'GET'
      }, {
        requestId,
        ip: clientIP
      });
      
      return unauthorizedResponse('Authentication required', requestId);
    }

    // Verify admin role from session
    const isAdmin = session.user.role === 'admin';
    
    if (!isAdmin) {
      logger.security('Admin verification failed: User is not admin', {
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role,
        path: '/api/admin/verify-access'
      }, {
        requestId,
        ip: clientIP
      });
      
      return successResponse({
        isAdmin: false,
        message: 'User does not have admin privileges'
      }, 'Access verification completed', undefined, requestId);
    }

    // Log successful admin verification
    logger.auth('Admin access verified', session.user.id, clientIP, {
      userRole: session.user.role,
      path: '/api/admin/verify-access'
    });

    return successResponse({
      isAdmin: true,
      userId: session.user.id,
      userRole: session.user.role,
      message: 'Admin access verified'
    }, 'Admin access verified', undefined, requestId);

  } catch (error) {
    logger.error('Admin verification error', error, {
      requestId,
      ip: clientIP,
      path: '/api/admin/verify-access'
    });
    
    return internalErrorResponse(
      'Failed to verify admin access',
      requestId
    );
  }
}