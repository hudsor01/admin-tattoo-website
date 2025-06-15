import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { apiFetch, queryKeys } from '@/lib/api/client';
import { showSuccessToast, showErrorToast } from '@/lib/api/utils';

// Use the unified API client
const fetchApi = apiFetch;

// Gallery item interface
interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  style: string;
  tags: string[];
  artistId: string;
  artistName?: string;
  isPublic: boolean;
  estimatedHours?: number;
  popularity: number;
  createdAt: string;
  updatedAt: string;
}

interface GalleryFilters {
  style?: string;
  artistId?: string;
  isPublic?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
  search?: string;
}

// Query options factories
export function galleryItemsOptions(filters: GalleryFilters = {}) {
  const params = new URLSearchParams();

  if (filters.style) params.append('style', filters.style);
  if (filters.artistId) params.append('artistId', filters.artistId);
  if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());
  if (filters.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());
  if (filters.search) params.append('search', filters.search);

  return queryOptions({
    queryKey: queryKeys.media.list(filters),
    queryFn: () => {
      const url = `/api/admin/gallery${params.toString() ? `?${params}` : ''}`;
      return fetchApi<GalleryItem[]>(url);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes for gallery items
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function galleryItemOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.media.detail(id),
    queryFn: () => fetchApi<GalleryItem>(`/api/admin/gallery/${id}`),
    staleTime: 1000 * 60 * 15, // 15 minutes for individual items
    gcTime: 1000 * 60 * 45, // 45 minutes
  });
}

export function galleryStatsOptions() {
  return queryOptions({
    queryKey: [...queryKeys.media.all, 'stats'],
    queryFn: () => fetchApi<{ totalImages: number; totalVideos: number; recentUploads: number; popularTags: Array<{ tag: string; count: number }> }>('/api/admin/gallery/stats'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
  });
}

export function artistPortfolioOptions(artistId: string) {
  return queryOptions({
    queryKey: [...queryKeys.media.all, 'artists', artistId, 'portfolio'],
    queryFn: () => fetchApi<GalleryItem[]>(`/api/admin/gallery/artists/${artistId}/portfolio`),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hooks
export const useGalleryItems = (filters: GalleryFilters = {}) => {
  return useQuery(galleryItemsOptions(filters));
};

export const useGalleryItem = (id: string) => {
  return useQuery(galleryItemOptions(id));
};

export const useGalleryStats = () => {
  return useQuery(galleryStatsOptions());
};

export const useArtistPortfolio = (artistId: string) => {
  return useQuery(artistPortfolioOptions(artistId));
};

// Mutation hooks
export const useCreateGalleryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemData: Partial<GalleryItem>) =>
      fetchApi('/api/admin/gallery', {
        method: 'POST',
        body: JSON.stringify(itemData),
      }),
    onSuccess: (newItem) => {
      // Add to cache optimistically
      queryClient.setQueriesData({ queryKey: queryKeys.media.all }, (old: GalleryItem[] | undefined) => {
        return old ? [newItem, ...old] : [newItem];
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      if ((newItem as GalleryItem).artistId) {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.media.all, 'artists', (newItem as GalleryItem).artistId] });
      }
      showSuccessToast('Gallery item created successfully');
    },
    onError: (error) => {
      showErrorToast('Failed to create gallery item');
    },
  });
};

export const useUpdateGalleryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updateData }: { id: string } & Partial<GalleryItem>) =>
      fetchApi(`/api/admin/gallery/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      }),
    onMutate: async ({ id, ...updateData }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.media.all });

      const previousData = queryClient.getQueriesData({ queryKey: queryKeys.media.all });

      // Optimistically update item
      queryClient.setQueriesData({ queryKey: queryKeys.media.all }, (old: GalleryItem[] | undefined) => {
        return old?.map(item =>
          item.id === id ? { ...item, ...updateData } : item
        );
      });

      // Update individual item cache
      queryClient.setQueryData(queryKeys.media.detail(id), (old: GalleryItem | undefined) =>
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
      showErrorToast('Failed to update gallery item');
    },
    onSuccess: (updatedItem, { id }) => {
      queryClient.setQueryData(queryKeys.media.detail(id), updatedItem);
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      showSuccessToast('Gallery item updated successfully');
    },
  });
};

export const useDeleteGalleryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fetchApi(`/api/admin/gallery/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.media.all });

      const previousData = queryClient.getQueriesData({ queryKey: queryKeys.media.all });

      // Optimistically remove item
      queryClient.setQueriesData({ queryKey: queryKeys.media.all }, (old: GalleryItem[] | undefined) => {
        return old?.filter(item => item.id !== id);
      });

      queryClient.removeQueries({ queryKey: queryKeys.media.detail(id) });

      return { previousData };
    },
    onError: (error, _id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      showErrorToast('Failed to delete gallery item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      showSuccessToast('Gallery item deleted successfully');
    },
  });
};

// Prefetch utilities
export const usePrefetchGallery = () => {
  const queryClient = useQueryClient();

  return {
    prefetchItems: (filters?: GalleryFilters) =>
      queryClient.prefetchQuery(galleryItemsOptions(filters)),
    prefetchStats: () =>
      queryClient.prefetchQuery(galleryStatsOptions()),
    prefetchArtistPortfolio: (artistId: string) =>
      queryClient.prefetchQuery(artistPortfolioOptions(artistId)),
  };
};
