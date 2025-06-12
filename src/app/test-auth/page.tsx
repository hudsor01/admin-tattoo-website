import { AuthGuard, AdminGuard } from '@/components/auth/AuthGuard';
import { AuthStatus } from '@/components/auth/AuthStatus';
import { getSession, isAdmin } from '@/lib/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Database } from 'lucide-react';

/**
 * Test page to demonstrate Better Auth integration
 */
export default async function TestAuthPage() {
  // Server-side auth check
  const session = await getSession();
  const userIsAdmin = await isAdmin();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Better Auth Integration Test</h1>
      
      {/* Server-side authentication info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Server-Side Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Session exists: <Badge variant={session ? "default" : "destructive"}>{session ? "Yes" : "No"}</Badge></p>
          <p>User is admin: <Badge variant={userIsAdmin ? "default" : "secondary"}>{userIsAdmin ? "Yes" : "No"}</Badge></p>
          {session && (
            <div className="text-sm text-muted-foreground mt-2">
              <p>User: {session.user.email}</p>
              <p>User ID: {session.user.id}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client-side authentication status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client-Side Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuthStatus />
        </CardContent>
      </Card>

      {/* Authentication guard example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Protected Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuthGuard>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-green-800 dark:text-green-200">
                ✅ This content is only visible to authenticated users!
              </p>
            </div>
          </AuthGuard>
        </CardContent>
      </Card>

      {/* Admin guard example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Only Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminGuard>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200">
                ✅ This content is only visible to admin users!
              </p>
            </div>
          </AdminGuard>
        </CardContent>
      </Card>
    </div>
  );
}