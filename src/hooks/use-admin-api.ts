import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type { DashboardStats } from '@/types/database';
import type { AppointmentResponse, ClientResponse } from '@/types/database';
import type { FilterParams } from '@/types/filters';
import { logger } from '@/lib/logger';

const API_BASE_URL = '/api/admin';

// Custom error type for API errors
class ApiError extends Error {
  status: number;
  statusText: string;
  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.status = status;
    this.statusText = statusText;
  }
}

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
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    return await response.json();
  } catch (error) {
    void logger.error('API fetch error:', error);
    throw error;
  }
}

// Query options factory for reusable query configurations
export function dashboardStatsOptions() {
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => fetchApi<DashboardStats>(`${API_BASE_URL}/dashboard`),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });
}

export function appointmentsOptions(filters?: FilterParams) {
  const queryParams = new URLSearchParams();

  if (filters?.appointmentStatus && filters.appointmentStatus !== 'ALL') {
    queryParams.append('status', filters.appointmentStatus);
  }
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  if (filters?.limit) {
    queryParams.append('limit', filters.limit.toString());
  }
  if (filters?.offset) {
    queryParams.append('offset', filters.offset.toString());
  }
  if (filters?.search) {
    queryParams.append('search', filters.search);
  }

  return queryOptions({
    queryKey: ['admin', 'appointments', filters],
    queryFn: () => {
      const url = `${API_BASE_URL}/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return fetchApi<AppointmentResponse[]>(url);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function customersOptions(filters?: FilterParams) {
  const queryParams = new URLSearchParams();

  if (filters?.limit) {
    queryParams.append('limit', filters.limit.toString());
  }
  if (filters?.offset) {
    queryParams.append('offset', filters.offset.toString());
  }
  if (filters?.search) {
    queryParams.append('search', filters.search);
  }

  return queryOptions({
    queryKey: ['admin', 'customers', filters],
    queryFn: () => {
      const url = `${API_BASE_URL}/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return fetchApi<ClientResponse[]>(url);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}


// Add this type at the top or import from your types module
export interface MessageResponse {
  id: string;
  conversationId: string;
  content: string;
  sender: string;
  createdAt: string; // or Date if your API returns ISO strings
  // Add other fields as needed
}

export function messagesOptions() {
  return queryOptions({
    queryKey: ['admin', 'messages'],
    queryFn: () => fetchApi<MessageResponse[]>(`${API_BASE_URL}/messages`),
    staleTime: 1000 * 30, // 30 seconds for real-time feel
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
}

export function recentSessionsOptions(limit = 10) {
  // Define a type for recent session if available, otherwise use unknown[]
  type RecentSession = {
    id: string;
    clientName: string;
    artistName: string;
    type: string;
    duration: number;
    amount: number;
    date: string;
    status: 'completed' | 'in-progress' | 'scheduled';
  };
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'recent-sessions', limit],
    queryFn: () => fetchApi<RecentSession[]>(`${API_BASE_URL}/dashboard/recent-sessions?limit=${limit}`),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function chartDataOptions() {
  // Define a type for chart data if available, otherwise use unknown
  type ChartData = {
    date: string;
    revenue: number;
    sessions: number;
  }[];
  return queryOptions({
    queryKey: ['admin', 'dashboard', 'chart-data'],
    queryFn: () => fetchApi<ChartData>(`${API_BASE_URL}/dashboard/chart-data`),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Enhanced hooks using query options
export const useAdminDashboardStats = () => {
  return useQuery(dashboardStatsOptions());
};

export const useAdminAppointments = (filters?: FilterParams) => {
  return useQuery(appointmentsOptions(filters));
};

export const useAdminCustomers = (filters?: FilterParams) => {
  return useQuery(customersOptions(filters));
};


export const useAdminMessages = () => {
  return useQuery(messagesOptions());
};

export const useRecentSessions = (limit = 10) => {
  return useQuery(recentSessionsOptions(limit));
};

export const useChartData = () => {
  return useQuery(chartDataOptions());
};

// Enhanced mutation hooks with optimistic updates and proper error handling
export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return fetchApi(`${API_BASE_URL}/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches to avoid optimistic update conflicts
      await queryClient.cancelQueries({ queryKey: ['admin', 'appointments'] });

      // Snapshot the previous value
      const previousAppointments = queryClient.getQueriesData({ queryKey: ['admin', 'appointments'] });

      // Optimistically update appointments
      queryClient.setQueriesData({ queryKey: ['admin', 'appointments'] }, (old: AppointmentResponse[] | undefined) => {
        return old?.map(appointment =>
          appointment.id === id ? { ...appointment, status } : appointment
        );
      });

      return { previousAppointments };
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousAppointments) {
        context.previousAppointments.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      void logger.error('Failed to update appointment status:', error);
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      return fetchApi(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'DELETE',
      });
    },
    onMutate: async (customerId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'customers'] });

      // Snapshot the previous value
      const previousCustomers = queryClient.getQueriesData({ queryKey: ['admin', 'customers'] });

      // Optimistically remove customer
      queryClient.setQueriesData({ queryKey: ['admin', 'customers'] }, (old: ClientResponse[] | undefined) => {
        return old?.filter(customer => customer.id !== customerId);
      });

      return { previousCustomers };
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousCustomers) {
        context.previousCustomers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      void logger.error('Failed to delete customer:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content, sender = 'admin' }: {
      conversationId: string;
      content: string;
      sender?: string;
    }) => {
      return fetchApi(`${API_BASE_URL}/messages`, {
        method: 'POST',
        body: JSON.stringify({ conversationId, content, sender }),
      });
    },
    onSuccess: () => {
      // Invalidate messages to show new message
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
    },
    onError: (error) => {
      void logger.error('Failed to send message:', error);
    },
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  // Define a type for customer creation input if available, otherwise use Partial<ClientResponse>
  type CreateCustomerInput = Partial<ClientResponse>;

  return useMutation({
    mutationFn: async (customerData: CreateCustomerInput) => {
      return fetchApi<ClientResponse>(`${API_BASE_URL}/customers`, {
        method: 'POST',
        body: JSON.stringify(customerData),
      });
    },
    onSuccess: (newCustomer) => {
      // Add new customer to the cache optimistically
      queryClient.setQueriesData({ queryKey: ['admin', 'customers'] }, (old: ClientResponse[] | undefined) => {
        return old ? [newCustomer, ...old] : [newCustomer];
      });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (error) => {
      void logger.error('Failed to create customer:', error);
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<ClientResponse>) => {
      return fetchApi(`${API_BASE_URL}/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
    },
    onMutate: async ({ id, ...updateData }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'customers'] });

      const previousCustomers = queryClient.getQueriesData({ queryKey: ['admin', 'customers'] });

      // Optimistically update customer
      queryClient.setQueriesData({ queryKey: ['admin', 'customers'] }, (old: ClientResponse[] | undefined) => {
        return old?.map(customer =>
          customer.id === id ? { ...customer, ...updateData } : customer
        );
      });

      return { previousCustomers };
    },
    onError: (error, _variables, context) => {
      if (context?.previousCustomers) {
        context.previousCustomers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      void logger.error('Failed to update customer:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    },
  });
};

// Prefetch utilities for better UX
export const usePrefetchDashboard = () => {
  const queryClient = useQueryClient();

  return {
    prefetchStats: () => queryClient.prefetchQuery(dashboardStatsOptions()),
    prefetchChartData: () => queryClient.prefetchQuery(chartDataOptions()),
    prefetchRecentSessions: (limit = 10) => queryClient.prefetchQuery(recentSessionsOptions(limit)),
  };
};

export const usePrefetchAppointments = () => {
  const queryClient = useQueryClient();

  return (filters?: FilterParams) => {
    queryClient.prefetchQuery(appointmentsOptions(filters));
  };
};

export const usePrefetchCustomers = () => {
  const queryClient = useQueryClient();

  return (filters?: FilterParams) => {
    queryClient.prefetchQuery(customersOptions(filters));
  };
};
