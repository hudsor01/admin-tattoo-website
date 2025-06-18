import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { authClient } from '@/lib/auth-client';
import type { Session, User } from '@/types/auth';
import { ErrorCategory, handleError, withEnhancedRetry } from '@/lib/api/enhanced-error-handling';

// Stable snapshot function to prevent infinite loops
const createStableSnapshot = (state: AuthState) => {
  return JSON.stringify({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isAdmin: state.isAdmin,
    userId: state.user?.id,
  });
};

// Auth state interface
interface AuthState {
  // Core auth state
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Admin specific state
  isAdmin: boolean;
  isVerifiedAdmin: boolean;
  canAccessDashboard: boolean;
  
  // Permissions
  permissions: string[];
  adminPermissions: string[];
  
  // Session management
  lastRefresh: number | null;
  autoRefreshEnabled: boolean;
  refreshTimer: NodeJS.Timeout | null;
  
  // Error state
  lastError: string | null;
  retryCount: number;
  
  // Auth actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  
  // Auth operations with enhanced error handling
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  
  // Session management
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  scheduleRefresh: (delay?: number) => void;
  
  // Permission checks
  hasPermission: (permission: string) => boolean;
  canManageResource: (resource: string, action: string) => boolean;
  
  // Admin checks
  checkAdminStatus: () => Promise<void>;
  verifyAdminAccess: () => Promise<boolean>;
  
  // Recovery and retry
  retryLastOperation: () => Promise<void>;
  resetErrorState: () => void;
}

// Permission constants
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'dashboard:view',
  VIEW_ANALYTICS: 'analytics:view',
  
  // Customers
  VIEW_CUSTOMERS: 'customers:view',
  CREATE_CUSTOMERS: 'customers:create',
  UPDATE_CUSTOMERS: 'customers:update',
  DELETE_CUSTOMERS: 'customers:delete',
  
  // Appointments
  VIEW_APPOINTMENTS: 'appointments:view',
  CREATE_APPOINTMENTS: 'appointments:create',
  UPDATE_APPOINTMENTS: 'appointments:update',
  DELETE_APPOINTMENTS: 'appointments:delete',
  
  // Media
  VIEW_MEDIA: 'media:view',
  UPLOAD_MEDIA: 'media:upload',
  DELETE_MEDIA: 'media:delete',
  SYNC_MEDIA: 'media:sync',
  
  // Admin
  ADMIN_ACCESS: 'admin:access',
  ADMIN_SETTINGS: 'admin:settings',
  USER_MANAGEMENT: 'admin:users',
} as const;

// Admin permissions - all admins get these
const ADMIN_PERMISSIONS = Object.values(PERMISSIONS);

// Retry wrapper for auth operations
const retryAuthOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  return withEnhancedRetry(operation, {
    maxRetries,
    baseDelay: delay,
    retryCondition: (error) => {
      // Don't retry auth failures (401, 403) but retry network errors
      if (error instanceof Error) {
        return !error.message.includes('401') && !error.message.includes('403');
      }
      return true;
    }
  });
};

// Create the auth store with persistence and auto-refresh
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      subscribeWithSelector(
        (set, get) => ({
          // Initial state
          user: null,
          session: null,
          isLoading: true,
          isAuthenticated: false,
          isInitialized: false,
          isAdmin: false,
          isVerifiedAdmin: false,
          canAccessDashboard: false,
          permissions: [],
          adminPermissions: [],
          lastRefresh: null,
          autoRefreshEnabled: true,
          refreshTimer: null,
          lastError: null,
          retryCount: 0,
      
          // Basic setters
          setUser: (user) => 
            set(
              (state) => {
                const isAuthenticated = !!user;
                const isAdmin = user?.role === 'admin';
                const permissions = isAdmin ? ADMIN_PERMISSIONS : [];
                
                return {
                  user,
                  isAuthenticated,
                  isAdmin,
                  isVerifiedAdmin: isAdmin,
                  canAccessDashboard: isAdmin,
                  permissions,
                  adminPermissions: isAdmin ? ADMIN_PERMISSIONS : [],
                  lastError: null, // Clear errors on successful auth
                  retryCount: 0,
                };
              },
              false,
              'setUser'
            ),
          
          setSession: (session) => {
            set({ session, lastRefresh: Date.now() }, false, 'setSession');
            // Start auto-refresh when session is set
            if (session && get().autoRefreshEnabled) {
              get().startAutoRefresh();
            }
          },
          
          setLoading: (isLoading) =>
            set({ isLoading }, false, 'setLoading'),
          
          setInitialized: (isInitialized) =>
            set({ isInitialized }, false, 'setInitialized'),
          
          setError: (lastError) =>
            set({ lastError }, false, 'setError'),
      
          // Enhanced auth operations with retry logic
          login: async (email, password) => {
            try {
              set({ isLoading: true, lastError: null }, false, 'login:start');
              
              const result = await retryAuthOperation(async () => {
                return await authClient.signIn.email({ email, password });
              });
              
              if (result.data) {
                const { user, session } = result.data;
                get().setUser(user);
                get().setSession(session);
                return true;
              }
              
              get().setError('Login failed: Invalid credentials');
              return false;
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Login failed';
              get().setError(errorMsg);
              handleError(error, { 
                category: ErrorCategory.AUTHENTICATION,
                showToast: true 
              });
              return false;
            } finally {
              set({ isLoading: false }, false, 'login:end');
            }
          },
          
          logout: async () => {
            try {
              set({ isLoading: true }, false, 'logout:start');
              
              // Stop auto-refresh
              get().stopAutoRefresh();
              
              await retryAuthOperation(async () => {
                await authClient.signOut();
              });
              
              // Clear all auth state
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isAdmin: false,
                isVerifiedAdmin: false,
                canAccessDashboard: false,
                permissions: [],
                adminPermissions: [],
                lastRefresh: null,
                lastError: null,
                retryCount: 0,
              }, false, 'logout:complete');
              
            } catch (error) {
              console.error('Logout failed:', error);
              // Clear state anyway on logout failure
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isAdmin: false,
                isVerifiedAdmin: false,
                canAccessDashboard: false,
                permissions: [],
                adminPermissions: [],
                lastRefresh: null,
              }, false, 'logout:force');
            } finally {
              set({ isLoading: false }, false, 'logout:end');
            }
          },
          
          refreshSession: async () => {
            try {
              set({ isLoading: true }, false, 'refresh:start');
              
              const session = await retryAuthOperation(async () => {
                return await authClient.getSession();
              });
              
              if (session?.user) {
                get().setUser(session.user);
                get().setSession(session);
                return true;
              } else {
                // No valid session, clear state
                get().setUser(null);
                get().setSession(null);
                get().stopAutoRefresh();
                return false;
              }
            } catch (error) {
              console.error('Session refresh failed:', error);
              const state = get();
              const newRetryCount = state.retryCount + 1;
              
              // If we've retried too many times, clear the session
              if (newRetryCount >= 3) {
                get().setUser(null);
                get().setSession(null);
                get().stopAutoRefresh();
                set({ retryCount: 0 }, false, 'refresh:max-retries');
                return false;
              }
              
              set({ retryCount: newRetryCount }, false, 'refresh:retry');
              return false;
            } finally {
              set({ isLoading: false }, false, 'refresh:end');
            }
          },
          
          // Auto-refresh functionality
          startAutoRefresh: () => {
            const state = get();
            if (state.refreshTimer) {
              clearTimeout(state.refreshTimer);
            }
            
            get().scheduleRefresh();
          },
          
          stopAutoRefresh: () => {
            const state = get();
            if (state.refreshTimer) {
              clearTimeout(state.refreshTimer);
              set({ refreshTimer: null }, false, 'stopAutoRefresh');
            }
          },
          
          scheduleRefresh: (delay?: number) => {
            const state = get();
            const {session} = state;
            
            if (!session || !state.autoRefreshEnabled) return;
            
            // Calculate refresh time (5 minutes before expiry, or use provided delay)
            let refreshDelay = delay;
            if (!refreshDelay && session.expiresAt) {
              const expiresAt = new Date(session.expiresAt).getTime();
              const now = Date.now();
              const timeUntilExpiry = expiresAt - now;
              
              // Refresh 5 minutes before expiry, but at least in 1 minute
              refreshDelay = Math.max(timeUntilExpiry - (5 * 60 * 1000), 60 * 1000);
            }
            
            // Default to 15 minutes if no expiry info
            refreshDelay = refreshDelay || (15 * 60 * 1000);
            
            const timer = setTimeout(async () => {
              const success = await get().refreshSession();
              if (success) {
                get().scheduleRefresh(); // Schedule next refresh
              }
            }, refreshDelay);
            
            set({ refreshTimer: timer }, false, 'scheduleRefresh');
          },
      
      // Permission checks
      hasPermission: (permission) => {
        const { permissions } = get();
        return permissions.includes(permission);
      },
      
      canManageResource: (resource, action) => {
        const permission = `${resource}:${action}`;
        return get().hasPermission(permission);
      },
      
      // Admin checks
      checkAdminStatus: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          // In a real app, you might need to verify admin status with the server
          // For now, we'll trust the user.role from the session
          const isAdmin = user.role === 'admin';
          
          set({
            isAdmin,
            isVerifiedAdmin: isAdmin,
            canAccessDashboard: isAdmin,
            permissions: isAdmin ? ADMIN_PERMISSIONS : [],
            adminPermissions: isAdmin ? ADMIN_PERMISSIONS : [],
          }, false, 'checkAdminStatus');
          
        } catch (error) {
          console.error('Admin status check failed:', error);
          // On error, remove admin access
          set({
            isAdmin: false,
            isVerifiedAdmin: false,
            canAccessDashboard: false,
            permissions: [],
            adminPermissions: [],
          }, false, 'checkAdminStatus:error');
        }
      },
      
      verifyAdminAccess: async () => {
        const { isAdmin, user } = get();
        
        if (!user || !isAdmin) {
          return false;
        }
        
        try {
          // Additional verification logic could go here
          // For example, checking if the admin account is still active
          return true;
        } catch (error) {
          console.error('Admin access verification failed:', error);
          return false;
        }
      },
      
      // Recovery and retry operations
      retryLastOperation: async () => {
        const { lastError, retryCount } = get();
        
        if (!lastError || retryCount >= 3) {
          return;
        }
        
        try {
          set({ retryCount: retryCount + 1 }, false, 'retryLastOperation:start');
          
          // Try to refresh the session as a default retry operation
          const success = await get().refreshSession();
          
          if (success) {
            get().resetErrorState();
          }
        } catch (error) {
          console.error('Retry operation failed:', error);
        }
      },
      
      resetErrorState: () => {
        set({
          lastError: null,
          retryCount: 0
        }, false, 'resetErrorState');
      },
        })
      ),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
          isAdmin: state.isAdmin,
          autoRefreshEnabled: state.autoRefreshEnabled,
        }),
      }
    ),
    { name: 'Auth Store' }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore((state) => state.isAdmin);
export const useIsVerifiedAdmin = () => useAuthStore((state) => state.isVerifiedAdmin);
export const useCanAccessDashboard = () => useAuthStore((state) => state.canAccessDashboard);
export const usePermissions = () => useAuthStore((state) => state.permissions);
export const useAdminPermissions = () => useAuthStore((state) => state.adminPermissions);

// Stable compound selectors to prevent infinite loops
const authStatusSelector = (state: AuthState) => ({
  isLoading: state.isLoading,
  isAuthenticated: state.isAuthenticated,
  isAdmin: state.isAdmin,
  canAccessDashboard: state.canAccessDashboard,
});

const authActionsSelector = (state: AuthState) => ({
  login: state.login,
  logout: state.logout,
  refreshSession: state.refreshSession,
  checkAdminStatus: state.checkAdminStatus,
  verifyAdminAccess: state.verifyAdminAccess,
});

const permissionChecksSelector = (state: AuthState) => ({
  hasPermission: state.hasPermission,
  canManageResource: state.canManageResource,
});

// Use stable selectors
export const useAuthStatus = () => useAuthStore(authStatusSelector);
export const useAuthActions = () => useAuthStore(authActionsSelector);
export const usePermissionChecks = () => useAuthStore(permissionChecksSelector);

// Initialize auth store on app start
export async function initializeAuthStore() {
  const store = useAuthStore.getState();
  await store.refreshSession();
}