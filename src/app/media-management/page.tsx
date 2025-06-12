"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Image, Search, Filter, Eye, Edit, Trash2, Video } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"

// Fetch media items from API
const fetchMediaItems = async () => {
  const response = await fetch('/api/admin/media')
  if (!response.ok) throw new Error('Failed to fetch media items')
  return response.json()
}

export default function MediaManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadType, setUploadType] = useState<'photo' | 'video'>('photo')
  const { data: mediaItems, isLoading } = useQuery({
    queryKey: ['media'],
    queryFn: fetchMediaItems,
    refetchInterval: 60000, // Refresh every minute
  })

  const filteredItems = mediaItems?.filter((item: any) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.artistName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Ink37 Tattoos
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Media Management</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Media Management</h1>
                <p className="text-muted-foreground">
                  Upload photos and videos that sync to ink37tattoos.com/gallery
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={uploadType === 'photo' ? 'default' : 'outline'}
                  onClick={() => setUploadType('photo')}
                  className={uploadType === 'photo' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  <Image className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
                <Button
                  variant={uploadType === 'video' ? 'default' : 'outline'}
                  onClick={() => setUploadType('video')}
                  className={uploadType === 'video' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Upload Video
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
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

            {/* Media Grid */}
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
                filteredItems.map((item: any) => (
                  <MediaItemCard key={item.id} item={item} />
                ))
              ) : (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="flex items-center justify-center h-48">
                      <div className="text-center">
                        <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No media items found</h3>
                        <p className="text-muted-foreground mb-4">
                          Start by uploading your first photo or video.
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button className="bg-orange-500 hover:bg-orange-600">
                            <Image className="mr-2 h-4 w-4" />
                            Upload Photo
                          </Button>
                          <Button variant="outline">
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
        </SidebarInset>
      </SidebarProvider>
  )
}

function MediaItemCard({ item }: { item: any }) {
  const isVideo = item.type === 'video' || item.mediaUrl?.includes('.mp4') || item.mediaUrl?.includes('.mov')

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative">
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          {item.mediaUrl || item.imageUrl ? (
            isVideo ? (
              <video
                src={item.mediaUrl || item.imageUrl}
                className="w-full h-full object-cover"
                controls={false}
                muted
                poster={item.thumbnail}
              />
            ) : (
              <img
                src={item.mediaUrl || item.imageUrl}
                alt={item.title || 'Tattoo'}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-2">
              {isVideo ? <Video className="h-16 w-16 text-muted-foreground" /> : <Image className="h-16 w-16 text-muted-foreground" />}
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
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {item.title || 'Untitled Tattoo'}
        </CardTitle>
        <CardDescription>
          By {item.artistName || item.artist?.firstName || 'Unknown Artist'}
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
