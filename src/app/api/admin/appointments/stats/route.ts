import { type NextRequest, NextResponse } from 'next/server'
import { SecurityPresets, withSecurityValidation } from '@/lib/api-validation'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-core'
import { prisma } from '@/lib/prisma'
import { AppointmentStatus } from '@prisma/client'
import { logger } from '@/lib/logger'
import type { AppointmentStats } from '@/types/dashboard'

const statsHandler = async (_request: NextRequest): Promise<NextResponse> => {
  try {
    
    // Get current period (last 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Current period stats (last 30 days)
    const [
      totalCurrent,
      confirmedCurrent,
      completedCurrent
    ] = await Promise.all([
      // Total appointments in last 30 days
      prisma.appointments.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Confirmed appointments in last 30 days
      prisma.appointments.count({
        where: {
          status: AppointmentStatus.CONFIRMED,
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Completed appointments in last 30 days
      prisma.appointments.count({
        where: {
          status: AppointmentStatus.COMPLETED,
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      })
    ])

    // Previous period stats (30-60 days ago)
    const [
      totalPrevious,
      confirmedPrevious,
      completedPrevious
    ] = await Promise.all([
      // Total appointments 30-60 days ago
      prisma.appointments.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      
      // Confirmed appointments 30-60 days ago
      prisma.appointments.count({
        where: {
          status: AppointmentStatus.CONFIRMED,
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      
      // Completed appointments 30-60 days ago
      prisma.appointments.count({
        where: {
          status: AppointmentStatus.COMPLETED,
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      })
    ])

    // Calculate completion rate
    const completionRate = totalCurrent > 0 ? Math.round((completedCurrent / totalCurrent) * 100) : 0
    const previousCompletionRate = totalPrevious > 0 ? Math.round((completedPrevious / totalPrevious) * 100) : 0

    // Calculate changes
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) {
        return current > 0 ? '+100%' : '0%'
      }
      const change = ((current - previous) / previous) * 100
      const sign = change >= 0 ? '+' : ''
      return `${sign}${Math.round(change)}%`
    }

    const stats: AppointmentStats = {
      totalAppointments: totalCurrent,
      confirmedAppointments: confirmedCurrent,
      completedAppointments: completedCurrent,
      completionRate,
      appointmentsChange: calculateChange(totalCurrent, totalPrevious),
      confirmedChange: calculateChange(confirmedCurrent, confirmedPrevious),
      completedChange: calculateChange(completedCurrent, completedPrevious),
      completionRateChange: calculateChange(completionRate, previousCompletionRate)
    }

    return NextResponse.json(createSuccessResponse(stats, 'Appointment stats retrieved successfully'))
  } catch (error) {
    logger.error('Error fetching appointment stats', error)
    return NextResponse.json(
      createErrorResponse('Failed to fetch appointment stats'),
      { status: 500 }
    )
  }
}

// Apply security validation
export const GET = withSecurityValidation(SecurityPresets.APPOINTMENT_READ)(statsHandler)
