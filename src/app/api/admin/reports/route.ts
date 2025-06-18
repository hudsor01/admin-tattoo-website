import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SecurityPresets, withSecurityValidation } from '@/lib/api-validation';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-core';
import { logger } from '@/lib/logger';

const getReportsHandler = async (_request: NextRequest): Promise<NextResponse> => {
  try {
    // Calculate date ranges
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayThisYear = new Date(now.getFullYear(), 0, 1);

    // 1. Customer Summary
    const [totalCustomers, newCustomersThisMonth, activeCustomers] = await Promise.all([
      prisma.clients.count(),
      prisma.clients.count({
        where: {
          createdAt: { gte: firstDayThisMonth }
        }
      }),
      prisma.clients.count({
        where: {
          tattoo_sessions: {
            some: {
              appointmentDate: { gte: firstDayThisMonth }
            }
          }
        }
      })
    ]);

    // 2. Revenue Summary
    const [totalRevenueThisYear, totalRevenueThisMonth, avgSessionValue] = await Promise.all([
      prisma.tattoo_sessions.aggregate({
        where: {
          status: 'COMPLETED',
          appointmentDate: { gte: firstDayThisYear }
        },
        _sum: { totalCost: true },
        _avg: { totalCost: true }
      }),
      prisma.tattoo_sessions.aggregate({
        where: {
          status: 'COMPLETED',
          appointmentDate: { gte: firstDayThisMonth }
        },
        _sum: { totalCost: true }
      }),
      prisma.tattoo_sessions.aggregate({
        where: {
          status: 'COMPLETED'
        },
        _avg: { totalCost: true }
      })
    ]);

    // 3. Appointment Summary
    const [totalAppointments, completedAppointments, pendingAppointments, cancelledAppointments] = await Promise.all([
      prisma.appointments.count(),
      prisma.appointments.count({
        where: { status: 'COMPLETED' }
      }),
      prisma.appointments.count({
        where: { status: 'SCHEDULED' }
      }),
      prisma.appointments.count({
        where: { status: 'CANCELLED' }
      })
    ]);

    // 4. Artist Performance
    const artistPerformance = await prisma.tattoo_sessions.groupBy({
      by: ['artistId'],
      where: {
        status: 'COMPLETED',
        appointmentDate: { gte: firstDayThisYear }
      },
      _sum: { totalCost: true },
      _count: { id: true },
      _avg: { totalCost: true }
    });

    // Get artist names
    const artistIds = artistPerformance.map(a => a.artistId);
    const artistNames = await prisma.tattoo_artists.findMany({
      where: { id: { in: artistIds } },
      select: { id: true, name: true }
    });
    const artistNameMap = new Map(artistNames.map(a => [a.id, a.name]));

    const artistReports = artistPerformance.map(a => ({
      artistId: a.artistId,
      artistName: artistNameMap.get(a.artistId) || 'Unknown',
      totalRevenue: Number(a._sum.totalCost || 0),
      sessionCount: a._count.id,
      avgSessionValue: Number(a._avg.totalCost || 0)
    }));

    // 5. Monthly Revenue Trends (last 12 months)
    const monthlyRevenue: Array<{ month: string; revenue: number }> = [];
    const revenuePromises = [];
    const months: Array<{ monthStart: Date; monthEnd: Date; label: string }> = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      months.push({
        monthStart,
        monthEnd,
        label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
      
      revenuePromises.push(
        prisma.tattoo_sessions.aggregate({
          where: {
            status: 'COMPLETED',
            appointmentDate: { gte: monthStart, lte: monthEnd }
          },
          _sum: { totalCost: true }
        })
      );
    }

    const monthlyRevenueData = await Promise.all(revenuePromises);
    
    months.forEach((monthObj, index) => {
      const revenueData = monthlyRevenueData.at(index);
      monthlyRevenue.push({
        month: monthObj.label,
        revenue: Number(revenueData?._sum.totalCost || 0)
      });
    });

    // 6. Top Customers by Revenue
    const topCustomers = await prisma.tattoo_sessions.groupBy({
      by: ['clientId'],
      where: {
        status: 'COMPLETED',
        appointmentDate: { gte: firstDayThisYear }
      },
      _sum: { totalCost: true },
      _count: { id: true },
      orderBy: {
        _sum: { totalCost: 'desc' }
      },
      take: 10
    });

    // Get customer names
    const customerIds = topCustomers.map(c => c.clientId);
    const customerNames = await prisma.clients.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });
    const customerNameMap = Object.fromEntries(
      customerNames.map(c => [c.id, `${c.firstName} ${c.lastName}`])
    );

    const customerReports = topCustomers.map(c => ({
      customerId: c.clientId,
      customerName: customerNameMap[c.clientId] || 'Unknown',
      totalSpent: Number(c._sum.totalCost || 0),
      sessionCount: c._count.id
    }));

    // 7. Appointment Status Distribution
    const appointmentStats = {
      total: totalAppointments,
      completed: completedAppointments,
      pending: pendingAppointments,
      cancelled: cancelledAppointments,
      completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0
    };

    const reportsData = {
      summary: {
        totalCustomers,
        newCustomersThisMonth,
        activeCustomers,
        totalRevenue: Number(totalRevenueThisYear._sum.totalCost || 0),
        monthlyRevenue: Number(totalRevenueThisMonth._sum.totalCost || 0),
        avgSessionValue: Number(avgSessionValue._avg.totalCost || 0),
        totalAppointments,
        appointmentStats
      },
      monthlyRevenue,
      artistReports,
      customerReports,
      appointmentStats
    };

    return NextResponse.json(createSuccessResponse(reportsData));

  } catch (error) {
    logger.error('Reports API error', error);
    return NextResponse.json(createErrorResponse('Failed to fetch reports data', 500), {
      status: 500
    });
  }
};

export const GET = withSecurityValidation({
  ...SecurityPresets.REPORTS_READ
})(getReportsHandler);