import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { 
  AuthProvider, 
  useAuth, 
  useRequireAuth, 
  useRequireAdmin 
} from '@/components/providers/AuthProvider'

// Mock auth store
const mockInitializeAuthStore = vi.fn()
const mockUseUser = vi.fn()
const mockUseAuthStatus = vi.fn()

vi.mock('@/stores/auth-store', () => ({
  useUser: () => mockUseUser(),
  useAuthStatus: () => mockUseAuthStatus(),
  initializeAuthStore: () => mockInitializeAuthStore(),
}))

// Test wrapper component
const TestComponent = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="test-wrapper">{children}</div>
)

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock returns
    mockUseUser.mockReturnValue(null)
    mockUseAuthStatus.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
    })
    mockInitializeAuthStore.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render children without wrapper', () => {
      render(
        <AuthProvider>
          <TestComponent>
            <div>Test Content</div>
          </TestComponent>
        </AuthProvider>
      )

      expect(screen.getByTestId('test-wrapper')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should not add any additional DOM nodes', () => {
      const { container } = render(
        <AuthProvider>
          <div data-testid="direct-child">Direct Child</div>
        </AuthProvider>
      )

      const directChild = screen.getByTestId('direct-child')
      expect(directChild.parentElement).toBe(container)
    })

    it('should render multiple children', () => {
      render(
        <AuthProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </AuthProvider>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      const { container } = render(<AuthProvider>{null}</AuthProvider>)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Authentication Initialization', () => {
    it('should call initializeAuthStore on mount', async () => {
      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockInitializeAuthStore).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle initialization errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const initError = new Error('Initialization failed')
      mockInitializeAuthStore.mockRejectedValue(initError)

      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockInitializeAuthStore).toHaveBeenCalledTimes(1)
        expect(consoleErrorSpy).toHaveBeenCalledWith(initError)
      })

      consoleErrorSpy.mockRestore()
    })

    it('should only initialize once on multiple renders', async () => {
      const { rerender } = render(
        <AuthProvider>
          <div>Test 1</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockInitializeAuthStore).toHaveBeenCalledTimes(1)
      })

      rerender(
        <AuthProvider>
          <div>Test 2</div>
        </AuthProvider>
      )

      // Should not call again on rerender
      expect(mockInitializeAuthStore).toHaveBeenCalledTimes(1)
    })

    it('should handle slow initialization', async () => {
      let resolveInit: () => void
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve
      })
      mockInitializeAuthStore.mockReturnValue(initPromise)

      render(
        <AuthProvider>
          <div data-testid="content">Loading...</div>
        </AuthProvider>
      )

      // Content should render immediately even if init is pending
      expect(screen.getByTestId('content')).toBeInTheDocument()

      // Complete initialization
      resolveInit!()
      await waitFor(() => {
        expect(mockInitializeAuthStore).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Lifecycle Behavior', () => {
    it('should cleanup properly on unmount', async () => {
      const { unmount } = render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockInitializeAuthStore).toHaveBeenCalledTimes(1)
      })

      unmount()

      // Should not cause any errors or warnings
      expect(mockInitializeAuthStore).toHaveBeenCalledTimes(1)
    })

    it('should handle remounting', async () => {
      const { unmount, rerender } = render(
        <AuthProvider>
          <div>Test 1</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockInitializeAuthStore).toHaveBeenCalledTimes(1)
      })

      unmount()

      rerender(
        <AuthProvider>
          <div>Test 2</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockInitializeAuthStore).toHaveBeenCalledTimes(2)
      })
    })
  })
})

describe('useAuth Hook', () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    mockInitializeAuthStore.mockResolvedValue(undefined)
  })

  describe('Basic Functionality', () => {
    it('should return user and auth status', () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'user' }
      mockUseUser.mockReturnValue(mockUser)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false,
      })

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should return loading state', () => {
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
      })

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should return admin status', () => {
      const mockAdmin = { id: '1', email: 'admin@example.com', role: 'admin' }
      mockUseUser.mockReturnValue(mockAdmin)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: true,
      })

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper })

      expect(result.current.user).toEqual(mockAdmin)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('Session Compatibility', () => {
    it('should provide session object for backward compatibility', () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'user' }
      mockUseUser.mockReturnValue(mockUser)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false,
      })

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper })

      expect(result.current.session).toEqual({
        data: { user: mockUser },
        isPending: false,
        error: null,
      })
    })

    it('should provide null session data when not authenticated', () => {
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      })

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper })

      expect(result.current.session).toEqual({
        data: null,
        isPending: false,
        error: null,
      })
    })

    it('should show pending session during loading', () => {
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
      })

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper })

      expect(result.current.session).toEqual({
        data: null,
        isPending: true,
        error: null,
      })
    })
  })

  describe('State Updates', () => {
    it('should react to user changes', () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper: TestWrapper })

      // Initial state - no user
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      })

      rerender()
      expect(result.current.user).toBeNull()

      // User logged in
      const mockUser = { id: '1', email: 'test@example.com', role: 'user' }
      mockUseUser.mockReturnValue(mockUser)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false,
      })

      rerender()
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should react to admin status changes', () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'user' }
      const { result, rerender } = renderHook(() => useAuth(), { wrapper: TestWrapper })

      // Regular user
      mockUseUser.mockReturnValue(mockUser)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false,
      })

      rerender()
      expect(result.current.isAdmin).toBe(false)

      // Promoted to admin
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: true,
      })

      rerender()
      expect(result.current.isAdmin).toBe(true)
    })
  })
})

describe('useRequireAuth Hook', () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    mockInitializeAuthStore.mockResolvedValue(undefined)
  })

  describe('Successful Authentication', () => {
    it('should return user when authenticated', () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'user' }
      mockUseUser.mockReturnValue(mockUser)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false,
      })

      const { result } = renderHook(() => useRequireAuth(), { wrapper: TestWrapper })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
    })

    it('should allow loading state', () => {
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
      })

      const { result } = renderHook(() => useRequireAuth(), { wrapper: TestWrapper })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('Authentication Required Errors', () => {
    it('should throw error when not authenticated and not loading', () => {
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      })

      expect(() => {
        renderHook(() => useRequireAuth(), { wrapper: TestWrapper })
      }).toThrow('Authentication required')
    })

    it('should not throw during loading state', () => {
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
      })

      expect(() => {
        renderHook(() => useRequireAuth(), { wrapper: TestWrapper })
      }).not.toThrow()
    })

    it('should handle transition from loading to unauthenticated', () => {
      const { rerender } = renderHook(() => {
        try {
          return useRequireAuth()
        } catch (error) {
          return { error: (error as Error).message }
        }
      }, { wrapper: TestWrapper })

      // Start with loading state
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
      })

      // Should not throw during loading
      rerender()

      // Transition to unauthenticated
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      })

      // Should throw after loading completes
      const { result } = renderHook(() => {
        try {
          return useRequireAuth()
        } catch (error) {
          return { error: (error as Error).message }
        }
      }, { wrapper: TestWrapper })

      expect(result.current).toEqual({ error: 'Authentication required' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle user present but not authenticated flag', () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'user' }
      mockUseUser.mockReturnValue(mockUser)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: false, // Flag not set despite user presence
        isAdmin: false,
      })

      const { result } = renderHook(() => useRequireAuth(), { wrapper: TestWrapper })

      // Should return user regardless of isAuthenticated flag
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle undefined user vs null user', () => {
      mockUseUser.mockReturnValue(undefined as any)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      })

      expect(() => {
        renderHook(() => useRequireAuth(), { wrapper: TestWrapper })
      }).toThrow('Authentication required')
    })
  })
})

describe('useRequireAdmin Hook', () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    mockInitializeAuthStore.mockResolvedValue(undefined)
  })

  describe('Successful Admin Authentication', () => {
    it('should return user when admin', () => {
      const mockAdmin = { id: '1', email: 'admin@example.com', role: 'admin' }
      mockUseUser.mockReturnValue(mockAdmin)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: true,
      })

      const { result } = renderHook(() => useRequireAdmin(), { wrapper: TestWrapper })

      expect(result.current.user).toEqual(mockAdmin)
      expect(result.current.isLoading).toBe(false)
    })

    it('should allow loading state', () => {
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
      })

      const { result } = renderHook(() => useRequireAdmin(), { wrapper: TestWrapper })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('Admin Access Required Errors', () => {
    it('should throw error when not admin and not loading', () => {
      const mockUser = { id: '1', email: 'user@example.com', role: 'user' }
      mockUseUser.mockReturnValue(mockUser)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false,
      })

      expect(() => {
        renderHook(() => useRequireAdmin(), { wrapper: TestWrapper })
      }).toThrow('Admin access required')
    })

    it('should throw error when not authenticated', () => {
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      })

      expect(() => {
        renderHook(() => useRequireAdmin(), { wrapper: TestWrapper })
      }).toThrow('Admin access required')
    })

    it('should not throw during loading state', () => {
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
      })

      expect(() => {
        renderHook(() => useRequireAdmin(), { wrapper: TestWrapper })
      }).not.toThrow()
    })

    it('should handle transition from loading to non-admin', () => {
      const { rerender } = renderHook(() => {
        try {
          return useRequireAdmin()
        } catch (error) {
          return { error: (error as Error).message }
        }
      }, { wrapper: TestWrapper })

      // Start with loading state
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isAdmin: false,
      })

      // Should not throw during loading
      rerender()

      // Transition to non-admin user
      const mockUser = { id: '1', email: 'user@example.com', role: 'user' }
      mockUseUser.mockReturnValue(mockUser)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false,
      })

      // Should throw after loading completes with non-admin user
      const { result } = renderHook(() => {
        try {
          return useRequireAdmin()
        } catch (error) {
          return { error: (error as Error).message }
        }
      }, { wrapper: TestWrapper })

      expect(result.current).toEqual({ error: 'Admin access required' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle admin user with isAdmin false flag', () => {
      const mockAdmin = { id: '1', email: 'admin@example.com', role: 'admin' }
      mockUseUser.mockReturnValue(mockAdmin)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false, // Flag inconsistent with user role
      })

      expect(() => {
        renderHook(() => useRequireAdmin(), { wrapper: TestWrapper })
      }).toThrow('Admin access required')
    })

    it('should handle user with admin role but no user object', () => {
      mockUseUser.mockReturnValue(null)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: true, // Admin flag but no user
      })

      expect(() => {
        renderHook(() => useRequireAdmin(), { wrapper: TestWrapper })
      }).toThrow('Admin access required')
    })

    it('should handle inconsistent authentication state', () => {
      const mockUser = { id: '1', email: 'user@example.com', role: 'user' }
      mockUseUser.mockReturnValue(mockUser)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: false, // Not authenticated but has user
        isAdmin: true, // Admin but not authenticated
      })

      expect(() => {
        renderHook(() => useRequireAdmin(), { wrapper: TestWrapper })
      }).toThrow('Admin access required')
    })
  })

  describe('State Transitions', () => {
    it('should handle promotion to admin', () => {
      const mockUser = { id: '1', email: 'user@example.com', role: 'user' }
      const { result, rerender } = renderHook(() => {
        try {
          return useRequireAdmin()
        } catch (error) {
          return { error: (error as Error).message }
        }
      }, { wrapper: TestWrapper })

      // Start as regular user
      mockUseUser.mockReturnValue(mockUser)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false,
      })

      rerender()
      expect(result.current).toEqual({ error: 'Admin access required' })

      // Promoted to admin
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: true,
      })

      const { result: adminResult } = renderHook(() => useRequireAdmin(), { wrapper: TestWrapper })
      expect(adminResult.current.user).toEqual(mockUser)
      expect(adminResult.current.isLoading).toBe(false)
    })

    it('should handle demotion from admin', () => {
      const mockUser = { id: '1', email: 'admin@example.com', role: 'admin' }
      const { rerender } = renderHook(() => {
        try {
          return useRequireAdmin()
        } catch (error) {
          return { error: (error as Error).message }
        }
      }, { wrapper: TestWrapper })

      // Start as admin
      mockUseUser.mockReturnValue(mockUser)
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: true,
      })

      rerender()

      // Demoted to regular user
      mockUseAuthStatus.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false,
      })

      const { result } = renderHook(() => {
        try {
          return useRequireAdmin()
        } catch (error) {
          return { error: (error as Error).message }
        }
      }, { wrapper: TestWrapper })

      expect(result.current).toEqual({ error: 'Admin access required' })
    })
  })
})

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInitializeAuthStore.mockResolvedValue(undefined)
  })

  it('should work together with AuthProvider', async () => {
    const mockUser = { id: '1', email: 'admin@example.com', role: 'admin' }
    mockUseUser.mockReturnValue(mockUser)
    mockUseAuthStatus.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: true,
    })

    const TestComponent = () => {
      const auth = useAuth()
      const requireAuth = useRequireAuth()
      const requireAdmin = useRequireAdmin()

      return (
        <div>
          <div data-testid="auth-user">{auth.user?.email}</div>
          <div data-testid="require-auth-user">{requireAuth.user?.email}</div>
          <div data-testid="require-admin-user">{requireAdmin.user?.email}</div>
          <div data-testid="is-admin">{auth.isAdmin.toString()}</div>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockInitializeAuthStore).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByTestId('auth-user')).toHaveTextContent('admin@example.com')
    expect(screen.getByTestId('require-auth-user')).toHaveTextContent('admin@example.com')
    expect(screen.getByTestId('require-admin-user')).toHaveTextContent('admin@example.com')
    expect(screen.getByTestId('is-admin')).toHaveTextContent('true')
  })

  it('should handle error states in components', async () => {
    mockUseUser.mockReturnValue(null)
    mockUseAuthStatus.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
    })

    const TestComponent = () => {
      try {
        useRequireAuth()
        return <div>Should not render</div>
      } catch (error) {
        return <div data-testid="auth-error">{(error as Error).message}</div>
      }
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockInitializeAuthStore).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByTestId('auth-error')).toHaveTextContent('Authentication required')
  })
})