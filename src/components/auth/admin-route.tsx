'use client';

import { ReactNode } from 'react';
import { useUser, useIsVerifiedAdmin } from '@/lib/auth-client';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useUser();
  const isVerifiedAdmin = useIsVerifiedAdmin();
  
  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    window.location.href = '/api/auth/signin';
    return null;
  }
  
  // Show access denied if not verified admin
  if (!isVerifiedAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            You need verified admin permissions to access this page. 
            {!user.emailVerified && " Please verify your email address first."}
          </p>
        </div>
      </div>
    );
  }
  
  // Render children if user is verified admin
  return <>{children}</>;
}