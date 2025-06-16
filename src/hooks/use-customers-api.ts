import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, queryKeys, invalidateQueries } from '@/lib/api/client';
import { buildQueryString, createOptimisticUpdate, createOptimisticDelete } from '@/lib/api/utils';
import { showSuccessToast, showErrorToast } from '@/lib/api/utils';
import type { Client } from '@prisma/client';

// Customer specific types
export interface CustomerFilters {
  search?: string;
  hasAppointments?: boolean;
  limit?: number;
  offset?: number;
}

export interface CustomerResponse extends Client {
  appointmentCount: number;
  totalSpent: number;
  lastAppointment?: Date;
  nextAppointment?: Date;
}

export interface CreateCustomerData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: string;
  medicalConditions?: string;
  allergies?: string;
  notes?: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  id: string;
}

// List customers hook with filters
export function useCustomers(filters: CustomerFilters = {}) {
  const queryString = buildQueryString(filters);
  
  return useQuery({
    queryKey: queryKeys.customers.list(filters),
    queryFn: () => 
      apiFetch<CustomerResponse[]>(`/api/admin/customers?${queryString}`),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Single customer hook
export function useCustomer(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => apiFetch<CustomerResponse>(`/api/admin/customers/${id}`),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create customer mutation
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCustomerData) =>
      apiFetch<CustomerResponse>('/api/admin/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (newCustomer) => {
      // Invalidate customers list
      invalidateQueries(queryKeys.customers.lists());
      
      // Optimistically update cache
      queryClient.setQueryData(
        queryKeys.customers.detail(newCustomer.id),
        newCustomer
      );
      
      showSuccessToast('Customer created successfully');
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
}

// Update customer mutation
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateCustomerData) =>
      apiFetch<CustomerResponse>(`/api/admin/customers/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onMutate: async (updatedCustomer) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.customers.detail(updatedCustomer.id) 
      });
      
      // Snapshot previous value
      const previousCustomer = queryClient.getQueryData(
        queryKeys.customers.detail(updatedCustomer.id)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        queryKeys.customers.detail(updatedCustomer.id),
        (old: CustomerResponse) => ({ ...old, ...updatedCustomer })
      );
      
      return { previousCustomer };
    },
    onSuccess: (updatedCustomer) => {
      // Invalidate and refetch
      invalidateQueries(queryKeys.customers.lists());
      invalidateQueries(queryKeys.customers.detail(updatedCustomer.id));
      
      showSuccessToast('Customer updated successfully');
    },
    onError: (error, updatedCustomer, context) => {
      // Rollback on error
      if (context?.previousCustomer) {
        queryClient.setQueryData(
          queryKeys.customers.detail(updatedCustomer.id),
          context.previousCustomer
        );
      }
      showErrorToast(error);
    },
  });
}

// Delete customer mutation
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/customers/${id}`, { method: 'DELETE' }),
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.customers.lists() 
      });
      
      // Snapshot previous value
      const previousCustomers = queryClient.getQueryData(
        queryKeys.customers.lists()
      );
      
      // Optimistically remove from all lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.customers.lists() },
        (old: CustomerResponse[] | undefined) => 
          createOptimisticDelete(old, deletedId, (item) => item.id)
      );
      
      return { previousCustomers };
    },
    onSuccess: (_, deletedId) => {
      // Remove from individual query cache
      queryClient.removeQueries({ 
        queryKey: queryKeys.customers.detail(deletedId) 
      });
      
      showSuccessToast('Customer deleted successfully');
    },
    onError: (error, deletedId, context) => {
      // Rollback on error
      if (context?.previousCustomers) {
        queryClient.setQueryData(
          queryKeys.customers.lists(),
          context.previousCustomers
        );
      }
      showErrorToast(error);
    },
  });
}

// Hook to prefetch customer for faster navigation
export function usePrefetchCustomer() {
  const queryClient = useQueryClient();
  
  return (id: string) => queryClient.prefetchQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => apiFetch<CustomerResponse>(`/api/admin/customers/${id}`),
    staleTime: 5 * 60 * 1000,
  });
}