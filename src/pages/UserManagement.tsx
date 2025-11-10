import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, ShieldOff, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  role: 'admin' | 'user';
}

export default function UserManagement() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'promote' | 'demote'>('promote');

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_users_list');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userData: UserData, action: 'promote' | 'demote') => {
    setSelectedUser(userData);
    setActionType(action);
    setShowConfirmDialog(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;

    const newRole = actionType === 'promote' ? 'admin' : 'user';

    try {
      const { error } = await supabase.rpc('set_user_role', {
        target_user_id: selectedUser.id,
        new_role: newRole,
      });

      if (error) throw error;

      toast.success(`User ${actionType === 'promote' ? 'promoted to admin' : 'demoted to user'}`);
      await fetchUsers();
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(error.message || 'Failed to change user role');
    } finally {
      setShowConfirmDialog(false);
      setSelectedUser(null);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user roles and permissions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((userData) => (
                <div
                  key={userData.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{userData.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(userData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
                      {userData.role}
                    </Badge>
                    {userData.id !== user?.id && (
                      <>
                        {userData.role === 'user' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(userData, 'promote')}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(userData, 'demote')}
                          >
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Remove Admin
                          </Button>
                        )}
                      </>
                    )}
                    {userData.id === user?.id && (
                      <span className="text-sm text-muted-foreground">(You)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'promote' ? 'Promote to Admin' : 'Remove Admin Role'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'promote'
                ? `Are you sure you want to promote ${selectedUser?.email} to admin? They will have full access to manage vocabulary and users.`
                : `Are you sure you want to remove admin role from ${selectedUser?.email}? They will only have regular user access.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
