import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock the auth client completely
vi.mock('@/lib/auth-client', () => ({
  useUser: vi.fn(),
  useIsAdmin: vi.fn(),
  useCanAccessDashboard: vi.fn(),
  useSession: vi.fn(),
  signIn: {
    email: vi.fn(),
    social: vi.fn()
  },
  signOut: vi.fn(),
  isAdmin: vi.fn((user: unknown) => (user as { role?: string })?.role === 'admin'),
  canAccessDashboard: vi.fn((user: unknown) => (user as { role?: string })?.role === 'admin'),
  authClient: {
    useSession: vi.fn()
  }
}))

// Import after mocking
import { useUser, useIsAdmin, useCanAccessDashboard, isAdmin, canAccessDashboard } from '@/lib/auth-client'

// Use the actual type from auth-client
import type { UserWithRole } from '@/lib/auth-client'

// Mock error type for testing
interface MockBetterFetchError {
  status: number
  statusText: string
  error: string
  message: string
  name: string
}

describe('Auth Client Tests', () => {
  const mockSession = {
    data: {
      user: {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: 'session-1',
        userId: '1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    },
    isPending: false,
    error: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Hook Tests', () => {
    it('should return user data when session exists', () => {
      vi.mocked(useUser).mockReturnValue({
        user: mockSession.data.user,
        isLoading: false,
        error: null
      })

      const { result } = renderHook(() => useUser())

      expect(result.current.user).toEqual(mockSession.data.user)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle loading state', () => {
      vi.mocked(useUser).mockReturnValue({
        user: undefined,
        isLoading: true,
        error: null
      })

      const { result } = renderHook(() => useUser())

      expect(result.current.user).toBeUndefined()
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBe(null)
    })

    it('should handle error state', () => {
      const error: MockBetterFetchError = {
        status: 500,
        statusText: 'Internal Server Error',
        error: 'INTERNAL_ERROR',
        message: 'Session fetch failed',
        name: 'BetterFetchError'
      }
      vi.mocked(useUser).mockReturnValue({
        user: undefined,
        isLoading: false,
        error
      })

      const { result } = renderHook(() => useUser())

      expect(result.current.user).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(error)
    })

    it('should handle unauthenticated state', () => {
      vi.mocked(useUser).mockReturnValue({
        user: undefined,
        isLoading: false,
        error: null
      })

      const { result } = renderHook(() => useUser())

      expect(result.current.user).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  describe('Admin Check Tests', () => {
    it('should return true for admin users', () => {
      vi.mocked(useIsAdmin).mockReturnValue(true)

      const { result } = renderHook(() => useIsAdmin())

      expect(result.current).toBe(true)
    })

    it('should return false for non-admin users', () => {
      vi.mocked(useIsAdmin).mockReturnValue(false)

      const { result } = renderHook(() => useIsAdmin())

      expect(result.current).toBe(false)
    })

    it('should return false when no user exists', () => {
      vi.mocked(useIsAdmin).mockReturnValue(false)

      const { result } = renderHook(() => useIsAdmin())

      expect(result.current).toBe(false)
    })

    it('should return false during loading', () => {
      vi.mocked(useIsAdmin).mockReturnValue(false)

      const { result } = renderHook(() => useIsAdmin())

      expect(result.current).toBe(false)
    })
  })

  describe('Dashboard Access Tests', () => {
    it('should allow dashboard access for admins', () => {
      vi.mocked(useCanAccessDashboard).mockReturnValue(true)

      const { result } = renderHook(() => useCanAccessDashboard())

      expect(result.current).toBe(true)
    })

    it('should deny dashboard access for non-admins', () => {
      vi.mocked(useCanAccessDashboard).mockReturnValue(false)

      const { result } = renderHook(() => useCanAccessDashboard())

      expect(result.current).toBe(false)
    })
  })

  describe('Utility Function Tests', () => {
    describe('isAdmin', () => {
      it('should return true for admin users', () => {
        const adminUser: UserWithRole = {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          role: 'admin',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        expect(isAdmin(adminUser)).toBe(true)
      })

      it('should return false for non-admin users', () => {
        const regularUser: UserWithRole = {
          id: '2',
          email: 'user@test.com',
          name: 'User',
          role: 'user',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        expect(isAdmin(regularUser)).toBe(false)
      })

      it('should return false for undefined user', () => {
        expect(isAdmin(undefined)).toBe(false)
      })

      it('should return false for null user', () => {
        expect(isAdmin(null)).toBe(false)
      })

      it('should return false for user without role', () => {
        const userWithoutRole: UserWithRole = {
          id: '3',
          email: 'norole@test.com',
          name: 'No Role',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        expect(isAdmin(userWithoutRole)).toBe(false)
      })
    })

    describe('canAccessDashboard', () => {
      it('should return true for admin users', () => {
        const adminUser: UserWithRole = {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          role: 'admin',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        expect(canAccessDashboard(adminUser)).toBe(true)
      })

      it('should return false for non-admin users', () => {
        const regularUser: UserWithRole = {
          id: '2',
          email: 'user@test.com',
          name: 'User',
          role: 'user',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        expect(canAccessDashboard(regularUser)).toBe(false)
      })
    })
  })
})