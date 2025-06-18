import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { SecurityPresets, withSecurityValidation } from '@/lib/api-validation';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-core';
import { logger } from '@/lib/logger';

const getAnalyticsHandler = async (_request: NextRequest) => {
  try {

    // Calculate date ranges
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // 1. Total Revenue (from completed sessions)
    const [currentMonthRevenue, lastMonthRevenue] = await Promise.all([
      prisma.tattoo_sessions.aggregate({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: firstDayThisMonth }
        },
        _sum: { totalCost: true }
      }),
      prisma.tattoo_sessions.aggregate({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: firstDayLastMonth, lte: lastDayLastMonth }
        },
        _sum: { totalCost: true }
      })
    ]);

    const totalRevenue = Number(currentMonthRevenue._sum.totalCost || 0);
    const lastMonthRevenueValue = Number(lastMonthRevenue._sum.totalCost || 0);
    const revenueChange = lastMonthRevenueValue > 0 
      ? ((totalRevenue - lastMonthRevenueValue) / lastMonthRevenueValue) * 100 
      : 0;

    // 2. Active Clients (clients with sessions in last 30 days)
    const [activeClientsCount, lastMonthActiveClients] = await Promise.all([
      prisma.clients.count({
        where: {
          tattoo_sessions: {
            some: {
              appointmentDate: { gte: thirtyDaysAgo }
            }
          }
        }
      }),
      prisma.clients.count({
        where: {
          tattoo_sessions: {
            some: {
              appointmentDate: { gte: firstDayLastMonth, lte: lastDayLastMonth }
            }
          }
        }
      })
    ]);

    const clientsChange = lastMonthActiveClients > 0 
      ? ((activeClientsCount - lastMonthActiveClients) / lastMonthActiveClients) * 100 
      : 0;

    // 3. Sessions This Month
    const [currentMonthSessions, lastMonthSessions] = await Promise.all([
      prisma.tattoo_sessions.count({
        where: {
          appointmentDate: { gte: firstDayThisMonth }
        }
      }),
      prisma.tattoo_sessions.count({
        where: {
          appointmentDate: { gte: firstDayLastMonth, lte: lastDayLastMonth }
        }
      })
    ]);

    const sessionsChange = lastMonthSessions > 0 
      ? ((currentMonthSessions - lastMonthSessions) / lastMonthSessions) * 100 
      : 0;

    // 4. Average Session Value
    const avgSessionValue = currentMonthSessions > 0 ? totalRevenue / currentMonthSessions : 0;
    const lastMonthAvgValue = lastMonthSessions > 0 ? lastMonthRevenueValue / lastMonthSessions : 0;
    const avgValueChange = lastMonthAvgValue > 0 
      ? ((avgSessionValue - lastMonthAvgValue) / lastMonthAvgValue) * 100 
      : 0;

    // 5. Top Performing Artists
    const topArtists = await prisma.tattoo_artists.findMany({
      include: {
        tattoo_sessions: {
          where: {
            status: 'COMPLETED',
            appointmentDate: { gte: firstDayThisMonth }
          }
        }
      }
    });

    const artistsWithRevenue = topArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      revenue: artist.tattoo_sessions.reduce((sum: number, session: { totalCost: Prisma.Decimal | number | null }) => sum + Number(session.totalCost), 0)
    })).sort((a, b) => b.revenue - a.revenue);

    // 6. Session Types Breakdown
    const sessionsByStyle = await prisma.tattoo_sessions.groupBy({
      by: ['style'],
      where: {
        appointmentDate: { gte: firstDayThisMonth }
      },
      _count: { style: true }
    });

    const totalSessionsForTypes = sessionsByStyle.reduce((sum, item) => sum + item._count.style, 0);
    const sessionTypes = sessionsByStyle.map(item => ({
      name: item.style,
      count: item._count.style,
      percentage: totalSessionsForTypes > 0 ? (item._count.style / totalSessionsForTypes) * 100 : 0
    }));

    // 7. Client Acquisition (last 6 months)
    const clientAcquisition: Array<{ month: string; newClients: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const newClients = await prisma.clients.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      });

      clientAcquisition.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newClients
      });
    }

    const analyticsData = {
      totalRevenue,
      revenueChange,
      activeClients: activeClientsCount,
      clientsChange,
      monthlySessions: currentMonthSessions, // Fixed typo from "monthySessions"
      sessionsChange,
      avgSessionValue,
      avgValueChange,
      topArtists: artistsWithRevenue,
      sessionTypes,
      clientAcquisition
    };

    return NextResponse.json(createSuccessResponse(analyticsData));

  } catch (error) {
    logger.error('Analytics API error', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch analytics data'),
      { status: 500 }
    );
  }
}

// Apply security validation with analytics read preset
export const GET = withSecurityValidation({
  ...SecurityPresets.ANALYTICS_READ
})(getAnalyticsHandler);
