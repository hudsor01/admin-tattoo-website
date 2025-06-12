"use client"

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from '@/lib/auth-client';

// Unified user interface with role
export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Unified auth context interface
export interface AuthContextValue {
  user: UserWithRole | null;
  session: ReturnType<typeof useSession>;
  isLoading: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Unified Auth Provider Component
 * 
 * Provides authentication state and helpers throughout the app
 * Consolidates multiple auth provider patterns into one
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  
  // Cast user as UserWithRole to ensure 'role' is available
  const user = (session.data?.user as UserWithRole) || null;
  const isAdmin = user?.role === 'admin';
  const isSignedIn = !!user;
  const isLoading = session.isPending;
  const error = session.error || null;

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isSignedIn,
    isAdmin,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access unified auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Convenience hook for getting user with proper typing
 * Compatible with existing codebase
 */
export function useUser() {
  const { user, isLoading, error } = useAuth();
  return {
    user,
    isLoading,
    isSignedIn: !!user,
    error
  };
}

/**
 * Admin role check hook
 */
export function useIsAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin;
}

/**
 * Hook to require authentication
 * Throws error if user is not authenticated
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  
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
  const { user, isAdmin, isLoading } = useAuth();
  
  if (!isLoading && !isAdmin) {
    throw new Error('Admin access required');
  }
  
  return { user, isLoading };
}
