import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
  } catch (error) {
    console.error("Error getting session:", error);
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
  // Cast user to include optional 'role' property for this check
  return (user as { role?: string } | null)?.role === 'admin';
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
  // Cast user to include optional 'role' property for this check
  if ((session.user as { role?: string }).role !== 'admin') {
    throw new Error("Admin access required");
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
  } catch (error) {
    console.error("Error signing out:", error);
    throw new Error("Failed to sign out");
  }
}