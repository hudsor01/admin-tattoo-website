import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { withSecurityValidation, SecurityPresets } from '@/lib/api-validation';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-core';
import { logger } from '@/lib/logger';

const getRecentSessionsHandler = async (_request: NextRequest) => {
  try {

    // Fetch recent sessions with related data
    const recentSessions = await prisma.tattooSession.findMany({
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
            specialties: true
          }
        }
      },
      orderBy: {
        appointmentDate: 'desc'
      },
      take: 20 // Limit to 20 most recent sessions
    });

    return NextResponse.json(createSuccessResponse({
      data: recentSessions,
      total: recentSessions.length
    }));

  } catch (error) {
    logger.error('Recent sessions API error', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch recent sessions'),
      { status: 500 }
    );
  }
}

// Apply security validation with appropriate preset
export const GET = withSecurityValidation({
  ...SecurityPresets.DASHBOARD_READ
})(getRecentSessionsHandler);
