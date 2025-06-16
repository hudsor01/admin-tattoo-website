import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogoutButton, LogoutMenuItem } from '@/components/auth/logout-button'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

// Mock dependencies
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: vi.fn()
  }
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// Mock console to avoid noise
const originalConsoleError = console.error

describe('LogoutButton', () => {
  const mockPush = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    console.error = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn()
    } as any)
  })

  afterEach(() => {
    console.error = originalConsoleError
  })

  describe('Basic rendering', () => {
    it('should render with default props', () => {
      render(<LogoutButton />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('flex', 'items-center', 'gap-2')
    })

    it('should render with custom children', () => {
      render(<LogoutButton>Custom Logout Text</LogoutButton>)
      
      expect(screen.getByText('Custom Logout Text')).toBeInTheDocument()
    })

    it('should render without icon when showIcon is false', () => {
      const { container } = render(<LogoutButton showIcon={false} />)
      
      const icon = container.querySelector('svg')
      expect(icon).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<LogoutButton className="custom-class" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should apply variant and size props', () => {
      render(<LogoutButton variant="destructive" size="lg" />)
      
      const button = screen.getByRole('button')
      // The exact classes depend on the Button component implementation
      expect(button).toBeInTheDocument()
    })
  })

  describe('With confirmation dialog', () => {
    it('should show confirmation dialog when clicked', async () => {
      const user = userEvent.setup()
      render(<LogoutButton showConfirmDialog={true} />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      await user.click(button)
      
      // Check dialog content
      expect(screen.getByText(/are you sure you want to sign out/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      
      // Check that dialog is open by finding the specific dialog button
      const dialogContent = screen.getByRole('alertdialog')
      expect(dialogContent).toBeInTheDocument()
    })

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<LogoutButton showConfirmDialog={true} />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      await user.click(button)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to sign out/i)).not.toBeInTheDocument()
      })
    })

    it('should logout when confirmed', async () => {
      const user = userEvent.setup()
      vi.mocked(authClient.signOut).mockResolvedValueOnce(undefined)
      
      render(<LogoutButton showConfirmDialog={true} />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      await user.click(button)
      
      // Find the confirm button by looking within the dialog
      const dialog = screen.getByRole('alertdialog')
      const confirmButton = within(dialog).getByRole('button', { name: /sign out/i })
      
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(authClient.signOut).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Without confirmation dialog', () => {
    it('should logout immediately when clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(authClient.signOut).mockResolvedValueOnce(undefined)
      
      render(<LogoutButton showConfirmDialog={false} />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(authClient.signOut).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('should redirect to custom path', async () => {
      const user = userEvent.setup()
      vi.mocked(authClient.signOut).mockResolvedValueOnce(undefined)
      
      render(<LogoutButton showConfirmDialog={false} redirectTo="/custom" />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom')
      })
    })
  })

  describe('Loading state', () => {
    it('should show loading spinner during logout', async () => {
      const user = userEvent.setup()
      
      let resolveLogout: () => void
      const logoutPromise = new Promise<void>(resolve => {
        resolveLogout = resolve
      })
      vi.mocked(authClient.signOut).mockReturnValue(logoutPromise)
      
      render(<LogoutButton showConfirmDialog={false} />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      await user.click(button)
      
      // Should show loading spinner immediately
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(button).toBeDisabled()
      
      // Complete the logout
      resolveLogout!()
      await logoutPromise
    })
  })

  describe('Error handling', () => {
    it('should handle logout error gracefully', async () => {
      const user = userEvent.setup()
      const error = new Error('Logout failed')
      vi.mocked(authClient.signOut).mockRejectedValueOnce(error)
      
      render(<LogoutButton showConfirmDialog={false} />)
      
      const button = screen.getByRole('button', { name: /sign out/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Logout error:', error)
        expect(button).not.toBeDisabled()
        // Should not redirect on error
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })
})

describe('LogoutMenuItem', () => {
  const mockPush = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    console.error = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn()
    } as any)
  })

  afterEach(() => {
    console.error = originalConsoleError
  })

  it('should render logout menu item', () => {
    render(<LogoutMenuItem />)
    
    const button = screen.getByRole('button', { name: /sign out/i })
    expect(button).toBeInTheDocument()
    expect(button.tagName).toBe('BUTTON')
  })

  it('should apply custom className', () => {
    render(<LogoutMenuItem className="custom-menu-class" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-menu-class')
  })

  it('should logout and call onLogout callback', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    vi.mocked(authClient.signOut).mockResolvedValueOnce(undefined)
    
    render(<LogoutMenuItem onLogout={onLogout} />)
    
    const button = screen.getByRole('button', { name: /sign out/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(authClient.signOut).toHaveBeenCalled()
      expect(onLogout).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should show loading state during logout', async () => {
    const user = userEvent.setup()
    vi.mocked(authClient.signOut).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(<LogoutMenuItem />)
    
    const button = screen.getByRole('button', { name: /sign out/i })
    await user.click(button)
    
    // Should show loading spinner
    const spinner = button.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(button).toBeDisabled()
    
    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  it('should handle logout error', async () => {
    const user = userEvent.setup()
    const error = new Error('Logout failed')
    vi.mocked(authClient.signOut).mockRejectedValueOnce(error)
    
    render(<LogoutMenuItem />)
    
    const button = screen.getByRole('button', { name: /sign out/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Logout error:', error)
      expect(button).not.toBeDisabled()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})