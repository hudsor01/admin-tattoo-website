import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withSecurityValidation, SecurityPresets } from '@/lib/api-validation'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-core'
import { sanitizeString, sanitizeArrayOfStrings } from '@/lib/sanitization'
import { logger } from '@/lib/logger'

const getMediaHandler = async (_request: NextRequest) => {
  try {

    // Get media items from TattooDesign table
    const mediaItems = await prisma.tattooDesign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        artist: {
          select: {
            name: true
          }
        }
      }
    })

    // Transform to include sync status and media type
    const transformedItems = mediaItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      style: item.style,
      tags: item.tags,
      mediaUrl: item.imageUrl,
      imageUrl: item.imageUrl, // For backward compatibility
      type: item.imageUrl?.includes('.mp4') || item.imageUrl?.includes('.mov') || item.imageUrl?.includes('.webm') ? 'video' : 'photo',
      artistName: item.artist.name,
      isPublic: item.isPublic,
      popularity: item.popularity,
      estimatedHours: item.estimatedHours,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      // Add sync status - SAFETY: Default to false to prevent placeholder images syncing to production
      syncedToWebsite: false,
      websiteUrl: `https://ink37tattoos.com/gallery/${item.id}`
    }))

    return NextResponse.json(createSuccessResponse(transformedItems))
  } catch (error) {
    logger.error('Media API error', error)
    return NextResponse.json(
      createErrorResponse('Failed to fetch media items'),
      { status: 500 }
    )
  }
}

const createMediaHandler = async (request: NextRequest) => {
  try {

    const body = await request.json()
    const { 
      title, 
      description, 
      style, 
      tags, 
      mediaUrl, 
      type,
      isPublic = true,
      estimatedHours = 0,
      syncToWebsite = false  // SAFETY: Default to false to require manual approval
    } = body

    // Sanitize input data
    const sanitizedTitle = sanitizeString(title)
    const sanitizedDescription = sanitizeString(description || '')
    const sanitizedStyle = sanitizeString(style || 'Traditional')
    const sanitizedTags = sanitizeArrayOfStrings(tags || [])
    const sanitizedMediaUrl = sanitizeString(mediaUrl)

    // Get Fernando's artist ID
    const fernando = await prisma.tattooArtist.findFirst({
      where: { name: 'Fernando Govea' }
    })

    if (!fernando) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      )
    }

    // Create media item in database
    const mediaItem = await prisma.tattooDesign.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        style: sanitizedStyle,
        tags: sanitizedTags,
        imageUrl: sanitizedMediaUrl,
        artistId: fernando.id,
        isPublic,
        estimatedHours: parseFloat(String(estimatedHours)),
        popularity: 0
      },
      include: {
        artist: {
          select: {
            name: true
          }
        }
      }
    })

    // If syncToWebsite is true, sync to main website
    if (syncToWebsite) {
      try {
        await syncToMainWebsite({
          ...mediaItem,
          estimatedHours: Number(mediaItem.estimatedHours)
        }, type)
      } catch (syncError) {
        logger.error('Failed to sync to main website', syncError)
        // Don't fail the request if sync fails, just log it
      }
    }

    // Transform response
    const transformedItem = {
      id: mediaItem.id,
      title: mediaItem.title,
      description: mediaItem.description,
      style: mediaItem.style,
      tags: mediaItem.tags,
      mediaUrl: mediaItem.imageUrl,
      imageUrl: mediaItem.imageUrl,
      type: type || 'photo',
      artistName: mediaItem.artist.name,
      isPublic: mediaItem.isPublic,
      popularity: mediaItem.popularity,
      estimatedHours: Number(mediaItem.estimatedHours),
      createdAt: mediaItem.createdAt,
      updatedAt: mediaItem.updatedAt,
      syncedToWebsite: syncToWebsite,
      websiteUrl: `https://ink37tattoos.com/gallery/${mediaItem.id}`
    }

    return NextResponse.json(createSuccessResponse(transformedItem), { status: 201 })
  } catch (error) {
    logger.error('Create media error', error)
    return NextResponse.json(
      createErrorResponse('Failed to create media item'),
      { status: 500 }
    )
  }
}

// Apply security validation
export const GET = withSecurityValidation({
  ...SecurityPresets.MEDIA_READ
})(getMediaHandler)

export const POST = withSecurityValidation({
  ...SecurityPresets.MEDIA_UPLOAD
})(createMediaHandler)

// Function to sync media to main website
async function syncToMainWebsite(mediaItem: {
  id: string;
  title: string;
  description: string;
  style: string;
  tags: string[];
  imageUrl: string;
  isPublic: boolean;
  estimatedHours: number;
  createdAt: Date;
  artist: { name: string };
}, type: string) {
  const mainWebsiteApiUrl = process.env.MAIN_WEBSITE_API_URL || 'https://ink37tattoos.com/api'
  const syncEndpoint = `${mainWebsiteApiUrl}/gallery/sync`

  const syncData = {
    id: mediaItem.id,
    title: mediaItem.title,
    description: mediaItem.description,
    style: mediaItem.style,
    tags: mediaItem.tags,
    mediaUrl: mediaItem.imageUrl,
    type: type,
    artistName: mediaItem.artist.name,
    isPublic: mediaItem.isPublic,
    estimatedHours: Number(mediaItem.estimatedHours),
    source: 'admin-dashboard',
    createdAt: mediaItem.createdAt
  }

  const response = await fetch(syncEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MAIN_WEBSITE_API_KEY}`,
      'X-Admin-Source': 'admin.ink37tattoos.com'
    },
    body: JSON.stringify(syncData)
  })

  if (!response.ok) {
    throw new Error(`Failed to sync to main website: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}
