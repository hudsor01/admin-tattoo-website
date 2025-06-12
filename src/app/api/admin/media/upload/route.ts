import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    // Skip auth in development for now
    if (process.env.NODE_ENV !== 'development') {
      // Auth check would go here
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    // Note: type parameter currently not used for validation
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedPhotoTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/webm', 'video/quicktime']
    const allAllowedTypes = [...allowedPhotoTypes, ...allowedVideoTypes]

    if (!allAllowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, WebP) and videos (MP4, MOV, WebM) are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (10MB for photos, 100MB for videos)
    const maxPhotoSize = 10 * 1024 * 1024 // 10MB
    const maxVideoSize = 100 * 1024 * 1024 // 100MB
    const isVideo = allowedVideoTypes.includes(file.type)
    const maxSize = isVideo ? maxVideoSize : maxPhotoSize

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${isVideo ? '100MB' : '10MB'}` },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'media')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${originalName}`
    const filePath = join(uploadDir, fileName)
    const publicUrl = `/uploads/media/${fileName}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate thumbnail for videos (placeholder for now)
    let thumbnailUrl = null
    if (isVideo) {
      // TODO: Generate video thumbnail using ffmpeg or similar
      thumbnailUrl = `/uploads/media/thumbnails/${timestamp}_thumbnail.jpg`
    }

    // If this is production, we'd also upload to cloud storage (Vercel Blob, S3, etc.)
    // For now, we'll use local storage

    const result = {
      success: true,
      fileName,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      mediaUrl: publicUrl,
      thumbnailUrl,
      type: isVideo ? 'video' : 'photo',
      uploadedAt: new Date().toISOString()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}