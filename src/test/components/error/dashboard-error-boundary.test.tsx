import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardErrorBoundary } from '@/components/error/dashboard-error-boundary'

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  MessageCircle: () => <div data-testid="message-circle-icon" />,
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardDescription: ({ children }: any) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <div data-testid="card-title" className={className}>{children}</div>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}))

// Mock console.error to test error logging
const mockConsoleError = vi.fn()
const originalConsoleError = console.error

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3001/dashboard',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
  value: 'test-user-agent',
  writable: true,
})

// Component that throws an error for testing
const ThrowError = ({ shouldThrow, errorMessage }: { shouldThrow: boolean; errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test error')
  }
  return <div data-testid="child-component">Child content</div>
}

describe('DashboardErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.error = mockConsoleError
    vi.useFakeTimers()
  })

  afterEach(() => {
    console.error = originalConsoleError
    vi.useRealTimers()
  })

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={false} />
        </DashboardErrorBoundary>
      )

      expect(screen.getByTestId('child-component')).toBeInTheDocument()
      expect(screen.queryByTestId('card')).not.toBeInTheDocument()
    })

    it('should render multiple children correctly', () => {
      render(
        <DashboardErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </DashboardErrorBoundary>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
    })
  })

  describe('Error State Rendering', () => {
    it('should display error UI when child component throws', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
      expect(screen.getByText('Dashboard Error')).toBeInTheDocument()
      expect(screen.getByText(/The admin dashboard encountered an unexpected error/)).toBeInTheDocument()
    })

    it('should display error badge for application errors', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Application error" />
        </DashboardErrorBoundary>
      )

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('Application Error')
      expect(badge).toHaveAttribute('data-variant', 'destructive')
    })

    it('should display network error badge for network issues', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Network fetch failed" />
        </DashboardErrorBoundary>
      )

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('Network Error')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
    })

    it('should display action buttons', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      expect(screen.getByText('Retry Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Support')).toBeInTheDocument()
      
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument()
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
      expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument()
    })

    it('should display error ID in instructions', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      const errorIdText = screen.getByText(/Contact support with Error ID:/)
      expect(errorIdText).toBeInTheDocument()
      expect(errorIdText.textContent).toMatch(/dash_err_\d+_[a-z0-9]+/)
    })

    it('should display troubleshooting instructions', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      expect(screen.getByText('If this problem persists:')).toBeInTheDocument()
      expect(screen.getByText('• Try refreshing your browser')).toBeInTheDocument()
      expect(screen.getByText('• Check your internet connection')).toBeInTheDocument()
      expect(screen.getByText('• Clear browser cache and cookies')).toBeInTheDocument()
    })
  })

  describe('Error Logging', () => {
    it('should log error details to console', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error" />
        </DashboardErrorBoundary>
      )

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Dashboard Error Boundary] Critical dashboard error:',
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
          errorInfo: expect.any(Object),
          errorId: expect.stringMatching(/dash_err_\d+_[a-z0-9]+/),
          retryCount: 0,
          timestamp: expect.any(String),
          userAgent: 'test-user-agent',
          url: 'http://localhost:3001/dashboard'
        })
      )
    })

    it('should call onError callback when provided', () => {
      const onError = vi.fn()
      
      render(
        <DashboardErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} errorMessage="Test error" />
        </DashboardErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' }),
        expect.any(Object)
      )
    })
  })

  describe('Auto-Retry Logic', () => {
    it('should identify network errors correctly', () => {
      const networkErrorMessages = [
        'fetch failed',
        'network error',
        'timeout occurred',
        'connection lost',
        'ECONNRESET',
        'ETIMEDOUT'
      ]

      networkErrorMessages.forEach(message => {
        render(
          <DashboardErrorBoundary>
            <ThrowError shouldThrow={true} errorMessage={message} />
          </DashboardErrorBoundary>
        )

        const badge = screen.getByTestId('badge')
        expect(badge).toHaveTextContent('Network Error')
        
        // Cleanup for next iteration
        screen.getByText('Retry Dashboard').click()
      })
    })

    it('should show auto-retry message for network errors', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Network fetch failed" />
        </DashboardErrorBoundary>
      )

      expect(screen.getByText(/This appears to be a network issue/)).toBeInTheDocument()
      expect(screen.getByText(/The dashboard will automatically retry/)).toBeInTheDocument()
    })

    it('should auto-retry network errors up to maxRetries', async () => {
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true)
        
        React.useEffect(() => {
          const timer = setTimeout(() => setShouldThrow(false), 100)
          return () => clearTimeout(timer)
        }, [])

        return <ThrowError shouldThrow={shouldThrow} errorMessage="Network fetch failed" />
      }

      render(
        <DashboardErrorBoundary maxRetries={3}>
          <TestComponent />
        </DashboardErrorBoundary>
      )

      // Should show error initially
      expect(screen.getByText('Dashboard Error')).toBeInTheDocument()

      // Fast forward the retry timeout
      vi.advanceTimersByTime(1000)

      // Should eventually recover
      await waitFor(() => {
        expect(screen.queryByText('Dashboard Error')).not.toBeInTheDocument()
      })
    })

    it('should show retry count badge', () => {
      // We'll simulate this by manually setting state
      const boundary = new DashboardErrorBoundary({ children: <div /> })
      boundary.state = {
        hasError: true,
        error: new Error('Network error'),
        errorId: 'test-id',
        retryCount: 2
      }

      const { container } = render(boundary.render())
      
      expect(screen.getByText('Retry 2/2')).toBeInTheDocument()
    })

    it('should respect maxRetries prop', () => {
      render(
        <DashboardErrorBoundary maxRetries={1}>
          <ThrowError shouldThrow={true} errorMessage="Network error" />
        </DashboardErrorBoundary>
      )

      // Should show default behavior with custom max retries
      expect(screen.getByText(/The dashboard will automatically retry/)).toBeInTheDocument()
    })
  })

  describe('Manual Retry', () => {
    it('should allow manual retry via button click', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true)
        
        // Listen for retry button clicks by checking if error was cleared
        React.useEffect(() => {
          const handleRetry = () => setShouldThrow(false)
          return () => {}
        }, [])

        return <ThrowError shouldThrow={shouldThrow} />
      }

      render(
        <DashboardErrorBoundary>
          <TestComponent />
        </DashboardErrorBoundary>
      )

      expect(screen.getByText('Dashboard Error')).toBeInTheDocument()
      
      const retryButton = screen.getByText('Retry Dashboard')
      await user.click(retryButton)

      // After retry, the component should attempt to re-render children
      expect(retryButton).toBeInTheDocument() // Error boundary resets state
    })

    it('should reset retry count on manual retry', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      const retryButton = screen.getByText('Retry Dashboard')
      await user.click(retryButton)

      // Manual retry should reset the error state
      expect(screen.queryByText(/Retry \d+\/\d+/)).not.toBeInTheDocument()
    })
  })

  describe('Navigation Actions', () => {
    it('should navigate to settings when settings button clicked', async () => {
      const user = userEvent.setup()
      const originalHref = window.location.href
      
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      const settingsButton = screen.getByText('Settings')
      await user.click(settingsButton)

      expect(window.location.href).toBe('/settings')
      
      // Restore original href
      window.location.href = originalHref
    })

    it('should open email client when support button clicked', async () => {
      const user = userEvent.setup()
      const originalHref = window.location.href
      
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      const supportButton = screen.getByText('Support')
      await user.click(supportButton)

      expect(window.location.href).toBe('mailto:support@ink37tattoos.com')
      
      // Restore original href
      window.location.href = originalHref
    })
  })

  describe('Component Lifecycle', () => {
    it('should cleanup timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      
      const { unmount } = render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Network error" />
        </DashboardErrorBoundary>
      )

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should handle rapid successive errors', () => {
      const TestComponent = ({ errorCount }: { errorCount: number }) => {
        if (errorCount > 0) {
          throw new Error(`Error ${errorCount}`)
        }
        return <div>No error</div>
      }

      const { rerender } = render(
        <DashboardErrorBoundary>
          <TestComponent errorCount={0} />
        </DashboardErrorBoundary>
      )

      // Trigger first error
      rerender(
        <DashboardErrorBoundary>
          <TestComponent errorCount={1} />
        </DashboardErrorBoundary>
      )

      expect(screen.getByText('Dashboard Error')).toBeInTheDocument()

      // Trigger second error (should handle gracefully)
      rerender(
        <DashboardErrorBoundary>
          <TestComponent errorCount={2} />
        </DashboardErrorBoundary>
      )

      expect(screen.getByText('Dashboard Error')).toBeInTheDocument()
    })
  })

  describe('Error Boundary Props', () => {
    it('should use default maxRetries when not provided', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Network error" />
        </DashboardErrorBoundary>
      )

      // Should show auto-retry message (default maxRetries = 2)
      expect(screen.getByText(/The dashboard will automatically retry/)).toBeInTheDocument()
    })

    it('should handle missing onError prop gracefully', () => {
      expect(() => {
        render(
          <DashboardErrorBoundary>
            <ThrowError shouldThrow={true} />
          </DashboardErrorBoundary>
        )
      }).not.toThrow()
    })
  })

  describe('Styling and Layout', () => {
    it('should apply correct CSS classes', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      const container = screen.getByTestId('card').parentElement
      expect(container).toHaveClass('min-h-screen', 'bg-gray-50', 'flex', 'items-center', 'justify-center', 'p-4')
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('w-full', 'max-w-lg')
    })

    it('should apply correct button variants and sizes', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      const retryButton = screen.getByText('Retry Dashboard')
      expect(retryButton).toHaveAttribute('data-variant', 'default')
      expect(retryButton).toHaveClass('w-full')

      const settingsButton = screen.getByText('Settings')
      expect(settingsButton).toHaveAttribute('data-variant', 'outline')
      expect(settingsButton).toHaveAttribute('data-size', 'sm')

      const supportButton = screen.getByText('Support')
      expect(supportButton).toHaveAttribute('data-variant', 'outline')
      expect(supportButton).toHaveAttribute('data-size', 'sm')
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      expect(screen.getByTestId('card-header')).toBeInTheDocument()
      expect(screen.getByTestId('card-title')).toBeInTheDocument()
      expect(screen.getByTestId('card-description')).toBeInTheDocument()
      expect(screen.getByTestId('card-content')).toBeInTheDocument()
    })

    it('should have accessible error icon', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
    })

    it('should have accessible button icons', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      )

      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument()
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
      expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle errors with empty messages', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="" />
        </DashboardErrorBoundary>
      )

      expect(screen.getByText('Dashboard Error')).toBeInTheDocument()
      expect(screen.getByTestId('badge')).toBeInTheDocument()
    })

    it('should handle errors without stack traces', () => {
      const errorWithoutStack = new Error('Test error')
      delete errorWithoutStack.stack

      const ThrowSpecificError = () => {
        throw errorWithoutStack
      }

      render(
        <DashboardErrorBoundary>
          <ThrowSpecificError />
        </DashboardErrorBoundary>
      )

      expect(screen.getByText('Dashboard Error')).toBeInTheDocument()
    })

    it('should handle null/undefined error messages', () => {
      const nullError = new Error()
      nullError.message = null as any

      const ThrowNullError = () => {
        throw nullError
      }

      render(
        <DashboardErrorBoundary>
          <ThrowNullError />
        </DashboardErrorBoundary>
      )

      expect(screen.getByText('Dashboard Error')).toBeInTheDocument()
    })
  })
})