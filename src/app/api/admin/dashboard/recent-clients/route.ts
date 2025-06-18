import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { RecentClient } from '@/types/dashboard';

export async function GET(): Promise<NextResponse<RecentClient[] | { error: string }>> {
  try {
    // Fetch the 10 most recently updated clients
    const recentClients = await prisma.clients.findMany({
      take: 10,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    if (recentClients.length === 0) {
      return NextResponse.json([]);
    }

    const clientIds = recentClients.map(client => client.id);

    // Fetch session aggregates in parallel
    const [sessionAggregates, lastSessions] = await Promise.all([
      // Get session count and total cost per client
      prisma.tattoo_sessions.groupBy({
        by: ['clientId'],
        where: { clientId: { in: clientIds } },
        _count: {
          id: true,
        },
        _sum: {
          totalCost: true,
        },
      }),
      // Get last session date for each client
      Promise.all(
        clientIds.map(clientId =>
          prisma.tattoo_sessions.findFirst({
            where: { clientId },
            orderBy: { appointmentDate: 'desc' },
            select: { 
              clientId: true,
              appointmentDate: true 
            },
          })
        )
      ),
    ]);

    // Create lookup maps for performance
    const aggregatesMap = new Map<string, { totalSessions: number; totalSpent: number }>();
    sessionAggregates.forEach(aggregate => {
      aggregatesMap.set(aggregate.clientId, {
        totalSessions: aggregate._count.id,
        totalSpent: Number(aggregate._sum.totalCost || 0),
      });
    });

    const lastSessionMap = new Map<string, Date>();
    lastSessions.forEach(session => {
      if (session) {
        lastSessionMap.set(session.clientId, session.appointmentDate);
      }
    });

    // Format client data with aggregated information
    const formattedClients: RecentClient[] = recentClients.map(client => {
      const aggregates = aggregatesMap.get(client.id) ?? { 
        totalSessions: 0, 
        totalSpent: 0 
      };
      const lastSessionDate = lastSessionMap.get(client.id);

      return {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        phone: client.phone || undefined,
        joinDate: client.createdAt.toISOString(),
        totalSessions: aggregates.totalSessions,
        totalSpent: aggregates.totalSpent,
        lastSession: lastSessionDate?.toISOString(),
      };
    });

    return NextResponse.json(formattedClients);

  } catch (error) {
    logger.error('Failed to fetch recent clients', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch recent clients' },
      { status: 500 }
    );
  }
}
