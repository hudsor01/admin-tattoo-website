'use client';

import React, { ReactNode, useEffect } from 'react';
import { 
  useUser, 
  useAuthStatus,
  initializeAuthStore 
} from '@/stores/auth-store';

/**
 * Auth Provider Component
 * 
 * Initializes and provides authentication state throughout the app using Zustand store
 * This component replaces the old Context API approach with Zustand for better performance
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize auth store on mount
  useEffect(() => {
    initializeAuthStore().catch(console.error);
  }, []);

  return <>{children}</>;
}

/**
 * Hook to access auth state (migrated from Context to Zustand)
 * 
 * @deprecated Use specific auth hooks like useUser, useIsAdmin, etc. for better performance
 * This hook is kept for backward compatibility during migration
 */
export function useAuth() {
  const user = useUser();
  const { isLoading, isAuthenticated, isAdmin } = useAuthStatus();
  
  return {
    user,
    isAdmin,
    isLoading,
    isAuthenticated,
    // For compatibility with existing code that expects session object
    session: {
      data: user ? { user } : null,
      isPending: isLoading,
      error: null,
    },
    error: null,
  };
}

/**
 * Hook to require authentication
 * Throws error if user is not authenticated
 */
export function useRequireAuth() {
  const user = useUser();
  const { isLoading } = useAuthStatus();
  
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
  const user = useUser();
  const { isLoading, isAdmin } = useAuthStatus();
  
  if (!isLoading && !isAdmin) {
    throw new Error('Admin access required');
  }
  
  return { user, isLoading };
}
