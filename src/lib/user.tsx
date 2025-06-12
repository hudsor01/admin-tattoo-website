"use client";

import { createContext, useContext } from "react";
import { useSession } from "@/lib/auth-client";

// Better Auth hooks
export { useSession } from "@/lib/auth-client";

// Auth context for additional state management if needed
interface AuthContextType {
  isLoading: boolean;
  isSignedIn: boolean;
  user: UserWithRole | null;
}

// Add UserWithRole interface to include 'role'
export interface UserWithRole {
  id: string;
  name: string;
  emailVerified: boolean;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isLoading } = useSession();
  const isSignedIn = !!session?.user;
  const user = (session?.user as UserWithRole) || null;

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isSignedIn,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Component for protecting admin routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isLoading } = useSession();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const user = session?.user as UserWithRole | undefined;

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience hook for getting user with proper typing
export function useUser() {
  const { data: session, isPending: isLoading } = useSession();
  return {
    user: (session?.user as UserWithRole) || null,
    isLoading,
    isSignedIn: !!session?.user
  };
}

// Admin role check hook
export function useIsAdmin() {
  const { user } = useUser();
  return user?.role === 'admin';
}