import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { SessionStatus as PrismaSessionStatus } from '@prisma/client';
import { AppointmentStatus } from '@prisma/client'
import type { BetterAuthUser} from '@/lib/authorization';
import { isVerifiedAdmin, toBetterAuthUser } from '@/lib/authorization'
import type { ChartDataPoint, DashboardStats, RecentClient, RecentSession } from '@/types/dashboard'

export async function GET(request: NextRequest) {
  try {
    // Always enforce authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has verified admin access using new authorization system
    const user = toBetterAuthUser(session.user as BetterAuthUser)
    if (!isVerifiedAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch all dashboard data in parallel
    const [stats, recentClients, chartData, recentSessions] = await Promise.all([
      getDashboardStats(),
      getRecentClients(),
      getChartData(),
      getRecentSessions()
    ])

    return NextResponse.json({
      stats,
      recentClients,
      chartData,
      recentSessions
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

async function getDashboardStats(): Promise<DashboardStats> { // Add return type
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
 
  const [
    currentRevenueData,
    currentNewClients, 
    currentMonthAppointmentsCount,
    activeBookingsCount,
    completedSessionsThisMonthCount,
    totalSessionsThisMonthCount
  ] = await Promise.all([
    prisma.tattoo_sessions.aggregate({
      where: {
        appointmentDate: { gte: firstOfMonth }
      },
      _sum: { totalCost: true }
    }),
    prisma.clients.count({
      where: {
        createdAt: { gte: firstOfMonth }
      }
    }),
    prisma.appointments.count({
      where: {
        scheduledDate: { gte: firstOfMonth }
      }
    }),
    prisma.appointments.count({ 
      where: { 
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS] } 
      } 
    }),
    prisma.tattoo_sessions.count({ 
      where: { 
        status: 'COMPLETED', 
        appointmentDate: { gte: firstOfMonth } 
      } 
    }),
    prisma.tattoo_sessions.count({ 
      where: { 
        appointmentDate: { gte: firstOfMonth } 
      } 
    }),
  ])

  // Get last month stats for comparison
  const [
    lastMonthRevenueData,
    lastMonthNewClients,
    lastMonthAppointmentsCount,
    activeBookingsLastMonthCount,
    completedSessionsLastMonthCount,
    totalSessionsLastMonthCount
  ] = await Promise.all([
    prisma.tattoo_sessions.aggregate({
      where: {
        appointmentDate: { 
          gte: firstOfLastMonth,
          lt: firstOfMonth
        }
      },
      _sum: { totalCost: true }
    }),
    prisma.clients.count({
      where: {
        createdAt: { 
          gte: firstOfLastMonth,
          lt: firstOfMonth 
        }
      }
    }),
    prisma.appointments.count({
      where: {
        scheduledDate: { 
          gte: firstOfLastMonth,
          lt: firstOfMonth
        }
      }
    }),
    prisma.appointments.count({ 
      where: { 
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS] },
        scheduledDate: { lt: firstOfMonth, gte: firstOfLastMonth }
      } 
    }),
    prisma.tattoo_sessions.count({ 
      where: { 
        status: 'COMPLETED', 
        appointmentDate: { gte: firstOfLastMonth, lt: firstOfMonth } 
      } 
    }),
    prisma.tattoo_sessions.count({ 
      where: { 
        appointmentDate: { gte: firstOfLastMonth, lt: firstOfMonth } 
      } 
    }),
  ])

  // Calculate metrics
  const totalRevenue = Number(currentRevenueData._sum.totalCost || 0)
  const overallTotalClients = await prisma.clients.count()
  const monthlyAppointments = currentMonthAppointmentsCount

  const lastMonthRevenueValue = Number(lastMonthRevenueData._sum.totalCost || 0)
  
  const revenueGrowth = lastMonthRevenueValue > 0 
    ? parseFloat(((totalRevenue - lastMonthRevenueValue) / lastMonthRevenueValue * 100).toFixed(1))
    : (totalRevenue > 0 ? 100 : 0);
  
  const clientGrowth = lastMonthNewClients > 0 
    ? parseFloat(((currentNewClients - lastMonthNewClients) / lastMonthNewClients * 100).toFixed(1))
    : (currentNewClients > 0 ? 100 : 0);

  const bookingGrowth = activeBookingsLastMonthCount > 0
    ? parseFloat(((activeBookingsCount - activeBookingsLastMonthCount) / activeBookingsLastMonthCount * 100).toFixed(1))
    : (activeBookingsCount > 0 ? 100 : 0);

  const completionRate = totalSessionsThisMonthCount > 0 
    ? parseFloat((completedSessionsThisMonthCount / totalSessionsThisMonthCount * 100).toFixed(1)) 
    : 0;
  
  const completionRateLastMonth = totalSessionsLastMonthCount > 0 
    ? (completedSessionsLastMonthCount / totalSessionsLastMonthCount * 100) 
    : 0;
  
  const completionGrowth = completionRateLastMonth > 0 
    ? parseFloat(((completionRate - completionRateLastMonth) / completionRateLastMonth * 100).toFixed(1))
    : (completionRate > 0 ? 100 : 0);

  // Calculate percentage change strings
  const revenueChangeStr = `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`
  const clientsChangeStr = `${clientGrowth >= 0 ? '+' : ''}${clientGrowth.toFixed(1)}%`
  const appointmentsChangeNum = lastMonthAppointmentsCount > 0 
    ? ((currentMonthAppointmentsCount - lastMonthAppointmentsCount) / lastMonthAppointmentsCount * 100)
    : (currentMonthAppointmentsCount > 0 ? 100 : 0);
  const appointmentsChangeStr = `${appointmentsChangeNum >= 0 ? '+' : ''}${appointmentsChangeNum.toFixed(1)}%`


  return {
    totalRevenue,
    revenueGrowth,
    newClients: currentNewClients,
    clientGrowth,
    activeBookings: activeBookingsCount,
    bookingGrowth,
    completionRate,
    completionGrowth,
    revenue: totalRevenue,
    revenueChange: revenueChangeStr,
    totalClients: overallTotalClients,
    clientsChange: clientsChangeStr,
    monthlyAppointments,
    appointmentsChange: appointmentsChangeStr,
    averageRating: parseFloat(await calculateSatisfactionRating()),
    ratingChange: await calculateRatingChange(),
  }
}

async function calculateSatisfactionRating(): Promise<string> {
  const completedSessions = await prisma.tattoo_sessions.count({
    where: { status: 'COMPLETED' }
  });
  
  const totalSessions = await prisma.tattoo_sessions.count();
  
  if (totalSessions === 0) return '5.0';
  
  const completionRate = completedSessions / totalSessions;

  const rating = Math.min(5.0, 3.0 + (completionRate * 2.0));
  
  return rating.toFixed(1);
}

async function calculateRatingChange(): Promise<string> {
  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get completion rates for this month and last month
  const [thisMonthCompleted, thisMonthTotal, lastMonthCompleted, lastMonthTotal] = await Promise.all([
    prisma.tattoo_sessions.count({
      where: { 
        status: 'COMPLETED',
        updatedAt: { gte: thisMonthStart }
      }
    }),
    prisma.tattoo_sessions.count({
      where: { updatedAt: { gte: thisMonthStart } }
    }),
    prisma.tattoo_sessions.count({
      where: { 
        status: 'COMPLETED',
        updatedAt: { 
          gte: lastMonthStart,
          lt: thisMonthStart
        }
      }
    }),
    prisma.tattoo_sessions.count({
      where: { 
        updatedAt: { 
          gte: lastMonthStart,
          lt: thisMonthStart
        }
      }
    })
  ]);
  
  const thisMonthRate = thisMonthTotal > 0 ? thisMonthCompleted / thisMonthTotal : 0;
  const lastMonthRate = lastMonthTotal > 0 ? lastMonthCompleted / lastMonthTotal : 0;
  
  const ratingChange = (thisMonthRate - lastMonthRate) * 2.0; // Scale to rating system
  
  return ratingChange >= 0 ? `+${ratingChange.toFixed(1)}` : ratingChange.toFixed(1);
}

async function getRecentClients(): Promise<RecentClient[]> {
  const clientsData = await prisma.clients.findMany({ // Renamed to clientsData to avoid conflict
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      tattoo_sessions: {
        orderBy: { appointmentDate: 'desc' },
        select: {
          appointmentDate: true,
          totalCost: true,
        }
      }
    }
  });

  return clientsData.map(client => {
    const lastSessionData = client.tattoo_sessions[0];
    // For totalSessions and totalSpent, a more accurate calculation might involve aggregating all sessions.
    // Here, we're simplifying based on available data or using placeholders.
    const totalSessions = client.tattoo_sessions.length;
    const totalSpent = client.tattoo_sessions.reduce((acc, s) => acc + Number(s.totalCost || 0), 0);

    return {
      id: client.id,
      name: `${client.firstName} ${client.lastName}`,
      email: client.email,
      phone: client.phone || undefined,
      joinDate: client.createdAt.toISOString(),
      totalSessions,
      totalSpent,
      lastSession: lastSessionData?.appointmentDate.toISOString() || undefined,
    };
  });
}

async function getChartData(): Promise<ChartDataPoint[]> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sessions = await prisma.tattoo_sessions.findMany({
    where: {
      appointmentDate: { gte: thirtyDaysAgo }
    },
    select: {
      appointmentDate: true,
      totalCost: true
    },
    orderBy: { appointmentDate: 'asc' }
  })

  const appointments = await prisma.appointments.findMany({
    where: {
      scheduledDate: { gte: thirtyDaysAgo }
    },
    select: {
      scheduledDate: true
    },
    orderBy: { scheduledDate: 'asc' }
  })

  // Group by date
  const revenueByDate = new Map<string, number>()
  const appointmentsByDate = new Map<string, number>()

  sessions.forEach(session => {
    const date = session.appointmentDate.toISOString().split('T')[0]
    revenueByDate.set(date, (revenueByDate.get(date) || 0) + Number(session.totalCost || 0))
  })

  appointments.forEach(appointment => {
    const date = appointment.scheduledDate.toISOString().split('T')[0]
    appointmentsByDate.set(date, (appointmentsByDate.get(date) || 0) + 1)
  })

  // Generate chart data for last 30 days
  const chartData: ChartDataPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10)
    
    chartData.push({
      date: dateStr,
      revenue: revenueByDate.get(dateStr) || 0,
      sessions: appointmentsByDate.get(dateStr) || 0
    })
  }

  return chartData
}

async function getRecentSessions(): Promise<RecentSession[]> {
  const sessionsData = await prisma.tattoo_sessions.findMany({ 
    take: 10,
    orderBy: { appointmentDate: 'desc' },
    select: {
      id: true,
      style: true,
      duration: true,
      totalCost: true,
      appointmentDate: true,
      status: true, 
      clients: {
        select: {
          firstName: true,
          lastName: true,
        }
      },
      tattoo_artists: {
        select: {
          name: true
        }
      }
    }
  });

  return sessionsData.map(session => {
    // Ensure status is a valid SessionStatus enum member.
    // The Prisma client returns the enum string directly.
    // The RecentSession type expects SessionStatus enum from './database'
    // which should be compatible with PrismaSessionStatus.
    const statusValue = session.status as PrismaSessionStatus;

    return {
      id: session.id,
      clientName: `${session.clients.firstName} ${session.clients.lastName}`,
      artistName: session.tattoo_artists.name,
      type: session.style || 'N/A',
      duration: session.duration || 0, 
      amount: Number(session.totalCost || 0),
      date: session.appointmentDate.toISOString(),
      status: statusValue, 
    };
  });
}
