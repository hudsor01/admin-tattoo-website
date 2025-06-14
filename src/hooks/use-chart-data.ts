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
        // Return mock data if API fails
        return generateMockChartData()
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
      
      // Fallback to mock data if response format is unexpected
      return generateMockChartData()
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Fallback mock data if API is not accessible
function generateMockChartData(): ChartDataPoint[] {
  const data = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value1: Math.floor(Math.random() * 500) + 100, // Revenue 100-600
      value2: Math.floor(Math.random() * 400) + 150, // Appointments scaled 150-550
    })
  }
  return data
}