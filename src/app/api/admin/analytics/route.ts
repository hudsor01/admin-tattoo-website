import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SecurityPresets, withSecurityValidation } from '@/lib/api-validation';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-core';
import { logger } from '@/lib/logger';

const getAnalyticsHandler = async (_request: NextRequest): Promise<NextResponse> => {
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
          updatedAt: { gte: firstDayThisMonth, lte: now }
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
          appointmentDate: { gte: firstDayThisMonth, lte: now }
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

    // 5. Top Performing Artists (limit to top 5, aggregate in DB)
    const artistsWithRevenue = await prisma.tattoo_sessions.groupBy({
      by: ['artistId'],
      where: {
        status: 'COMPLETED',
        appointmentDate: { gte: firstDayThisMonth }
      },
      _sum: { totalCost: true },
      _count: { id: true },
      orderBy: {
        _sum: {
          totalCost: 'desc'
        }
      },
      take: 5
    });

    // Fetch artist names for the top artists
    const artistIds = artistsWithRevenue.map(a => a.artistId);
    const artistNames = await prisma.tattoo_artists.findMany({
      where: { id: { in: artistIds } },
      select: { id: true, name: true }
    });
    const artistNameMap = Object.fromEntries(artistNames.map(a => [a.id, a.name]));

    const topArtists = artistsWithRevenue.map(a => ({
      id: a.artistId,
      name: artistNameMap[a.artistId] || 'Unknown',
      revenue: Number(a._sum.totalCost || 0),
      sessionCount: a._count.id
    }));

    // 6. Session Types Breakdown
    const sessionsByStyle = await prisma.tattoo_sessions.groupBy({
      by: ['style'],
      where: {
        appointmentDate: {
          gte: firstDayThisMonth
        }
      },
      _count: {
        style: true
      }
    });

    const totalSessionsForTypes = sessionsByStyle.reduce((sum, item) => sum + item._count.style, 0);
    const sessionTypes = sessionsByStyle.map(item => ({
      name: item.style,
      count: item._count.style,
      percentage: totalSessionsForTypes > 0 ? (item._count.style / totalSessionsForTypes) * 100 : 0
    }));
    // 7. Client Acquisition (last 6 months)
    const clientAcquisition: Array < {
      month: string;
      newClients: number
    } > = [];
    const acquisitionPromises: Array < Promise < number >> = [];
    const months: Array < {
      monthStart: Date;
      monthEnd: Date;
      label: string
    } > = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      months.push({
        monthStart,
        monthEnd,
        label: monthStart.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric'
        })
      });
      acquisitionPromises.push(
        prisma.clients.count({
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        })
      );
    }

    const newClientsCounts = await Promise.all(acquisitionPromises);

    // Use map and zip pattern to avoid direct array indexing
    const clientAcquisitionData = months.map((monthObj, index) => {
      let label = '';

      // Ensure monthObj.label is a string before attempting to sanitize
      if (typeof monthObj.label === 'string') {
        // Option 1: Allow only letters, numbers, spaces, and hyphens (common for labels)
        // This is generally a safe and robust approach for display labels.
        label = monthObj.label.replace(/[^a-zA-Z0-9\s-]/g, '');
      } else {
        // Handle cases where monthObj.label is not a string (e.g., null, undefined, number)
        // Set a default value or handle as appropriate for your application.
        label = 'Unknown Month'; // Default value
      }

      // Use Array.at() which is safer than bracket notation
      const countValue = newClientsCounts.at(index);
      const newClients = typeof countValue === 'number' && Number.isFinite(countValue) ? countValue : 0;
      
      return {
        month: label,
        newClients
      };
    });

    clientAcquisition.push(...clientAcquisitionData);

    const analyticsData = {
      totalRevenue,
      revenueChange,
      activeClients: activeClientsCount,
      clientsChange,
      monthlySessions: currentMonthSessions,
      sessionsChange,
      avgSessionValue,
      avgValueChange,
      topArtists,
      sessionTypes,
      clientAcquisition
    };

    return NextResponse.json(createSuccessResponse(analyticsData));

  } catch (error) {
    logger.error('Analytics API error', error);
    return NextResponse.json(createErrorResponse('Failed to fetch analytics data', 500), {
      status: 500
    });
  }
}
export const GET = withSecurityValidation({
  ...SecurityPresets.ANALYTICS_READ
})(getAnalyticsHandler);
