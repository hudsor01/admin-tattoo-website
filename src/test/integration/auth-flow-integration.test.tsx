import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { authClient } from '@/lib/auth-client'
import { useAuthStore, initializeAuthStore } from '@/stores/auth-store'
import type { User, Session } from '@/types/auth'

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
      social: vi.fn()
    },
    signOut: vi.fn(),
    signUp: {
      email: vi.fn()
    },
    getSession: vi.fn(),
    useSession: vi.fn(),
    forgetPassword: vi.fn(),
    resetPassword: vi.fn()
  }
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn()
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams()
}))

// Test component for integration testing
function TestAuthComponent() {
  const { user, isAuthenticated, isAdmin, login, logout } = useAuthStore()
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'unauthenticated'}
      </div>
      <div data-testid="user-info">
        {user ? `${user.name} (${user.role})` : 'No user'}
      </div>
      <div data-testid="admin-status">
        {isAdmin ? 'admin' : 'not-admin'}
      </div>
      <button 
        data-testid="login-btn" 
        onClick={() => login('test@example.com', 'password')}
      >
        Login
      </button>
      <button 
        data-testid="logout-btn" 
        onClick={() => logout()}
      >
        Logout
      </button>
    </div>
  )
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <AuthUIProvider>
        {children}
      </AuthUIProvider>
    </QueryClientProvider>
  )
}

describe('Auth Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset auth store to initial state
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      isVerifiedAdmin: false,
      canAccessDashboard: false,
      permissions: [],
      adminPermissions: []
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('User Authentication Flow', () => {
    it('should handle complete login flow', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const mockSession: Session = {
        id: 'session-1',
        userId: '1',
        token: 'token-123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: mockUser
      }

      vi.mocked(authClient.signIn.email).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      } as any)

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      )

      // Initial state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated')
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user')
      expect(screen.getByTestId('admin-status')).toHaveTextContent('not-admin')

      // Trigger login
      fireEvent.click(screen.getByTestId('login-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
        expect(screen.getByTestId('user-info')).toHaveTextContent('Test User (user)')
        expect(screen.getByTestId('admin-status')).toHaveTextContent('not-admin')
      })

      expect(authClient.signIn.email).toHaveBeenCalledWith(
        'test@example.com',
        'password'
      )
    })

    it('should handle admin login flow', async () => {
      const mockAdminUser: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const mockSession: Session = {
        id: 'session-1',
        userId: '1',
        token: 'token-123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: mockAdminUser
      }

      vi.mocked(authClient.signIn.email).mockResolvedValue({
        data: { user: mockAdminUser, session: mockSession },
        error: null
      } as any)

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('login-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
        expect(screen.getByTestId('user-info')).toHaveTextContent('Admin User (admin)')
        expect(screen.getByTestId('admin-status')).toHaveTextContent('admin')
      })
    })

    it('should handle login failure', async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      } as any)

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('login-btn'))

      await waitFor(() => {
        // Should remain unauthenticated
        expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated')
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user')
      })
    })

    it('should handle logout flow', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Set initial authenticated state
      act(() => {
        useAuthStore.getState().setUser(mockUser)
      })

      vi.mocked(authClient.signOut).mockResolvedValue({
        success: true
      } as any)

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      )

      // Verify authenticated state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')

      // Trigger logout
      fireEvent.click(screen.getByTestId('logout-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated')
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user')
      })

      expect(authClient.signOut).toHaveBeenCalled()
    })
  })

  describe('Session Management Integration', () => {
    it('should initialize auth store with existing session', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const mockSession: Session = {
        id: 'session-1',
        userId: '1',
        token: 'token-123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: mockUser
      }

      vi.mocked(authClient.getSession).mockResolvedValue(mockSession)

      await initializeAuthStore()

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.session).toEqual(mockSession)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isAdmin).toBe(true)
      expect(state.canAccessDashboard).toBe(true)
    })

    it('should handle session initialization failure', async () => {
      vi.mocked(authClient.getSession).mockRejectedValue(
        new Error('Session fetch failed')
      )

      await initializeAuthStore()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it('should handle expired session', async () => {
      const expiredSession: Session = {
        id: 'session-1',
        userId: '1',
        token: 'token-123',
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // Expired
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }

      vi.mocked(authClient.getSession).mockResolvedValue(expiredSession)

      await initializeAuthStore()

      const state = useAuthStore.getState()
      // Should not authenticate with expired session
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('Permission Integration', () => {
    it('should handle permission checks for admin user', async () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        useAuthStore.getState().setUser(adminUser)
      })

      const state = useAuthStore.getState()
      expect(state.isAdmin).toBe(true)
      expect(state.isVerifiedAdmin).toBe(true)
      expect(state.canAccessDashboard).toBe(true)
      
      // Check permission functions
      expect(state.hasPermission('VIEW_DASHBOARD')).toBe(true)
      expect(state.hasPermission('ADMIN_ACCESS')).toBe(true)
      expect(state.canManageResource('customers')).toBe(true)
    })

    it('should handle permission checks for regular user', async () => {
      const regularUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        useAuthStore.getState().setUser(regularUser)
      })

      const state = useAuthStore.getState()
      expect(state.isAdmin).toBe(false)
      expect(state.isVerifiedAdmin).toBe(false)
      expect(state.canAccessDashboard).toBe(false)
      
      // Check permission functions
      expect(state.hasPermission('VIEW_DASHBOARD')).toBe(false)
      expect(state.hasPermission('ADMIN_ACCESS')).toBe(false)
      expect(state.canManageResource('customers')).toBe(false)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle network errors during login', async () => {
      vi.mocked(authClient.signIn.email).mockRejectedValue(
        new Error('Network error')
      )

      render(
        <TestWrapper>
          <TestAuthComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('login-btn'))

      await waitFor(() => {
        // Should remain unauthenticated
        expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated')
      })
    })

    it('should handle malformed session data', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue(null)

      await initializeAuthStore()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('Social Authentication Integration', () => {
    it('should handle Google OAuth login', async () => {
      const mockUser: User = {
        id: '1',
        email: 'google@example.com',
        name: 'Google User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      vi.mocked(authClient.signIn.social).mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any)

      const { login } = useAuthStore.getState()
      
      await act(async () => {
        await login('google@example.com', 'password', 'google')
      })

      expect(authClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/dashboard'
      })
    })
  })
})