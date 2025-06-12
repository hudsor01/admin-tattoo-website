import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

// Enhanced fetch function with proper error handling
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      throw error;
    }

    return await response.json();
  } catch (error) {
    void logger.error('Gallery API fetch error:', error);
    throw error;
  }
}

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
    queryKey: ['gallery', 'items', filters],
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
    queryKey: ['gallery', 'items', id],
    queryFn: () => fetchApi<GalleryItem>(`/api/admin/gallery/${id}`),
    staleTime: 1000 * 60 * 15, // 15 minutes for individual items
    gcTime: 1000 * 60 * 45, // 45 minutes
  });
}

export function galleryStatsOptions() {
  return queryOptions({
    queryKey: ['gallery', 'stats'],
    queryFn: () => fetchApi<any>('/api/admin/gallery/stats'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
  });
}

export function artistPortfolioOptions(artistId: string) {
  return queryOptions({
    queryKey: ['gallery', 'artists', artistId, 'portfolio'],
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
      queryClient.setQueriesData({ queryKey: ['gallery', 'items'] }, (old: GalleryItem[] | undefined) => {
        return old ? [newItem, ...old] : [newItem];
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      if ((newItem as GalleryItem).artistId) {
        queryClient.invalidateQueries({ queryKey: ['gallery', 'artists', (newItem as GalleryItem).artistId] });
      }
    },
    onError: (error) => {
      void logger.error('Failed to create gallery item:', error);
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
      await queryClient.cancelQueries({ queryKey: ['gallery'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['gallery'] });

      // Optimistically update item
      queryClient.setQueriesData({ queryKey: ['gallery', 'items'] }, (old: GalleryItem[] | undefined) => {
        return old?.map(item =>
          item.id === id ? { ...item, ...updateData } : item
        );
      });

      // Update individual item cache
      queryClient.setQueryData(['gallery', 'items', id], (old: GalleryItem | undefined) =>
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
      void logger.error('Failed to update gallery item:', error);
    },
    onSuccess: (updatedItem, { id }) => {
      queryClient.setQueryData(['gallery', 'items', id], updatedItem);
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
  });
};

export const useDeleteGalleryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fetchApi(`/api/admin/gallery/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['gallery'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['gallery'] });

      // Optimistically remove item
      queryClient.setQueriesData({ queryKey: ['gallery', 'items'] }, (old: GalleryItem[] | undefined) => {
        return old?.filter(item => item.id !== id);
      });

      queryClient.removeQueries({ queryKey: ['gallery', 'items', id] });

      return { previousData };
    },
    onError: (error, _id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      void logger.error('Failed to delete gallery item:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
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
