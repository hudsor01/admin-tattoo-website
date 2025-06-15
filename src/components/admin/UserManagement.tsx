'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Define User type to match Better Auth admin plugin response
interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  role?: string;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
  }>({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const { toast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await authClient.admin.listUsers({
        query: {
          limit: 100
        }
      });
      if (result.data?.users) {
        setUsers(result.data.users);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Error", 
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await authClient.admin.createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        data: {}
      });

      if (result.data) {
        toast({
          title: "Success",
          description: "User created successfully"
        });
        setNewUser({ name: '', email: '', password: '', role: 'user' });
        loadUsers(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const banUser = async (userId: string) => {
    try {
      await authClient.admin.banUser(userId, {
        reason: "Administrative action"
      });
      toast({
        title: "Success",
        description: "User banned successfully"
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to ban user",
        variant: "destructive"
      });
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      await authClient.admin.unbanUser(userId);
      toast({
        title: "Success",
        description: "User unbanned successfully"
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unban user", 
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                placeholder="Full Name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="user@example.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Temporary password"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Client</SelectItem>
                  <SelectItem value="artist">Tattoo Artist</SelectItem>
                  <SelectItem value="reception">Reception</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={createUser} className="w-full">
            Create User
          </Button>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Button onClick={loadUsers} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400">
                    Role: {user.role} | Created: {user.createdAt.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  {user.banned ? (
                    <Button onClick={() => unbanUser(user.id)} size="sm" variant="outline">
                      Unban
                    </Button>
                  ) : (
                    <Button onClick={() => banUser(user.id)} size="sm" variant="destructive">
                      Ban
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}