"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, ExternalLink, Eye, RefreshCw, Trash2, Video } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { MediaUploadDialog } from "@/components/media/media-upload-dialog"

// Media item type
interface MediaItem {
  id: string
  title: string
  description: string
  style: string
  tags: string[]
  mediaUrl: string
  imageUrl: string
  type: string
  artistName: string
  isPublic: boolean
  popularity: number
  estimatedHours: number
  createdAt: string
  updatedAt: string
  syncedToWebsite: boolean
  websiteUrl: string
}

// Fetch media items from API
const fetchMediaItems = async () => {
  const response = await fetch('/api/admin/media')
  if (!response.ok) throw new Error('Failed to fetch media items')
  const result = await response.json()
  // Handle API response wrapper format
  return result.success ? result.data : []
}

export default function VideosPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const { data: mediaItems, isLoading } = useQuery({
    queryKey: ['media'],
    queryFn: fetchMediaItems,
    refetchInterval: 60000, // Refresh every minute
  })

  // Ensure mediaItems is always an array and filter for videos only
  const safeMediaItems: MediaItem[] = Array.isArray(mediaItems) ? mediaItems : []
  const videoItems = safeMediaItems.filter(item => 
    item.type === 'video' || (item.mediaUrl && (item.mediaUrl.includes('.mp4') || item.mediaUrl.includes('.mov') || item.mediaUrl.includes('.webm')))
  )
  
  // Separate by sync status
  const syncedVideos = videoItems.filter(item => item.syncedToWebsite)
  const unsyncedVideos = videoItems.filter(item => !item.syncedToWebsite)

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Page Header */}
          <div className="px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Videos</h1>
                    <p className="text-muted-foreground">
                      Manage video uploads that sync to ink37tattoos.com/gallery
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                >
                  <Video className="mr-2 h-4 w-4" aria-hidden="true" />
                  Upload Video
                </Button>
              </div>
            </div>
          </div>

          {/* Videos Sections */}
          <div className="px-6 lg:px-8 space-y-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {['video-1', 'video-2', 'video-3', 'video-4', 'video-5', 'video-6', 'video-7', 'video-8'].map((videoKey) => (
                  <Card key={`video-skeleton-${videoKey}`} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : videoItems?.length > 0 ? (
              <>
                {/* Videos on Website */}
                <MediaSection 
                  title="Videos on Website" 
                  items={syncedVideos} 
                  icon={<Video className="h-5 w-5" />}
                  badge="✓ Synced"
                  badgeVariant="default"
                />
                
                {/* Videos not on Website */}
                <MediaSection 
                  title="Videos not on Website" 
                  items={unsyncedVideos} 
                  icon={<Video className="h-5 w-5" />}
                  badge="⚠ Not Synced"
                  badgeVariant="destructive"
                />
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
                    <h3 className="text-lg font-semibold">No videos found</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by uploading your first video.
                    </p>
                    <Button 
                      onClick={() => setUploadDialogOpen(true)}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                    >
                      <Video className="mr-2 h-4 w-4" aria-hidden="true" />
                      Upload Video
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <MediaUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        uploadType="video"
      />
    </div>
  )
}

function MediaSection({ 
  title, 
  items, 
  icon, 
  badge, 
  badgeVariant 
}: { 
  title: string
  items: MediaItem[]
  icon: React.ReactNode
  badge: string
  badgeVariant: "default" | "destructive"
}) {
  if (items.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Badge variant={badgeVariant} className="text-xs">
            {badge}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {items.length} {items.length === 1 ? 'video' : 'videos'}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item: MediaItem) => (
          <MediaItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function MediaItemCard({ item }: { item: MediaItem }) {
  const queryClient = useQueryClient()

  const syncMutation = useMutation({
    mutationFn: async (action: 'sync' | 'unsync') => {
      const response = await fetch('/api/admin/media/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: item.id, action })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Sync failed')
      }
      
      return response.json()
    },
    onSuccess: (_, action) => {
      toast.success(action === 'sync' 
        ? 'Video synced to website successfully!' 
        : 'Video removed from website successfully!'
      )
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/media?id=${item.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Delete failed')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success('Video deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`)
    }
  })

  const handleSync = () => {
    const action = item.syncedToWebsite ? 'unsync' : 'sync'
    syncMutation.mutate(action)
  }

  const handleDelete = () => {
    // Note: In production, replace with a proper confirmation dialog
    // eslint-disable-next-line no-alert
    if (confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

  // Helper to check if URL is valid (not a relative path without host)
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')
  }
  
  const hasValidUrl = isValidUrl(item.mediaUrl) || isValidUrl(item.imageUrl)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative">
        <div className="relative h-48 bg-gray-100 flex items-center justify-center">
          {hasValidUrl ? (
            <video
              src={item.mediaUrl}
              poster={item.imageUrl}
              className="w-full h-full object-cover"
              controls={false}
              muted
              preload="metadata"
              onError={(e) => {
                // Hide video on error and show placeholder
                const target = e.target as HTMLVideoElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Video className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="absolute top-2 left-2">
          <Badge variant={item.syncedToWebsite ? 'default' : 'destructive'} className="text-xs">
            {item.syncedToWebsite ? '✓ Synced' : '⚠ Not Synced'}
          </Badge>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            {item.websiteUrl ? <Button 
                size="sm" 
                variant="secondary" 
                className="h-8 w-8 p-0"
                onClick={() => window.open(item.websiteUrl, '_blank')}
                title="View on website"
              >
                <ExternalLink className="h-3 w-3" />
              </Button> : null}
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-8 w-8 p-0"
              title="View details"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-8 w-8 p-0"
              title="Edit metadata"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant={item.syncedToWebsite ? "default" : "outline"}
              className="h-8 w-8 p-0"
              onClick={handleSync}
              disabled={syncMutation.isPending}
              title={item.syncedToWebsite ? "Remove from website" : "Sync to website"}
            >
              <RefreshCw className={`h-3 w-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              className="h-8 w-8 p-0"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {item.title || 'Untitled Video'}
        </CardTitle>
        <CardDescription>
          By {item.artistName || 'Unknown Artist'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-2">
          {item.tags?.slice(0, 3).map((tag: string) => (
            <Badge key={`video-${item.id}-tag-${tag.replace(/\s+/g, '-')}-${tag.length}`} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.tags?.length > 3 ? <Badge variant="outline" className="text-xs">
              +{item.tags.length - 3}
            </Badge> : null}
        </div>
        <div className="text-xs text-muted-foreground">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}
        </div>
      </CardContent>
    </Card>
  )
}
