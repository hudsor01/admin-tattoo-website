import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { apiFetch, queryKeys } from '@/lib/api/client';
import { showSuccessToast, showErrorToast } from '@/lib/api/utils';

// Use the unified API client
const fetchApi = apiFetch;

// Form interfaces
interface FormSubmission {
  id: string;
  formType: 'waiver' | 'consultation' | 'aftercare' | 'contact';
  clientId?: string;
  clientName: string;
  clientEmail: string;
  submissionData: Record<string, unknown>;
  status: 'new' | 'reviewed' | 'processed' | 'archived';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

interface FormTemplate {
  id: string;
  name: string;
  formType: 'waiver' | 'consultation' | 'aftercare' | 'contact';
  fields: FormField[];
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'signature';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For radio, select
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

interface FormFilters {
  formType?: string;
  status?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

// Query options factories
export function formSubmissionsOptions(filters: FormFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.formType) params.append('formType', filters.formType);
  if (filters.status) params.append('status', filters.status);
  if (filters.clientId) params.append('clientId', filters.clientId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());
  if (filters.search) params.append('search', filters.search);

  return queryOptions({
    queryKey: [...queryKeys.all, 'forms', 'submissions', filters],
    queryFn: () => {
      const url = `/api/admin/forms/submissions${params.toString() ? `?${params}` : ''}`;
      return fetchApi<FormSubmission[]>(url);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes for form submissions
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function formSubmissionOptions(id: string) {
  return queryOptions({
    queryKey: [...queryKeys.all, 'forms', 'submissions', id],
    queryFn: () => fetchApi<FormSubmission>(`/api/admin/forms/submissions/${id}`),
    staleTime: 1000 * 60 * 5, // 5 minutes for individual submissions
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function formTemplatesOptions() {
  return queryOptions({
    queryKey: [...queryKeys.all, 'forms', 'templates'],
    queryFn: () => fetchApi<FormTemplate[]>('/api/admin/forms/templates'),
    staleTime: 1000 * 60 * 30, // 30 minutes for templates (rarely change)
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

export function formTemplateOptions(id: string) {
  return queryOptions({
    queryKey: [...queryKeys.all, 'forms', 'templates', id],
    queryFn: () => fetchApi<FormTemplate>(`/api/admin/forms/templates/${id}`),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

export function formStatsOptions() {
  return queryOptions({
    queryKey: [...queryKeys.all, 'forms', 'stats'],
    queryFn: () => fetchApi<{ totalSubmissions: number; pendingReview: number; recentSubmissions: FormSubmission[] }>('/api/admin/forms/stats'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
  });
}

export function formSubmissionsByClientOptions(clientId: string) {
  return queryOptions({
    queryKey: [...queryKeys.all, 'forms', 'submissions', 'client', clientId],
    queryFn: () => fetchApi<FormSubmission[]>(`/api/admin/forms/submissions/client/${clientId}`),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
  });
}

// Hooks
export const useFormSubmissions = (filters: FormFilters = {}) => {
  return useQuery(formSubmissionsOptions(filters));
};

export const useFormSubmission = (id: string) => {
  return useQuery(formSubmissionOptions(id));
};

export const useFormTemplates = () => {
  return useQuery(formTemplatesOptions());
};

export const useFormTemplate = (id: string) => {
  return useQuery(formTemplateOptions(id));
};

export const useFormStats = () => {
  return useQuery(formStatsOptions());
};

export const useFormSubmissionsByClient = (clientId: string) => {
  return useQuery(formSubmissionsByClientOptions(clientId));
};

// Mutation hooks
export const useUpdateSubmissionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      fetchApi(`/api/admin/forms/submissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes, reviewedAt: new Date().toISOString() }),
      }),
    onMutate: async ({ id, status, notes }) => {
      await queryClient.cancelQueries({ queryKey: ['forms', 'submissions'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['forms', 'submissions'] });

      // Optimistically update submission
      queryClient.setQueriesData({ queryKey: ['forms', 'submissions'] }, (old: FormSubmission[] | undefined) => {
        return old?.map(submission => 
          submission.id === id ? { 
            ...submission, 
            status: status as FormSubmission['status'], 
            notes,
            reviewedAt: new Date().toISOString()
          } : submission
        );
      });

      // Update individual submission cache
      queryClient.setQueryData(['forms', 'submissions', id], (old: FormSubmission | undefined) => 
        old ? { 
          ...old, 
          status: status as FormSubmission['status'], 
          notes,
          reviewedAt: new Date().toISOString()
        } : undefined
      );

      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      showErrorToast('Failed to update submission status');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, 'forms', 'submissions'] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, 'forms', 'stats'] });
      showSuccessToast('Form submission status updated successfully');
    },
  });
};

export const useCreateFormTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateData: Partial<FormTemplate>) =>
      fetchApi('/api/admin/forms/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      }),
    onSuccess: (newTemplate) => {
      // Add to templates cache
      queryClient.setQueryData([...queryKeys.all, 'forms', 'templates'], (old: FormTemplate[] | undefined) => {
        return old ? [newTemplate, ...old] : [newTemplate];
      });
      
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, 'forms', 'templates'] });
      showSuccessToast('Form template created successfully');
    },
    onError: (error) => {
      showErrorToast('Failed to create form template');
    },
  });
};

export const useUpdateFormTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updateData }: { id: string } & Partial<FormTemplate>) =>
      fetchApi(`/api/admin/forms/templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      }),
    onMutate: async ({ id, ...updateData }) => {
      await queryClient.cancelQueries({ queryKey: ['forms', 'templates'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['forms', 'templates'] });

      // Optimistically update template
      queryClient.setQueriesData({ queryKey: ['forms', 'templates'] }, (old: FormTemplate[] | undefined) => {
        return old?.map(template => 
          template.id === id ? { ...template, ...updateData } : template
        );
      });

      queryClient.setQueryData(['forms', 'templates', id], (old: FormTemplate | undefined) => 
        old ? { ...old, ...updateData } : undefined
      );

      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      showErrorToast('Failed to update form template');
    },
    onSuccess: (updatedTemplate, { id }) => {
      queryClient.setQueryData([...queryKeys.all, 'forms', 'templates', id], updatedTemplate);
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, 'forms', 'templates'] });
      showSuccessToast('Form template updated successfully');
    },
  });
};

export const useDeleteFormTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fetchApi(`/api/admin/forms/templates/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['forms', 'templates'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['forms', 'templates'] });

      // Optimistically remove template
      queryClient.setQueriesData({ queryKey: ['forms', 'templates'] }, (old: FormTemplate[] | undefined) => {
        return old?.filter(template => template.id !== id);
      });

      queryClient.removeQueries({ queryKey: ['forms', 'templates', id] });

      return { previousData };
    },
    onError: (error, _id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      void logger.error('Failed to delete form template:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', 'templates'] });
    },
  });
};

export const useBulkUpdateSubmissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      fetchApi('/api/admin/forms/submissions/bulk-update', {
        method: 'PATCH',
        body: JSON.stringify({ ids, status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', 'submissions'] });
      queryClient.invalidateQueries({ queryKey: ['forms', 'stats'] });
    },
    onError: (error) => {
      void logger.error('Failed to bulk update submissions:', error);
    },
  });
};

// Prefetch utilities
export const usePrefetchForms = () => {
  const queryClient = useQueryClient();

  return {
    prefetchSubmissions: (filters?: FormFilters) => 
      queryClient.prefetchQuery(formSubmissionsOptions(filters)),
    prefetchTemplates: () => 
      queryClient.prefetchQuery(formTemplatesOptions()),
    prefetchStats: () => 
      queryClient.prefetchQuery(formStatsOptions()),
    prefetchClientSubmissions: (clientId: string) => 
      queryClient.prefetchQuery(formSubmissionsByClientOptions(clientId)),
  };
};