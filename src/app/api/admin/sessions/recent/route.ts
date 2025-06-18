import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { SecurityPresets, withSecurityValidation } from '@/lib/api-validation';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-core';
import { logger } from '@/lib/logger';
import type { RecentSessionDTO } from '@/types/database';

const getRecentSessionsHandler = async (_request: NextRequest): Promise<NextResponse> => {
  try {

    // Fetch recent sessions with related data
    const recentSessions = await prisma.tattoo_sessions.findMany({
      select: {
        id: true,
        appointmentDate: true,
        status: true,
        consentSigned: true,
        createdAt: true,
        updatedAt: true,
        clients: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        tattoo_artists: {
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

    const mappedSessions: RecentSessionDTO[] = recentSessions.map(session => ({
      id: session.id,
      appointmentDate: session.appointmentDate,
      status: session.status,
      consentSigned: session.consentSigned,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      client: {
        id: session.clients.id,
        firstName: session.clients.firstName,
        lastName: session.clients.lastName,
        email: session.clients.email,
        phone: session.clients.phone,
      },
      artist: {
        id: session.tattoo_artists.id,
        name: session.tattoo_artists.name,
        email: session.tattoo_artists.email,
        specialties: session.tattoo_artists.specialties,
      },
    }));
    
    return NextResponse.json(createSuccessResponse({
      data: mappedSessions,
      total: mappedSessions.length
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
