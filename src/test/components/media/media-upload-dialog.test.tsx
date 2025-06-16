import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MediaUploadDialog } from '@/components/media/media-upload-dialog'
import { useUIStore } from '@/stores/ui-store'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('@/stores/ui-store')
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock file reader for drag and drop
Object.defineProperty(global, 'DataTransfer', {
  value: vi.fn(() => ({
    files: [],
    items: [],
    types: []
  })),
  writable: true
})

// Mock store state
const mockUIStore = {
  modals: {
    mediaUpload: { open: false, type: 'photo' }
  },
  loading: {
    component: {}
  },
  closeModal: vi.fn(),
  setComponentLoading: vi.fn()
}

// Test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('MediaUploadDialog Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useUIStore).mockReturnValue(mockUIStore)
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Dialog State Management', () => {
    it('should not be visible when closed', () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      // Dialog should not be visible
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should be visible when open via store', () => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Upload Photo')).toBeInTheDocument()
    })

    it('should be visible when open via legacy props', () => {
      render(
        <TestWrapper>
          <MediaUploadDialog open={true} uploadType="video" />
        </TestWrapper>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Upload Video')).toBeInTheDocument()
    })

    it('should prioritize store state over legacy props', () => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'video' }
        }
      })

      render(
        <TestWrapper>
          <MediaUploadDialog open={false} uploadType="photo" />
        </TestWrapper>
      )

      // Should show video dialog from store, not photo from props
      expect(screen.getByText('Upload Video')).toBeInTheDocument()
    })

    it('should call closeModal when dialog is closed', async () => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockUIStore.closeModal).toHaveBeenCalledWith('mediaUpload')
    })

    it('should call legacy onOpenChange when provided', async () => {
      const mockOnOpenChange = vi.fn()

      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })

      render(
        <TestWrapper>
          <MediaUploadDialog onOpenChange={mockOnOpenChange} />
        </TestWrapper>
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Upload Type Configuration', () => {
    it('should display photo upload UI for photo type', () => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      expect(screen.getByText('Upload Photo')).toBeInTheDocument()
      expect(screen.getByText(/JPEG, PNG, WebP up to 4.5MB/)).toBeInTheDocument()
      expect(screen.getByText('Save Photo')).toBeInTheDocument()
    })

    it('should display video upload UI for video type', () => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'video' }
        }
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      expect(screen.getByText('Upload Video')).toBeInTheDocument()
      expect(screen.getByText(/MP4, MOV, WebM up to 4.5MB/)).toBeInTheDocument()
      expect(screen.getByText('Save Video')).toBeInTheDocument()
    })

    it('should have correct file input accept attributes', () => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/jpg,image/png,image/webp')
    })
  })

  describe('File Upload', () => {
    beforeEach(() => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })
    })

    it('should handle successful file upload', async () => {
      const mockBlob = {
        url: 'https://example.com/uploaded-file.jpg',
        pathname: 'uploaded-file.jpg',
        size: 1024000
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBlob)
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully!')).toBeInTheDocument()
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/upload?filename=test.jpg&type=media',
        expect.objectContaining({
          method: 'POST',
          body: file
        })
      )

      expect(toast.success).toHaveBeenCalledWith('File uploaded successfully!')
      expect(screen.getByText('uploaded-file.jpg')).toBeInTheDocument()
    })

    it('should validate file type for photos', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please select an image file')
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate file type for videos', async () => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'video' }
        }
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please select a video file')
      })
    })

    it('should validate file size', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      // Create a file larger than 4.5MB
      const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('File too large. Maximum size is 4.5MB.')
      })
    })

    it('should handle upload errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Upload failed' })
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Upload failed: Upload failed')
      })
    })

    it('should auto-fill title from filename', async () => {
      const mockBlob = {
        url: 'https://example.com/my-tattoo.jpg',
        pathname: 'my-tattoo.jpg',
        size: 1024000
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBlob)
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const file = new File(['test content'], 'my-tattoo.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('my-tattoo')
        expect(titleInput).toBeInTheDocument()
      })
    })

    it('should not overwrite existing title', async () => {
      const mockBlob = {
        url: 'https://example.com/test.jpg',
        pathname: 'test.jpg',
        size: 1024000
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBlob)
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      // Set a title first
      const titleInput = screen.getByLabelText('Title *')
      await user.type(titleInput, 'Existing Title')

      const file = new File(['test content'], 'new-file.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Title')).toBeInTheDocument()
      })
    })

    it('should allow removing uploaded file', async () => {
      const mockBlob = {
        url: 'https://example.com/test.jpg',
        pathname: 'test.jpg',
        size: 1024000
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBlob)
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully!')).toBeInTheDocument()
      })

      const removeButton = screen.getByText('Remove')
      await user.click(removeButton)

      expect(screen.queryByText('File uploaded successfully!')).not.toBeInTheDocument()
      expect(screen.getByText(/Drop your .* here/)).toBeInTheDocument()
    })
  })

  describe('Drag and Drop', () => {
    beforeEach(() => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })
    })

    it('should handle drag enter and leave events', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const dropZone = screen.getByText(/Drop your .* here/).closest('div')!

      fireEvent.dragEnter(dropZone)
      expect(dropZone).toHaveClass('border-primary', 'bg-primary/5')

      fireEvent.dragLeave(dropZone)
      expect(dropZone).not.toHaveClass('border-primary', 'bg-primary/5')
    })

    it('should handle file drop', async () => {
      const mockBlob = {
        url: 'https://example.com/dropped.jpg',
        pathname: 'dropped.jpg',
        size: 1024000
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBlob)
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const dropZone = screen.getByText(/Drop your .* here/).closest('div')!
      const file = new File(['test content'], 'dropped.jpg', { type: 'image/jpeg' })

      const mockDataTransfer = {
        files: [file],
        items: [],
        types: []
      }

      fireEvent.drop(dropZone, { dataTransfer: mockDataTransfer })

      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully!')).toBeInTheDocument()
      })
    })

    it('should prevent default drag behaviors', () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const dropZone = screen.getByText(/Drop your .* here/).closest('div')!

      const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true })
      const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault')

      fireEvent(dropZone, dragOverEvent)
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Metadata Form', () => {
    beforeEach(() => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })
    })

    it('should handle title input', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const titleInput = screen.getByLabelText('Title *')
      await user.type(titleInput, 'My Tattoo')

      expect(titleInput).toHaveValue('My Tattoo')
    })

    it('should handle description input', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const descriptionInput = screen.getByLabelText('Description')
      await user.type(descriptionInput, 'A beautiful tattoo design')

      expect(descriptionInput).toHaveValue('A beautiful tattoo design')
    })

    it('should handle style input', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const styleInput = screen.getByLabelText('Style')
      await user.type(styleInput, 'Traditional')

      expect(styleInput).toHaveValue('Traditional')
    })

    it('should add tags when Add button is clicked', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const tagInput = screen.getByLabelText('Tags')
      const addButton = screen.getByText('Add')

      await user.type(tagInput, 'traditional')
      await user.click(addButton)

      expect(screen.getByText('traditional')).toBeInTheDocument()
      expect(tagInput).toHaveValue('')
    })

    it('should add tags when Enter is pressed', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const tagInput = screen.getByLabelText('Tags')

      await user.type(tagInput, 'blackwork')
      await user.keyboard('{Enter}')

      expect(screen.getByText('blackwork')).toBeInTheDocument()
      expect(tagInput).toHaveValue('')
    })

    it('should not add duplicate tags', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const tagInput = screen.getByLabelText('Tags')
      const addButton = screen.getByText('Add')

      await user.type(tagInput, 'realism')
      await user.click(addButton)

      await user.type(tagInput, 'realism')
      await user.click(addButton)

      const realismTags = screen.getAllByText('realism')
      expect(realismTags).toHaveLength(1)
    })

    it('should remove tags when X is clicked', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const tagInput = screen.getByLabelText('Tags')
      const addButton = screen.getByText('Add')

      await user.type(tagInput, 'geometric')
      await user.click(addButton)

      expect(screen.getByText('geometric')).toBeInTheDocument()

      const removeButton = screen.getByText('geometric').parentElement?.querySelector('svg')
      expect(removeButton).toBeInTheDocument()

      await user.click(removeButton!)

      expect(screen.queryByText('geometric')).not.toBeInTheDocument()
    })

    it('should handle sync checkbox', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const syncCheckbox = screen.getByLabelText(/Sync to ink37tattoos.com/)
      expect(syncCheckbox).toBeChecked() // Default is true

      await user.click(syncCheckbox)
      expect(syncCheckbox).not.toBeChecked()

      await user.click(syncCheckbox)
      expect(syncCheckbox).toBeChecked()
    })
  })

  describe('Save Functionality', () => {
    beforeEach(() => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })
    })

    it('should save successfully with valid data', async () => {
      // Mock upload
      const mockBlob = {
        url: 'https://example.com/test.jpg',
        pathname: 'test.jpg',
        size: 1024000
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBlob)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      // Upload file
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully!')).toBeInTheDocument()
      })

      // Set title
      const titleInput = screen.getByLabelText('Title *')
      await user.clear(titleInput)
      await user.type(titleInput, 'Test Photo')

      // Save
      const saveButton = screen.getByText('Save Photo')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: mockBlob.url,
            pathname: mockBlob.pathname,
            size: mockBlob.size,
            type: 'photo',
            metadata: {
              title: 'Test Photo',
              description: '',
              tags: [],
              style: '',
              syncToWebsite: true
            }
          })
        })
      })

      expect(toast.success).toHaveBeenCalledWith('Photo saved successfully!')
      expect(mockUIStore.closeModal).toHaveBeenCalledWith('mediaUpload')
    })

    it('should not save without uploaded file', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const saveButton = screen.getByText('Save Photo')
      await user.click(saveButton)

      expect(toast.error).toHaveBeenCalledWith('Please upload a file first')
      expect(mockFetch).not.toHaveBeenCalledWith('/api/admin/media', expect.any(Object))
    })

    it('should disable save button without title', async () => {
      // Mock upload
      const mockBlob = {
        url: 'https://example.com/test.jpg',
        pathname: 'test.jpg',
        size: 1024000
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBlob)
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      // Upload file
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully!')).toBeInTheDocument()
      })

      // Clear auto-filled title
      const titleInput = screen.getByLabelText('Title *')
      await user.clear(titleInput)

      const saveButton = screen.getByText('Save Photo')
      expect(saveButton).toBeDisabled()
    })

    it('should handle save errors', async () => {
      // Mock upload
      const mockBlob = {
        url: 'https://example.com/test.jpg',
        pathname: 'test.jpg',
        size: 1024000
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBlob)
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: { message: 'Database error' } })
        })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      // Upload file
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully!')).toBeInTheDocument()
      })

      // Set title
      const titleInput = screen.getByLabelText('Title *')
      await user.clear(titleInput)
      await user.type(titleInput, 'Test Photo')

      // Save
      const saveButton = screen.getByText('Save Photo')
      await user.click(saveButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Save failed: Database error')
      })
    })
  })

  describe('Loading States', () => {
    beforeEach(() => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })
    })

    it('should show uploading state', async () => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        },
        loading: {
          component: { 'media-upload': true }
        }
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      expect(screen.getByText('Uploading...')).toBeInTheDocument()
      expect(screen.getByText('Uploading...').parentElement?.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('should disable upload area when uploading', () => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        },
        loading: {
          component: { 'media-upload': true }
        }
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const uploadArea = screen.getByText('Uploading...').closest('div')
      expect(uploadArea).toHaveClass('opacity-50')
    })

    it('should show saving state on save button', async () => {
      // Mock upload success first
      const mockBlob = {
        url: 'https://example.com/test.jpg',
        pathname: 'test.jpg',
        size: 1024000
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBlob)
        })
        .mockImplementationOnce(() => new Promise(() => {})) // Pending save

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      // Upload file and set title
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully!')).toBeInTheDocument()
      })

      const titleInput = screen.getByLabelText('Title *')
      await user.clear(titleInput)
      await user.type(titleInput, 'Test Photo')

      // Click save
      const saveButton = screen.getByText('Save Photo')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument()
      })

      expect(saveButton).toBeDisabled()
      expect(screen.getByText('Cancel')).toBeDisabled()
    })
  })

  describe('Form Reset', () => {
    beforeEach(() => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })
    })

    it('should reset form after successful save', async () => {
      // Mock successful upload and save
      const mockBlob = {
        url: 'https://example.com/test.jpg',
        pathname: 'test.jpg',
        size: 1024000
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBlob)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      // Upload file and fill form
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully!')).toBeInTheDocument()
      })

      const titleInput = screen.getByLabelText('Title *')
      await user.clear(titleInput)
      await user.type(titleInput, 'Test Photo')

      const descriptionInput = screen.getByLabelText('Description')
      await user.type(descriptionInput, 'Test description')

      const tagInput = screen.getByLabelText('Tags')
      await user.type(tagInput, 'test')
      await user.keyboard('{Enter}')

      // Save
      const saveButton = screen.getByText('Save Photo')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockUIStore.setComponentLoading).toHaveBeenCalledWith('media-upload', false)
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })
    })

    it('should have proper form labels', () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      expect(screen.getByLabelText('Title *')).toBeInTheDocument()
      expect(screen.getByLabelText('Style')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
      expect(screen.getByLabelText('Tags')).toBeInTheDocument()
      expect(screen.getByLabelText(/Sync to ink37tattoos.com/)).toBeInTheDocument()
    })

    it('should have proper dialog structure', () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Upload Photo')).toBeInTheDocument()
      expect(screen.getByText(/Upload photos that will sync/)).toBeInTheDocument()
    })

    it('should have keyboard navigation support', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const titleInput = screen.getByLabelText('Title *')
      titleInput.focus()

      await user.tab()
      expect(screen.getByLabelText('Style')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('Description')).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        }
      })
    })

    it('should handle upload area click when uploading', () => {
      vi.mocked(useUIStore).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: { open: true, type: 'photo' }
        },
        loading: {
          component: { 'media-upload': true }
        }
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const uploadArea = screen.getByText('Uploading...').closest('div')!
      
      // Should not trigger file input when uploading
      const clickSpy = vi.fn()
      const fileInput = document.querySelector('input[type="file"]')
      fileInput?.addEventListener('click', clickSpy)

      fireEvent.click(uploadArea)
      expect(clickSpy).not.toHaveBeenCalled()
    })

    it('should handle empty tag input', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const addButton = screen.getByText('Add')
      await user.click(addButton)

      // Should not add empty tag
      expect(screen.queryByText('')).not.toBeInTheDocument()
    })

    it('should handle whitespace-only tag input', async () => {
      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const tagInput = screen.getByLabelText('Tags')
      await user.type(tagInput, '   ')

      const addButton = screen.getByText('Add')
      await user.click(addButton)

      // Should not add whitespace-only tag
      expect(tagInput).toHaveValue('')
    })

    it('should handle network errors during upload', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Upload failed: Network error')
      })
    })

    it('should handle malformed upload response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}) // No error message
      })

      render(
        <TestWrapper>
          <MediaUploadDialog />
        </TestWrapper>
      )

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Upload failed: Upload failed')
      })
    })
  })
})