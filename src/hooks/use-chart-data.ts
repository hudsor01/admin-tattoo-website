"use client"

import { useQuery } from '@tanstack/react-query'

interface ChartDataPoint {
  date: string
  value1: number  // Revenue
  value2: number  // Appointments (scaled)
}

export function useChartData() {
  return useQuery<ChartDataPoint[]>({
    queryKey: ['chart-data'],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const response = await fetch('/api/admin/dashboard/chart-data')
      
      if (!response.ok) {
        // Return empty array if API fails
        return []
      }
      
      const result = await response.json()
      
      // Handle API response wrapper format
      if (result.success && Array.isArray(result.data)) {
        return result.data
      }
      
      // If direct array response
      if (Array.isArray(result)) {
        return result
      }
      
      // Return empty array if response format is unexpected
      return []
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}