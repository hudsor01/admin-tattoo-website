"use client"

import { useQuery } from '@tanstack/react-query'

interface DashboardStats {
  revenue: number
  revenueChange: string
  totalClients: number
  clientsChange: string
  monthlyAppointments: number
  appointmentsChange: string
  averageRating: string
  ratingChange: string
}

interface RecentClient {
  id: string
  firstName: string
  lastName: string
  email: string
  lastSessionType: string | null
  lastPayment: number | null
}

interface ChartDataPoint {
  date: string
  revenue: number
  appointments: number
}

interface RecentSession {
  id: string
  clientName: string
  clientEmail: string
  artistName: string
  sessionType: string
  price: number
  sessionDate: string
  status: string
}

interface DashboardData {
  stats: DashboardStats
  recentClients: RecentClient[]
  chartData: ChartDataPoint[]
  recentSessions: RecentSession[]
}

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch('/api/admin/dashboard')
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  return response.json()
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}