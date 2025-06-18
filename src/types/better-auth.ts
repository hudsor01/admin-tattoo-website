/**
 * Better Auth Type Extensions
 * 
 * These types extend the Better Auth types to include our custom fields
 * and provide proper type safety throughout the application.
 */

import type { AuthSession, AuthUser } from '@/lib/auth';

// Extended user type that includes our custom fields
export type ExtendedUser = AuthUser;

// Session data type for client-side usage
export interface SessionData {
  user: ExtendedUser;
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

// Better Auth response wrapper
export interface BetterAuthResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Type guard to check if user has role property
export function isExtendedUser(user: unknown): user is ExtendedUser {
  return Boolean(user && typeof user === 'object' && user !== null && 'id' in user);
}

// Type guard to check if response contains user data
export function hasUserData(data: unknown): data is { user: ExtendedUser } {
  return Boolean(
    data && 
    typeof data === 'object' && 
    data !== null && 
    'user' in data && 
    isExtendedUser((data as { user: unknown }).user)
  );
}

// Safe role extractor
export function getUserRole(user: unknown): string | undefined {
  if (isExtendedUser(user) && user.role !== null) {
    return user.role;
  }
  return undefined;
}

// Safe session data extractor
export function extractSessionData(session: unknown): { user?: ExtendedUser; userId?: string } {
  if (!session) return {};
  
  // Handle different Better Auth response formats
  if (hasUserData(session)) {
    return { user: session.user, userId: session.user.id };
  }
  
  // Check if session has user property
  if (session && typeof session === 'object' && session !== null && 'user' in session) {
    const sessionWithUser = session as { user: unknown };
    if (isExtendedUser(sessionWithUser.user)) {
      return { user: sessionWithUser.user, userId: sessionWithUser.user.id };
    }
  }
  
  if (isExtendedUser(session)) {
    return { user: session, userId: session.id };
  }
  
  return {};
}
