import { authClient } from '@/lib/auth-client';
import { authOperations, logAuthEvent } from '@/lib/auth';
import { 
  type AdminUserData, 
  type AdminUserFilters, 
  type AuthResponse, 
  type LoginRequest, 
  type Permission,
  type Role,
  type SignUpRequest,
  loginSchema, 
  signUpSchema 
} from '@/types/auth';
import { extractSessionData, getUserRole } from '@/types/better-auth';
import { z } from 'zod';

/**
 * Production-Ready Auth Utilities
 * 
 * Comprehensive authentication utilities with Better Auth, 
 * TanStack Query integration, Zod validation, and audit logging.
 */

// Permission constants aligned with admin plugin
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'dashboard:view',
  VIEW_ANALYTICS: 'analytics:view',
  
  VIEW_CUSTOMERS: 'customers:view',
  CREATE_CUSTOMERS: 'customers:create',
  UPDATE_CUSTOMERS: 'customers:update',
  DELETE_CUSTOMERS: 'customers:delete',
  
  VIEW_APPOINTMENTS: 'appointments:view',
  CREATE_APPOINTMENTS: 'appointments:create',
  UPDATE_APPOINTMENTS: 'appointments:update',
  DELETE_APPOINTMENTS: 'appointments:delete',
  
  VIEW_MEDIA: 'media:view',
  UPLOAD_MEDIA: 'media:upload',
  DELETE_MEDIA: 'media:delete',
  SYNC_MEDIA: 'media:sync',
  
  ADMIN_ACCESS: 'admin:access',
  ADMIN_SETTINGS: 'admin:settings',
  USER_MANAGEMENT: 'admin:users',
} as const;

// Role-based permissions
const ADMIN_PERMISSIONS = Object.values(PERMISSIONS);
const USER_PERMISSIONS = [
  PERMISSIONS.VIEW_DASHBOARD,
  PERMISSIONS.VIEW_CUSTOMERS,
  PERMISSIONS.VIEW_APPOINTMENTS,
  PERMISSIONS.VIEW_MEDIA,
];

/**
 * React hooks for authentication state
 */

/**
 * Check if user is admin using Better Auth's built-in session
 */
export function useIsAdmin() {
  const { data: session } = authClient.useSession();
  const { user } = extractSessionData(session);
  return getUserRole(user) === 'admin';
}

/**
 * Check if user is authenticated using Better Auth's built-in session
 */
export function useIsAuthenticated() {
  const { data: session } = authClient.useSession();
  return !!session?.user;
}

/**
 * Get current user using Better Auth's built-in session
 */
export function useCurrentUser() {
  const { data: session } = authClient.useSession();
  return session?.user || null;
}

/**
 * Get current session using Better Auth's built-in session
 */
export function useCurrentSession() {
  const { data: session } = authClient.useSession();
  return session || null;
}

/**
 * Permission checker using role-based access control
 */
export function useHasPermission(permission: Permission) {
  const { data: session } = authClient.useSession();
  const { user } = extractSessionData(session);
  const userRole = getUserRole(user) as Role;
  
  if (!userRole) return false;
  
  // Get permissions for user's role
  const userPermissions = userRole === 'admin' ? ADMIN_PERMISSIONS : USER_PERMISSIONS;
  return userPermissions.includes(permission);
}

/**
 * Resource permission checker
 */
export function useCanManageResource(resource: string, action: string) {
  const permission = `${resource}:${action}` as Permission;
  return useHasPermission(permission);
}

/**
 * Authentication operations with enhanced error handling and validation
 */

/**
 * Enhanced login function with validation and audit logging
 */
export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    // Validate input
    const validatedData = loginSchema.parse(credentials);
    
    // Check user status before attempting login
    const userStatus = await authOperations.checkUserStatus(validatedData.email);
    if (!userStatus.allowed) {
      return {
        success: false,
        error: {
          message: userStatus.reason || 'Login not allowed',
          code: 'ACCOUNT_RESTRICTED'
        }
      };
    }

    // Attempt login
    const result = await authClient.signIn.email({
      email: validatedData.email,
      password: validatedData.password,
    });
    
    if (result.error) {
      // Track failed login attempt
      await authOperations.incrementLoginAttempts(validatedData.email);
      
      return {
        success: false,
        error: {
          message: result.error.message || 'Login failed',
          code: 'INVALID_CREDENTIALS'
        }
      };
    }
    
    if (result.data) {
      const { userId } = extractSessionData(result.data);
      
      if (userId) {
        // Update last login and reset failed attempts
        await authOperations.updateLastLogin(userId);
        
        // Log successful login
        await logAuthEvent(
          'USER_LOGIN_SUCCESS',
          userId,
          {
            email: validatedData.email,
            method: 'email_password',
            rememberMe: validatedData.rememberMe
          }
        );
      }
      
      return {
        success: true,
        data: result.data
      };
    }
    
    return {
      success: false,
      error: {
        message: 'Login failed - no user data returned',
        code: 'LOGIN_FAILED'
      }
    };
    
  } catch (error) {
    console.error('Login failed:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: error.errors.reduce((acc, err) => {
            const path = err.path.join('.');
            acc[path || 'unknown'] = err.message;
            return acc;
          }, {} as Record<string, string>)
        }
      };
    }
    
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Login failed',
        code: 'INTERNAL_ERROR'
      }
    };
  }
}

/**
 * Enhanced logout function with audit logging
 */
export async function logoutUser(): Promise<AuthResponse> {
  try {
    // Get current session for logging
    const session = await authClient.getSession();
    const { userId } = extractSessionData(session);
    
    // Perform logout
    await authClient.signOut();
    
    // Log logout event
    if (userId) {
      await logAuthEvent('USER_LOGOUT', userId);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Logout failed:', error);
    
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Logout failed',
        code: 'LOGOUT_ERROR'
      }
    };
  }
}

/**
 * Enhanced signup function with validation
 */
export async function signUpUser(userData: SignUpRequest): Promise<AuthResponse> {
  try {
    // Validate input
    const validatedData = signUpSchema.parse(userData);
    
    // Attempt signup
    const result = await authClient.signUp.email({
      email: validatedData.email,
      password: validatedData.password,
      name: validatedData.name,
    });
    
    if (result.error) {
      return {
        success: false,
        error: {
          message: result.error.message || 'Signup failed',
          code: 'SIGNUP_FAILED'
        }
      };
    }
    
    if (result.data) {
      const { userId } = extractSessionData(result.data);
      
      if (userId) {
        // Log successful signup
        await logAuthEvent(
          'USER_SIGNUP_SUCCESS',
          userId,
          {
            email: validatedData.email,
            name: validatedData.name
          }
        );
      }
      
      return {
        success: true,
        data: result.data
      };
    }
    
    return {
      success: false,
      error: {
        message: 'Signup failed - no user data returned',
        code: 'SIGNUP_FAILED'
      }
    };
    
  } catch (error) {
    console.error('Signup failed:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: error.errors.reduce((acc, err) => {
            const path = err.path.join('.');
            acc[path || 'unknown'] = err.message;
            return acc;
          }, {} as Record<string, string>)
        }
      };
    }
    
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Signup failed',
        code: 'INTERNAL_ERROR'
      }
    };
  }
}

/**
 * Enhanced session management
 */
export async function refreshSession(): Promise<AuthResponse> {
  try {
    const sessionData = await authClient.getSession();
    
    if (sessionData) {
      return {
        success: true,
        data: sessionData
      };
    }
    
    return {
      success: false,
      error: {
        message: 'No valid session found',
        code: 'NO_SESSION'
      }
    };
    
  } catch (error) {
    console.error('Session refresh failed:', error);
    
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Session refresh failed',
        code: 'SESSION_ERROR'
      }
    };
  }
}

/**
 * Admin user management functions using Better Auth admin plugin
 */
export const adminActions = {
  /**
   * Create a new user (admin only)
   */
  async createUser(userData: AdminUserData): Promise<AuthResponse> {
    try {
      const result = await authClient.admin.createUser({
        ...userData,
        role: userData.role as "user" | "admin" | undefined,
      });
      
      if (result.error) {
        return {
          success: false,
          error: {
            message: result.error.message || 'Failed to create user',
            code: 'CREATE_USER_FAILED'
          }
        };
      }
      
      // Log admin action
      const session = await authClient.getSession();
      const { userId } = extractSessionData(session);
      if (userId) {
        await logAuthEvent(
          'ADMIN_CREATE_USER',
          userId,
          {
            targetEmail: userData.email,
            targetRole: userData.role
          }
        );
      }
      
      return {
        success: true,
        data: result.data
      };
      
    } catch (error) {
      console.error('Create user failed:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Create user failed',
          code: 'INTERNAL_ERROR'
        }
      };
    }
  },

  /**
   * List all users (admin only)
   */
  async listUsers(options?: AdminUserFilters): Promise<AuthResponse> {
    try {
      const queryParams: {
        limit?: string;
        offset?: string;
        searchValue?: string;
      } = {};
      
      if (options?.limit !== undefined) queryParams.limit = String(options.limit);
      if (options?.offset !== undefined) queryParams.offset = String(options.offset);
      if (options?.search !== undefined) queryParams.searchValue = options.search;

      const result = await authClient.admin.listUsers({ query: queryParams });
      
      if (result.error) {
        return {
          success: false,
          error: {
            message: result.error.message || 'Failed to list users',
            code: 'LIST_USERS_FAILED'
          }
        };
      }
      
      return {
        success: true,
        data: result.data
      };
      
    } catch (error) {
      console.error('List users failed:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'List users failed',
          code: 'INTERNAL_ERROR'
        }
      };
    }
  },

  /**
   * Set user role (admin only)
   */
  async setUserRole(userId: string, role: Role): Promise<AuthResponse> {
    try {
      const result = await authClient.admin.setRole({
        userId,
        role: role as "user" | "admin",
      });
      
      if (result.error) {
        return {
          success: false,
          error: {
            message: result.error.message || 'Failed to set user role',
            code: 'SET_ROLE_FAILED'
          }
        };
      }
      
      // Log admin action
      const session = await authClient.getSession();
      const { userId: currentUserId } = extractSessionData(session);
      if (currentUserId) {
        await logAuthEvent(
          'ADMIN_SET_USER_ROLE',
          currentUserId,
          {
            targetUserId: userId,
            newRole: role
          }
        );
      }
      
      return {
        success: true,
        data: result.data
      };
      
    } catch (error) {
      console.error('Set user role failed:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Set user role failed',
          code: 'INTERNAL_ERROR'
        }
      };
    }
  },

  /**
   * Ban user (admin only)
   */
  async banUser(userId: string, reason?: string, expiresAt?: Date): Promise<AuthResponse> {
    try {
      let banExpiresIn: number | undefined;
      if (expiresAt) {
        banExpiresIn = Math.max(0, expiresAt.getTime() - Date.now());
      }
      
      const result = await authClient.admin.banUser({
        userId,
        banReason: reason,
        banExpiresIn,
      });
      
      if (result.error) {
        return {
          success: false,
          error: {
            message: result.error.message || 'Failed to ban user',
            code: 'BAN_USER_FAILED'
          }
        };
      }
      
      // Log admin action
      const session = await authClient.getSession();
      const { userId: currentUserId } = extractSessionData(session);
      if (currentUserId) {
        await logAuthEvent(
          'ADMIN_BAN_USER',
          currentUserId,
          {
            targetUserId: userId,
            reason,
            expiresAt: expiresAt?.toISOString()
          }
        );
      }
      
      return {
        success: true,
        data: result.data
      };
      
    } catch (error) {
      console.error('Ban user failed:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Ban user failed',
          code: 'INTERNAL_ERROR'
        }
      };
    }
  },

  /**
   * Unban user (admin only)
   */
  async unbanUser(userId: string): Promise<AuthResponse> {
    try {
      const result = await authClient.admin.unbanUser({
        userId,
      });
      
      if (result.error) {
        return {
          success: false,
          error: {
            message: result.error.message || 'Failed to unban user',
            code: 'UNBAN_USER_FAILED'
          }
        };
      }
      
      // Log admin action
      const session = await authClient.getSession();
      const { userId: currentUserId } = extractSessionData(session);
      if (currentUserId) {
        await logAuthEvent(
          'ADMIN_UNBAN_USER',
          currentUserId,
          { targetUserId: userId }
        );
      }
      
      return {
        success: true,
        data: result.data
      };
      
    } catch (error) {
      console.error('Unban user failed:', error);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unban user failed',
          code: 'INTERNAL_ERROR'
        }
      };
    }
  },
};

/**
 * Utility functions for permission management
 */
export function getUserPermissions(role: Role): Permission[] {
  return role === 'admin' ? ADMIN_PERMISSIONS : USER_PERMISSIONS;
}

export function hasPermission(userRole: Role, permission: Permission): boolean {
  const userPermissions = getUserPermissions(userRole);
  return userPermissions.includes(permission);
}

export function canManageResource(userRole: Role, resource: string, action: string): boolean {
  const permission = `${resource}:${action}` as Permission;
  return hasPermission(userRole, permission);
}
