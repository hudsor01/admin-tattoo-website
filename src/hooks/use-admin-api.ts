import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type { DashboardStats } from '@/types/database';
import type { RecentSession } from '@/types/dashboard';
import type { AppointmentResponse, ClientResponse } from '@/types/database';
import type { FilterParams } from '@/types/filters';
import { apiFetch, queryKeys } from '@/lib/api/client';
import { showSuccessToast, showErrorToast } from '@/lib/api/utils';

const API_BASE_URL = '/api/admin';

// Re-export the unified API client for consistency
const fetchApi = apiFetch;

// Query options factory for reusable query configurations
export function dashboardStatsOptions() {
  return queryOptions({
    queryKey: queryKeys.dashboard.stats(),
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
    queryKey: queryKeys.appointments.list(filters),
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
    queryKey: queryKeys.customers.list(filters),
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
  createdAt: string;
}

export function messagesOptions() {
  return queryOptions({
    queryKey: [...queryKeys.all, 'messages'],
    queryFn: () => fetchApi<MessageResponse[]>(`${API_BASE_URL}/messages`),
    staleTime: 1000 * 30, // 30 seconds for real-time feel
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
}

export function recentSessionsOptions(limit = 10) {
  return queryOptions({
    queryKey: queryKeys.dashboard.recentSessions(),
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
    queryKey: queryKeys.dashboard.chartData(),
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
      await queryClient.cancelQueries({ queryKey: queryKeys.appointments.all });

      // Snapshot the previous value
      const previousAppointments = queryClient.getQueriesData({ queryKey: queryKeys.appointments.all });

      // Optimistically update appointments
      queryClient.setQueriesData({ queryKey: queryKeys.appointments.all }, (old: AppointmentResponse[] | undefined) => {
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
      showErrorToast('Failed to update appointment status');
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      showSuccessToast('Appointment status updated successfully');
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
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.all });

      // Snapshot the previous value
      const previousCustomers = queryClient.getQueriesData({ queryKey: queryKeys.customers.all });

      // Optimistically remove customer
      queryClient.setQueriesData({ queryKey: queryKeys.customers.all }, (old: ClientResponse[] | undefined) => {
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
      showErrorToast('Failed to delete customer');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      showSuccessToast('Customer deleted successfully');
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
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, 'messages'] });
      showSuccessToast('Message sent successfully');
    },
    onError: (error) => {
      showErrorToast('Failed to send message');
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
      queryClient.setQueriesData({ queryKey: queryKeys.customers.all }, (old: ClientResponse[] | undefined) => {
        return old ? [newCustomer, ...old] : [newCustomer];
      });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      showSuccessToast('Customer created successfully');
    },
    onError: (error) => {
      showErrorToast('Failed to create customer');
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
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.all });

      const previousCustomers = queryClient.getQueriesData({ queryKey: queryKeys.customers.all });

      // Optimistically update customer
      queryClient.setQueriesData({ queryKey: queryKeys.customers.all }, (old: ClientResponse[] | undefined) => {
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
      showErrorToast('Failed to update customer');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      showSuccessToast('Customer updated successfully');
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
