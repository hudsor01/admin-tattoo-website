"use client"

import { useQuery } from '@tanstack/react-query'
import { apiFetch, queryKeys } from '@/lib/api/client'
import type { 
  DashboardStats, 
  DashboardData, 
  ChartDataPoint, 
  RecentClient, 
  RecentSession 
} from '@/types/dashboard'

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: queryKeys.dashboard.all,
    queryFn: () => apiFetch<DashboardData>('/api/admin/dashboard'),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}