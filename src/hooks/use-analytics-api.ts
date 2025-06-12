import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

// Enhanced fetch function with proper error handling
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      throw error;
    }

    return await response.json();
  } catch (error) {
    void logger.error('Analytics API fetch error:', error);
    throw error;
  }
}

// Analytics interfaces
interface AnalyticsMetrics {
  totalRevenue: number;
  revenueChange: string;
  totalSessions: number;
  sessionsChange: string;
  totalClients: number;
  clientsChange: string;
  averageSessionValue: number;
  sessionValueChange: string;
  popularStyles: Array<{ style: string; count: number; revenue: number }>;
  artistPerformance: Array<{ 
    artistId: string; 
    artistName: string; 
    sessions: number; 
    revenue: number; 
    avgRating: number;
  }>;
  clientRetention: {
    newClients: number;
    returningClients: number;
    retentionRate: number;
  };
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    sessions: number;
    clients: number;
  }>;
}

interface RevenueAnalytics {
  dailyRevenue: Array<{ date: string; revenue: number; sessions: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; growth: number }>;
  revenueByStyle: Array<{ style: string; revenue: number; percentage: number }>;
  revenueByArtist: Array<{ artistId: string; artistName: string; revenue: number; percentage: number }>;
  averageTicketSize: number;
  peakHours: Array<{ hour: number; revenue: number; sessions: number }>;
  seasonalTrends: Array<{ quarter: string; revenue: number; growth: number }>;
}

interface ClientAnalytics {
  demographics: {
    ageGroups: Array<{ range: string; count: number; percentage: number }>;
    genderDistribution: Array<{ gender: string; count: number; percentage: number }>;
    locationData: Array<{ city: string; count: number; percentage: number }>;
  };
  behavior: {
    averageSessionsPerClient: number;
    clientLifetimeValue: number;
    mostPopularStyles: Array<{ style: string; clientCount: number }>;
    referralSources: Array<{ source: string; count: number; percentage: number }>;
  };
  retention: {
    returnRate: number;
    averageTimeBetweenSessions: number;
    churnRate: number;
    loyaltyTiers: Array<{ tier: string; clientCount: number; avgSpend: number }>;
  };
}

interface BookingAnalytics {
  conversionRates: {
    consultationToBooking: number;
    inquiryToConsultation: number;
    overallConversion: number;
  };
  bookingPatterns: {
    popularDays: Array<{ day: string; count: number }>;
    popularTimes: Array<{ hour: number; count: number }>;
    seasonalDemand: Array<{ month: string; bookings: number }>;
  };
  cancellationAnalysis: {
    cancellationRate: number;
    reasonBreakdown: Array<{ reason: string; count: number; percentage: number }>;
    noShowRate: number;
  };
  leadTimes: {
    averageLeadTime: number;
    leadTimeDistribution: Array<{ range: string; count: number }>;
  };
}

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  artistId?: string;
  clientId?: string;
  style?: string;
  granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

// Query options factories
export function analyticsOverviewOptions(filters: AnalyticsFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.artistId) params.append('artistId', filters.artistId);
  if (filters.granularity) params.append('granularity', filters.granularity);

  return queryOptions({
    queryKey: ['analytics', 'overview', filters],
    queryFn: () => {
      const url = `/api/admin/analytics/overview${params.toString() ? `?${params}` : ''}`;
      return fetchApi<AnalyticsMetrics>(url);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });
}

export function revenueAnalyticsOptions(filters: AnalyticsFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.artistId) params.append('artistId', filters.artistId);
  if (filters.granularity) params.append('granularity', filters.granularity);

  return queryOptions({
    queryKey: ['analytics', 'revenue', filters],
    queryFn: () => {
      const url = `/api/admin/analytics/revenue${params.toString() ? `?${params}` : ''}`;
      return fetchApi<RevenueAnalytics>(url);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function clientAnalyticsOptions(filters: AnalyticsFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.clientId) params.append('clientId', filters.clientId);

  return queryOptions({
    queryKey: ['analytics', 'clients', filters],
    queryFn: () => {
      const url = `/api/admin/analytics/clients${params.toString() ? `?${params}` : ''}`;
      return fetchApi<ClientAnalytics>(url);
    },
    staleTime: 1000 * 60 * 15, // 15 minutes (client data changes less frequently)
    gcTime: 1000 * 60 * 45, // 45 minutes
  });
}

export function bookingAnalyticsOptions(filters: AnalyticsFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.artistId) params.append('artistId', filters.artistId);

  return queryOptions({
    queryKey: ['analytics', 'bookings', filters],
    queryFn: () => {
      const url = `/api/admin/analytics/bookings${params.toString() ? `?${params}` : ''}`;
      return fetchApi<BookingAnalytics>(url);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function artistPerformanceOptions(artistId: string, filters: AnalyticsFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.granularity) params.append('granularity', filters.granularity);

  return queryOptions({
    queryKey: ['analytics', 'artists', artistId, 'performance', filters],
    queryFn: () => {
      const url = `/api/admin/analytics/artists/${artistId}/performance${params.toString() ? `?${params}` : ''}`;
      return fetchApi<any>(url);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function realTimeAnalyticsOptions() {
  return queryOptions({
    queryKey: ['analytics', 'realtime'],
    queryFn: () => fetchApi<any>('/api/admin/analytics/realtime'),
    staleTime: 1000 * 30, // 30 seconds for real-time data
    gcTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
}

export function customReportOptions(reportConfig: any) {
  return queryOptions({
    queryKey: ['analytics', 'custom-report', reportConfig],
    queryFn: () => fetchApi('/api/admin/analytics/custom-report', {
      method: 'POST',
      body: JSON.stringify(reportConfig),
    }),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hooks
export const useAnalyticsOverview = (filters: AnalyticsFilters = {}) => {
  return useQuery(analyticsOverviewOptions(filters));
};

export const useRevenueAnalytics = (filters: AnalyticsFilters = {}) => {
  return useQuery(revenueAnalyticsOptions(filters));
};

export const useClientAnalytics = (filters: AnalyticsFilters = {}) => {
  return useQuery(clientAnalyticsOptions(filters));
};

export const useBookingAnalytics = (filters: AnalyticsFilters = {}) => {
  return useQuery(bookingAnalyticsOptions(filters));
};

export const useArtistPerformance = (artistId: string, filters: AnalyticsFilters = {}) => {
  return useQuery(artistPerformanceOptions(artistId, filters));
};

export const useRealTimeAnalytics = () => {
  return useQuery(realTimeAnalyticsOptions());
};

export const useCustomReport = (reportConfig: any, enabled = true) => {
  return useQuery({
    ...customReportOptions(reportConfig),
    enabled,
  });
};

// Mutation hooks for analytics configuration
export const useSaveCustomReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportData: any) =>
      fetchApi('/api/admin/analytics/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'reports'] });
    },
    onError: (error) => {
      void logger.error('Failed to save custom report:', error);
    },
  });
};

export const useExportAnalytics = () => {
  return useMutation({
    mutationFn: ({ type, filters, format }: { 
      type: string; 
      filters: AnalyticsFilters; 
      format: 'csv' | 'xlsx' | 'pdf';
    }) =>
      fetchApi('/api/admin/analytics/export', {
        method: 'POST',
        body: JSON.stringify({ type, filters, format }),
      }),
    onError: (error) => {
      void logger.error('Failed to export analytics:', error);
    },
  });
};

export const useSetAnalyticsAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertConfig: any) =>
      fetchApi('/api/admin/analytics/alerts', {
        method: 'POST',
        body: JSON.stringify(alertConfig),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'alerts'] });
    },
    onError: (error) => {
      void logger.error('Failed to set analytics alert:', error);
    },
  });
};

// Utility hooks for analytics insights
export const useAnalyticsInsights = (filters: AnalyticsFilters = {}) => {
  const overview = useAnalyticsOverview(filters);
  const revenue = useRevenueAnalytics(filters);
  const clients = useClientAnalytics(filters);
  const bookings = useBookingAnalytics(filters);

  return {
    overview,
    revenue,
    clients,
    bookings,
    isLoading: overview.isLoading || revenue.isLoading || clients.isLoading || bookings.isLoading,
    hasError: overview.error || revenue.error || clients.error || bookings.error,
    refetchAll: () => {
      overview.refetch();
      revenue.refetch();
      clients.refetch();
      bookings.refetch();
    },
  };
};

// Prefetch utilities
export const usePrefetchAnalytics = () => {
  const queryClient = useQueryClient();

  return {
    prefetchOverview: (filters?: AnalyticsFilters) => 
      queryClient.prefetchQuery(analyticsOverviewOptions(filters)),
    prefetchRevenue: (filters?: AnalyticsFilters) => 
      queryClient.prefetchQuery(revenueAnalyticsOptions(filters)),
    prefetchClients: (filters?: AnalyticsFilters) => 
      queryClient.prefetchQuery(clientAnalyticsOptions(filters)),
    prefetchBookings: (filters?: AnalyticsFilters) => 
      queryClient.prefetchQuery(bookingAnalyticsOptions(filters)),
    prefetchArtistPerformance: (artistId: string, filters?: AnalyticsFilters) => 
      queryClient.prefetchQuery(artistPerformanceOptions(artistId, filters)),
    prefetchRealTime: () => 
      queryClient.prefetchQuery(realTimeAnalyticsOptions()),
  };
};

// Date range helpers for analytics
export const useAnalyticsDateRanges = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const lastQuarter = new Date(today);
  lastQuarter.setMonth(lastQuarter.getMonth() - 3);
  
  const lastYear = new Date(today);
  lastYear.setFullYear(lastYear.getFullYear() - 1);

  return {
    today: { startDate: today.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] },
    yesterday: { startDate: yesterday.toISOString().split('T')[0], endDate: yesterday.toISOString().split('T')[0] },
    lastWeek: { startDate: lastWeek.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] },
    lastMonth: { startDate: lastMonth.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] },
    lastQuarter: { startDate: lastQuarter.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] },
    lastYear: { startDate: lastYear.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] },
  };
};