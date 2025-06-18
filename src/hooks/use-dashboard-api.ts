import { useQuery } from '@tanstack/react-query';
import { apiFetch, queryKeys } from '@/lib/api/client';
import type { 
  ChartDataPoint, 
  DashboardData, 
  DashboardStats, 
  RecentClient, 
  RecentSession 
} from '@/types/dashboard';

// Dashboard stats hook
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => apiFetch<DashboardStats>('/api/admin/dashboard/stats'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Chart data hook
export function useDashboardChartData() {
  return useQuery({
    queryKey: queryKeys.dashboard.chartData(),
    queryFn: () => apiFetch<ChartDataPoint[]>('/api/admin/dashboard/chart-data'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Recent clients hook
export function useRecentClients() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentClients(),
    queryFn: () => apiFetch<RecentClient[]>('/api/admin/dashboard/recent-clients'),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Recent sessions hook
export function useRecentSessions() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentSessions(),
    queryFn: () => apiFetch<RecentSession[]>('/api/admin/dashboard/recent-sessions'),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Combined dashboard data hook (fetches all at once)
export function useDashboardData() {
  return useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: () => apiFetch<DashboardData>('/api/admin/dashboard'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Prefetch utilities for dashboard
export function prefetchDashboardData() {
  const {queryClient} = require('@/lib/api/client');
  
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(),
      queryFn: () => apiFetch<DashboardStats>('/api/admin/dashboard/stats'),
      staleTime: 2 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.chartData(),
      queryFn: () => apiFetch<ChartDataPoint[]>('/api/admin/dashboard/chart-data'),
      staleTime: 5 * 60 * 1000,
    }),
  ]);
}