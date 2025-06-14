"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ImageIcon, Search, Filter, Eye, Edit, Trash2, Video, RefreshCw, ExternalLink } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import Image from "next/image"
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

export default function MediaManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadType, setUploadType] = useState<'photo' | 'video'>('photo')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const { data: mediaItems, isLoading } = useQuery({
    queryKey: ['media'],
    queryFn: fetchMediaItems,
    refetchInterval: 60000, // Refresh every minute
  })

  // Ensure mediaItems is always an array before filtering
  const safeMediaItems: MediaItem[] = Array.isArray(mediaItems) ? mediaItems : []
  const filteredItems = safeMediaItems.filter((item: MediaItem) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.artistName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "5rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Page Header */}
                <div className="px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                          <ImageIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-black text-foreground tracking-tight">Media Management</h1>
                          <p className="text-muted-foreground">
                            Upload photos and videos that sync to ink37tattoos.com/gallery
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => {
                          setUploadType('photo')
                          setUploadDialogOpen(true)
                        }}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        <ImageIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                        Upload Photo
                      </Button>
                      <Button
                        onClick={() => {
                          setUploadType('video')
                          setUploadDialogOpen(true)
                        }}
                        variant="outline"
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Upload Video
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="px-6 lg:px-8">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search media..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </div>

                {/* Media Grid */}
                <div className="px-6 lg:px-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {isLoading ? (
                      <>
                        {[...Array(8)].map((_, i) => (
                          <Card key={i} className="overflow-hidden">
                            <Skeleton className="h-48 w-full" />
                            <CardHeader>
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-4 w-24" />
                            </CardHeader>
                          </Card>
                        ))}
                      </>
                    ) : filteredItems?.length > 0 ? (
                      filteredItems.map((item: MediaItem) => (
                        <MediaItemCard key={item.id} item={item} />
                      ))
                    ) : (
                      <div className="col-span-full">
                        <Card>
                          <CardContent className="flex items-center justify-center h-48">
                            <div className="text-center">
                              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
                              <h3 className="text-lg font-semibold">No media items found</h3>
                              <p className="text-muted-foreground mb-4">
                                Start by uploading your first photo or video.
                              </p>
                              <div className="flex gap-2 justify-center">
                                <Button 
                                  onClick={() => {
                                    setUploadType('photo')
                                    setUploadDialogOpen(true)
                                  }}
                                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                >
                                  <ImageIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                                  Upload Photo
                                </Button>
                                <Button 
                                  onClick={() => {
                                    setUploadType('video')
                                    setUploadDialogOpen(true)
                                  }}
                                  variant="outline"
                                >
                                  <Video className="mr-2 h-4 w-4" />
                                  Upload Video
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
        
        <MediaUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          uploadType={uploadType}
        />
      </SidebarProvider>
  )
}

function MediaItemCard({ item }: { item: MediaItem }) {
  const queryClient = useQueryClient()
  const isVideo = item.type === 'video' || item.mediaUrl?.includes('.mp4') || item.mediaUrl?.includes('.mov')

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
        ? 'Media synced to website successfully!' 
        : 'Media removed from website successfully!'
      )
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`)
    }
  })

  const handleSync = () => {
    const action = item.syncedToWebsite ? 'unsync' : 'sync'
    syncMutation.mutate(action)
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
            isVideo ? (
              <video
                src={item.mediaUrl || item.imageUrl}
                className="w-full h-full object-cover"
                controls={false}
                muted
                poster={item.imageUrl}
              />
            ) : (
              <Image
                src={item.mediaUrl || item.imageUrl}
                alt={item.title || 'Tattoo'}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                onError={(e) => {
                  // Hide image on error and show placeholder
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-2">
              {isVideo ? <Video className="h-16 w-16 text-muted-foreground" aria-hidden="true" /> : <ImageIcon className="h-16 w-16 text-muted-foreground" aria-hidden="true" />}
            </div>
          )}
        </div>
        {isVideo && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="text-xs bg-black/50 text-white">
              <Video className="h-3 w-3 mr-1" />
              Video
            </Badge>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant={item.syncedToWebsite ? 'default' : 'destructive'} className="text-xs">
            {item.syncedToWebsite ? '✓ Synced' : '⚠ Not Synced'}
          </Badge>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            {item.websiteUrl && (
              <Button 
                size="sm" 
                variant="secondary" 
                className="h-8 w-8 p-0"
                onClick={() => window.open(item.websiteUrl, '_blank')}
                title="View on website"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
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
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {item.title || 'Untitled Tattoo'}
        </CardTitle>
        <CardDescription>
          By {item.artistName || 'Unknown Artist'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-2">
          {item.tags?.slice(0, 3).map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.tags?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{item.tags.length - 3}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}
        </div>
      </CardContent>
    </Card>
  )
}
