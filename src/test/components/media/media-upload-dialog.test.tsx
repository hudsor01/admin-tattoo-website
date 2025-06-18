import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MediaUploadDialog } from '@/components/media/media-upload-dialog'
// import { toast } from 'sonner' // Mocked in test setup
import { useUIStore } from '@/stores/ui-store'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/stores/ui-store', () => ({
  useUIStore: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  
  Wrapper.displayName = 'QueryWrapper'
  
  return Wrapper
}

const mockUIStore = {
  modals: {
    mediaUpload: {
      open: true,
      type: 'photo' as const,
    },
  },
  closeModal: vi.fn(),
  setComponentLoading: vi.fn(),
  loading: {
    component: {},
  },
}

describe('MediaUploadDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useUIStore as any).mockReturnValue(mockUIStore)
  })

  describe('Dialog Rendering', () => {
    it('renders dialog when open', () => {
      render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Upload Photo')).toBeInTheDocument()
    })

    it('renders video upload dialog when type is video', () => {
      ;(useUIStore as any).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: {
            open: true,
            type: 'video',
          },
        },
      })
      
      render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      expect(screen.getByText('Upload Video')).toBeInTheDocument()
      expect(screen.getByText('Upload videos that will sync to ink37tattoos.com/gallery')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      ;(useUIStore as any).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: {
            open: false,
            type: 'photo',
          },
        },
      })
      
      const { container } = render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Upload Zone Display', () => {
    it('displays upload zone with correct instructions', () => {
      render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/Drop your photo here, or/)).toBeInTheDocument()
      expect(screen.getByText('browse')).toBeInTheDocument()
      expect(screen.getByText('JPEG, PNG, WebP up to 4.5MB')).toBeInTheDocument()
    })

    it('shows video format instructions for video upload', () => {
      ;(useUIStore as any).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: {
            open: true,
            type: 'video',
          },
        },
      })
      
      render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/Drop your video here, or/)).toBeInTheDocument()
      expect(screen.getByText('MP4, MOV, WebM up to 4.5MB')).toBeInTheDocument()
    })

    it('renders upload zone for file interactions', () => {
      render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      // Check that the upload zone is present with the right styling
      expect(screen.getByText('browse')).toBeInTheDocument()
      
      // The file input exists but is hidden - this is expected behavior
      // We'll test file upload functionality through integration tests
    })
  })

  describe('Metadata Form', () => {
    it('displays all metadata input fields', () => {
      render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      expect(screen.getByLabelText('Title *')).toBeInTheDocument()
      expect(screen.getByLabelText('Style')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
      expect(screen.getByLabelText('Tags')).toBeInTheDocument()
      expect(screen.getByLabelText('Sync to ink37tattoos.com gallery (recommended)')).toBeInTheDocument()
    })

    it('allows adding tags', async () => {
      const user = userEvent.setup()
      render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      const tagInput = screen.getByLabelText('Tags')
      const addButton = screen.getByRole('button', { name: 'Add' })
      
      await user.type(tagInput, 'traditional')
      await user.click(addButton)
      
      expect(screen.getByText('traditional')).toBeInTheDocument()
    })

    it('allows adding tags with Enter key', async () => {
      const user = userEvent.setup()
      render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      const tagInput = screen.getByLabelText('Tags')
      
      await user.type(tagInput, 'color')
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('color')).toBeInTheDocument()
    })

    it('toggles sync to website checkbox', async () => {
      const user = userEvent.setup()
      render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      const checkbox = screen.getByLabelText('Sync to ink37tattoos.com gallery (recommended)') as HTMLInputElement
      
      expect(checkbox.checked).toBe(true) // Default is true
      
      await user.click(checkbox)
      expect(checkbox.checked).toBe(false)
      
      await user.click(checkbox)
      expect(checkbox.checked).toBe(true)
    })
  })

  describe('Form Actions', () => {
    it('disables save button when no file is uploaded', () => {
      render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      const saveButton = screen.getByRole('button', { name: /Save Photo/ })
      expect(saveButton).toBeDisabled()
    })

    it('closes dialog on cancel', async () => {
      const user = userEvent.setup()
      render(<MediaUploadDialog />, { wrapper: createWrapper() })
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)
      
      expect(mockUIStore.closeModal).toHaveBeenCalledWith('mediaUpload')
    })
  })

  describe('Legacy Props Support', () => {
    it('supports legacy open and onOpenChange props', () => {
      const mockOnOpenChange = vi.fn()
      
      // Override store to return closed state AND no type so legacy props take precedence
      ;(useUIStore as any).mockReturnValue({
        ...mockUIStore,
        modals: {
          mediaUpload: {
            open: false,
            type: null, // No type set in store
          },
        },
      })
      
      render(
        <MediaUploadDialog 
          open 
          onOpenChange={mockOnOpenChange} 
          uploadType="video"
        />, 
        { wrapper: createWrapper() }
      )
      
      // Should show video upload since uploadType="video" was passed and store has no type
      expect(screen.getByText('Upload Video')).toBeInTheDocument()
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)
      
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })
})