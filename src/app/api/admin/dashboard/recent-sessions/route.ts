import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import type { RecentSession } from '@/types/dashboard' // Import RecentSession
import type { SessionStatus as PrismaSessionStatus } from '@prisma/client' // For type casting if needed

export async function GET(): Promise<NextResponse<RecentSession[] | { error: string }>> {
  try {
    // Get recent tattoo sessions with client and artist info
    const sessionsData = await prisma.tattoo_sessions.findMany({ // Corrected model name
      take: 10,
      orderBy: {
        appointmentDate: 'desc'
      },
      // Select all scalar fields from tattoo_sessions by default, plus specified relations
      include: {
        clients: { // Corrected relation name
          select: {
            // id: true, // Not needed for RecentSession if only name is used
            firstName: true,
            lastName: true,
            // email: true // Not needed for RecentSession
          }
        },
        tattoo_artists: { // Corrected relation name
          select: {
            // id: true, // Not needed for RecentSession
            name: true,
            // email: true // Not needed for RecentSession
          }
        }
      }
    })

    const formattedSessions: RecentSession[] = sessionsData.map(session => {
      const statusValue = session.status as PrismaSessionStatus; // Prisma returns the enum string
      return {
        id: session.id,
        clientName: session.clients ? `${session.clients.firstName} ${session.clients.lastName}` : 'N/A',
        artistName: session.tattoo_artists?.name || 'N/A',
        type: session.style || 'N/A',
        duration: session.duration || 0,
        amount: Number(session.totalCost || 0),
        date: session.appointmentDate.toISOString(),
        status: statusValue,
      };
    });

    return NextResponse.json(formattedSessions)

  } catch (error) {
    logger.error('Recent sessions error', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent sessions' },
      { status: 500 }
    )
  }
}
