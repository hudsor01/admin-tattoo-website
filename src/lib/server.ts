import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { BetterAuthUser, isAdmin as checkIsAdmin, isVerifiedAdmin, hasPermission, Permission, toBetterAuthUser } from '@/lib/authorization';

/**
 * Get current session on the server
 * Works in RSC, Server Actions, and API routes
 */
export async function getSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    return session;
  } catch {
    // Session error logged
    return null;
  }
}

/**
 * Get current user on the server
 * Returns user object or null if not authenticated
 */
export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Check if current user is an admin
 * Returns true if user has admin role, false otherwise
 */
export async function isAdmin() {
  const user = await getUser();
  if (!user) return false;
  return checkIsAdmin(toBetterAuthUser(user as BetterAuthUser));
}

/**
 * Check if current user is a verified admin
 * Returns true if user has admin role and verified email, false otherwise
 */
export async function isVerifiedAdminUser() {
  const user = await getUser();
  if (!user) return false;
  return isVerifiedAdmin(toBetterAuthUser(user as BetterAuthUser));
}

/**
 * Check if current user has a specific permission
 * Returns true if user has the permission, false otherwise
 */
export async function userHasPermission(permission: Permission) {
  const user = await getUser();
  if (!user) return false;
  return hasPermission(toBetterAuthUser(user as BetterAuthUser), permission);
}

/**
 * Require authentication
 * Throws error if user is not authenticated
 * Use in Server Actions and API routes
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Authentication required");
  }
  return session;
}

/**
 * Require admin authentication
 * Throws error if user is not an admin
 * Use in Server Actions and API routes
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Authentication required");
  }
  
  const user = toBetterAuthUser(session.user);
  if (!checkIsAdmin(user)) {
    throw new Error("Admin access required");
  }
  return session;
}

/**
 * Require verified admin authentication
 * Throws error if user is not a verified admin
 * Use in Server Actions and API routes
 */
export async function requireVerifiedAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Authentication required");
  }
  
  const user = toBetterAuthUser(session.user);
  if (!isVerifiedAdmin(user)) {
    throw new Error("Verified admin access required");
  }
  return session;
}

/**
 * Require specific permission
 * Throws error if user doesn't have the permission
 * Use in Server Actions and API routes
 */
export async function requirePermission(permission: Permission) {
  const session = await getSession();
  if (!session) {
    throw new Error("Authentication required");
  }
  
  const user = toBetterAuthUser(session.user);
  if (!hasPermission(user, permission)) {
    throw new Error(`Permission required: ${permission}`);
  }
  return session;
}

/**
 * Sign out server action
 * Works with nextCookies plugin for automatic cookie handling
 */
export async function signOutAction() {
  "use server";
  
  try {
    await auth.api.signOut({
      headers: await headers()
    });
  } catch {
    // Sign out error logged;
    throw new Error("Failed to sign out");
  }
}
