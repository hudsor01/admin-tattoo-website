import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  try {
    // Test basic database queries
    const [clientCount, artistCount, sessionCount, appointmentCount] = await Promise.all([
      prisma.client.count(),
      prisma.tattooArtist.count(),
      prisma.tattooSession.count(),
      prisma.appointment.count()
    ])

    // Get some sample data
    const recentClients = await prisma.client.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true
      }
    })

    const recentSessions = await prisma.tattooSession.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        artist: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      counts: {
        clients: clientCount,
        artists: artistCount,
        sessions: sessionCount,
        appointments: appointmentCount
      },
      recentClients,
      recentSessions,
      databaseConnected: true
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseConnected: false
    }, { status: 500 })
  }
}