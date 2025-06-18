import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/media/route'
import { POST as syncPOST } from '@/app/api/admin/media/sync/route'
import { prisma } from '@/lib/prisma'
import { toast as _toast } from 'sonner'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tattoo_designs: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    tattoo_artists: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockFernando = {
  id: 'artist-1',
  name: 'Fernando Govea',
  bio: 'Master tattoo artist',
  specialties: ['Traditional', 'Realism'],
  portfolioUrl: 'https://example.com/fernando',
  experienceYears: 10,
  contactEmail: 'fernando@ink37tattoos.com',
  isActive: true,
  socialMedia: {},
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockMediaItems = [
  {
    id: '1',
    title: 'Traditional Dragon',
    description: 'A traditional dragon tattoo',
    style: 'Traditional',
    tags: ['dragon', 'traditional', 'color'],
    imageUrl: 'https://example.com/dragon.jpg',
    artistId: 'artist-1',
    isPublic: true,
    popularity: 10,
    estimatedHours: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tattoo_artists: {
      name: 'Fernando Govea',
    },
  },
  {
    id: '2',
    title: 'Blackwork Sleeve',
    description: 'Full sleeve blackwork',
    style: 'Blackwork',
    tags: ['blackwork', 'sleeve'],
    imageUrl: 'https://example.com/sleeve.mp4',
    artistId: 'artist-1',
    isPublic: true,
    popularity: 8,
    estimatedHours: 12,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    tattoo_artists: {
      name: 'Fernando Govea',
    },
  },
]

// Mock fetch for external API calls
global.fetch = vi.fn()

describe('Media API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/admin/media', () => {
    it('returns all media items with transformed data', async () => {
      ;(prisma.tattoo_designs.findMany as any).mockResolvedValue(mockMediaItems)
      
      const request = new NextRequest('http://localhost:3001/api/admin/media')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      
      const firstItem = data.data[0]
      expect(firstItem).toMatchObject({
        id: '1',
        title: 'Traditional Dragon',
        description: 'A traditional dragon tattoo',
        style: 'Traditional',
        tags: ['dragon', 'traditional', 'color'],
        mediaUrl: 'https://example.com/dragon.jpg',
        imageUrl: 'https://example.com/dragon.jpg',
        type: 'photo',
        artistName: 'Fernando Govea',
        isPublic: true,
        popularity: 10,
        estimatedHours: 5,
        syncedToWebsite: false,
        websiteUrl: 'https://ink37tattoos.com/gallery/1',
      })
    })

    it('correctly identifies video files', async () => {
      ;(prisma.tattoo_designs.findMany as any).mockResolvedValue(mockMediaItems)
      
      const request = new NextRequest('http://localhost:3001/api/admin/media')
      const response = await GET(request)
      const data = await response.json()
      
      const videoItem = data.data[1]
      expect(videoItem.type).toBe('video')
    })

    it('returns empty array when no media items exist', async () => {
      ;(prisma.tattoo_designs.findMany as any).mockResolvedValue([])
      
      const request = new NextRequest('http://localhost:3001/api/admin/media')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('handles database errors gracefully', async () => {
      ;(prisma.tattoo_designs.findMany as any).mockRejectedValue(new Error('Database connection failed'))
      
      const request = new NextRequest('http://localhost:3001/api/admin/media')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch media items')
    })
  })

  describe('POST /api/admin/media', () => {
    it('creates a new media item successfully', async () => {
      ;(prisma.tattoo_artists.findFirst as any).mockResolvedValue(mockFernando)
      ;(prisma.tattoo_designs.create as any).mockResolvedValue({
        id: 'new-1',
        title: 'New Tattoo',
        description: 'A new tattoo design',
        style: 'Traditional',
        tags: ['new', 'traditional'],
        imageUrl: 'https://example.com/new.jpg',
        artistId: 'artist-1',
        isPublic: true,
        popularity: 0,
        estimatedHours: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      const body = {
        title: 'New Tattoo',
        description: 'A new tattoo design',
        style: 'Traditional',
        tags: ['new', 'traditional'],
        mediaUrl: 'https://example.com/new.jpg',
        type: 'photo',
        isPublic: true,
        estimatedHours: 3,
        syncToWebsite: false,
      }
      
      const request = new NextRequest('http://localhost:3001/api/admin/media', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: 'new-1',
        title: 'New Tattoo',
        artistName: 'Fernando Govea',
        syncedToWebsite: false,
        type: 'photo',
      })
      
      expect(prisma.tattoo_designs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Tattoo',
          description: 'A new tattoo design',
          style: 'Traditional',
          tags: ['new', 'traditional'],
          imageUrl: 'https://example.com/new.jpg',
          artistId: 'artist-1',
          isPublic: true,
          estimatedHours: 3,
        }),
      })
    })

    it('syncs to main website when syncToWebsite is true', async () => {
      ;(prisma.tattoo_artists.findFirst as any).mockResolvedValue(mockFernando)
      ;(prisma.tattoo_designs.create as any).mockResolvedValue({
        id: 'new-1',
        title: 'New Tattoo',
        description: 'A new tattoo design',
        style: 'Traditional',
        tags: ['new', 'traditional'],
        imageUrl: 'https://example.com/new.jpg',
        artistId: 'artist-1',
        isPublic: true,
        popularity: 0,
        estimatedHours: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      
      const body = {
        title: 'New Tattoo',
        description: 'A new tattoo design',
        style: 'Traditional',
        tags: ['new', 'traditional'],
        mediaUrl: 'https://example.com/new.jpg',
        type: 'photo',
        syncToWebsite: true,
      }
      
      const request = new NextRequest('http://localhost:3001/api/admin/media', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      
      // Verify sync API was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/gallery/sync'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Admin-Source': 'admin.ink37tattoos.com',
          }),
          body: expect.stringContaining('"source":"admin-dashboard"'),
        })
      )
    })

    it('continues successfully even if sync to website fails', async () => {
      ;(prisma.tattoo_artists.findFirst as any).mockResolvedValue(mockFernando)
      ;(prisma.tattoo_designs.create as any).mockResolvedValue({
        id: 'new-1',
        title: 'New Tattoo',
        description: 'A new tattoo design',
        style: 'Traditional',
        tags: ['new', 'traditional'],
        imageUrl: 'https://example.com/new.jpg',
        artistId: 'artist-1',
        isPublic: true,
        popularity: 0,
        estimatedHours: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))
      
      const body = {
        title: 'New Tattoo',
        description: 'A new tattoo design',
        style: 'Traditional',
        tags: ['new', 'traditional'],
        mediaUrl: 'https://example.com/new.jpg',
        type: 'photo',
        syncToWebsite: true,
      }
      
      const request = new NextRequest('http://localhost:3001/api/admin/media', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      // Should still succeed
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.syncedToWebsite).toBe(true) // Still marked as synced since we attempted
    })

    it('returns 404 when artist not found', async () => {
      ;(prisma.tattoo_artists.findFirst as any).mockResolvedValue(null)
      
      const body = {
        title: 'New Tattoo',
        mediaUrl: 'https://example.com/new.jpg',
      }
      
      const request = new NextRequest('http://localhost:3001/api/admin/media', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Artist not found')
    })

    it('handles database creation errors', async () => {
      ;(prisma.tattoo_artists.findFirst as any).mockResolvedValue(mockFernando)
      ;(prisma.tattoo_designs.create as any).mockRejectedValue(new Error('Unique constraint violation'))
      
      const body = {
        title: 'New Tattoo',
        mediaUrl: 'https://example.com/new.jpg',
      }
      
      const request = new NextRequest('http://localhost:3001/api/admin/media', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create media item')
    })

    it('sanitizes input data', async () => {
      ;(prisma.tattoo_artists.findFirst as any).mockResolvedValue(mockFernando)
      ;(prisma.tattoo_designs.create as any).mockResolvedValue({
        id: 'new-1',
        title: 'Script Alert Test',
        description: 'Clean description',
        style: 'Traditional',
        tags: ['clean'],
        imageUrl: 'https://example.com/clean.jpg',
        artistId: 'artist-1',
        isPublic: true,
        popularity: 0,
        estimatedHours: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      const body = {
        title: '<script>alert("XSS")</script>',
        description: '<img src=x onerror=alert("XSS")>',
        style: 'Traditional',
        tags: ['<script>alert("XSS")</script>'],
        mediaUrl: 'https://example.com/clean.jpg',
      }
      
      const request = new NextRequest('http://localhost:3001/api/admin/media', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      
      const response = await POST(request)
      const _data = await response.json()
      
      expect(response.status).toBe(201)
      
      // Verify sanitization was applied
      expect(prisma.tattoo_designs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: expect.not.stringContaining('<script>'),
          description: expect.not.stringContaining('onerror'),
          tags: expect.not.arrayContaining(['<script>alert("XSS")</script>']),
        }),
      })
    })
  })

  describe('POST /api/admin/media/sync', () => {
    it('handles sync action successfully', async () => {
      const body = {
        mediaId: '1',
        action: 'sync',
      }
      
      const request = new NextRequest('http://localhost:3001/api/admin/media/sync', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      
      const response = await syncPOST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        mediaId: '1',
        syncedToWebsite: true,
        websiteUrl: 'https://ink37tattoos.com/gallery/1',
      })
      expect(data.data.syncedAt).toBeDefined()
    })

    it('handles unsync action successfully', async () => {
      const body = {
        mediaId: '1',
        action: 'unsync',
      }
      
      const request = new NextRequest('http://localhost:3001/api/admin/media/sync', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      
      const response = await syncPOST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        mediaId: '1',
        syncedToWebsite: false,
      })
      expect(data.data.unsyncedAt).toBeDefined()
    })

    it('returns 400 for missing parameters', async () => {
      const body = {
        mediaId: '1',
        // Missing action
      }
      
      const request = new NextRequest('http://localhost:3001/api/admin/media/sync', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      
      const response = await syncPOST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Media ID and action are required')
    })

    it('returns 400 for invalid action', async () => {
      const body = {
        mediaId: '1',
        action: 'invalid',
      }
      
      const request = new NextRequest('http://localhost:3001/api/admin/media/sync', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      
      const response = await syncPOST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid action')
    })

    it('handles sync errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3001/api/admin/media/sync', {
        method: 'POST',
        body: 'invalid json',
      })
      
      const response = await syncPOST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to sync media')
    })
  })
})