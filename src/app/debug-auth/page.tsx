'use client';

import { useAuthStatus, useSession, useUser } from '@/stores/auth-store';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugAuthPage() {
  const user = useUser();
  const session = useSession();
  const { isLoading, isAuthenticated, isAdmin, canAccessDashboard } = useAuthStatus();
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if in development environment
    const isDev = process.env.NODE_ENV === 'development';
    setIsDevelopment(isDev);
    
    // Redirect to access denied if not in development or not admin
    if (!isDev || (!isLoading && (!isAuthenticated || !isAdmin))) {
      setAccessDenied(true);
      setTimeout(() => {
        router.push('/access-denied');
      }, 3000);
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (accessDenied || !isDevelopment) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Access Denied:</strong> This debug page is only available in development mode for verified administrators.
          <br />
          Redirecting to access denied page...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <strong>Access Restricted:</strong> Admin privileges required for debug access.
        </div>
      </div>
    );
  }

  // Sanitized user data for display (remove sensitive fields)
  const sanitizedUser = user ? {
    id: user.id,
    email: user.email ? `${user.email.substring(0, 3)}***@${user.email.split('@')[1]}` : 'No email',
    role: user.role,
    emailVerified: user.emailVerified,
    name: user.name
  } : null;

  // Sanitized session data (remove tokens and sensitive info)
  const sanitizedSession = session ? {
    expiresAt: session.session?.expiresAt || 'No expiry info',
    userId: session.user?.id || 'No user ID',
    hasValidSession: !!session.session
  } : null;

  return (
    <div className="p-8">
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <strong>Development Debug Page:</strong> This page shows sanitized authentication state for debugging purposes.
      </div>
      
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page (Development Only)</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Environment:</strong> {process.env.NODE_ENV}
        </div>
        
        <div>
          <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Sanitized User:</strong>
          <pre className="bg-gray-100 p-4 mt-2 rounded">
            {sanitizedUser ? JSON.stringify(sanitizedUser, null, 2) : 'No user'}
          </pre>
        </div>
        
        <div>
          <strong>Sanitized Session:</strong>
          <pre className="bg-gray-100 p-4 mt-2 rounded">
            {sanitizedSession ? JSON.stringify(sanitizedSession, null, 2) : 'No session'}
          </pre>
        </div>
        
        <div>
          <strong>Is Admin Check:</strong> {isAdmin ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Can Access Dashboard:</strong> {canAccessDashboard ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Role:</strong> {user?.role || 'No role'}
        </div>
      </div>
    </div>
  );
}