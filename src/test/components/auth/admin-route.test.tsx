import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AdminRoute } from '@/components/auth/admin-route'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

// Mock dependencies
vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

describe('AdminRoute', () => {
  const mockPush = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn()
    } as any)
  })

  describe('Loading state', () => {
    it('should show loading spinner when session is pending', () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        isPending: true,
        error: null,
        isError: false,
        isSuccess: false,
        status: 'pending'
      } as any)

      render(
        <AdminRoute>
          <div>Protected Content</div>
        </AdminRoute>
      )

      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      
      // Should not show protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Unauthenticated state', () => {
    it('should redirect to home when user is not authenticated', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        isPending: false,
        error: null,
        isError: false,
        isSuccess: false,
        status: 'error'
      } as any)

      render(
        <AdminRoute>
          <div>Protected Content</div>
        </AdminRoute>
      )

      // Should redirect to home
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })

      // Should show loading spinner while redirecting
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      
      // Should not show protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Non-admin user', () => {
    it('should show access denied for non-admin users', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'user@example.com',
            name: 'Regular User',
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          session: {
            id: 'session-1',
            userId: '1',
            token: 'token',
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          }
        },
        isPending: false,
        error: null,
        isError: false,
        isSuccess: true,
        status: 'success'
      } as any)

      render(
        <AdminRoute>
          <div>Protected Content</div>
        </AdminRoute>
      )

      // Should show access denied message
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText('You need admin permissions to access this page.')).toBeInTheDocument()
      
      // Should not show protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      
      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Admin user', () => {
    it('should render children for admin users', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '2',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          session: {
            id: 'session-2',
            userId: '2',
            token: 'token',
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          }
        },
        isPending: false,
        error: null,
        isError: false,
        isSuccess: true,
        status: 'success'
      } as any)

      render(
        <AdminRoute>
          <div>Protected Content</div>
        </AdminRoute>
      )

      // Should show protected content
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      
      // Should not show access denied
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
      
      // Should not show loading spinner
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      
      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should render multiple children for admin users', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '2',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          session: {
            id: 'session-2',
            userId: '2',
            token: 'token',
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          }
        },
        isPending: false,
        error: null,
        isError: false,
        isSuccess: true,
        status: 'success'
      } as any)

      render(
        <AdminRoute>
          <div>Content 1</div>
          <div>Content 2</div>
          <div>Content 3</div>
        </AdminRoute>
      )

      // Should show all children
      expect(screen.getByText('Content 1')).toBeInTheDocument()
      expect(screen.getByText('Content 2')).toBeInTheDocument()
      expect(screen.getByText('Content 3')).toBeInTheDocument()
    })
  })

  describe('Session transitions', () => {
    it('should handle transition from loading to authenticated admin', () => {
      const { rerender } = render(
        <AdminRoute>
          <div>Protected Content</div>
        </AdminRoute>
      )

      // Start with loading state
      vi.mocked(useSession).mockReturnValue({
        data: null,
        isPending: true,
        error: null,
        isError: false,
        isSuccess: false,
        status: 'pending'
      } as any)

      rerender(
        <AdminRoute>
          <div>Protected Content</div>
        </AdminRoute>
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()

      // Transition to authenticated admin
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '2',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          session: {
            id: 'session-2',
            userId: '2',
            token: 'token',
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          }
        },
        isPending: false,
        error: null,
        isError: false,
        isSuccess: true,
        status: 'success'
      } as any)

      rerender(
        <AdminRoute>
          <div>Protected Content</div>
        </AdminRoute>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})