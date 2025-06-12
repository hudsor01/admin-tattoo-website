'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Authentication Guard Component
 * 
 * Protects routes and components requiring authentication
 */
export function AuthGuard({ 
  children, 
  requireAdmin = false, 
  fallback,
  redirectTo = '/login'
}: AuthGuardProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  // Show loading state
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Checking authentication...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check authentication
  if (!user.user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              You need to be signed in to access this page.
            </p>
            <Button 
              onClick={() => router.push(redirectTo)}
              className="w-full"
            >
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to access this page.
            </p>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Admin Guard - Shorthand for requiring admin access
 */
export function AdminGuard({ children, fallback, redirectTo }: Omit<AuthGuardProps, 'requireAdmin'>) {
  return (
    <AuthGuard requireAdmin fallback={fallback} redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  );
}
