"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Video, Upload, X } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface MediaUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uploadType: 'photo' | 'video'
}

interface MediaMetadata {
  title: string
  description: string
  tags: string[]
  artistName: string
  style: string
  estimatedHours: number
  syncToWebsite: boolean
}

export function MediaUploadDialog({ open, onOpenChange, uploadType }: MediaUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [metadata, setMetadata] = useState<MediaMetadata>({
    title: '',
    description: '',
    tags: [],
    artistName: '',
    style: '',
    estimatedHours: 0,
    syncToWebsite: true
  })
  const [tagInput, setTagInput] = useState('')

  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: MediaMetadata }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('metadata', JSON.stringify(metadata))

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Upload failed')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success(`${uploadType === 'photo' ? 'Photo' : 'Video'} uploaded successfully!`)
      queryClient.invalidateQueries({ queryKey: ['media'] })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`)
    }
  })

  const resetForm = () => {
    setFile(null)
    setMetadata({
      title: '',
      description: '',
      tags: [],
      artistName: '',
      style: '',
      estimatedHours: 0,
      syncToWebsite: true
    })
    setTagInput('')
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
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    const isPhoto = selectedFile.type.startsWith('image/')
    const isVideo = selectedFile.type.startsWith('video/')
    
    if (uploadType === 'photo' && !isPhoto) {
      toast.error('Please select an image file')
      return
    }
    
    if (uploadType === 'video' && !isVideo) {
      toast.error('Please select a video file')
      return
    }
    
    setFile(selectedFile)
    
    // Auto-fill title with filename (without extension)
    if (!metadata.title) {
      const titleFromFile = selectedFile.name.replace(/\.[^/.]+$/, "")
      setMetadata(prev => ({ ...prev, title: titleFromFile }))
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a file')
      return
    }
    if (!metadata.title.trim()) {
      toast.error('Please enter a title')
      return
    }
    
    uploadMutation.mutate({ file, metadata })
  }

  const acceptedTypes = uploadType === 'photo' 
    ? 'image/jpeg,image/jpg,image/png,image/webp'
    : 'video/mp4,video/mov,video/webm,video/quicktime'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {uploadType === 'photo' ? (
              <ImageIcon className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
            Upload {uploadType === 'photo' ? 'Photo' : 'Video'}
          </DialogTitle>
          <DialogDescription>
            Upload {uploadType === 'photo' ? 'photos' : 'videos'} that will sync to ink37tattoos.com/gallery
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${file ? 'border-green-500 bg-green-50' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {uploadType === 'photo' ? (
                    <ImageIcon className="h-8 w-8 text-green-600" />
                  ) : (
                    <Video className="h-8 w-8 text-green-600" />
                  )}
                  <span className="font-medium text-green-700">{file.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    Drop your {uploadType} here, or{' '}
                    <label className="text-primary cursor-pointer hover:underline">
                      browse
                      <input
                        type="file"
                        className="hidden"
                        accept={acceptedTypes}
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      />
                    </label>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {uploadType === 'photo' 
                      ? 'JPEG, PNG, WebP up to 10MB'
                      : 'MP4, MOV, WebM up to 100MB'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

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
              <Label htmlFor="artist">Artist Name</Label>
              <Input
                id="artist"
                value={metadata.artistName}
                onChange={(e) => setMetadata(prev => ({ ...prev, artistName: e.target.value }))}
                placeholder="Artist name"
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

            <div className="space-y-2">
              <Label htmlFor="hours">Estimated Hours</Label>
              <Input
                id="hours"
                type="number"
                value={metadata.estimatedHours}
                onChange={(e) => setMetadata(prev => ({ ...prev, estimatedHours: Number(e.target.value) }))}
                placeholder="0"
                min="0"
                step="0.5"
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
            {metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {metadata.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
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
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || !metadata.title.trim() || uploadMutation.isPending}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {uploadMutation.isPending ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {uploadType === 'photo' ? 'Photo' : 'Video'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}