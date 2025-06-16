import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, queryKeys, invalidateQueries } from '@/lib/api/client';
import { buildQueryString, createOptimisticUpdate, createOptimisticDelete } from '@/lib/api/utils';
import { showSuccessToast, showErrorToast } from '@/lib/api/utils';
import type { TattooDesign } from '@prisma/client';

// Media specific types
export interface MediaFilters {
  search?: string;
  type?: 'photo' | 'video';
  style?: string;
  tags?: string[];
  isPublic?: boolean;
  syncedToWebsite?: boolean;
  limit?: number;
  offset?: number;
}

export interface MediaItem extends TattooDesign {
  artistName: string;
  popularity: number;
  websiteUrl?: string;
}

export interface CreateMediaData {
  title: string;
  description?: string;
  style: string;
  tags: string[];
  mediaUrl: string;
  imageUrl?: string;
  type: 'photo' | 'video';
  isPublic?: boolean;
  estimatedHours?: number;
  syncToWebsite?: boolean;
}

export interface UpdateMediaData extends Partial<CreateMediaData> {
  id: string;
}

export interface UploadResult {
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  type: 'photo' | 'video';
  uploadedAt: string;
  metadata: any;
  syncedToWebsite: boolean;
}

export interface SyncResult {
  success: boolean;
  mediaId: string;
  websiteUrl?: string;
  message?: string;
}

// List media hook with filters
export function useMedia(filters: MediaFilters = {}) {
  const queryString = buildQueryString(filters);
  
  return useQuery({
    queryKey: queryKeys.media.list(filters),
    queryFn: () => 
      apiFetch<MediaItem[]>(`/api/admin/media?${queryString}`),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Single media item hook
export function useMediaItem(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.media.lists(), // Use a specific key if needed
    queryFn: () => apiFetch<MediaItem>(`/api/admin/media/${id}`),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Upload media mutation
export function useUploadMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      // Use apiFetch but override content type for file upload
      return apiFetch<UploadResult>('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
        headers: {}, // Remove Content-Type to let browser set it for FormData
      });
    },
    onSuccess: (uploadResult) => {
      // Invalidate media lists
      invalidateQueries(queryKeys.media.lists());
      
      showSuccessToast('Media uploaded successfully');
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
}

// Create media item mutation (for metadata)
export function useCreateMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMediaData) =>
      apiFetch<MediaItem>('/api/admin/media', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (newMedia) => {
      // Invalidate media lists
      invalidateQueries(queryKeys.media.lists());
      
      // Cache the new media item
      queryClient.setQueryData(
        [...queryKeys.media.lists(), newMedia.id],
        newMedia
      );
      
      showSuccessToast('Media item created successfully');
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
}

// Update media mutation
export function useUpdateMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateMediaData) =>
      apiFetch<MediaItem>(`/api/admin/media/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onMutate: async (updatedMedia) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: [...queryKeys.media.lists(), updatedMedia.id]
      });
      
      // Snapshot previous value
      const previousMedia = queryClient.getQueryData(
        [...queryKeys.media.lists(), updatedMedia.id]
      );
      
      // Optimistically update
      queryClient.setQueryData(
        [...queryKeys.media.lists(), updatedMedia.id],
        (old: MediaItem) => ({ ...old, ...updatedMedia })
      );
      
      return { previousMedia };
    },
    onSuccess: (updatedMedia) => {
      // Invalidate related queries
      invalidateQueries(queryKeys.media.lists());
      
      showSuccessToast('Media updated successfully');
    },
    onError: (error, updatedMedia, context) => {
      // Rollback on error
      if (context?.previousMedia) {
        queryClient.setQueryData(
          [...queryKeys.media.lists(), updatedMedia.id],
          context.previousMedia
        );
      }
      showErrorToast(error);
    },
  });
}

// Delete media mutation
export function useDeleteMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/media/${id}`, { method: 'DELETE' }),
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.media.lists() 
      });
      
      // Snapshot previous value
      const previousMedia = queryClient.getQueryData(
        queryKeys.media.lists()
      );
      
      // Optimistically remove from all lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.media.lists() },
        (old: MediaItem[] | undefined) => 
          createOptimisticDelete(old, deletedId, (item) => item.id)
      );
      
      return { previousMedia };
    },
    onSuccess: (_, deletedId) => {
      // Remove from individual query cache
      queryClient.removeQueries({ 
        queryKey: [...queryKeys.media.lists(), deletedId]
      });
      
      showSuccessToast('Media deleted successfully');
    },
    onError: (error, deletedId, context) => {
      // Rollback on error
      if (context?.previousMedia) {
        queryClient.setQueryData(
          queryKeys.media.lists(),
          context.previousMedia
        );
      }
      showErrorToast(error);
    },
  });
}

// Sync media to website mutation
export function useSyncMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { mediaId: string; action: 'sync' | 'unsync' }) =>
      apiFetch<SyncResult>('/api/admin/media/sync', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (result, { mediaId, action }) => {
      // Update the specific media item in cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.media.lists() },
        (old: MediaItem[] | undefined) => {
          return old?.map(item =>
            item.id === mediaId
              ? {
                  ...item,
                  syncedToWebsite: action === 'sync',
                  websiteUrl: result.websiteUrl || item.websiteUrl,
                }
              : item
          );
        }
      );
      
      // Invalidate to ensure consistency
      invalidateQueries(queryKeys.media.lists());
      
      const message = action === 'sync' 
        ? 'Media synced to website successfully'
        : 'Media unsynced from website successfully';
      showSuccessToast(message);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
}

// Bulk operations
export function useBulkDeleteMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mediaIds: string[]) =>
      apiFetch('/api/admin/media/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({ ids: mediaIds }),
      }),
    onSuccess: (_, mediaIds) => {
      // Remove all deleted items from cache
      mediaIds.forEach(id => {
        queryClient.removeQueries({ 
          queryKey: [...queryKeys.media.lists(), id]
        });
      });
      
      // Invalidate media lists
      invalidateQueries(queryKeys.media.lists());
      
      showSuccessToast(`${mediaIds.length} media items deleted successfully`);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
}

export function useBulkSyncMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { mediaIds: string[]; action: 'sync' | 'unsync' }) =>
      apiFetch('/api/admin/media/bulk-sync', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { mediaIds, action }) => {
      // Invalidate all media queries
      invalidateQueries(queryKeys.media.all);
      
      const message = action === 'sync'
        ? `${mediaIds.length} media items synced to website`
        : `${mediaIds.length} media items unsynced from website`;
      showSuccessToast(message);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });
}

// Hook for prefetch utilities
export function usePrefetchMedia() {
  const queryClient = useQueryClient();
  
  return (filters?: MediaFilters) => queryClient.prefetchQuery({
    queryKey: queryKeys.media.list(filters),
    queryFn: () => {
      const queryString = buildQueryString(filters || {});
      return apiFetch<MediaItem[]>(`/api/admin/media?${queryString}`);
    },
    staleTime: 3 * 60 * 1000,
  });
}