import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  try {
    // Skip auth in development for now
    if (process.env.NODE_ENV !== 'development') {
      // Auth check would go here
    }

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

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error('Media API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip auth in development for now
    if (process.env.NODE_ENV !== 'development') {
      // Auth check would go here
    }

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
        title,
        description: description || '',
        style: style || 'Traditional',
        tags: tags || [],
        imageUrl: mediaUrl,
        artistId: fernando.id,
        isPublic,
        estimatedHours: Number(estimatedHours),
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
        await syncToMainWebsite(mediaItem, type)
      } catch (syncError) {
        console.error('Failed to sync to main website:', syncError)
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
      estimatedHours: mediaItem.estimatedHours,
      createdAt: mediaItem.createdAt,
      updatedAt: mediaItem.updatedAt,
      syncedToWebsite: syncToWebsite,
      websiteUrl: `https://ink37tattoos.com/gallery/${mediaItem.id}`
    }

    return NextResponse.json(transformedItem, { status: 201 })
  } catch (error) {
    console.error('Create media error:', error)
    return NextResponse.json(
      { error: 'Failed to create media item' },
      { status: 500 }
    )
  }
}

// Function to sync media to main website
async function syncToMainWebsite(mediaItem: any, type: string) {
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
    estimatedHours: mediaItem.estimatedHours,
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