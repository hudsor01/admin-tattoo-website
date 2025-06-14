import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { withSecurityValidation, SecurityPresets, validateFileUpload, validateFileContent } from '@/lib/api-validation'
import { sanitizeFilename } from '@/lib/sanitization'
import { createErrorResponse, createSuccessResponse } from '@/lib/error-handling'

const uploadHandler = async (request: NextRequest) => {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return NextResponse.json(createErrorResponse('No file uploaded'), { status: 400 })
  }

  // Enhanced file validation with custom options
  const fileValidation = validateFileUpload(file, {
    maxSize: 100 * 1024 * 1024, // 100MB for media
    maxFilenameLength: 200,
    allowedTypes: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'video/mp4', 'video/mov', 'video/webm', 'video/quicktime'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.webm']
  });
  
  if (!fileValidation.isValid) {
    return NextResponse.json(createErrorResponse(fileValidation.error!), { status: 400 })
  }

  // Validate file content (magic numbers)
  const contentValidation = await validateFileContent(file);
  if (!contentValidation.isValid) {
    return NextResponse.json(createErrorResponse(contentValidation.error!), { status: 400 })
  }

  // Additional file type and size validation
  const allowedPhotoTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/webm', 'video/quicktime']
  const allAllowedTypes = [...allowedPhotoTypes, ...allowedVideoTypes]

  if (!allAllowedTypes.includes(file.type)) {
    return NextResponse.json(
      createErrorResponse('Invalid file type. Only images (JPEG, PNG, WebP) and videos (MP4, MOV, WebM) are allowed'),
      { status: 400 }
    )
  }

  // Enhanced size validation
  const maxPhotoSize = 10 * 1024 * 1024 // 10MB
  const maxVideoSize = 100 * 1024 * 1024 // 100MB
  const isVideo = allowedVideoTypes.includes(file.type)
  const maxSize = isVideo ? maxVideoSize : maxPhotoSize

  if (file.size > maxSize) {
    return NextResponse.json(
      createErrorResponse(`File too large. Maximum size is ${isVideo ? '100MB' : '10MB'}`),
      { status: 400 }
    )
  }

  // Generate secure filename
  const timestamp = Date.now()
  const sanitizedName = sanitizeFilename(file.name)
  const fileName = `${timestamp}_${sanitizedName}`

  try {
    // Upload to Vercel Blob storage
    const blob = await put(fileName, file, {
      access: 'public',
      handleUploadUrl: '/api/admin/media/upload'
    })

    // Generate thumbnail for videos (placeholder for now)
    let thumbnailUrl = null
    if (isVideo) {
      // Video thumbnail generation not implemented yet
      thumbnailUrl = null
    }

    const result = {
      fileName,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      mediaUrl: blob.url,
      thumbnailUrl,
      type: isVideo ? 'video' : 'photo',
      uploadedAt: new Date().toISOString()
    }

    return NextResponse.json(createSuccessResponse(result, 'File uploaded successfully'))
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(createErrorResponse('Failed to upload file'), { status: 500 })
  }
}

// Apply security validation with new media upload preset
export const POST = withSecurityValidation({
  ...SecurityPresets.MEDIA_UPLOAD,
  maxBodySize: 100 * 1024 * 1024 // 100MB for media files
})(uploadHandler);