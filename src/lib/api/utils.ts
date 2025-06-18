import { toast } from 'sonner';
import type { ApiError } from './client';

// Toast utilities for API responses
export function showErrorToast(error: ApiError | Error | string): void {
  const message = typeof error === 'string' 
    ? error 
    : error instanceof Error 
      ? error.message 
      : 'An error occurred';
  
  toast.error(message);
}

export function showSuccessToast(message: string): void {
  toast.success(message);
}

export function showLoadingToast(message: string): string | number {
  return toast.loading(message);
}

// API response helpers matching the existing format
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
  timestamp: string;
  requestId?: string;
}

export function createSuccessResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    status: 200,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(
  error: string,
  status: number = 500,
  requestId?: string
): ApiResponse<null> {
  return {
    success: false,
    error,
    status,
    timestamp: new Date().toISOString(),
    requestId,
    data: null,
  };
}

// Pagination utilities
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function createPaginationParams(
  page: number = 1,
  limit: number = 10
): Required<PaginationParams> {
  return {
    page: Math.max(1, page),
    limit: Math.max(1, Math.min(100, limit)), // Cap at 100
    offset: (Math.max(1, page) - 1) * Math.max(1, Math.min(100, limit)),
  };
}

// Filter utilities
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else if (typeof value === 'object') {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
}

// Optimistic update utilities
export function createOptimisticUpdate<T>(
  currentData: T[] | undefined,
  newItem: T,
  getId: (item: T) => string | number
): T[] {
  if (!currentData) return [newItem];
  
  const exists = currentData.find(item => getId(item) === getId(newItem));
  if (exists) {
    return currentData.map(item => 
      getId(item) === getId(newItem) ? newItem : item
    );
  }
  
  return [...currentData, newItem];
}

export function createOptimisticDelete<T>(
  currentData: T[] | undefined,
  itemId: string | number,
  getId: (item: T) => string | number
): T[] {
  if (!currentData) return [];
  return currentData.filter(item => getId(item) !== itemId);
}
