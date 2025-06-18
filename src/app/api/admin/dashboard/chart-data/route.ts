import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SecurityPresets, withSecurityValidation } from '@/lib/api-validation'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-core'
import { logger } from '@/lib/logger'
import type { SpecificChartDataPoint } from '@/types/dashboard' // Import SpecificChartDataPoint

const getChartDataHandler = async (_request: NextRequest): Promise<NextResponse> => {
  try {
    // Get last 30 days of data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get daily revenue and appointment counts
    const sessions = await prisma.tattoo_sessions.findMany({
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

    const appointments = await prisma.appointments.findMany({
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
    const dailyData = new Map<string, { date: string; revenue: number; appointments: number }>() // Add type to Map

    // Process sessions for revenue
    sessions.forEach(session => {
      const dateKey = session.appointmentDate.toISOString().slice(0, 10) // Robust date key
      let current = dailyData.get(dateKey);
      if (!current) {
        current = { date: dateKey, revenue: 0, appointments: 0 };
      }
      current.revenue += Number(session.totalCost || 0); // Added null check for totalCost
      dailyData.set(dateKey, current);
    })

    // Process appointments for count
    appointments.forEach(appointment => {
      const dateKey = appointment.scheduledDate.toISOString().slice(0, 10) // Robust date key
      let current = dailyData.get(dateKey);
      if (!current) {
        current = { date: dateKey, revenue: 0, appointments: 0 };
      }
      current.appointments += 1;
      dailyData.set(dateKey, current);
    })

    // Convert to array and fill missing dates
    const chartData: SpecificChartDataPoint[] = [] // Explicitly type chartData
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().slice(0, 10) // Robust date key
      const dayData = dailyData.get(dateKey) || { date: dateKey, revenue: 0, appointments: 0 }
      
      chartData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // Formatted date string
        value1: dayData.revenue, // Revenue
        value2: dayData.appointments * 50 // Appointments scaled for visualization
      })
    }

    return NextResponse.json(createSuccessResponse(chartData))
  } catch (error) {
    logger.error('Chart data error', error)
    return NextResponse.json(
      createErrorResponse('Failed to fetch chart data'),
      { status: 500 }
    )
  }
}

// Apply security validation with dashboard read preset
export const GET = withSecurityValidation({
  ...SecurityPresets.DASHBOARD_READ
})((request: NextRequest) => getChartDataHandler(request));
