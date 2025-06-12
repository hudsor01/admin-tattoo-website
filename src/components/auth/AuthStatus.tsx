'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/AuthProvider';
import { signOut } from '@/lib/auth-client';
import { 
  User, 
  Shield, 
  LogOut, 
  Clock, 
  Mail,
  UserCircle,
  Crown
} from 'lucide-react';

/**
 * Authentication Status Component
 * 
 * Displays current user information and authentication status
 */
export function AuthStatus() {
  const { user, isAdmin, isLoading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user.user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Not Authenticated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You are not currently signed in.
          </p>
        </CardContent>
      </Card>
    );
  }

  type UserType = {
    email: string;
    name?: string;
    role?: string;
    createdAt: string | number | Date;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
          {isAdmin && (
            <Badge variant="destructive" className="ml-auto">
              <Crown className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{user.user.email}</span>
          </div>
          
          {user.user.name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.user.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Role: {(user.user as UserType)?.role || 'user'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Signed in: {new Date(user.user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Button 
          onClick={handleSignOut}
          variant="outline"
          className="w-full"
          size="sm"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Compact Auth Status - For navigation bars
 */
export function CompactAuthStatus() {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="animate-pulse h-8 w-8 bg-muted rounded-full"></div>
    );
  }

  if (!user.user) {
    return (
      <Button size="sm" variant="ghost">
        <UserCircle className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <UserCircle className="h-4 w-4" />
        <span className="text-sm font-medium">{user.user.email}</span>
      </div>
      {isAdmin && (
        <Badge variant="destructive" className="text-xs">
          <Crown className="h-3 w-3" />
        </Badge>
      )}
    </div>
  );
}
