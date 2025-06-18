"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2, FileImage, FileVideo, ImageIcon, Loader2, Upload, Video, X } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PutBlobResult } from '@vercel/blob'
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

interface MediaUploadDialogProps {
  // Legacy props for backward compatibility - now optional
  open?: boolean
  onOpenChange?: (open: boolean) => void
  uploadType?: 'photo' | 'video'
}

interface MediaMetadata {
  title: string
  description: string
  tags: string[]
  style: string
  syncToWebsite: boolean
}

export function MediaUploadDialog({ 
  open: legacyOpen, 
  onOpenChange: legacyOnOpenChange, 
  uploadType: legacyUploadType 
}: MediaUploadDialogProps = {}) {
  // Use UI store for modal state - Fixed uploadType variable references
  const { modals, closeModal, setComponentLoading, loading } = useUIStore();
  
  // Get loading state from store
  const isUploading = loading.component['media-upload'] || false;
  
  // Use store state or fallback to legacy props
  const isOpen = modals.mediaUpload.open || legacyOpen || false;
  const currentUploadType = modals.mediaUpload.type || legacyUploadType || 'photo';
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Opening is handled by parent components via store
    } else {
      closeModal('mediaUpload');
    }
    // Also call legacy handler for backward compatibility
    legacyOnOpenChange?.(open);
  };

  const [uploadedBlob, setUploadedBlob] = useState<PutBlobResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [metadata, setMetadata] = useState<MediaMetadata>({
    title: '',
    description: '',
    tags: [],
    style: '',
    syncToWebsite: true
  })
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: async ({ blob, metadata }: { blob: PutBlobResult; metadata: MediaMetadata }) => {
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: metadata.title,
          description: metadata.description,
          style: metadata.style,
          tags: metadata.tags,
          mediaUrl: blob.url,
          type: currentUploadType,
          isPublic: true,
          estimatedHours: 0,
          syncToWebsite: metadata.syncToWebsite
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Save failed')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success(`${currentUploadType === 'photo' ? 'Photo' : 'Video'} saved successfully!`)
      queryClient.invalidateQueries({ queryKey: ['media'] })
      handleOpenChange(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(`Save failed: ${error.message}`)
    }
  })

  const resetForm = () => {
    setUploadedBlob(null)
    setDragActive(false)
    setUploadProgress(0)
    setComponentLoading('media-upload', false)
    setMetadata({
      title: '',
      description: '',
      tags: [],
      style: '',
      syncToWebsite: true
    })
    setTagInput('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = () => {
    if (!uploadedBlob) {
      toast.error('Please upload a file first')
      return
    }
    saveMutation.mutate({ blob: uploadedBlob, metadata })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const {files} = e.dataTransfer
    if (files && files[0]) {
      uploadFile(files[0])
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const uploadFile = async (file: File) => {
    // Validate file type
    const isPhoto = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    if (currentUploadType === 'photo' && !isPhoto) {
      toast.error('Please select an image file')
      return
    }
    
    if (currentUploadType === 'video' && !isVideo) {
      toast.error('Please select a video file')
      return
    }

    // Validate file size (4.5MB limit for server uploads)
    const maxSize = 4.5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 4.5MB.')
      return
    }

    setComponentLoading('media-upload', true)
    setUploadProgress(0)

    // Use AbortController for better cleanup
    const controller = new AbortController()
    
    try {
      // Start the actual upload
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&type=media`,
        {
          method: 'POST',
          body: file,
          signal: controller.signal,
        }
      )

      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const blob = await response.json() as PutBlobResult
      setUploadedBlob(blob)
      
      // Auto-fill title with filename (without extension)
      if (!metadata.title) {
        const titleFromFile = file.name.replace(/\.[^/.]+$/, '')
        setMetadata(prev => ({ ...prev, title: titleFromFile }))
      }
      
      toast.success('File uploaded successfully!')

    } catch (error) {
      if (controller.signal.aborted) {
        toast.error('Upload cancelled')
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        toast.error(`Upload failed: ${errorMessage}`)
      }
      setUploadProgress(0)
    } finally {
      setComponentLoading('media-upload', false)
    }
  }

  // Use useEffect for upload progress simulation with AbortController
  useEffect(() => {
    if (!isUploading) return undefined

    const controller = new AbortController()
    let rafId: number

    const simulateProgress = () => {
      if (controller.signal.aborted) return

      setUploadProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })

      // Continue animation if not aborted
      if (!controller.signal.aborted) {
        rafId = requestAnimationFrame(() => {
          setTimeout(simulateProgress, 200)
        })
      }
    }

    // Start the simulation
    rafId = requestAnimationFrame(() => {
      setTimeout(simulateProgress, 200)
    })

    return () => {
      controller.abort()
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [isUploading])

  const addTag = () => {
    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const acceptedTypes = currentUploadType === 'photo' 
    ? 'image/jpeg,image/jpg,image/png,image/webp'
    : 'video/mp4,video/mov,video/webm,video/quicktime'

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-2xl max-h-[90vh] overflow-hidden p-0",
        "bg-white dark:bg-card text-gray-900 dark:text-card-foreground",
        "shadow-2xl border border-gray-200 dark:border-border"
      )}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-border/50">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className={cn(
              "p-2 rounded-md",
              "bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-sm"
            )}>
              {currentUploadType === 'photo' ? (
                <ImageIcon className="h-4 w-4" />
              ) : (
                <Video className="h-4 w-4" />
              )}
            </div>
            Add {currentUploadType === 'photo' ? 'Photo' : 'Video'} to Gallery
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Upload high-quality {currentUploadType === 'photo' ? 'photos' : 'videos'} to showcase on ink37tattoos.com
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Upload Zone */}
            <div className={cn(
              "border-2 border-dashed rounded-lg transition-all duration-200",
              dragActive && "border-primary bg-primary/5",
              uploadedBlob && "border-green-500 bg-green-50 dark:bg-green-950/20",
              !uploadedBlob && !dragActive && "border-gray-300 dark:border-gray-600 hover:border-primary",
              isUploading && "border-orange-400 bg-orange-50 dark:bg-orange-950/20"
            )}>
              <div 
                className={cn(
                  "p-8 text-center cursor-pointer transition-colors",
                  !isUploading && "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                )}
                role="button"
                tabIndex={0}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
              >
                {uploadedBlob ? (
                  <div className="space-y-3">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">
                        File uploaded successfully
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {uploadedBlob.pathname}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedBlob(null);
                        setUploadProgress(0);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : isUploading ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                    <div>
                      <p className="font-medium">Uploading...</p>
                      <div className="mt-3 max-w-xs mx-auto">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center mt-1">
                          {uploadProgress.toFixed(0)}% complete
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentUploadType === 'photo' ? (
                      <FileImage className="h-12 w-12 text-muted-foreground mx-auto" />
                    ) : (
                      <FileVideo className="h-12 w-12 text-muted-foreground mx-auto" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        Drop your {currentUploadType} here, or{' '}
                        <span className="text-primary underline cursor-pointer">browse files</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {currentUploadType === 'photo' 
                          ? 'JPEG, PNG, WebP • Max 4.5MB'
                          : 'MP4, MOV, WebM • Max 4.5MB'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={acceptedTypes}
              onChange={handleFileUpload}
            />

            {/* Form Section */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base mb-1">Media Details</h3>
                <p className="text-sm text-muted-foreground">
                  Add information to help showcase your work
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={metadata.title}
                    onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={currentUploadType === 'photo' ? "Dragon sleeve tattoo" : "Tattoo process video"}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style" className="text-sm font-medium">
                    Style
                  </Label>
                  <Select value={metadata.style} onValueChange={(value) => setMetadata(prev => ({ ...prev, style: value }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      <SelectItem value="traditional" className="hover:bg-gray-50 cursor-pointer">Traditional</SelectItem>
                      <SelectItem value="realism" className="hover:bg-gray-50 cursor-pointer">Realism</SelectItem>
                      <SelectItem value="blackwork" className="hover:bg-gray-50 cursor-pointer">Blackwork</SelectItem>
                      <SelectItem value="watercolor" className="hover:bg-gray-50 cursor-pointer">Watercolor</SelectItem>
                      <SelectItem value="neo-traditional" className="hover:bg-gray-50 cursor-pointer">Neo-Traditional</SelectItem>
                      <SelectItem value="japanese" className="hover:bg-gray-50 cursor-pointer">Japanese</SelectItem>
                      <SelectItem value="tribal" className="hover:bg-gray-50 cursor-pointer">Tribal</SelectItem>
                      <SelectItem value="geometric" className="hover:bg-gray-50 cursor-pointer">Geometric</SelectItem>
                      <SelectItem value="dotwork" className="hover:bg-gray-50 cursor-pointer">Dotwork</SelectItem>
                      <SelectItem value="minimalist" className="hover:bg-gray-50 cursor-pointer">Minimalist</SelectItem>
                      <SelectItem value="portrait" className="hover:bg-gray-50 cursor-pointer">Portrait</SelectItem>
                      <SelectItem value="biomechanical" className="hover:bg-gray-50 cursor-pointer">Biomechanical</SelectItem>
                      <SelectItem value="other" className="hover:bg-gray-50 cursor-pointer">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={metadata.description}
                    onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-sm font-medium">
                    Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tags..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                      className="h-9 flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={addTag} 
                      variant="outline"
                      size="sm"
                      className="h-9 px-3"
                    >
                      Add
                    </Button>
                  </div>
                  {metadata.tags.length > 0 ? <div className="flex flex-wrap gap-1 mt-2">
                      {metadata.tags.map((tag) => (
                        <Badge 
                          key={`upload-tag-${tag.replace(/\s+/g, '-')}-${tag.length}`} 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {tag}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div> : null}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <Checkbox
                  id="sync"
                  checked={metadata.syncToWebsite}
                  onCheckedChange={(checked) => setMetadata(prev => ({ ...prev, syncToWebsite: !!checked }))}
                />
                <Label htmlFor="sync" className="text-sm font-medium cursor-pointer flex-1">
                  Publish to ink37tattoos.com gallery
                  <span className="text-xs text-muted-foreground block font-normal">
                    Make this {currentUploadType} visible on the public website
                  </span>
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-border/50 bg-gray-50/50 dark:bg-gray-800/20">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={saveMutation.isPending}
            className="px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!uploadedBlob || !metadata.title.trim() || saveMutation.isPending}
            className="px-6"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Save {currentUploadType === 'photo' ? 'Photo' : 'Video'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
