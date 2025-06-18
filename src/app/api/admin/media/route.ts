import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client' // Import Prisma from @prisma/client
import { SecurityPresets, withSecurityValidation } from '@/lib/api-validation'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-core'
import { sanitizeArrayOfStrings, sanitizeString } from '@/lib/sanitization'
import { logger } from '@/lib/logger'

// TODO: Move these interfaces to a centralized types file (e.g., src/types/media.ts)
interface MediaItemAdminDTO {
  id: string;
  title: string;
  description: string | null;
  style: string | null;
  tags: string[];
  mediaUrl: string;
  imageUrl: string;
  type: 'photo' | 'video';
  artistName: string;
  isPublic: boolean;
  popularity: number;
  estimatedHours: number | null; // Prisma Decimal is nullable
  createdAt: Date;
  updatedAt: Date;
  syncedToWebsite: boolean;
  websiteUrl: string;
}

interface SyncMediaItemPayload {
  id: string;
  title: string;
  description: string | null; // Prisma String?
  style: string | null; // Prisma String?
  tags: string[];
  imageUrl: string;
  isPublic: boolean;
  estimatedHours: number | null; // Prisma Decimal? converted to number
  createdAt: Date;
  tattoo_artists: { name: string };
}
// End TODO

const getMediaHandler = async (_request: NextRequest): Promise<NextResponse> => {
  try {

    // Get media items from TattooDesign table
    const mediaItems = await prisma.tattoo_designs.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tattoo_artists: {
          select: {
            name: true
          }
        }
      }
    })

    // Transform to include sync status and media type
    const transformedItems: MediaItemAdminDTO[] = mediaItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      style: item.style,
      tags: item.tags,
      mediaUrl: item.imageUrl,
      imageUrl: item.imageUrl, // For backward compatibility
      type: item.imageUrl?.includes('.mp4') || item.imageUrl?.includes('.mov') || item.imageUrl?.includes('.webm') ? 'video' : 'photo',
      artistName: item.tattoo_artists.name,
      isPublic: item.isPublic,
      popularity: item.popularity,
      estimatedHours: item.estimatedHours ? Number(item.estimatedHours) : null, // Convert Decimal to number
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      // Add sync status - SAFETY: Default to false to prevent placeholder images syncing to production
      syncedToWebsite: false, // This field might need to come from the DB if persistence is needed
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

const createMediaHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {

    const body = await request.json()
    
    // Explicitly define types for destructured properties from body to avoid 'any'
    const { 
      title, 
      description, 
      style, 
      tags, 
      mediaUrl, 
      type,
      isPublic: rawIsPublic, // Keep original name if needed, or just use isPublic
      estimatedHours: rawEstimatedHours,
      syncToWebsite = false
    }: {
      title: string;
      description?: string;
      style?: string;
      tags?: string[];
      mediaUrl: string;
      type?: 'photo' | 'video';
      isPublic?: boolean;
      estimatedHours?: number | string;
      syncToWebsite?: boolean;
    } = body;

    const isPublic = typeof rawIsPublic === 'boolean' ? rawIsPublic : true;
    const estimatedHours = typeof rawEstimatedHours === 'number' ? rawEstimatedHours : (typeof rawEstimatedHours === 'string' ? parseFloat(rawEstimatedHours) : 0);


    // Sanitize input data
    const sanitizedTitle = sanitizeString(title)
    const sanitizedDescription = sanitizeString(description || '')
    const sanitizedStyle = sanitizeString(style || 'Traditional')
    const sanitizedTags = sanitizeArrayOfStrings(tags || [])
    const sanitizedMediaUrl = sanitizeString(mediaUrl)

    // Get Fernando's artist ID
    const fernando = await prisma.tattoo_artists.findFirst({
      where: { name: 'Fernando Govea' }
    })

    if (!fernando) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      )
    }
    
    // Define the type for mediaItem with included relations - removing as create() might not return relations directly
    // type TattooDesignWithArtist = Prisma.tattoo_designsGetPayload<{ 
    //   include: {
    //     tattoo_artists: {
    //       select: {
    //         name: true
    //       }
    //     }
    //   }
    // }>;

    // Create media item in database
    // Let mediaItem type be inferred from prisma.tattoo_designs.create()
    // Prisma's create() typically returns the base model type.
    const mediaItem = await prisma.tattoo_designs.create({ 
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        style: sanitizedStyle,
        tags: sanitizedTags,
        imageUrl: sanitizedMediaUrl,
        artistId: fernando.id, // We know the artist is Fernando
        isPublic,
        estimatedHours, // Already a number from earlier processing
        popularity: 0,
        // Adding placeholder id and updatedAt to satisfy Prisma.tattoo_designsUncheckedCreateInput
        // These should be overridden by the database if schema defaults are set (e.g., @default(uuid()), @updatedAt)
        id: crypto.randomUUID(), // Or a placeholder string if crypto is not available/appropriate
        updatedAt: new Date()
      } satisfies Prisma.tattoo_designsUncheckedCreateInput
      // Removed include from create, as we'll use fernando.name for artist info
    })

    // If syncToWebsite is true, sync to main website
    if (syncToWebsite) {
      try {
        // Ensure the object passed to syncToMainWebsite matches SyncMediaItemPayload
        const payloadForSync: SyncMediaItemPayload = {
          id: mediaItem.id,
          title: mediaItem.title,
          description: mediaItem.description,
          style: mediaItem.style,
          tags: mediaItem.tags,
          imageUrl: mediaItem.imageUrl,
          isPublic: mediaItem.isPublic,
          estimatedHours: mediaItem.estimatedHours ? Number(mediaItem.estimatedHours) : null,
          createdAt: mediaItem.createdAt,
          tattoo_artists: { name: fernando.name } // Use Fernando's name directly
        };
        await syncToMainWebsite(payloadForSync, type || 'photo') // Provide default for type
      } catch (syncError) {
        logger.error('Failed to sync to main website', syncError)
        // Don't fail the request if sync fails, just log it
      }
    }

    // Transform response
    const transformedItem: MediaItemAdminDTO = {
      id: mediaItem.id,
      title: mediaItem.title,
      description: mediaItem.description,
      style: mediaItem.style,
      tags: mediaItem.tags,
      mediaUrl: mediaItem.imageUrl,
      imageUrl: mediaItem.imageUrl,
      type: type || (mediaItem.imageUrl?.includes('.mp4') || mediaItem.imageUrl?.includes('.mov') || mediaItem.imageUrl?.includes('.webm') ? 'video' : 'photo'),
      artistName: fernando.name, // Using fernando.name as mediaItem won't have tattoo_artists
      isPublic: mediaItem.isPublic,
      popularity: mediaItem.popularity,
      estimatedHours: mediaItem.estimatedHours ? Number(mediaItem.estimatedHours) : null, // Convert Decimal to number
      createdAt: mediaItem.createdAt,
      updatedAt: mediaItem.updatedAt,
      syncedToWebsite: syncToWebsite, // This assumes syncToWebsite reflects the actual sync status post-operation
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

const deleteMediaHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        createErrorResponse('Media item ID is required'),
        { status: 400 }
      )
    }

    // Delete the media item from database
    await prisma.tattoo_designs.delete({
      where: { id }
    })

    return NextResponse.json(createSuccessResponse({ message: 'Media item deleted successfully' }))
  } catch (error) {
    logger.error('Delete media error', error)
    return NextResponse.json(
      createErrorResponse('Failed to delete media item'),
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

export const DELETE = withSecurityValidation({
  ...SecurityPresets.MEDIA_DELETE
})(deleteMediaHandler)

// Function to sync media to main website
async function syncToMainWebsite(mediaItem: SyncMediaItemPayload, type: string): Promise<{ success: boolean; data?: unknown }> {
  const mainWebsiteApiUrl = process.env.MAIN_WEBSITE_API_URL || 'https://ink37tattoos.com/api'
  const syncEndpoint = `${mainWebsiteApiUrl}/gallery/sync`

  const syncData = {
    id: mediaItem.id,
    title: mediaItem.title,
    description: mediaItem.description,
    style: mediaItem.style,
    tags: mediaItem.tags,
    mediaUrl: mediaItem.imageUrl,
    type,
    artistName: mediaItem.tattoo_artists.name,
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

  return response.json()
}
