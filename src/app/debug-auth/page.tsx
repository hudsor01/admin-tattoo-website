'use client';

import { useSession } from '@/lib/auth-client';

export default function DebugAuthPage() {
  const session = useSession();
  const user = session.data?.user;
  const isLoading = session.isPending;
  const error = session.error;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
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
          <strong>Is Admin Check:</strong> {user?.role === 'admin' ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Role:</strong> {user?.role || 'No role'}
        </div>
      </div>
    </div>
  );
}