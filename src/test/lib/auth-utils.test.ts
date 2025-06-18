import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { 
  PERMISSIONS, 
  adminActions, 
  loginUser,
  logoutUser,
  useCanManageResource,
  useCurrentUser,
  useHasPermission,
  useIsAdmin,
  useIsAuthenticated
} from '@/lib/auth-utils';
import { authClient } from '@/lib/auth-client';

// Mock Better Auth client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signIn: {
      email: vi.fn()
    },
    signOut: vi.fn(),
    createUser: vi.fn(),
    listUsers: vi.fn(),
    setUserRole: vi.fn(),
    banUser: vi.fn(),
    unbanUser: vi.fn()
  }
}));

const mockAuthClient = authClient as {
  useSession: Mock;
  signIn: { email: Mock };
  signOut: Mock;
  createUser: Mock;
  listUsers: Mock;
  setUserRole: Mock;
  banUser: Mock;
  unbanUser: Mock;
};

describe('Auth Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useIsAdmin', () => {
    it('should return true when user has admin role', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'admin@test.com', role: 'admin' }
        }
      });

      const { result } = renderHook(() => useIsAdmin());
      expect(result.current).toBe(true);
    });

    it('should return false when user does not have admin role', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'user@test.com', role: 'user' }
        }
      });

      const { result } = renderHook(() => useIsAdmin());
      expect(result.current).toBe(false);
    });

    it('should return false when no session exists', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: null
      });

      const { result } = renderHook(() => useIsAdmin());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'user@test.com', role: 'user' }
        }
      });

      const { result } = renderHook(() => useIsAuthenticated());
      expect(result.current).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: null
      });

      const { result } = renderHook(() => useIsAuthenticated());
      expect(result.current).toBe(false);
    });
  });

  describe('useCurrentUser', () => {
    it('should return user data when authenticated', () => {
      const mockUser = { id: '1', email: 'user@test.com', role: 'user' };
      mockAuthClient.useSession.mockReturnValue({
        data: { user: mockUser }
      });

      const { result } = renderHook(() => useCurrentUser());
      expect(result.current).toEqual(mockUser);
    });

    it('should return null when not authenticated', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: null
      });

      const { result } = renderHook(() => useCurrentUser());
      expect(result.current).toBe(null);
    });
  });

  describe('useHasPermission', () => {
    it('should return true for admin users', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'admin@test.com', role: 'admin' }
        }
      });

      const { result } = renderHook(() => useHasPermission(PERMISSIONS.VIEW_DASHBOARD));
      expect(result.current).toBe(true);
    });

    it('should return false for non-admin users', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'user@test.com', role: 'user' }
        }
      });

      const { result } = renderHook(() => useHasPermission(PERMISSIONS.VIEW_DASHBOARD));
      expect(result.current).toBe(false);
    });
  });

  describe('useCanManageResource', () => {
    it('should return true for admin users managing any resource', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'admin@test.com', role: 'admin' }
        }
      });

      const { result } = renderHook(() => useCanManageResource('customers', 'delete'));
      expect(result.current).toBe(true);
    });

    it('should return false for non-admin users', () => {
      mockAuthClient.useSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'user@test.com', role: 'user' }
        }
      });

      const { result } = renderHook(() => useCanManageResource('customers', 'delete'));
      expect(result.current).toBe(false);
    });
  });

  describe('loginUser', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResult = {
        data: { user: { id: '1', email: 'user@test.com' } },
        error: null
      };
      mockAuthClient.signIn.email.mockResolvedValue(mockResult);

      const result = await loginUser('user@test.com', 'password123');
      
      expect(mockAuthClient.signIn.email).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'password123'
      });
      expect(result).toEqual(mockResult.data);
    });

    it('should throw error when login fails', async () => {
      const mockError = { message: 'Invalid credentials' };
      mockAuthClient.signIn.email.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(loginUser('user@test.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockAuthClient.signIn.email.mockRejectedValue(networkError);

      await expect(loginUser('user@test.com', 'password123'))
        .rejects.toThrow('Network error');
    });
  });

  describe('logoutUser', () => {
    it('should successfully logout', async () => {
      mockAuthClient.signOut.mockResolvedValue(undefined);

      await expect(logoutUser()).resolves.toBeUndefined();
      expect(mockAuthClient.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const logoutError = new Error('Logout failed');
      mockAuthClient.signOut.mockRejectedValue(logoutError);

      await expect(logoutUser()).rejects.toThrow('Logout failed');
    });
  });

  describe('adminActions', () => {
    describe('createUser', () => {
      it('should successfully create a user', async () => {
        const userData = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        };
        const mockResult = { user: { id: '1', ...userData } };
        mockAuthClient.createUser.mockResolvedValue(mockResult);

        const result = await adminActions.createUser(userData);
        
        expect(mockAuthClient.createUser).toHaveBeenCalledWith(userData);
        expect(result).toEqual(mockResult);
      });

      it('should handle create user errors', async () => {
        const userData = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        };
        const createError = new Error('User creation failed');
        mockAuthClient.createUser.mockRejectedValue(createError);

        await expect(adminActions.createUser(userData))
          .rejects.toThrow('User creation failed');
      });
    });

    describe('listUsers', () => {
      it('should successfully list users', async () => {
        const mockUsers = [
          { id: '1', email: 'user1@test.com', role: 'user' },
          { id: '2', email: 'admin@test.com', role: 'admin' }
        ];
        mockAuthClient.listUsers.mockResolvedValue(mockUsers);

        const result = await adminActions.listUsers();
        
        expect(mockAuthClient.listUsers).toHaveBeenCalledWith(undefined);
        expect(result).toEqual(mockUsers);
      });

      it('should list users with options', async () => {
        const options = { limit: 10, offset: 0, search: 'test' };
        const mockUsers = [{ id: '1', email: 'test@test.com', role: 'user' }];
        mockAuthClient.listUsers.mockResolvedValue(mockUsers);

        const result = await adminActions.listUsers(options);
        
        expect(mockAuthClient.listUsers).toHaveBeenCalledWith(options);
        expect(result).toEqual(mockUsers);
      });
    });

    describe('setUserRole', () => {
      it('should successfully set user role', async () => {
        const mockResult = { success: true };
        mockAuthClient.setUserRole.mockResolvedValue(mockResult);

        const result = await adminActions.setUserRole('user123', 'admin');
        
        expect(mockAuthClient.setUserRole).toHaveBeenCalledWith({
          userId: 'user123',
          role: 'admin'
        });
        expect(result).toEqual(mockResult);
      });
    });

    describe('banUser', () => {
      it('should successfully ban user', async () => {
        const mockResult = { success: true };
        const expiresAt = new Date('2024-12-31');
        mockAuthClient.banUser.mockResolvedValue(mockResult);

        const result = await adminActions.banUser('user123', 'Violation', expiresAt);
        
        expect(mockAuthClient.banUser).toHaveBeenCalledWith({
          userId: 'user123',
          reason: 'Violation',
          expiresAt
        });
        expect(result).toEqual(mockResult);
      });
    });

    describe('unbanUser', () => {
      it('should successfully unban user', async () => {
        const mockResult = { success: true };
        mockAuthClient.unbanUser.mockResolvedValue(mockResult);

        const result = await adminActions.unbanUser('user123');
        
        expect(mockAuthClient.unbanUser).toHaveBeenCalledWith({
          userId: 'user123'
        });
        expect(result).toEqual(mockResult);
      });
    });
  });

  describe('PERMISSIONS constants', () => {
    it('should have all required permission constants', () => {
      expect(PERMISSIONS.VIEW_DASHBOARD).toBe('dashboard:view');
      expect(PERMISSIONS.VIEW_ANALYTICS).toBe('analytics:view');
      expect(PERMISSIONS.VIEW_CUSTOMERS).toBe('customers:view');
      expect(PERMISSIONS.CREATE_CUSTOMERS).toBe('customers:create');
      expect(PERMISSIONS.UPDATE_CUSTOMERS).toBe('customers:update');
      expect(PERMISSIONS.DELETE_CUSTOMERS).toBe('customers:delete');
      expect(PERMISSIONS.VIEW_APPOINTMENTS).toBe('appointments:view');
      expect(PERMISSIONS.CREATE_APPOINTMENTS).toBe('appointments:create');
      expect(PERMISSIONS.UPDATE_APPOINTMENTS).toBe('appointments:update');
      expect(PERMISSIONS.DELETE_APPOINTMENTS).toBe('appointments:delete');
      expect(PERMISSIONS.VIEW_MEDIA).toBe('media:view');
      expect(PERMISSIONS.UPLOAD_MEDIA).toBe('media:upload');
      expect(PERMISSIONS.DELETE_MEDIA).toBe('media:delete');
      expect(PERMISSIONS.SYNC_MEDIA).toBe('media:sync');
      expect(PERMISSIONS.ADMIN_ACCESS).toBe('admin:access');
      expect(PERMISSIONS.ADMIN_SETTINGS).toBe('admin:settings');
      expect(PERMISSIONS.USER_MANAGEMENT).toBe('admin:users');
    });
  });
});