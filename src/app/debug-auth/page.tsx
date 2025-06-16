'use client';

import { useUser, useSession, useAuthStatus } from '@/stores/auth-store';

export default function DebugAuthPage() {
  const user = useUser();
  const session = useSession();
  const { isLoading, isAuthenticated, isAdmin, canAccessDashboard } = useAuthStatus();
  const error = null; // Auth errors are handled by the store

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Error:</strong> {error ? JSON.stringify(error, null, 2) : 'None'}
        </div>
        
        <div>
          <strong>User:</strong>
          <pre className="bg-gray-100 p-4 mt-2 rounded">
            {user ? JSON.stringify(user, null, 2) : 'No user'}
          </pre>
        </div>
        
        <div>
          <strong>Session:</strong>
          <pre className="bg-gray-100 p-4 mt-2 rounded">
            {session ? JSON.stringify(session, null, 2) : 'No session'}
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