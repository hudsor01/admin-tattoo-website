import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    // Get recent tattoo sessions with client and artist info
    const recentSessions = await prisma.tattooSession.findMany({
      take: 10,
      orderBy: {
        appointmentDate: 'desc'
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        artist: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(recentSessions)

  } catch (error) {
    logger.error('Recent sessions error', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent sessions' },
      { status: 500 }
    )
  }
}