import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withSecurityValidation, SecurityPresets } from '@/lib/api-validation';
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handling';

const prisma = new PrismaClient();

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
      prisma.tattooSession.aggregate({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: firstDayThisMonth }
        },
        _sum: { totalCost: true }
      }),
      prisma.tattooSession.aggregate({
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
      prisma.client.count({
        where: {
          sessions: {
            some: {
              appointmentDate: { gte: thirtyDaysAgo }
            }
          }
        }
      }),
      prisma.client.count({
        where: {
          sessions: {
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
      prisma.tattooSession.count({
        where: {
          appointmentDate: { gte: firstDayThisMonth }
        }
      }),
      prisma.tattooSession.count({
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
    const topArtists = await prisma.tattooArtist.findMany({
      include: {
        sessions: {
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
      revenue: artist.sessions.reduce((sum, session) => sum + Number(session.totalCost), 0)
    })).sort((a, b) => b.revenue - a.revenue);

    // 6. Session Types Breakdown
    const sessionsByStyle = await prisma.tattooSession.groupBy({
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
    const clientAcquisition = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const newClients = await prisma.client.count({
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
    console.error('Analytics API error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch analytics data'),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Apply security validation with analytics read preset
export const GET = withSecurityValidation({
  ...SecurityPresets.ANALYTICS_READ
})(getAnalyticsHandler);