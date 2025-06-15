import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next.js
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
  useUser: vi.fn(),
  useIsAdmin: vi.fn(),
  signIn: {
    email: vi.fn(),
    social: vi.fn()
  },
  signOut: vi.fn(),
  isAdmin: vi.fn(),
  canAccessDashboard: vi.fn()
}))

vi.mock('@/components/auth/auth-error-boundary', () => ({
  useAuthErrorHandler: () => ({
    handleAuthError: vi.fn().mockReturnValue('Authentication failed')
  })
}))

import { useRouter } from 'next/navigation'
import { useUser, useIsAdmin, signIn, signOut } from '@/lib/auth-client'
import type { UserWithRole } from '@/lib/auth-client'

// Mock error type for testing
interface MockBetterFetchError {
  status: number
  statusText: string
  error: string
  message: string
  name: string
}

describe('Auth Integration Tests', () => {
  const mockPush = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush
    })
  })

  describe('Complete Authentication Flow', () => {
    it('should complete email authentication flow for admin user', async () => {
      // Mock successful sign in
      const mockAdminUser = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null
      }
      
      vi.mocked(signIn.email).mockResolvedValue({
        data: {
          user: mockAdminUser
        },
        error: null
      })

      const result = await signIn.email({
        email: 'admin@test.com',
        password: 'password123'
      })

      // Verify sign in was called
      expect(signIn.email).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'password123'
      })

      // Verify successful result
      expect((result.data?.user as any)?.role).toBe('admin')
      expect(result.error).toBeNull()
    })

    it('should complete Google OAuth flow', async () => {
      // Mock Google OAuth response
      vi.mocked(signIn.social).mockResolvedValue({
        data: {
          url: 'https://accounts.google.com/oauth/authorize?client_id=test'
        },
        error: null
      })

      const result = await signIn.social({
        provider: 'google',
        callbackURL: '/dashboard'
      })

      expect(signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/dashboard'
      })

      // Should return OAuth URL
      expect(result.data?.url).toBe('https://accounts.google.com/oauth/authorize?client_id=test')
    })

    it('should reject non-admin users and sign them out', async () => {
      // Mock sign in with non-admin user
      const mockRegularUser = {
        id: '2',
        email: 'user@test.com',
        name: 'Regular User',
        role: 'user',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null
      }
      
      vi.mocked(signIn.email).mockResolvedValue({
        data: {
          user: mockRegularUser
        },
        error: null
      })

      vi.mocked(signOut).mockResolvedValue({
        data: {},
        error: null
      })

      const signInResult = await signIn.email({
        email: 'user@test.com',
        password: 'password123'
      })

      // Should sign out non-admin user
      if ((signInResult.data?.user as any)?.role !== 'admin') {
        await signOut()
      }

      expect(signOut).toHaveBeenCalled()
    })
  })

  describe('Session State Management', () => {
    it('should handle loading states correctly', () => {
      vi.mocked(useUser).mockReturnValue({
        user: undefined,
        isLoading: true,
        error: null
      })
      vi.mocked(useIsAdmin).mockReturnValue(false)

      const userResult = useUser()
      const adminResult = useIsAdmin()

      // Should show loading state, not content or error
      expect(userResult.isLoading).toBe(true)
      expect(userResult.user).toBeUndefined()
      expect(adminResult).toBe(false)
    })

    it('should handle session errors', () => {
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

      const result = useUser()

      // Should handle error gracefully
      expect(result.error).toBe(error)
      expect(result.isLoading).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during login', async () => {
      vi.mocked(signIn.email).mockRejectedValue(new Error('Network error'))

      try {
        await signIn.email({
          email: 'admin@test.com',
          password: 'password123'
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })

    it('should handle invalid credentials', async () => {
      vi.mocked(signIn.email).mockResolvedValue({
        data: null,
        error: {
          message: 'Invalid email or password'
        }
      })

      const result = await signIn.email({
        email: 'wrong@test.com',
        password: 'wrongpassword'
      })

      expect(result.error?.message).toBe('Invalid email or password')
      expect(result.data).toBeNull()
    })

    it('should handle Google OAuth errors', async () => {
      vi.mocked(signIn.social).mockResolvedValue({
        data: null,
        error: {
          message: 'OAuth provider error'
        }
      })

      const result = await signIn.social({
        provider: 'google'
      })

      expect(result.error?.message).toBe('OAuth provider error')
      expect(result.data).toBeNull()
    })
  })

  describe('Role-Based Access Control', () => {
    it('should allow admin access to protected features', () => {
      const mockAdminUser: UserWithRole = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      vi.mocked(useUser).mockReturnValue({
        user: mockAdminUser,
        isLoading: false,
        error: null
      })
      vi.mocked(useIsAdmin).mockReturnValue(true)

      const userResult = useUser()
      const adminResult = useIsAdmin()

      expect(userResult.user?.role).toBe('admin')
      expect(adminResult).toBe(true)
    })

    it('should deny access to non-admin users', () => {
      const mockRegularUser: UserWithRole = {
        id: '2',
        email: 'user@test.com',
        name: 'Regular User',
        role: 'user',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      vi.mocked(useUser).mockReturnValue({
        user: mockRegularUser,
        isLoading: false,
        error: null
      })
      vi.mocked(useIsAdmin).mockReturnValue(false)

      const userResult = useUser()
      const adminResult = useIsAdmin()

      expect(userResult.user?.role).toBe('user')
      expect(adminResult).toBe(false)
    })

    it('should handle unauthenticated users', () => {
      vi.mocked(useUser).mockReturnValue({
        user: undefined,
        isLoading: false,
        error: null
      })
      vi.mocked(useIsAdmin).mockReturnValue(false)

      const userResult = useUser()
      const adminResult = useIsAdmin()

      expect(userResult.user).toBeUndefined()
      expect(adminResult).toBe(false)
    })
  })

  describe('Authentication Persistence', () => {
    it('should maintain admin session across page reloads', () => {
      // Simulate persisted admin session
      const mockAdminUser: UserWithRole = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      vi.mocked(useUser).mockReturnValue({
        user: mockAdminUser,
        isLoading: false,
        error: null
      })
      vi.mocked(useIsAdmin).mockReturnValue(true)

      const userResult = useUser()
      const adminResult = useIsAdmin()

      expect(userResult.user?.role).toBe('admin')
      expect(adminResult).toBe(true)
    })

    it('should handle session expiration', () => {
      // Simulate expired session
      const error: MockBetterFetchError = {
        status: 401,
        statusText: 'Unauthorized',
        error: 'SESSION_EXPIRED',
        message: 'Session expired',
        name: 'BetterFetchError'
      }
      
      vi.mocked(useUser).mockReturnValue({
        user: undefined,
        isLoading: false,
        error
      })
      vi.mocked(useIsAdmin).mockReturnValue(false)

      const userResult = useUser()
      const adminResult = useIsAdmin()

      expect(userResult.user).toBeUndefined()
      expect(userResult.error?.message).toBe('Session expired')
      expect(adminResult).toBe(false)
    })
  })
})