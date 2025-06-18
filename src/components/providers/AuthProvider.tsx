'use client';

import React, { type ReactNode } from 'react';
import { 
  useCurrentUser,
  useIsAdmin,
  useIsAuthenticated 
} from '@/lib/auth-utils';
import { authClient } from '@/lib/auth-client';

/**
 * Auth Provider Component
 * 
 * Provides authentication state using Better Auth's native hooks
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Better Auth handles initialization automatically
  return <>{children}</>;
}

/**
 * Hook to access auth state using Better Auth's native session
 */
export function useAuth() {
  const { data: session, isPending: isLoading, error } = authClient.useSession();
  const user = useCurrentUser();
  const isAdmin = useIsAdmin();
  const isAuthenticated = useIsAuthenticated();
  
  return {
    user,
    isAdmin,
    isLoading,
    isAuthenticated,
    session: {
      data: session,
      isPending: isLoading,
      error,
    },
    error,
  };
}

/**
 * Hook to require authentication
 * Throws error if user is not authenticated
 */
export function useRequireAuth() {
  const { data: session, isPending: isLoading } = authClient.useSession();
  const user = session?.user;
  
  if (!isLoading && !user) {
    throw new Error('Authentication required');
  }
  
  return { user, isLoading };
}

/**
 * Hook to require admin authentication
 * Throws error if user is not an admin
 */
export function useRequireAdmin() {
  const { data: session, isPending: isLoading } = authClient.useSession();
  const user = session?.user;
  const isAdmin = user?.role === 'admin';
  
  if (!isLoading && !isAdmin) {
    throw new Error('Admin access required');
  }
  
  return { user, isLoading };
}
