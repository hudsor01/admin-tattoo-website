"use client"

import React, { useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { IconLoader2, IconLock, IconShieldAlert } from "@tabler/icons-react"
import { useAuth } from "@/lib/auth-provider-unified"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
  showLoadingState?: boolean;
  showErrorState?: boolean;
}

/**
 * Unified Authentication Guard Component
 * 
 * Consolidates all auth protection patterns into one flexible component
 * Replaces: AuthGuard, ProtectedRoute, RequireAdmin, AdminRoute
 */
export function AuthGuard({ 
  children, 
  requireAdmin = false, 
  redirectTo = "/login",
  fallback,
  showLoadingState = true,
  showErrorState = true
}: AuthGuardProps) {
  const { user, isAdmin, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !error) {
      // Redirect if no user and auth is required
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Check admin requirement
      if (requireAdmin && !isAdmin) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [user, isAdmin, isLoading, error, requireAdmin, router, redirectTo]);

  // Show loading state
  if (isLoading && showLoadingState) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <IconLoader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Checking authentication...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error && showErrorState) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <IconShieldAlert className="h-5 w-5 text-destructive" />
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error.message || "Authentication failed"}
            </p>
            <Button onClick={() => router.push(redirectTo)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check authentication
  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <IconLock className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You need to be signed in to access this page.
            </p>
            <Button onClick={() => router.push(redirectTo)}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <IconShieldAlert className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You need admin privileges to access this page.
            </p>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Admin Guard - Shorthand for requiring admin access
 */
export function AdminGuard({ 
  children, 
  fallback, 
  redirectTo = "/login" 
}: Omit<AuthGuardProps, 'requireAdmin'>) {
  return (
    <AuthGuard requireAdmin={true} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  );
}

/**
 * Higher-order component version for class components or complex wrapping
 */
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options: Omit<AuthGuardProps, "children"> = {}
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Higher-order component for admin-only components
 */
export function withAdminAuth<T extends object>(
  Component: React.ComponentType<T>,
  options: Omit<AuthGuardProps, "children" | "requireAdmin"> = {}
) {
  return withAuth(Component, { ...options, requireAdmin: true });
}
