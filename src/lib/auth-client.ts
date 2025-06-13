import { createAuthClient } from "better-auth/react";
import { useMemo } from "react";
import { 
  AuthorizedUser, 
  Permission, 
  Role, 
  hasPermission, 
  hasAnyPermission, 
  isAdmin, 
  isVerifiedAdmin,
  canAccessDashboard,
  canManageResource,
  getUserPermissions
} from './authorization';
import { getAuthConfig } from './env-validation';

// Enhanced user interface with authorization support
export interface UserWithRole extends AuthorizedUser {
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
}

export const authClient = createAuthClient({
    baseURL: getAuthConfig().baseUrl,
});

export const {
    signIn,
    signOut,
    signUp,
    useSession,
    getSession,
    $Infer
} = authClient;

// Custom hook to get user data with better typing
export function useUser() {
    const session = useSession();
    
    return useMemo(() => ({
        user: session.data?.user as UserWithRole | undefined,
        isLoading: session.isPending,
        error: session.error
    }), [session.data?.user, session.isPending, session.error]);
}

// Custom hook to check if user is admin (using new authorization system)
export function useIsAdmin() {
    const { user, isLoading } = useUser();
    
    return useMemo(() => {
        if (isLoading || !user) return false;
        return isAdmin(user);
    }, [user, isLoading]);
}

// Hook to check if user is verified admin
export function useIsVerifiedAdmin() {
    const { user, isLoading } = useUser();
    
    return useMemo(() => {
        if (isLoading || !user) return false;
        return isVerifiedAdmin(user);
    }, [user, isLoading]);
}

// Hook to check if user can access dashboard
export function useCanAccessDashboard() {
    const { user, isLoading } = useUser();
    
    return useMemo(() => {
        if (isLoading || !user) return false;
        return canAccessDashboard(user);
    }, [user, isLoading]);
}

// Hook to check specific permissions
export function useHasPermission(permission: Permission) {
    const { user, isLoading } = useUser();
    
    return useMemo(() => {
        if (isLoading || !user) return false;
        return hasPermission(user, permission);
    }, [user, isLoading, permission]);
}

// Hook to check multiple permissions (any)
export function useHasAnyPermission(permissions: Permission[]) {
    const { user, isLoading } = useUser();
    
    return useMemo(() => {
        if (isLoading || !user) return false;
        return hasAnyPermission(user, permissions);
    }, [user, isLoading, permissions]);
}

// Hook to check resource management permissions
export function useCanManageResource(resource: string, action: 'read' | 'create' | 'update' | 'delete') {
    const { user, isLoading } = useUser();
    
    return useMemo(() => {
        if (isLoading || !user) return false;
        return canManageResource(user, resource, action);
    }, [user, isLoading, resource, action]);
}

// Hook to get user permissions (using new authorization system)
export function usePermissions() {
    const { user, isLoading } = useUser();
    
    return useMemo(() => {
        if (isLoading || !user) return [];
        return getUserPermissions(user);
    }, [user, isLoading]);
}

// Hook to get admin-specific permissions
export function useAdminPermissions() {
    const { user, isLoading } = useUser();
    
    return useMemo(() => {
        if (isLoading || !user || !isAdmin(user)) return [];
        return getUserPermissions(user);
    }, [user, isLoading]);
}

// Export authorization utilities for direct use
export { Permission, Role, isAdmin, isVerifiedAdmin, canAccessDashboard, canManageResource };


