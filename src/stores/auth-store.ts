import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { authClient } from '@/lib/auth-client';
import type { User, Session } from '@/types/auth';

// Auth state interface
interface AuthState {
  // Core auth state
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Admin specific state
  isAdmin: boolean;
  isVerifiedAdmin: boolean;
  canAccessDashboard: boolean;
  
  // Permissions
  permissions: string[];
  adminPermissions: string[];
  
  // Auth actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Auth operations
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Permission checks
  hasPermission: (permission: string) => boolean;
  canManageResource: (resource: string, action: string) => boolean;
  
  // Admin checks
  checkAdminStatus: () => Promise<void>;
  verifyAdminAccess: () => Promise<boolean>;
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

// Create the auth store
export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      isVerifiedAdmin: false,
      canAccessDashboard: false,
      permissions: [],
      adminPermissions: [],
      
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
              isVerifiedAdmin: isAdmin, // For now, admin role = verified admin
              canAccessDashboard: isAdmin,
              permissions,
              adminPermissions: isAdmin ? ADMIN_PERMISSIONS : [],
            };
          },
          false,
          'setUser'
        ),
      
      setSession: (session) =>
        set({ session }, false, 'setSession'),
      
      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),
      
      // Auth operations
      login: async (email, password) => {
        try {
          set({ isLoading: true }, false, 'login:start');
          
          const result = await authClient.signIn.email({
            email,
            password,
          });
          
          if (result.data) {
            const { user, session } = result.data;
            get().setUser(user);
            get().setSession(session);
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Login failed:', error);
          return false;
        } finally {
          set({ isLoading: false }, false, 'login:end');
        }
      },
      
      logout: async () => {
        try {
          set({ isLoading: true }, false, 'logout:start');
          
          await authClient.signOut();
          
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
          }, false, 'logout:complete');
          
        } catch (error) {
          console.error('Logout failed:', error);
        } finally {
          set({ isLoading: false }, false, 'logout:end');
        }
      },
      
      refreshSession: async () => {
        try {
          set({ isLoading: true }, false, 'refresh:start');
          
          const session = await authClient.getSession();
          
          if (session?.user) {
            get().setUser(session.user);
            get().setSession(session);
          } else {
            // No valid session, clear state
            get().setUser(null);
            get().setSession(null);
          }
        } catch (error) {
          console.error('Session refresh failed:', error);
          // Clear state on error
          get().setUser(null);
          get().setSession(null);
        } finally {
          set({ isLoading: false }, false, 'refresh:end');
        }
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
    }),
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

// Compound selectors
export const useAuthStatus = () => useAuthStore((state) => ({
  isLoading: state.isLoading,
  isAuthenticated: state.isAuthenticated,
  isAdmin: state.isAdmin,
  canAccessDashboard: state.canAccessDashboard,
}));

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  refreshSession: state.refreshSession,
  checkAdminStatus: state.checkAdminStatus,
  verifyAdminAccess: state.verifyAdminAccess,
}));

export const usePermissionChecks = () => useAuthStore((state) => ({
  hasPermission: state.hasPermission,
  canManageResource: state.canManageResource,
}));

// Initialize auth store on app start
export async function initializeAuthStore() {
  const store = useAuthStore.getState();
  await store.refreshSession();
}