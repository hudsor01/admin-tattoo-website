import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { isVerifiedAdmin, BetterAuthUser, toBetterAuthUser } from '@/lib/authorization'

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

async function getDashboardStats() {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Get current month stats
  const [currentRevenue, currentClients, currentAppointments] = await Promise.all([
    prisma.tattooSession.aggregate({
      where: {
        appointmentDate: { gte: firstOfMonth }
      },
      _sum: { totalCost: true }
    }),
    prisma.client.count({
      where: {
        createdAt: { gte: firstOfMonth }
      }
    }),
    prisma.appointment.count({
      where: {
        scheduledDate: { gte: firstOfMonth }
      }
    })
  ])

  // Get last month stats for comparison
  const [lastRevenue, lastClients, lastAppointments] = await Promise.all([
    prisma.tattooSession.aggregate({
      where: {
        appointmentDate: { 
          gte: firstOfLastMonth,
          lte: lastOfLastMonth
        }
      },
      _sum: { totalCost: true }
    }),
    prisma.client.count({
      where: {
        createdAt: { 
          gte: firstOfLastMonth,
          lte: lastOfLastMonth
        }
      }
    }),
    prisma.appointment.count({
      where: {
        scheduledDate: { 
          gte: firstOfLastMonth,
          lte: lastOfLastMonth
        }
      }
    })
  ])

  // Calculate percentage changes
  const revenue = Number(currentRevenue._sum.totalCost || 0)
  const totalClients = await prisma.client.count()
  const monthlyAppointments = currentAppointments

  const lastMonthRevenue = Number(lastRevenue._sum.totalCost || 0)
  const revenueChangeNum = lastMonthRevenue 
    ? ((revenue - lastMonthRevenue) / lastMonthRevenue * 100)
    : 0
  const revenueChange = revenueChangeNum.toFixed(1)
  const clientsChange = lastClients 
    ? Math.round(((currentClients - lastClients) / lastClients) * 100)
    : 0
  const appointmentsChange = lastAppointments 
    ? ((currentAppointments - lastAppointments) / lastAppointments * 100).toFixed(1)
    : '0'

  return {
    revenue,
    revenueChange: `${Number(revenueChange) > 0 ? '+' : ''}${revenueChange}%`,
    totalClients,
    clientsChange: `${clientsChange > 0 ? '+' : ''}${clientsChange}`,
    monthlyAppointments,
    appointmentsChange: `${Number(appointmentsChange) > 0 ? '+' : ''}${appointmentsChange}%`,
    // Calculate satisfaction rating based on completion rate
    averageRating: await calculateSatisfactionRating(),
    ratingChange: await calculateRatingChange()
  }
}

async function calculateSatisfactionRating(): Promise<string> {
  const completedSessions = await prisma.tattooSession.count({
    where: { status: 'COMPLETED' }
  });
  
  const totalSessions = await prisma.tattooSession.count();
  
  if (totalSessions === 0) return '5.0';
  
  const completionRate = completedSessions / totalSessions;
  // Scale from 3.0 to 5.0 based on completion rate
  const rating = Math.min(5.0, 3.0 + (completionRate * 2.0));
  
  return rating.toFixed(1);
}

async function calculateRatingChange(): Promise<string> {
  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get completion rates for this month and last month
  const [thisMonthCompleted, thisMonthTotal, lastMonthCompleted, lastMonthTotal] = await Promise.all([
    prisma.tattooSession.count({
      where: { 
        status: 'COMPLETED',
        updatedAt: { gte: thisMonthStart }
      }
    }),
    prisma.tattooSession.count({
      where: { updatedAt: { gte: thisMonthStart } }
    }),
    prisma.tattooSession.count({
      where: { 
        status: 'COMPLETED',
        updatedAt: { 
          gte: lastMonthStart,
          lt: thisMonthStart
        }
      }
    }),
    prisma.tattooSession.count({
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

async function getRecentClients() {
  const clients = await prisma.client.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      sessions: {
        take: 1,
        orderBy: { appointmentDate: 'desc' },
        select: {
          style: true,
          totalCost: true
        }
      }
    }
  })

  return clients.map(client => ({
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    lastSessionType: client.sessions[0]?.style || null,
    lastPayment: client.sessions[0] ? Number(client.sessions[0].totalCost) : null
  }))
}

async function getChartData() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sessions = await prisma.tattooSession.findMany({
    where: {
      appointmentDate: { gte: thirtyDaysAgo }
    },
    select: {
      appointmentDate: true,
      totalCost: true
    },
    orderBy: { appointmentDate: 'asc' }
  })

  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledDate: { gte: thirtyDaysAgo }
    },
    select: {
      scheduledDate: true
    },
    orderBy: { scheduledDate: 'asc' }
  })

  // Group by date
  const revenueByDate = new Map()
  const appointmentsByDate = new Map()

  sessions.forEach(session => {
    const date = session.appointmentDate.toISOString().split('T')[0]
    revenueByDate.set(date, (revenueByDate.get(date) || 0) + Number(session.totalCost || 0))
  })

  appointments.forEach(appointment => {
    const date = appointment.scheduledDate.toISOString().split('T')[0]
    appointmentsByDate.set(date, (appointmentsByDate.get(date) || 0) + 1)
  })

  // Generate chart data for last 30 days
  const chartData = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    chartData.push({
      date: dateStr,
      revenue: revenueByDate.get(dateStr) || 0,
      appointments: appointmentsByDate.get(dateStr) || 0
    })
  }

  return chartData
}

async function getRecentSessions() {
  const sessions = await prisma.tattooSession.findMany({
    take: 10,
    orderBy: { appointmentDate: 'desc' },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      artist: {
        select: {
          name: true
        }
      }
    }
  })

  return sessions.map(session => ({
    id: session.id,
    clientName: `${session.client.firstName} ${session.client.lastName}`,
    clientEmail: session.client.email,
    artistName: session.artist.name,
    sessionType: session.style,
    price: Number(session.totalCost),
    sessionDate: session.appointmentDate,
    status: session.status.toLowerCase()
  }))
}