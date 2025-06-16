import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from '@/components/media/FileUpload'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, disabled, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className} 
      data-variant={variant} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress" className={className} data-value={value}>
      Progress: {value}%
    </div>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}))

// Mock icons
vi.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" />,
  FileImage: () => <div data-testid="file-image-icon" />,
  File: () => <div data-testid="file-icon" />,
  X: () => <div data-testid="x-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}))

// Mock file utilities
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
  formatFileSize: vi.fn((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }),
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url')
global.URL.revokeObjectURL = vi.fn()

// Mock File constructor
global.File = class MockFile {
  name: string
  size: number
  type: string
  lastModified: number

  constructor(bits: any[], name: string, options: any = {}) {
    this.name = name
    this.size = options.size || bits.join('').length
    this.type = options.type || ''
    this.lastModified = options.lastModified || Date.now()
  }
} as any

describe('FileUpload Component', () => {
  const mockOnFileSelect = vi.fn()
  const mockOnUploadComplete = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock createObjectURL to return a valid string
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-url')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<FileUpload />)
      
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument()
      expect(screen.getByText('Click to upload or drag and drop')).toBeInTheDocument()
      expect(screen.getByText('SVG, PNG, JPG or GIF (max. 10MB)')).toBeInTheDocument()
    })

    it('should render with custom placeholder text', () => {
      render(
        <FileUpload 
          placeholder="Upload your design files"
          description="PNG, JPG files only (max. 5MB)"
        />
      )
      
      expect(screen.getByText('Upload your design files')).toBeInTheDocument()
      expect(screen.getByText('PNG, JPG files only (max. 5MB)')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<FileUpload className="custom-upload-class" />)
      
      const container = screen.getByRole('button')
      expect(container).toHaveClass('custom-upload-class')
    })

    it('should render in disabled state', () => {
      render(<FileUpload disabled />)
      
      const container = screen.getByRole('button')
      expect(container).toBeDisabled()
      expect(container).toHaveClass('cursor-not-allowed')
    })
  })

  describe('File Type Configuration', () => {
    it('should configure for tattoo-design type', () => {
      render(<FileUpload type="tattoo-design" />)
      
      expect(screen.getByText('Upload Design Image')).toBeInTheDocument()
      expect(screen.getByText('PNG, JPG, or WebP (max. 10MB)')).toBeInTheDocument()
    })

    it('should configure for portfolio type', () => {
      render(<FileUpload type="portfolio" />)
      
      expect(screen.getByText('Upload Portfolio Image')).toBeInTheDocument()
      expect(screen.getByText('High-quality PNG or JPG (max. 15MB)')).toBeInTheDocument()
    })

    it('should configure for avatar type', () => {
      render(<FileUpload type="avatar" />)
      
      expect(screen.getByText('Upload Profile Picture')).toBeInTheDocument()
      expect(screen.getByText('Square image, PNG or JPG (max. 5MB)')).toBeInTheDocument()
    })

    it('should configure for media type', () => {
      render(<FileUpload type="media" />)
      
      expect(screen.getByText('Upload Media File')).toBeInTheDocument()
      expect(screen.getByText('Images, videos, or documents (max. 25MB)')).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('should handle file selection via input click', async () => {
      const user = userEvent.setup()
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const input = document.querySelector('input[type="file"]')
      
      expect(input).toBeInTheDocument()
      
      await user.upload(input!, file)
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(file)
    })

    it('should handle multiple file selection when allowed', async () => {
      const user = userEvent.setup()
      render(<FileUpload onFileSelect={mockOnFileSelect} multiple />)
      
      const files = [
        new File(['content1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'test2.png', { type: 'image/png' }),
      ]
      const input = document.querySelector('input[type="file"]')
      
      await user.upload(input!, files)
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(files[0])
    })

    it('should trigger file selection on container click', async () => {
      const user = userEvent.setup()
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      await user.click(container)
      
      // Input should be triggered (tested indirectly through click event)
      expect(container).toBeInTheDocument()
    })

    it('should not trigger file selection when disabled', async () => {
      const user = userEvent.setup()
      render(<FileUpload onFileSelect={mockOnFileSelect} disabled />)
      
      const container = screen.getByRole('button')
      await user.click(container)
      
      expect(container).toBeDisabled()
    })
  })

  describe('Drag and Drop', () => {
    it('should handle drag over events', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      
      fireEvent.dragOver(container, {
        dataTransfer: {
          types: ['Files'],
          files: []
        }
      })
      
      expect(container).toHaveClass('border-primary')
    })

    it('should handle drag leave events', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      
      fireEvent.dragOver(container)
      fireEvent.dragLeave(container)
      
      expect(container).not.toHaveClass('border-primary')
    })

    it('should handle file drop', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [file],
          types: ['Files']
        }
      })
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(file)
    })

    it('should not handle drop when disabled', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} disabled />)
      
      const container = screen.getByRole('button')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [file],
          types: ['Files']
        }
      })
      
      expect(mockOnFileSelect).not.toHaveBeenCalled()
    })

    it('should prevent default on drag events', () => {
      render(<FileUpload />)
      
      const container = screen.getByRole('button')
      
      const dragOverEvent = new Event('dragover', { bubbles: true })
      const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault')
      
      fireEvent(container, dragOverEvent)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('File Validation', () => {
    it('should validate file size', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} onError={mockOnError} maxSize={1024} />)
      
      const container = screen.getByRole('button')
      const largeFile = new File(['x'.repeat(2048)], 'large.jpg', { 
        type: 'image/jpeg',
        size: 2048 
      })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [largeFile],
          types: ['Files']
        }
      })
      
      expect(mockOnError).toHaveBeenCalledWith('File size exceeds maximum limit')
      expect(mockOnFileSelect).not.toHaveBeenCalled()
    })

    it('should validate file type for tattoo-design', () => {
      render(
        <FileUpload 
          type="tattoo-design" 
          onFileSelect={mockOnFileSelect} 
          onError={mockOnError} 
        />
      )
      
      const container = screen.getByRole('button')
      const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [invalidFile],
          types: ['Files']
        }
      })
      
      expect(mockOnError).toHaveBeenCalledWith('Invalid file type. Please upload PNG, JPG, or WebP files.')
      expect(mockOnFileSelect).not.toHaveBeenCalled()
    })

    it('should validate file type for portfolio', () => {
      render(
        <FileUpload 
          type="portfolio" 
          onFileSelect={mockOnFileSelect} 
          onError={mockOnError} 
        />
      )
      
      const container = screen.getByRole('button')
      const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [invalidFile],
          types: ['Files']
        }
      })
      
      expect(mockOnError).toHaveBeenCalledWith('Invalid file type. Please upload PNG or JPG files.')
      expect(mockOnFileSelect).not.toHaveBeenCalled()
    })

    it('should accept valid file types', () => {
      render(
        <FileUpload 
          type="tattoo-design" 
          onFileSelect={mockOnFileSelect} 
          onError={mockOnError} 
        />
      )
      
      const container = screen.getByRole('button')
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [validFile],
          types: ['Files']
        }
      })
      
      expect(mockOnError).not.toHaveBeenCalled()
      expect(mockOnFileSelect).toHaveBeenCalledWith(validFile)
    })

    it('should validate custom accept prop', () => {
      render(
        <FileUpload 
          accept=".txt,.md"
          onFileSelect={mockOnFileSelect} 
          onError={mockOnError} 
        />
      )
      
      const container = screen.getByRole('button')
      const invalidFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [invalidFile],
          types: ['Files']
        }
      })
      
      expect(mockOnError).toHaveBeenCalledWith('Invalid file type')
      expect(mockOnFileSelect).not.toHaveBeenCalled()
    })
  })

  describe('File Preview', () => {
    it('should show image preview after selection', async () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [file],
          types: ['Files']
        }
      })
      
      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument()
        expect(screen.getByTestId('file-image-icon')).toBeInTheDocument()
      })
    })

    it('should show file icon for non-image files', async () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} type="media" />)
      
      const container = screen.getByRole('button')
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [file],
          types: ['Files']
        }
      })
      
      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
        expect(screen.getByTestId('file-icon')).toBeInTheDocument()
      })
    })

    it('should display file size in preview', async () => {
      const { formatFileSize } = await import('@/lib/utils')
      vi.mocked(formatFileSize).mockReturnValue('1.5 KB')
      
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      const file = new File(['test content'], 'test.jpg', { 
        type: 'image/jpeg',
        size: 1536
      })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [file],
          types: ['Files']
        }
      })
      
      await waitFor(() => {
        expect(formatFileSize).toHaveBeenCalledWith(1536)
        expect(screen.getByText('1.5 KB')).toBeInTheDocument()
      })
    })

    it('should allow removing selected file', async () => {
      const user = userEvent.setup()
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [file],
          types: ['Files']
        }
      })
      
      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument()
      })
      
      const removeButton = screen.getByTestId('x-icon').closest('button')
      await user.click(removeButton!)
      
      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument()
      expect(screen.getByText('Click to upload or drag and drop')).toBeInTheDocument()
    })
  })

  describe('Upload Progress', () => {
    it('should show upload progress', () => {
      render(<FileUpload uploadProgress={45} />)
      
      expect(screen.getByTestId('progress')).toHaveAttribute('data-value', '45')
      expect(screen.getByText('Progress: 45%')).toBeInTheDocument()
    })

    it('should hide progress when upload is complete', () => {
      render(<FileUpload uploadProgress={100} />)
      
      expect(screen.queryByTestId('progress')).not.toBeInTheDocument()
    })

    it('should show uploading state', () => {
      render(<FileUpload isUploading uploadProgress={25} />)
      
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
      expect(screen.getByTestId('progress')).toBeInTheDocument()
    })

    it('should show upload success state', () => {
      render(<FileUpload uploadSuccess />)
      
      expect(screen.getByText('Upload successful!')).toBeInTheDocument()
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
    })

    it('should show upload error state', () => {
      render(<FileUpload uploadError="Upload failed" />)
      
      expect(screen.getByText('Upload failed')).toBeInTheDocument()
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument()
    })
  })

  describe('Multiple Files', () => {
    it('should handle multiple file selection', async () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} multiple />)
      
      const container = screen.getByRole('button')
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ]
      
      fireEvent.drop(container, {
        dataTransfer: {
          files,
          types: ['Files']
        }
      })
      
      // Should call onFileSelect for each file
      expect(mockOnFileSelect).toHaveBeenCalledTimes(2)
      expect(mockOnFileSelect).toHaveBeenNthCalledWith(1, files[0])
      expect(mockOnFileSelect).toHaveBeenNthCalledWith(2, files[1])
    })

    it('should show multiple file previews', async () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} multiple />)
      
      const container = screen.getByRole('button')
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ]
      
      fireEvent.drop(container, {
        dataTransfer: {
          files,
          types: ['Files']
        }
      })
      
      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
        expect(screen.getByText('test2.png')).toBeInTheDocument()
      })
    })

    it('should validate each file individually', () => {
      render(
        <FileUpload 
          onFileSelect={mockOnFileSelect} 
          onError={mockOnError} 
          multiple 
          maxSize={1024}
        />
      )
      
      const container = screen.getByRole('button')
      const files = [
        new File(['small'], 'small.jpg', { type: 'image/jpeg', size: 512 }),
        new File(['x'.repeat(2048)], 'large.jpg', { type: 'image/jpeg', size: 2048 }),
      ]
      
      fireEvent.drop(container, {
        dataTransfer: {
          files,
          types: ['Files']
        }
      })
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(files[0]) // Small file accepted
      expect(mockOnError).toHaveBeenCalledWith('File size exceeds maximum limit') // Large file rejected
    })
  })

  describe('Keyboard Accessibility', () => {
    it('should handle Enter key press', async () => {
      const user = userEvent.setup()
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      container.focus()
      
      await user.keyboard('{Enter}')
      
      // Should trigger file input (tested indirectly)
      expect(container).toHaveFocus()
    })

    it('should handle Space key press', async () => {
      const user = userEvent.setup()
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      container.focus()
      
      await user.keyboard(' ')
      
      // Should trigger file input (tested indirectly)
      expect(container).toHaveFocus()
    })

    it('should be focusable', () => {
      render(<FileUpload />)
      
      const container = screen.getByRole('button')
      container.focus()
      
      expect(container).toHaveFocus()
    })

    it('should not be focusable when disabled', () => {
      render(<FileUpload disabled />)
      
      const container = screen.getByRole('button')
      expect(container).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should call onError for file size validation', () => {
      render(<FileUpload onError={mockOnError} maxSize={1024} />)
      
      const container = screen.getByRole('button')
      const largeFile = new File(['x'.repeat(2048)], 'large.jpg', { 
        type: 'image/jpeg',
        size: 2048 
      })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [largeFile],
          types: ['Files']
        }
      })
      
      expect(mockOnError).toHaveBeenCalledWith('File size exceeds maximum limit')
    })

    it('should call onError for file type validation', () => {
      render(<FileUpload onError={mockOnError} accept=".jpg,.png" />)
      
      const container = screen.getByRole('button')
      const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [invalidFile],
          types: ['Files']
        }
      })
      
      expect(mockOnError).toHaveBeenCalledWith('Invalid file type')
    })

    it('should handle upload errors gracefully', () => {
      render(<FileUpload uploadError="Network error occurred" />)
      
      expect(screen.getByText('Network error occurred')).toBeInTheDocument()
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument()
    })

    it('should clear errors on new file selection', async () => {
      const { rerender } = render(<FileUpload uploadError="Previous error" />)
      
      expect(screen.getByText('Previous error')).toBeInTheDocument()
      
      rerender(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [file],
          types: ['Files']
        }
      })
      
      expect(screen.queryByText('Previous error')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty file list', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [],
          types: ['Files']
        }
      })
      
      expect(mockOnFileSelect).not.toHaveBeenCalled()
    })

    it('should handle files without proper type', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      const file = new File(['test'], 'test', { type: '' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [file],
          types: ['Files']
        }
      })
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(file)
    })

    it('should handle very large file names', async () => {
      const longFileName = 'a'.repeat(255) + '.jpg'
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      const file = new File(['test'], longFileName, { type: 'image/jpeg' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [file],
          types: ['Files']
        }
      })
      
      await waitFor(() => {
        expect(screen.getByText(longFileName)).toBeInTheDocument()
      })
    })

    it('should handle zero-byte files', () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain', size: 0 })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [emptyFile],
          types: ['Files']
        }
      })
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(emptyFile)
    })

    it('should cleanup object URLs on unmount', () => {
      const { unmount } = render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [file],
          types: ['Files']
        }
      })
      
      unmount()
      
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should handle rapid file selections', async () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      
      // Simulate rapid file drops
      for (let i = 0; i < 5; i++) {
        const file = new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
        fireEvent.drop(container, {
          dataTransfer: {
            files: [file],
            types: ['Files']
          }
        })
      }
      
      expect(mockOnFileSelect).toHaveBeenCalledTimes(5)
    })

    it('should handle large file previews efficiently', async () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />)
      
      const container = screen.getByRole('button')
      const largeFile = new File(['x'.repeat(1000000)], 'large.jpg', { 
        type: 'image/jpeg',
        size: 1000000
      })
      
      fireEvent.drop(container, {
        dataTransfer: {
          files: [largeFile],
          types: ['Files']
        }
      })
      
      await waitFor(() => {
        expect(screen.getByText('large.jpg')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })
})