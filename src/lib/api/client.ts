import { QueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import type { Session } from '@/types/auth';
import { 
  resilientFetch, 
  FetchConfig, 
  handleError, 
  ApiErrorResponse,
  ApiSuccessResponse,
  ErrorCategory,
  categorizeError,
  getCircuitBreaker
} from '@/lib/api/enhanced-error-handling';
import { z } from 'zod';

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

// Enhanced fetch wrapper with Better Auth integration and resilience features
export interface EnhancedFetchOptions extends RequestInit, FetchConfig {
  requireAuth?: boolean;
  parseResponse?: boolean;
  serviceName?: string; // For circuit breaker tracking
  validateSchema?: z.ZodSchema; // For response validation
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any,
    public category?: ErrorCategory
  ) {
    super(message);
    this.name = 'ApiError';
    this.category = category || categorizeError(this);
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: EnhancedFetchOptions = {}
): Promise<T> {
  const {
    requireAuth = true,
    parseResponse = true,
    serviceName,
    validateSchema,
    timeout = 30000,
    retryConfig,
    deduplicationKey,
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
      } else if (requireAuth) {
        throw new ApiError('Authentication required', 401, 'AUTH_REQUIRED', null, ErrorCategory.AUTHENTICATION);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.warn('Failed to get auth session:', error);
      if (requireAuth) {
        throw new ApiError('Authentication failed', 401, 'AUTH_FAILED', error, ErrorCategory.AUTHENTICATION);
      }
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
    // Use resilient fetch with all error handling features
    const response = await resilientFetch<T>(url, {
      ...fetchOptions,
      headers: finalHeaders,
      timeout,
      retryConfig,
      circuitBreakerService: serviceName || 'api',
      deduplicationKey: deduplicationKey || (fetchOptions.method === 'GET' ? `${url}` : undefined),
      validateResponse: validateSchema,
    });

    // Handle standardized API response format if parsing is enabled
    if (parseResponse && response && typeof response === 'object') {
      const data = response as any;
      
      // Handle standardized API response format
      if (data.success === false && data.error) {
        const category = categorizeError(new ApiError(data.error, data.status || 500));
        throw new ApiError(data.error, data.status || 500, data.code, data, category);
      }
      
      // Return data directly or from data property
      return (data.data !== undefined ? data.data : data) as T;
    }

    return response;
  } catch (error) {
    // Enhanced error handling with categorization and user notifications
    const category = handleError(error, {
      showToast: false, // Let the calling code decide whether to show toasts
      logError: true,
    });

    // Re-throw enhanced ApiError
    if (error instanceof ApiError) {
      error.category = category;
      throw error;
    }

    // Network or other errors
    if (error instanceof Error) {
      throw new ApiError(
        error.message || 'Network error occurred',
        0,
        'NETWORK_ERROR',
        error,
        category
      );
    }

    throw new ApiError('An unexpected error occurred', 0, 'UNKNOWN_ERROR', error, category);
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

// Enhanced API utilities with error handling
export function createApiCall<T = any>(
  endpoint: string,
  defaultOptions: Partial<EnhancedFetchOptions> = {}
) {
  return (options: Partial<EnhancedFetchOptions> = {}) => 
    apiFetch<T>(endpoint, { ...defaultOptions, ...options });
}

// Typed API calls with response validation
export function createTypedApiCall<TRequest, TResponse>(
  endpoint: string,
  requestSchema?: z.ZodSchema<TRequest>,
  responseSchema?: z.ZodSchema<TResponse>,
  defaultOptions: Partial<EnhancedFetchOptions> = {}
) {
  return async (data?: TRequest, options: Partial<EnhancedFetchOptions> = {}): Promise<TResponse> => {
    // Validate request data if schema provided
    if (requestSchema && data) {
      try {
        requestSchema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ApiError(
            `Request validation failed: ${error.errors.map(e => e.message).join(', ')}`,
            400,
            'VALIDATION_ERROR',
            error.errors,
            ErrorCategory.VALIDATION
          );
        }
        throw error;
      }
    }

    return apiFetch<TResponse>(endpoint, {
      ...defaultOptions,
      ...options,
      validateSchema: responseSchema,
      body: data ? JSON.stringify(data) : undefined,
    });
  };
}

// Circuit breaker monitoring utilities
export function getApiHealthStatus() {
  return {
    circuitBreakers: Object.fromEntries(
      Array.from(new Set(['api', 'auth', 'dashboard', 'customers', 'appointments']))
        .map(service => [service, getCircuitBreaker(service).getStatus()])
    ),
    timestamp: new Date().toISOString(),
  };
}

// Batch request utility for efficient API calls
export async function batchApiCalls<T extends Record<string, () => Promise<any>>>(
  calls: T,
  options: { concurrency?: number; failFast?: boolean } = {}
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const { concurrency = 3, failFast = false } = options;
  const entries = Object.entries(calls);
  const results: Record<string, any> = {};
  const errors: Record<string, Error> = {};

  // Process requests in batches
  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async ([key, call]) => {
      try {
        results[key] = await call();
      } catch (error) {
        errors[key] = error instanceof Error ? error : new Error(String(error));
        if (failFast) throw error;
      }
    });

    await Promise.all(batchPromises);
  }

  // If there were errors and not in fail-fast mode, log them
  if (Object.keys(errors).length > 0 && !failFast) {
    console.warn('Batch API calls had errors:', errors);
  }

  return results as { [K in keyof T]: Awaited<ReturnType<T[K]>> };
}

// Export types
export type QueryKeys = typeof queryKeys;