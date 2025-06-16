import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, queryKeys, invalidateQueries } from '@/lib/api/client';
import { buildQueryString, createOptimisticUpdate, createOptimisticDelete } from '@/lib/api/utils';
import { showSuccessToast, showErrorToast } from '@/lib/api/utils';
import type { 
  Appointment, 
  Client, 
  TattooArtist,
  AppointmentType,
  AppointmentStatus 
} from '@prisma/client';

// Appointment specific types
export interface AppointmentFilters {
  status?: AppointmentStatus | AppointmentStatus[];
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  artistId?: string;
  type?: AppointmentType;
  limit?: number;
  offset?: number;
}

export interface AppointmentResponse extends Appointment {
  client: Pick<Client, 'id' | 'name' | 'email' | 'phone'>;
  artist: Pick<TattooArtist, 'id' | 'name' | 'specialties'>;
}

export interface AppointmentStats {
  totalAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  completionRate: number;
  appointmentsChange: string;
  confirmedChange: string;
  completedChange: string;
  completionRateChange: string;
}

export interface CreateAppointmentData {
  clientId: string;
  artistId: string;
  type: AppointmentType;
  scheduledDate: Date;
  estimatedDuration: number;
  description?: string;
  notes?: string;
  depositAmount?: number;
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {
  id: string;
  status?: AppointmentStatus;
}

// List appointments hook with filters
export function useAppointments(filters: AppointmentFilters = {}) {
  const queryString = buildQueryString({
    ...filters,
    startDate: filters.startDate?.toISOString(),
    endDate: filters.endDate?.toISOString(),
    status: Array.isArray(filters.status) 
      ? filters.status.join(',') 
      : filters.status,
  });
  
  return useQuery({
    queryKey: queryKeys.appointments.list(filters),
    queryFn: () => 
      apiFetch<AppointmentResponse[]>(`/api/admin/appointments?${queryString}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Single appointment hook
export function useAppointment(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => apiFetch<AppointmentResponse>(`/api/admin/appointments/${id}`),
    enabled: enabled && !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Appointment stats hook
export function useAppointmentStats(filters?: Pick<AppointmentFilters, 'startDate' | 'endDate'>) {
  const queryString = buildQueryString({
    startDate: filters?.startDate?.toISOString(),
    endDate: filters?.endDate?.toISOString(),
  });
  
  return useQuery({
    queryKey: queryKeys.appointments.stats(filters),
    queryFn: () => 
      apiFetch<AppointmentStats>(`/api/admin/appointments/stats?${queryString}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create appointment mutation
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAppointmentData) =>
      apiFetch<AppointmentResponse>('/api/admin/appointments', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          scheduledDate: data.scheduledDate.toISOString(),
        }),
      }),
    onSuccess: (newAppointment) => {
      // Invalidate appointment lists and stats
      invalidateQueries(queryKeys.appointments.lists());
      invalidateQueries(queryKeys.appointments.stats());
      invalidateQueries(queryKeys.dashboard.stats());
      
      // Cache the new appointment
      queryClient.setQueryData(
        queryKeys.appointments.detail(newAppointment.id),
        newAppointment
      );
      
      showSuccessToast('Appointment created successfully');
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
}

// Update appointment mutation
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateAppointmentData) =>
      apiFetch<AppointmentResponse>(`/api/admin/appointments/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...data,
          scheduledDate: data.scheduledDate?.toISOString(),
        }),
      }),
    onMutate: async (updatedAppointment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.appointments.detail(updatedAppointment.id) 
      });
      
      // Snapshot previous value
      const previousAppointment = queryClient.getQueryData(
        queryKeys.appointments.detail(updatedAppointment.id)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        queryKeys.appointments.detail(updatedAppointment.id),
        (old: AppointmentResponse) => ({ ...old, ...updatedAppointment })
      );
      
      return { previousAppointment };
    },
    onSuccess: (updatedAppointment) => {
      // Invalidate related queries
      invalidateQueries(queryKeys.appointments.lists());
      invalidateQueries(queryKeys.appointments.stats());
      invalidateQueries(queryKeys.dashboard.stats());
      
      showSuccessToast('Appointment updated successfully');
    },
    onError: (error, updatedAppointment, context) => {
      // Rollback on error
      if (context?.previousAppointment) {
        queryClient.setQueryData(
          queryKeys.appointments.detail(updatedAppointment.id),
          context.previousAppointment
        );
      }
      showErrorToast(error);
    },
  });
}

// Delete appointment mutation
export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/appointments/${id}`, { method: 'DELETE' }),
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.appointments.lists() 
      });
      
      // Snapshot previous value
      const previousAppointments = queryClient.getQueryData(
        queryKeys.appointments.lists()
      );
      
      // Optimistically remove from all lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.appointments.lists() },
        (old: AppointmentResponse[] | undefined) => 
          createOptimisticDelete(old, deletedId, (item) => item.id)
      );
      
      return { previousAppointments };
    },
    onSuccess: (_, deletedId) => {
      // Remove from individual query cache
      queryClient.removeQueries({ 
        queryKey: queryKeys.appointments.detail(deletedId) 
      });
      
      // Invalidate stats
      invalidateQueries(queryKeys.appointments.stats());
      invalidateQueries(queryKeys.dashboard.stats());
      
      showSuccessToast('Appointment deleted successfully');
    },
    onError: (error, deletedId, context) => {
      // Rollback on error
      if (context?.previousAppointments) {
        queryClient.setQueryData(
          queryKeys.appointments.lists(),
          context.previousAppointments
        );
      }
      showErrorToast(error);
    },
  });
}

// Bulk status update mutation
export function useBulkUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { ids: string[]; status: AppointmentStatus }) =>
      apiFetch('/api/admin/appointments/bulk-update', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalidate all appointment related queries
      invalidateQueries(queryKeys.appointments.all);
      invalidateQueries(queryKeys.dashboard.stats());
      
      showSuccessToast('Appointments updated successfully');
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
}

// Hook to prefetch appointment for faster navigation
export function usePrefetchAppointment() {
  const queryClient = useQueryClient();
  
  return (id: string) => queryClient.prefetchQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => apiFetch<AppointmentResponse>(`/api/admin/appointments/${id}`),
    staleTime: 3 * 60 * 1000,
  });
}