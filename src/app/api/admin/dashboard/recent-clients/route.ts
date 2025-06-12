import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  try {
    // Get recent clients with their latest session info
    const recentClients = await prisma.client.findMany({
      take: 10,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        sessions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            totalCost: true,
            designDescription: true,
            status: true,
            style: true
          }
        },
        appointments: {
          orderBy: {
            scheduledDate: 'desc'
          },
          take: 1,
          select: {
            type: true,
            status: true
          }
        }
      }
    })

    // Format the data for the dashboard
    const formattedClients = recentClients.map(client => ({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      lastSessionType: client.sessions[0]?.designDescription || 
                      client.sessions[0]?.style || 
                      client.appointments[0]?.type?.toLowerCase().replace('_', ' ') || 
                      'New client',
      lastPayment: client.sessions[0]?.totalCost 
        ? Number(client.sessions[0].totalCost)
        : null,
      status: client.sessions[0]?.status || client.appointments[0]?.status || 'ACTIVE'
    }))

    return NextResponse.json(formattedClients)

  } catch (error) {
    console.error('Recent clients error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent clients' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}