import { useCallback, useEffect, useMemo, useState } from 'react'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateCustomer, CustomerFilter } from '@/lib/validations'
import { apiFetch, queryKeys } from '@/lib/api/client'
import { showErrorToast, showSuccessToast } from '@/lib/api/utils'
// import { buildQueryString } from '@/lib/api/utils' // Available if needed
import type { ClientResponse } from '@/types/database'
import { logger } from '@/lib/logger'

interface UseCustomerOperationsOptions {
  search?: string
  hasAppointments?: boolean
  limit?: number
  offset?: number
}

// Use the unified API client
const fetchApi = apiFetch;

// Query options factory for customers
export function customersQueryOptions(filters: CustomerFilter) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.hasAppointments !== undefined) params.append('hasAppointments', filters.hasAppointments.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  return queryOptions({
    queryKey: queryKeys.customers.list(filters),
    queryFn: () => {
      const url = `/api/admin/customers${params.toString() ? `?${params}` : ''}`;
      return fetchApi<ClientResponse[]>(url).then(data => {
        // Handle both paginated and direct array responses
        return Array.isArray(data) ? data : (data as { data?: ClientResponse[] }).data || [];
      });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: (failureCount, error: Error & { status?: number }) => {
      // Don't retry on 4xx client errors
      if (error?.status && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Individual customer query options
export function customerQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => fetchApi<ClientResponse>(`/api/admin/customers/${id}`),
    staleTime: 1000 * 60 * 10, // 10 minutes for individual customer
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useCustomerOperations(options: UseCustomerOperationsOptions = {}) {
  const queryClient = useQueryClient();

  // Memoized filters to prevent unnecessary re-renders
  const [filters, setFilters] = useState<CustomerFilter>(() => ({
    search: options.search,
    hasAppointments: options.hasAppointments,
    limit: options.limit || 20,
    offset: options.offset || 0
  }));

  // Update filters when options change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: options.search,
      hasAppointments: options.hasAppointments
    }));
  }, [options.search, options.hasAppointments]);

  // Fetch customers query using query options
  const customersQuery = useQuery(customersQueryOptions(filters));

  // Create customer mutation with optimistic updates
  const createMutation = useMutation({
    mutationFn: (data: CreateCustomer) => fetchApi('/api/admin/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onError: (error) => {
      showErrorToast('Failed to create customer');
      logger.error('Failed to create customer:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      showSuccessToast('Customer created successfully');
    }
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomer> }) =>
      fetchApi(`/api/admin/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onError: (error) => {
      showErrorToast('Failed to update customer');
      logger.error('Failed to update customer:', error);
    },
    onSuccess: (updatedCustomer, { id }) => {
      queryClient.setQueryData(queryKeys.customers.detail(id), updatedCustomer);
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      showSuccessToast('Customer updated successfully');
    }
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (customerId: string) => fetchApi(`/api/admin/customers/${customerId}`, {
      method: 'DELETE',
    }),
    onError: (error) => {
      showErrorToast('Failed to delete customer');
      logger.error('Failed to delete customer:', error);
    },
    onSuccess: (_, customerId) => {
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(customerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      showSuccessToast('Customer deleted successfully');
    }
  });

  // Memoized pagination helpers
  const paginationHelpers = useMemo(() => ({
    nextPage: () => {
      setFilters(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    },

    prevPage: () => {
      setFilters(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }));
    },

    setSearch: (search: string) => {
      setFilters(prev => ({
        ...prev,
        search,
        offset: 0 // Reset to first page on search
      }));
    },

    setPage: (page: number) => {
      setFilters(prev => ({
        ...prev,
        offset: page * prev.limit
      }));
    },

    currentPage: Math.floor(filters.offset / filters.limit),
    hasNextPage: customersQuery.data?.length === filters.limit,
    hasPrevPage: filters.offset > 0,
  }), [filters, customersQuery.data?.length]);

  // Memoized CRUD operations
  const operations = useMemo(() => ({
    createCustomer: async (data: CreateCustomer): Promise<boolean> => {
      try {
        await createMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
      }
    },

    updateCustomer: async (id: string, data: Partial<CreateCustomer>): Promise<boolean> => {
      try {
        await updateMutation.mutateAsync({ id, data });
        return true;
      } catch {
        return false;
      }
    },

    deleteCustomer: async (id: string): Promise<boolean> => {
      try {
        await deleteMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
  }), [createMutation, updateMutation, deleteMutation]);

  // Prefetch utilities
  const prefetchCustomer = useCallback((id: string) => {
    queryClient.prefetchQuery(customerQueryOptions(id));
  }, [queryClient]);

  const prefetchNextPage = useCallback(() => {
    if (paginationHelpers.hasNextPage) {
      const nextFilters = { ...filters, offset: filters.offset + filters.limit };
      queryClient.prefetchQuery(customersQueryOptions(nextFilters));
    }
  }, [queryClient, filters, paginationHelpers.hasNextPage]);

  return {
    // Data and loading states
    customers: customersQuery.data,
    isLoading: customersQuery.isLoading,
    isFetching: customersQuery.isFetching,
    error: customersQuery.error,
    refetch: customersQuery.refetch,

    // CRUD operations
    ...operations,

    // Loading states for mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Filter management
    filters,
    setFilters,

    // Pagination
    ...paginationHelpers,

    // Prefetch utilities
    prefetchCustomer,
    prefetchNextPage,

    // Query utilities
    invalidateCustomers: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
    removeCustomerFromCache: (id: string) => queryClient.removeQueries({ queryKey: queryKeys.customers.detail(id) }),
  };
}

// Individual customer hook
export function useCustomer(id: string) {
  return useQuery(customerQueryOptions(id));
}

// Prefetch hook for better UX
export function usePrefetchCustomers() {
  const queryClient = useQueryClient();

  return useCallback((filters?: CustomerFilter) => {
    const defaultFilters: CustomerFilter = { limit: 20, offset: 0, ...filters };
    queryClient.prefetchQuery(customersQueryOptions(defaultFilters));
  }, [queryClient]);
}
