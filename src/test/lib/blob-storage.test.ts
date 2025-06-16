import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  uploadFile,
  uploadFiles,
  deleteFile,
  listFiles,
  uploadTattooDesign,
  uploadPortfolioImage,
  uploadMediaFile
} from '@/lib/blob-storage'

// Mock Vercel Blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
  del: vi.fn(),
  list: vi.fn()
}))

const mockPut = vi.mocked((await import('@vercel/blob')).put)
const mockDel = vi.mocked((await import('@vercel/blob')).del)
const mockList = vi.mocked((await import('@vercel/blob')).list)

describe('Blob Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z')
  })

  describe('uploadFile', () => {
    it('should upload file with default options', async () => {
      const mockBlobResponse = {
        url: 'https://blob.vercel-storage.com/uploads/2024-01-15/test.jpg',
        pathname: 'uploads/2024-01-15/test.jpg',
        size: 1024,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      }

      mockPut.mockResolvedValueOnce(mockBlobResponse)

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      const result = await uploadFile(file)

      expect(mockPut).toHaveBeenCalledWith(
        'uploads/2024-01-15/test.jpg',
        file,
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN
        }
      )

      expect(result).toEqual({
        url: 'https://blob.vercel-storage.com/uploads/2024-01-15/test.jpg',
        pathname: 'uploads/2024-01-15/test.jpg',
        size: 1024,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      })
    })

    it('should upload file with custom options', async () => {
      const mockBlobResponse = {
        url: 'https://blob.vercel-storage.com/custom/2024-01-15/custom-name.png',
        pathname: 'custom/2024-01-15/custom-name.png',
        size: 2048,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      }

      mockPut.mockResolvedValueOnce(mockBlobResponse)

      const file = new File(['content'], 'original.png', { type: 'image/png' })
      const result = await uploadFile(file, {
        access: 'private',
        folder: 'custom',
        filename: 'custom-name.png'
      })

      expect(mockPut).toHaveBeenCalledWith(
        'custom/2024-01-15/custom-name.png',
        file,
        {
          access: 'private',
          token: process.env.BLOB_READ_WRITE_TOKEN
        }
      )

      expect(result).toEqual({
        url: 'https://blob.vercel-storage.com/custom/2024-01-15/custom-name.png',
        pathname: 'custom/2024-01-15/custom-name.png',
        size: 2048,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      })
    })

    it('should upload Buffer', async () => {
      const mockBlobResponse = {
        url: 'https://blob.vercel-storage.com/uploads/2024-01-15/file',
        pathname: 'uploads/2024-01-15/file',
        size: 100,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      }

      mockPut.mockResolvedValueOnce(mockBlobResponse)

      const buffer = Buffer.from('binary data')
      const result = await uploadFile(buffer)

      expect(mockPut).toHaveBeenCalledWith(
        'uploads/2024-01-15/file',
        buffer,
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN
        }
      )

      expect(result.url).toBe('https://blob.vercel-storage.com/uploads/2024-01-15/file')
    })

    it('should upload string content', async () => {
      const mockBlobResponse = {
        url: 'https://blob.vercel-storage.com/uploads/2024-01-15/file',
        pathname: 'uploads/2024-01-15/file',
        size: 12,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      }

      mockPut.mockResolvedValueOnce(mockBlobResponse)

      const content = 'text content'
      const result = await uploadFile(content)

      expect(mockPut).toHaveBeenCalledWith(
        'uploads/2024-01-15/file',
        content,
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN
        }
      )

      expect(result.size).toBe(12)
    })

    it('should handle upload errors', async () => {
      const uploadError = new Error('Upload failed')
      mockPut.mockRejectedValueOnce(uploadError)

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

      await expect(uploadFile(file)).rejects.toThrow('Upload failed')
    })

    it('should generate correct pathname with custom filename', async () => {
      const mockBlobResponse = {
        url: 'https://blob.vercel-storage.com/docs/2024-01-15/report.pdf',
        pathname: 'docs/2024-01-15/report.pdf',
        size: 5000,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      }

      mockPut.mockResolvedValueOnce(mockBlobResponse)

      const file = new File(['content'], 'original.pdf', { type: 'application/pdf' })
      await uploadFile(file, {
        folder: 'docs',
        filename: 'report.pdf'
      })

      expect(mockPut).toHaveBeenCalledWith(
        'docs/2024-01-15/report.pdf',
        file,
        expect.objectContaining({
          access: 'public'
        })
      )
    })
  })

  describe('uploadFiles', () => {
    it('should upload multiple files', async () => {
      const mockBlobResponses = [
        {
          url: 'https://blob.vercel-storage.com/uploads/2024-01-15/file1.jpg',
          pathname: 'uploads/2024-01-15/file1.jpg',
          size: 1024,
          uploadedAt: new Date('2024-01-15T10:00:00.000Z')
        },
        {
          url: 'https://blob.vercel-storage.com/uploads/2024-01-15/file2.png',
          pathname: 'uploads/2024-01-15/file2.png',
          size: 2048,
          uploadedAt: new Date('2024-01-15T10:00:00.000Z')
        }
      ]

      mockPut
        .mockResolvedValueOnce(mockBlobResponses[0])
        .mockResolvedValueOnce(mockBlobResponses[1])

      const files = [
        new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'file2.png', { type: 'image/png' })
      ]

      const results = await uploadFiles(files)

      expect(mockPut).toHaveBeenCalledTimes(2)
      expect(results).toHaveLength(2)
      expect(results[0].url).toBe('https://blob.vercel-storage.com/uploads/2024-01-15/file1.jpg')
      expect(results[1].url).toBe('https://blob.vercel-storage.com/uploads/2024-01-15/file2.png')
    })

    it('should upload files with custom options', async () => {
      const mockBlobResponse = {
        url: 'https://blob.vercel-storage.com/images/2024-01-15/photo.jpg',
        pathname: 'images/2024-01-15/photo.jpg',
        size: 3000,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      }

      mockPut.mockResolvedValue(mockBlobResponse)

      const files = [
        new File(['content'], 'photo.jpg', { type: 'image/jpeg' })
      ]

      const results = await uploadFiles(files, {
        folder: 'images',
        access: 'private'
      })

      expect(mockPut).toHaveBeenCalledWith(
        'images/2024-01-15/photo.jpg',
        files[0],
        {
          access: 'private',
          token: process.env.BLOB_READ_WRITE_TOKEN
        }
      )

      expect(results).toHaveLength(1)
    })

    it('should handle empty files array', async () => {
      const results = await uploadFiles([])

      expect(mockPut).not.toHaveBeenCalled()
      expect(results).toEqual([])
    })

    it('should handle partial upload failures', async () => {
      mockPut
        .mockResolvedValueOnce({
          url: 'https://blob.vercel-storage.com/uploads/2024-01-15/file1.jpg',
          pathname: 'uploads/2024-01-15/file1.jpg',
          size: 1024,
          uploadedAt: new Date('2024-01-15T10:00:00.000Z')
        })
        .mockRejectedValueOnce(new Error('Upload failed'))

      const files = [
        new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'file2.png', { type: 'image/png' })
      ]

      await expect(uploadFiles(files)).rejects.toThrow('Upload failed')
    })
  })

  describe('deleteFile', () => {
    it('should delete file by URL', async () => {
      mockDel.mockResolvedValueOnce(undefined)

      const fileUrl = 'https://blob.vercel-storage.com/uploads/2024-01-15/test.jpg'
      await deleteFile(fileUrl)

      expect(mockDel).toHaveBeenCalledWith(fileUrl, {
        token: process.env.BLOB_READ_WRITE_TOKEN
      })
    })

    it('should handle delete errors', async () => {
      const deleteError = new Error('Delete failed')
      mockDel.mockRejectedValueOnce(deleteError)

      const fileUrl = 'https://blob.vercel-storage.com/uploads/2024-01-15/test.jpg'

      await expect(deleteFile(fileUrl)).rejects.toThrow('Delete failed')
    })

    it('should handle invalid URLs', async () => {
      mockDel.mockRejectedValueOnce(new Error('Invalid URL'))

      await expect(deleteFile('invalid-url')).rejects.toThrow('Invalid URL')
    })
  })

  describe('listFiles', () => {
    it('should list all files when no folder specified', async () => {
      const mockBlobs = [
        {
          url: 'https://blob.vercel-storage.com/uploads/file1.jpg',
          pathname: 'uploads/file1.jpg',
          size: 1024,
          uploadedAt: new Date('2024-01-15T10:00:00.000Z')
        },
        {
          url: 'https://blob.vercel-storage.com/images/file2.png',
          pathname: 'images/file2.png',
          size: 2048,
          uploadedAt: new Date('2024-01-15T11:00:00.000Z')
        }
      ]

      mockList.mockResolvedValueOnce({ blobs: mockBlobs })

      const result = await listFiles()

      expect(mockList).toHaveBeenCalledWith({
        prefix: undefined,
        token: process.env.BLOB_READ_WRITE_TOKEN
      })

      expect(result).toEqual([
        {
          url: 'https://blob.vercel-storage.com/uploads/file1.jpg',
          pathname: 'uploads/file1.jpg',
          size: 1024,
          uploadedAt: new Date('2024-01-15T10:00:00.000Z')
        },
        {
          url: 'https://blob.vercel-storage.com/images/file2.png',
          pathname: 'images/file2.png',
          size: 2048,
          uploadedAt: new Date('2024-01-15T11:00:00.000Z')
        }
      ])
    })

    it('should list files in specific folder', async () => {
      const mockBlobs = [
        {
          url: 'https://blob.vercel-storage.com/uploads/file1.jpg',
          pathname: 'uploads/file1.jpg',
          size: 1024,
          uploadedAt: new Date('2024-01-15T10:00:00.000Z')
        }
      ]

      mockList.mockResolvedValueOnce({ blobs: mockBlobs })

      const result = await listFiles('uploads')

      expect(mockList).toHaveBeenCalledWith({
        prefix: 'uploads',
        token: process.env.BLOB_READ_WRITE_TOKEN
      })

      expect(result).toHaveLength(1)
      expect(result[0].pathname).toBe('uploads/file1.jpg')
    })

    it('should handle empty folder', async () => {
      mockList.mockResolvedValueOnce({ blobs: [] })

      const result = await listFiles('empty-folder')

      expect(result).toEqual([])
    })

    it('should handle list errors', async () => {
      const listError = new Error('List failed')
      mockList.mockRejectedValueOnce(listError)

      await expect(listFiles()).rejects.toThrow('List failed')
    })
  })

  describe('Specialized Upload Functions', () => {
    beforeEach(() => {
      mockPut.mockResolvedValue({
        url: 'https://blob.vercel-storage.com/test-folder/2024-01-15/test.jpg',
        pathname: 'test-folder/2024-01-15/test.jpg',
        size: 1024,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      })
    })

    it('should upload tattoo design with correct folder', async () => {
      const file = new File(['content'], 'dragon.jpg', { type: 'image/jpeg' })
      const result = await uploadTattooDesign(file)

      expect(mockPut).toHaveBeenCalledWith(
        'tattoo-designs/2024-01-15/dragon.jpg',
        file,
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN
        }
      )

      expect(result.url).toBeDefined()
    })

    it('should upload portfolio image with correct folder', async () => {
      const file = new File(['content'], 'portfolio.jpg', { type: 'image/jpeg' })
      const result = await uploadPortfolioImage(file)

      expect(mockPut).toHaveBeenCalledWith(
        'portfolio/2024-01-15/portfolio.jpg',
        file,
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN
        }
      )

      expect(result.url).toBeDefined()
    })

    it('should upload media file with correct folder', async () => {
      const file = new File(['content'], 'media.jpg', { type: 'image/jpeg' })
      const result = await uploadMediaFile(file)

      expect(mockPut).toHaveBeenCalledWith(
        'media/2024-01-15/media.jpg',
        file,
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN
        }
      )

      expect(result.url).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle files with special characters in name', async () => {
      const mockBlobResponse = {
        url: 'https://blob.vercel-storage.com/uploads/2024-01-15/file%20with%20spaces.jpg',
        pathname: 'uploads/2024-01-15/file with spaces.jpg',
        size: 1024,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      }

      mockPut.mockResolvedValueOnce(mockBlobResponse)

      const file = new File(['content'], 'file with spaces.jpg', { type: 'image/jpeg' })
      const result = await uploadFile(file)

      expect(result.pathname).toBe('uploads/2024-01-15/file with spaces.jpg')
    })

    it('should handle files with no extension', async () => {
      const mockBlobResponse = {
        url: 'https://blob.vercel-storage.com/uploads/2024-01-15/README',
        pathname: 'uploads/2024-01-15/README',
        size: 100,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      }

      mockPut.mockResolvedValueOnce(mockBlobResponse)

      const file = new File(['content'], 'README', { type: 'text/plain' })
      const result = await uploadFile(file)

      expect(result.pathname).toBe('uploads/2024-01-15/README')
    })

    it('should handle very long filenames', async () => {
      const longFilename = 'a'.repeat(200) + '.jpg'
      const mockBlobResponse = {
        url: `https://blob.vercel-storage.com/uploads/2024-01-15/${longFilename}`,
        pathname: `uploads/2024-01-15/${longFilename}`,
        size: 1024,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      }

      mockPut.mockResolvedValueOnce(mockBlobResponse)

      const file = new File(['content'], longFilename, { type: 'image/jpeg' })
      const result = await uploadFile(file)

      expect(result.pathname).toBe(`uploads/2024-01-15/${longFilename}`)
    })

    it('should handle zero-byte files', async () => {
      const mockBlobResponse = {
        url: 'https://blob.vercel-storage.com/uploads/2024-01-15/empty.txt',
        pathname: 'uploads/2024-01-15/empty.txt',
        size: 0,
        uploadedAt: new Date('2024-01-15T10:00:00.000Z')
      }

      mockPut.mockResolvedValueOnce(mockBlobResponse)

      const file = new File([], 'empty.txt', { type: 'text/plain' })
      const result = await uploadFile(file)

      expect(result.size).toBe(0)
    })

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout')
      mockPut.mockRejectedValueOnce(timeoutError)

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

      await expect(uploadFile(file)).rejects.toThrow('Request timeout')
    })

    it('should handle missing environment token', async () => {
      // This would typically cause an error in the Vercel blob client
      const authError = new Error('Missing authentication token')
      mockPut.mockRejectedValueOnce(authError)

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

      await expect(uploadFile(file)).rejects.toThrow('Missing authentication token')
    })
  })
})