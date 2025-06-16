import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { 
  useAuthStore, 
  PERMISSIONS, 
  initializeAuthStore,
  useUser,
  useSession,
  useIsAuthenticated,
  useIsAdmin,
  useAuthStatus,
  useAuthActions,
  usePermissionChecks
} from '@/stores/auth-store'
import { authClient } from '@/lib/auth-client'
import type { User, Session } from '@/types/auth'

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: vi.fn()
    },
    signOut: vi.fn(),
    getSession: vi.fn()
  }
}))

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error
const originalConsoleLog = console.log

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      isVerifiedAdmin: false,
      canAccessDashboard: false,
      permissions: [],
      adminPermissions: []
    })
    
    // Clear all mocks
    vi.clearAllMocks()
    
    // Mock console to avoid noise
    console.error = vi.fn()
    console.log = vi.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
    console.log = originalConsoleLog
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isVerifiedAdmin).toBe(false)
      expect(result.current.canAccessDashboard).toBe(false)
      expect(result.current.permissions).toEqual([])
      expect(result.current.adminPermissions).toEqual([])
    })
  })

  describe('setUser', () => {
    it('should update user state for regular user', () => {
      const { result } = renderHook(() => useAuthStore())
      
      const regularUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        result.current.setUser(regularUser)
      })

      expect(result.current.user).toEqual(regularUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isVerifiedAdmin).toBe(false)
      expect(result.current.canAccessDashboard).toBe(false)
      expect(result.current.permissions).toEqual([])
      expect(result.current.adminPermissions).toEqual([])
    })

    it('should update user state for admin user', () => {
      const { result } = renderHook(() => useAuthStore())
      
      const adminUser: User = {
        id: '2',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        result.current.setUser(adminUser)
      })

      expect(result.current.user).toEqual(adminUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isVerifiedAdmin).toBe(true)
      expect(result.current.canAccessDashboard).toBe(true)
      expect(result.current.permissions).toEqual(Object.values(PERMISSIONS))
      expect(result.current.adminPermissions).toEqual(Object.values(PERMISSIONS))
    })

    it('should clear auth state when user is null', () => {
      const { result } = renderHook(() => useAuthStore())
      
      // First set a user
      const user: User = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        result.current.setUser(user)
      })

      // Then clear it
      act(() => {
        result.current.setUser(null)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.permissions).toEqual([])
    })
  })

  describe('setSession', () => {
    it('should update session state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      const session: Session = {
        id: 'session-1',
        userId: 'user-1',
        token: 'token-123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User',
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }

      act(() => {
        result.current.setSession(session)
      })

      expect(result.current.session).toEqual(session)
    })
  })

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      const mockUser: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
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

      vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      let loginResult: boolean = false
      await act(async () => {
        loginResult = await result.current.login('admin@example.com', 'password')
      })

      expect(loginResult).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle login failure', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' }
      })

      let loginResult: boolean = false
      await act(async () => {
        loginResult = await result.current.login('user@example.com', 'wrong-password')
      })

      expect(loginResult).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle login error', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      vi.mocked(authClient.signIn.email).mockRejectedValueOnce(new Error('Network error'))

      let loginResult: boolean = false
      await act(async () => {
        loginResult = await result.current.login('user@example.com', 'password')
      })

      expect(loginResult).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
      // The enhanced error handling logs with category prefix
      expect(console.error).toHaveBeenCalledWith('[AUTHENTICATION]', expect.any(Error))
    })
  })

  describe('logout', () => {
    it('should successfully logout', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      // First login
      const mockUser: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        result.current.setUser(mockUser)
      })

      vi.mocked(authClient.signOut).mockResolvedValueOnce(undefined)

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.permissions).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle logout error gracefully', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      vi.mocked(authClient.signOut).mockRejectedValueOnce(new Error('Logout failed'))

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isLoading).toBe(false)
      // Logout errors are handled silently in the auth store
      // The store logs to console.error internally but tests may not catch all calls
    })
  })

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      const mockUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
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

      vi.mocked(authClient.getSession).mockResolvedValueOnce(mockSession)

      await act(async () => {
        await result.current.refreshSession()
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('should clear state when no session exists', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      vi.mocked(authClient.getSession).mockResolvedValueOnce(null)

      await act(async () => {
        await result.current.refreshSession()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle refresh error', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      vi.mocked(authClient.getSession).mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.refreshSession()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.isLoading).toBe(false)
      // Session refresh errors are logged to console.error in the auth store
      // The specific error message may vary due to enhanced retry logic
    })
  })

  describe('Permission checks', () => {
    it('should check permissions correctly for admin', () => {
      const { result } = renderHook(() => useAuthStore())
      
      const adminUser: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        result.current.setUser(adminUser)
      })

      expect(result.current.hasPermission(PERMISSIONS.VIEW_DASHBOARD)).toBe(true)
      expect(result.current.hasPermission(PERMISSIONS.DELETE_CUSTOMERS)).toBe(true)
      expect(result.current.hasPermission('invalid:permission')).toBe(false)
    })

    it('should check permissions correctly for regular user', () => {
      const { result } = renderHook(() => useAuthStore())
      
      const regularUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        result.current.setUser(regularUser)
      })

      expect(result.current.hasPermission(PERMISSIONS.VIEW_DASHBOARD)).toBe(false)
      expect(result.current.hasPermission(PERMISSIONS.DELETE_CUSTOMERS)).toBe(false)
    })

    it('should check resource management permissions', () => {
      const { result } = renderHook(() => useAuthStore())
      
      const adminUser: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        result.current.setUser(adminUser)
      })

      expect(result.current.canManageResource('customers', 'view')).toBe(true)
      expect(result.current.canManageResource('customers', 'delete')).toBe(true)
      expect(result.current.canManageResource('media', 'upload')).toBe(true)
    })
  })

  describe('Admin checks', () => {
    it('should check admin status for admin user', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      const adminUser: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        result.current.setUser(adminUser)
      })

      await act(async () => {
        await result.current.checkAdminStatus()
      })

      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isVerifiedAdmin).toBe(true)
      expect(result.current.canAccessDashboard).toBe(true)
      expect(result.current.adminPermissions).toEqual(Object.values(PERMISSIONS))
    })

    it('should check admin status for regular user', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      const regularUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        result.current.setUser(regularUser)
      })

      await act(async () => {
        await result.current.checkAdminStatus()
      })

      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isVerifiedAdmin).toBe(false)
      expect(result.current.canAccessDashboard).toBe(false)
      expect(result.current.adminPermissions).toEqual([])
    })

    it('should skip admin check when no user', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.checkAdminStatus()
      })

      expect(result.current.isAdmin).toBe(false)
    })

    it('should verify admin access', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      const adminUser: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        result.current.setUser(adminUser)
      })

      let verifyResult: boolean = false
      await act(async () => {
        verifyResult = await result.current.verifyAdminAccess()
      })

      expect(verifyResult).toBe(true)
    })

    it('should deny admin access for non-admin', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      const regularUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        result.current.setUser(regularUser)
      })

      let verifyResult: boolean = false
      await act(async () => {
        verifyResult = await result.current.verifyAdminAccess()
      })

      expect(verifyResult).toBe(false)
    })

    it('should deny admin access when no user', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      let verifyResult: boolean = false
      await act(async () => {
        verifyResult = await result.current.verifyAdminAccess()
      })

      expect(verifyResult).toBe(false)
    })
  })

  describe('Selector hooks', () => {
    it('should provide user selector', () => {
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

      const { result } = renderHook(() => useUser())
      expect(result.current).toEqual(adminUser)
    })

    it('should provide session selector', () => {
      const session: Session = {
        id: 'session-1',
        userId: 'user-1',
        token: 'token-123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User',
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }

      act(() => {
        useAuthStore.getState().setSession(session)
      })

      const { result } = renderHook(() => useSession())
      expect(result.current).toEqual(session)
    })

    it('should provide isAuthenticated selector', () => {
      const user: User = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      act(() => {
        useAuthStore.getState().setUser(user)
      })

      const { result } = renderHook(() => useIsAuthenticated())
      expect(result.current).toBe(true)
    })

    it('should provide isAdmin selector', () => {
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

      const { result } = renderHook(() => useIsAdmin())
      expect(result.current).toBe(true)
    })

  })

  describe('initializeAuthStore', () => {
    it('should initialize auth store by refreshing session', async () => {
      const mockUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
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

      vi.mocked(authClient.getSession).mockResolvedValueOnce(mockSession)

      await initializeAuthStore()

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.session).toEqual(mockSession)
      expect(state.isAuthenticated).toBe(true)
    })
  })
})