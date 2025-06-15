import { QueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import type { Session } from '@/types/auth';

// Create a singleton query client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

// Custom fetch wrapper with Better Auth integration
export interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
  parseResponse?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    requireAuth = true,
    parseResponse = true,
    headers = {},
    ...fetchOptions
  } = options;

  // Get the current session if auth is required
  let authHeaders: HeadersInit = {};
  if (requireAuth) {
    try {
      const session = await authClient.getSession();
      if (session?.user) {
        authHeaders = {
          Authorization: `Bearer ${session.token || ''}`,
        };
      }
    } catch (error) {
      console.warn('Failed to get auth session:', error);
    }
  }

  // Construct the full URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  // Merge headers
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...headers,
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: finalHeaders,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorDetails = null;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new ApiError(errorMessage, response.status, undefined, errorDetails);
    }

    // Parse response
    if (parseResponse) {
      const data = await response.json();
      
      // Handle standardized API response format
      if (data.success === false && data.error) {
        throw new ApiError(data.error, response.status, data.code);
      }
      
      // Return data directly or from data property
      return data.data || data;
    }

    return response as any;
  } catch (error) {
    // Re-throw ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    if (error instanceof Error) {
      throw new ApiError(
        error.message || 'Network error occurred',
        0,
        'NETWORK_ERROR'
      );
    }

    throw new ApiError('An unexpected error occurred', 0, 'UNKNOWN_ERROR');
  }
}

// Query key factories for consistent key generation
export const queryKeys = {
  all: ['api'] as const,
  auth: {
    all: ['api', 'auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
  dashboard: {
    all: ['api', 'dashboard'] as const,
    stats: (filters?: any) => [...queryKeys.dashboard.all, 'stats', filters] as const,
    chartData: (filters?: any) => [...queryKeys.dashboard.all, 'chart', filters] as const,
    recentSessions: () => [...queryKeys.dashboard.all, 'recent-sessions'] as const,
    recentClients: () => [...queryKeys.dashboard.all, 'recent-clients'] as const,
  },
  customers: {
    all: ['api', 'customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },
  appointments: {
    all: ['api', 'appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.appointments.lists(), filters] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
    stats: (filters?: any) => [...queryKeys.appointments.all, 'stats', filters] as const,
  },
  media: {
    all: ['api', 'media'] as const,
    lists: () => [...queryKeys.media.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.media.lists(), filters] as const,
  },
  analytics: {
    all: ['api', 'analytics'] as const,
    data: (filters?: any) => [...queryKeys.analytics.all, 'data', filters] as const,
  },
} as const;

// Utility functions for common patterns
export function invalidateQueries(keys: readonly unknown[]) {
  return queryClient.invalidateQueries({ queryKey: keys });
}

export function prefetchQuery<T = unknown>(
  key: readonly unknown[],
  fetcher: () => Promise<T>,
  options?: { staleTime?: number }
) {
  return queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: options?.staleTime,
  });
}

// Export types
export type QueryKeys = typeof queryKeys;