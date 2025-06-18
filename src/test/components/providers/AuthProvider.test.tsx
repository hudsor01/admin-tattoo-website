import React from 'react';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth, useRequireAdmin, useRequireAuth } from '@/components/providers/AuthProvider';
import { authClient } from '@/lib/auth-client';

// Mock Better Auth client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn()
  }
}));

// Mock auth-utils
vi.mock('@/lib/auth-utils', () => ({
  useCurrentUser: vi.fn(),
  useIsAdmin: vi.fn(),
  useIsAuthenticated: vi.fn()
}));

const mockAuthClient = authClient as { useSession: Mock };

// Import mocked functions
import { useCurrentUser, useIsAdmin, useIsAuthenticated } from '@/lib/auth-utils';
const mockUseCurrentUser = useCurrentUser as Mock;
const mockUseIsAdmin = useIsAdmin as Mock;
const mockUseIsAuthenticated = useIsAuthenticated as Mock;

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthProvider Component', () => {
    it('should render children without wrapper', () => {
      const { getByText } = render(
        <AuthProvider>
          <div>Test Content</div>
        </AuthProvider>
      );

      expect(getByText('Test Content')).toBeInTheDocument();
    });

    it('should not add any wrapper elements', () => {
      const { container } = render(
        <AuthProvider>
          <div data-testid="child">Test Content</div>
        </AuthProvider>
      );

      // Should only contain the child element, no wrapper
      expect(container.firstChild).toHaveAttribute('data-testid', 'child');
    });
  });

  describe('useAuth Hook', () => {
    it('should return auth state with user data', () => {
      const mockUser = { id: '1', email: 'user@test.com', role: 'user' };
      const mockSession = {
        data: { user: mockUser },
        isPending: false,
        error: null
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);
      mockUseCurrentUser.mockReturnValue(mockUser);
      mockUseIsAdmin.mockReturnValue(false);
      mockUseIsAuthenticated.mockReturnValue(true);

      const { result } = renderHook(() => useAuth());

      expect(result.current).toEqual({
        user: mockUser,
        isAdmin: false,
        isLoading: false,
        isAuthenticated: true,
        session: {
          data: mockSession.data,
          isPending: false,
          error: null
        },
        error: null
      });
    });

    it('should return auth state when loading', () => {
      const mockSession = {
        data: null,
        isPending: true,
        error: null
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);
      mockUseCurrentUser.mockReturnValue(null);
      mockUseIsAdmin.mockReturnValue(false);
      mockUseIsAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useAuth());

      expect(result.current).toEqual({
        user: null,
        isAdmin: false,
        isLoading: true,
        isAuthenticated: false,
        session: {
          data: null,
          isPending: true,
          error: null
        },
        error: null
      });
    });

    it('should return auth state with error', () => {
      const mockError = new Error('Auth error');
      const mockSession = {
        data: null,
        isPending: false,
        error: mockError
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);
      mockUseCurrentUser.mockReturnValue(null);
      mockUseIsAdmin.mockReturnValue(false);
      mockUseIsAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useAuth());

      expect(result.current).toEqual({
        user: null,
        isAdmin: false,
        isLoading: false,
        isAuthenticated: false,
        session: {
          data: null,
          isPending: false,
          error: mockError
        },
        error: mockError
      });
    });

    it('should return admin user state', () => {
      const mockAdminUser = { id: '1', email: 'admin@test.com', role: 'admin' };
      const mockSession = {
        data: { user: mockAdminUser },
        isPending: false,
        error: null
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);
      mockUseCurrentUser.mockReturnValue(mockAdminUser);
      mockUseIsAdmin.mockReturnValue(true);
      mockUseIsAuthenticated.mockReturnValue(true);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.user).toEqual(mockAdminUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('useRequireAuth Hook', () => {
    it('should return user when authenticated', () => {
      const mockUser = { id: '1', email: 'user@test.com', role: 'user' };
      const mockSession = {
        data: { user: mockUser },
        isPending: false
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current).toEqual({
        user: mockUser,
        isLoading: false
      });
    });

    it('should return loading state when session is pending', () => {
      const mockSession = {
        data: null,
        isPending: true
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current).toEqual({
        user: undefined,
        isLoading: true
      });
    });

    it('should throw error when not authenticated', () => {
      const mockSession = {
        data: null,
        isPending: false
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);

      expect(() => {
        renderHook(() => useRequireAuth());
      }).toThrow('Authentication required');
    });

    it('should not throw error when session is null but still loading', () => {
      const mockSession = {
        data: { user: null },
        isPending: true
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current).toEqual({
        user: null,
        isLoading: true
      });
    });
  });

  describe('useRequireAdmin Hook', () => {
    it('should return admin user when user has admin role', () => {
      const mockAdminUser = { id: '1', email: 'admin@test.com', role: 'admin' };
      const mockSession = {
        data: { user: mockAdminUser },
        isPending: false
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);

      const { result } = renderHook(() => useRequireAdmin());

      expect(result.current).toEqual({
        user: mockAdminUser,
        isLoading: false
      });
    });

    it('should return loading state when session is pending', () => {
      const mockSession = {
        data: null,
        isPending: true
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);

      const { result } = renderHook(() => useRequireAdmin());

      expect(result.current).toEqual({
        user: undefined,
        isLoading: true
      });
    });

    it('should throw error when user is not admin', () => {
      const mockUser = { id: '1', email: 'user@test.com', role: 'user' };
      const mockSession = {
        data: { user: mockUser },
        isPending: false
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);

      expect(() => {
        renderHook(() => useRequireAdmin());
      }).toThrow('Admin access required');
    });

    it('should throw error when not authenticated', () => {
      const mockSession = {
        data: null,
        isPending: false
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);

      expect(() => {
        renderHook(() => useRequireAdmin());
      }).toThrow('Admin access required');
    });

    it('should not throw error when session is null but still loading', () => {
      const mockSession = {
        data: { user: null },
        isPending: true
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);

      const { result } = renderHook(() => useRequireAdmin());

      expect(result.current).toEqual({
        user: null,
        isLoading: true
      });
    });

    it('should handle user without role property', () => {
      const mockUser = { id: '1', email: 'user@test.com' }; // No role property
      const mockSession = {
        data: { user: mockUser },
        isPending: false
      };

      mockAuthClient.useSession.mockReturnValue(mockSession);

      expect(() => {
        renderHook(() => useRequireAdmin());
      }).toThrow('Admin access required');
    });
  });
});