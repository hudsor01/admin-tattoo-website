import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withSecurityValidation, SecurityPresets } from '@/lib/api-validation'
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handling'

const getChartDataHandler = async () => {
  try {
    // Get last 30 days of data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get daily revenue and appointment counts
    const sessions = await prisma.tattooSession.findMany({
      where: {
        appointmentDate: {
          gte: thirtyDaysAgo
        },
        status: {
          in: ['COMPLETED', 'IN_PROGRESS']
        }
      },
      select: {
        appointmentDate: true,
        totalCost: true,
        status: true
      },
      orderBy: {
        appointmentDate: 'asc'
      }
    })

    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledDate: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        scheduledDate: true,
        status: true
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    // Group data by date
    const dailyData = new Map()

    // Process sessions for revenue
    sessions.forEach(session => {
      const dateKey = session.appointmentDate.toISOString().split('T')[0]
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { date: dateKey, revenue: 0, appointments: 0 })
      }
      const current = dailyData.get(dateKey)
      current.revenue += Number(session.totalCost)
      dailyData.set(dateKey, current)
    })

    // Process appointments for count
    appointments.forEach(appointment => {
      const dateKey = appointment.scheduledDate.toISOString().split('T')[0]
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { date: dateKey, revenue: 0, appointments: 0 })
      }
      const current = dailyData.get(dateKey)
      current.appointments += 1
      dailyData.set(dateKey, current)
    })

    // Convert to array and fill missing dates
    const chartData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      const dayData = dailyData.get(dateKey) || { date: dateKey, revenue: 0, appointments: 0 }
      
      chartData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value1: dayData.revenue, // Revenue
        value2: dayData.appointments * 50 // Appointments scaled for visualization
      })
    }

    return NextResponse.json(createSuccessResponse(chartData))
  } catch (error) {
    console.error('Chart data error:', error)
    return NextResponse.json(
      createErrorResponse('Failed to fetch chart data'),
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Apply security validation with dashboard read preset
export const GET = withSecurityValidation({
  ...SecurityPresets.DASHBOARD_READ
})(getChartDataHandler);