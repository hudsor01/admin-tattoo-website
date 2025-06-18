import { useQuery } from '@tanstack/react-query';
import { apiFetch, queryKeys } from '@/lib/api/client';
import { buildQueryString } from '@/lib/api/utils';

// Enhanced analytics types
export interface AnalyticsFilters extends Record<string, unknown> {
  startDate?: Date;
  endDate?: Date;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  compareWith?: 'previous_period' | 'previous_year';
  breakdown?: 'artist' | 'style' | 'location' | 'service_type';
}

export interface AnalyticsData {
  totalRevenue: number;
  revenueChange: number;
  activeClients: number;
  clientsChange: number;
  monthlySessions: number;
  sessionsChange: number;
  avgSessionValue: number;
  avgValueChange: number;
  topArtists: Array<{
    id: string;
    name: string;
    revenue: number;
    sessions: number;
    change: number;
  }>;
  sessionTypes: Array<{
    name: string;
    count: number;
    percentage: number;
    revenue: number;
  }>;
  clientAcquisition: Array<{
    month: string;
    newClients: number;
    returning: number;
    total: number;
  }>;
  revenueBreakdown: Array<{
    category: string;
    value: number;
    percentage: number;
    change: number;
  }>;
  dailyMetrics: Array<{
    date: string;
    revenue: number;
    sessions: number;
    clients: number;
  }>;
}

export interface RevenueMetrics {
  total: number;
  change: number;
  byPeriod: Array<{
    period: string;
    revenue: number;
    sessions: number;
  }>;
  byArtist: Array<{
    artistId: string;
    artistName: string;
    revenue: number;
    percentage: number;
  }>;
  byService: Array<{
    serviceType: string;
    revenue: number;
    sessions: number;
    avgValue: number;
  }>;
}

export interface ClientMetrics {
  total: number;
  active: number;
  new: number;
  returning: number;
  retention: number;
  lifetimeValue: number;
  acquisitionTrends: Array<{
    month: string;
    new: number;
    returning: number;
    retention: number;
  }>;
  demographics: {
    ageGroups: Array<{ range: string; count: number }>;
    genderDistribution: Array<{ gender: string; count: number }>;
    locationBreakdown: Array<{ location: string; count: number }>;
  };
}

export interface SessionMetrics {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  avgDuration: number;
  avgValue: number;
  popularTimes: Array<{
    hour: number;
    day: string;
    count: number;
  }>;
  stylePopularity: Array<{
    style: string;
    count: number;
    revenue: number;
  }>;
}

export interface PerformanceMetrics {
  efficiency: {
    bookingRate: number;
    utilizationRate: number;
    reschedulingRate: number;
  };
  quality: {
    averageRating: number;
    repeatClientRate: number;
    referralRate: number;
  };
  growth: {
    monthOverMonth: number;
    yearOverYear: number;
    projectedGrowth: number;
  };
}

// Main analytics hook
export function useAnalytics(filters: AnalyticsFilters = {}) {
  const queryString = buildQueryString({
    ...filters,
    startDate: filters.startDate?.toISOString(),
    endDate: filters.endDate?.toISOString(),
  });
  
  return useQuery({
    queryKey: queryKeys.analytics.data(filters),
    queryFn: () => 
      apiFetch<AnalyticsData>(`/api/admin/analytics?${queryString}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Revenue-specific analytics
export function useRevenueAnalytics(filters: AnalyticsFilters = {}) {
  const queryString = buildQueryString({
    ...filters,
    startDate: filters.startDate?.toISOString(),
    endDate: filters.endDate?.toISOString(),
  });
  
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'revenue', filters],
    queryFn: () => 
      apiFetch<RevenueMetrics>(`/api/admin/analytics/revenue?${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

// Client-specific analytics
export function useClientAnalytics(filters: AnalyticsFilters = {}) {
  const queryString = buildQueryString({
    ...filters,
    startDate: filters.startDate?.toISOString(),
    endDate: filters.endDate?.toISOString(),
  });
  
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'clients', filters],
    queryFn: () => 
      apiFetch<ClientMetrics>(`/api/admin/analytics/clients?${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

// Session-specific analytics
export function useSessionAnalytics(filters: AnalyticsFilters = {}) {
  const queryString = buildQueryString({
    ...filters,
    startDate: filters.startDate?.toISOString(),
    endDate: filters.endDate?.toISOString(),
  });
  
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'sessions', filters],
    queryFn: () => 
      apiFetch<SessionMetrics>(`/api/admin/analytics/sessions?${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

// Performance metrics
export function usePerformanceAnalytics(filters: AnalyticsFilters = {}) {
  const queryString = buildQueryString({
    ...filters,
    startDate: filters.startDate?.toISOString(),
    endDate: filters.endDate?.toISOString(),
  });
  
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'performance', filters],
    queryFn: () => 
      apiFetch<PerformanceMetrics>(`/api/admin/analytics/performance?${queryString}`),
    staleTime: 10 * 60 * 1000, // 10 minutes for performance data
  });
}

// Combined analytics hook for dashboard overview
export function useDashboardAnalytics(filters: AnalyticsFilters = {}) {
  const analytics = useAnalytics(filters);
  const revenue = useRevenueAnalytics(filters);
  const clients = useClientAnalytics(filters);
  const sessions = useSessionAnalytics(filters);
  
  return {
    analytics,
    revenue,
    clients,
    sessions,
    isLoading: analytics.isLoading || revenue.isLoading || clients.isLoading || sessions.isLoading,
    isError: analytics.isError || revenue.isError || clients.isError || sessions.isError,
    error: analytics.error || revenue.error || clients.error || sessions.error,
  };
}

// Real-time analytics (shorter stale time)
export function useRealTimeAnalytics() {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'realtime'],
    queryFn: () => apiFetch('/api/admin/analytics/realtime'),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

// Export utilities
export function useAnalyticsExport() {
  return {
    exportToPDF: (filters: AnalyticsFilters) =>
      apiFetch('/api/admin/analytics/export/pdf', {
        method: 'POST',
        body: JSON.stringify(filters),
      }),
    exportToCSV: (filters: AnalyticsFilters) =>
      apiFetch('/api/admin/analytics/export/csv', {
        method: 'POST',
        body: JSON.stringify(filters),
      }),
    exportToExcel: (filters: AnalyticsFilters) =>
      apiFetch('/api/admin/analytics/export/excel', {
        method: 'POST',
        body: JSON.stringify(filters),
      }),
  };
}

// Comparison utilities
export function useAnalyticsComparison(
  currentFilters: AnalyticsFilters,
  comparisonFilters: AnalyticsFilters
) {
  const current = useAnalytics(currentFilters);
  const comparison = useAnalytics(comparisonFilters);
  
  return {
    current,
    comparison,
    isLoading: current.isLoading || comparison.isLoading,
    isError: current.isError || comparison.isError,
    error: current.error || comparison.error,
  };
}

// Prefetch utilities
export function prefetchAnalytics(filters?: AnalyticsFilters) {
  const {queryClient} = require('@/lib/api/client');
  
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.analytics.data(filters),
      queryFn: () => {
        const queryString = buildQueryString({
          ...filters,
          startDate: filters?.startDate?.toISOString(),
          endDate: filters?.endDate?.toISOString(),
        });
        return apiFetch<AnalyticsData>(`/api/admin/analytics?${queryString}`);
      },
      staleTime: 5 * 60 * 1000,
    }),
  ]);
}
