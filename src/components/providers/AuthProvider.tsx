'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession, useUser, useIsAdmin } from '@/lib/auth-client';

interface AuthContextValue {
  session: ReturnType<typeof useSession>;
  user: ReturnType<typeof useUser>;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth Provider Component
 * 
 * Provides authentication state and helpers throughout the app
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const user = useUser();
  const isAdmin = useIsAdmin();

  const value: AuthContextValue = {
    session,
    user,
    isAdmin,
    isLoading: session.isPending || user.isLoading,
    error: session.error || user.error || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to require authentication
 * Throws error if user is not authenticated
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  
  if (!isLoading && !user.user) {
    throw new Error('Authentication required');
  }
  
  return { user: user.user, isLoading };
}

/**
 * Hook to require admin authentication
 * Throws error if user is not an admin
 */
export function useRequireAdmin() {
  const { user, isAdmin, isLoading } = useAuth();
  
  if (!isLoading && !isAdmin) {
    throw new Error('Admin access required');
  }
  
  return { user: user.user, isLoading };
}
