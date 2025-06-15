"use client"

import { useQuery } from '@tanstack/react-query'
import { apiFetch, queryKeys } from '@/lib/api/client'
import type { ChartDataPoint } from '@/types/dashboard'

export function useChartData() {
  return useQuery<ChartDataPoint[]>({
    queryKey: queryKeys.dashboard.chartData(),
    queryFn: async (): Promise<ChartDataPoint[]> => {
      try {
        const result = await apiFetch<ChartDataPoint[]>('/api/admin/dashboard/chart-data')
        return Array.isArray(result) ? result : []
      } catch (error) {
        // Return empty array if API fails - graceful fallback for chart display
        console.warn('Chart data fetch failed, returning empty array:', error)
        return []
      }
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}