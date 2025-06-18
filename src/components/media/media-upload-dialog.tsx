"use client"

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Upload, Video, X } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { PutBlobResult } from '@vercel/blob'
import { useUIStore } from "@/stores/ui-store"

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

    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&type=media`,
        {
          method: 'POST',
          body: file,
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const blob = await response.json() as PutBlobResult
      setUploadedBlob(blob)
      
      // Auto-fill title with filename (without extension)
      if (!metadata.title) {
        const titleFromFile = file.name.replace(/\.[^/.]+$/, "")
        setMetadata(prev => ({ ...prev, title: titleFromFile }))
      }
      
      toast.success('File uploaded successfully!')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      toast.error(`Upload failed: ${errorMessage}`)
    } finally {
      setComponentLoading('media-upload', false)
    }
  }

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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentUploadType === 'photo' ? (
              <ImageIcon className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
            Upload {currentUploadType === 'photo' ? 'Photo' : 'Video'}
          </DialogTitle>
          <DialogDescription>
            Upload {currentUploadType === 'photo' ? 'photos' : 'videos'} that will sync to ink37tattoos.com/gallery
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Custom Drag & Drop Upload Zone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploadedBlob ? 'border-green-500 bg-green-50' : ''}
              ${isUploading ? 'opacity-50' : 'hover:border-primary hover:bg-primary/5 cursor-pointer'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {uploadedBlob ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {currentUploadType === 'photo' ? (
                    <ImageIcon className="h-8 w-8 text-green-600" />
                  ) : (
                    <Video className="h-8 w-8 text-green-600" />
                  )}
                  <span className="font-medium text-green-700">File uploaded successfully!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {uploadedBlob.pathname}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedBlob(null);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : isUploading ? (
              <div className="space-y-2">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
                <p className="text-lg font-medium">Uploading...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    Drop your {currentUploadType} here, or{' '}
                    <span className="text-primary hover:underline">browse</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentUploadType === 'photo' 
                      ? 'JPEG, PNG, WebP up to 4.5MB'
                      : 'MP4, MOV, WebM up to 4.5MB'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptedTypes}
            onChange={handleFileUpload}
          />

          {/* Metadata Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Input
                id="style"
                value={metadata.style}
                onChange={(e) => setMetadata(prev => ({ ...prev, style: e.target.value }))}
                placeholder="e.g. Traditional, Realism, Blackwork"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={metadata.description}
              onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the tattoo work..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            {metadata.tags.length > 0 ? <div className="flex flex-wrap gap-2 mt-2">
                {metadata.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div> : null}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sync"
              checked={metadata.syncToWebsite}
              onChange={(e) => setMetadata(prev => ({ ...prev, syncToWebsite: e.target.checked }))}
            />
            <Label htmlFor="sync">
              Sync to ink37tattoos.com gallery (recommended)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!uploadedBlob || !metadata.title.trim() || saveMutation.isPending}
              className="bg-brand-gradient-hover"
            >
              {saveMutation.isPending ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Save {currentUploadType === 'photo' ? 'Photo' : 'Video'}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
