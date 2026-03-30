import { useState, useEffect } from 'react';
import { Plus, Users, Edit, Trash2, Search, Shield, User, Mail, Phone, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User as UserType, UserRole } from '@/types/user';
import { formatDate } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserForm } from './UserForm';

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const {
    users,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  } = useUsers();
  const { toast } = useToast();

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Check if current user is super admin or admin
  const isSuperAdmin = currentUser?.role === UserRole.superadmin;
  const isAdmin = currentUser?.role === UserRole.admin;
  const canAccessUserManagement = isSuperAdmin || isAdmin;

  useEffect(() => {
    if (!canAccessUserManagement) {
      toast({
        title: 'Access Denied',
        description: 'Only Super Admin or Admin can access User Management',
        variant: 'destructive'
      });
    }
  }, [canAccessUserManagement, toast]);

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: UserType) => {
    // Temporarily disable restrictions to test
    // Only super admin can edit other super admins and admins
    // if (!isSuperAdmin && (user.role === UserRole.superadmin || user.role === UserRole.admin)) {
    //   toast({ title: 'Error', description: 'Only Super Admin can manage other Super Admins and Admins', variant: 'destructive' });
    //   return;
    // }
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (user: UserType) => {
    if (user.id === currentUser?.id) {
      toast({ title: 'Error', description: 'Cannot delete your own account', variant: 'destructive' });
      return;
    }

    // Temporarily disable restrictions to test
    // Only super admin can delete super admins and admins
    // if (!isSuperAdmin && (user.role === UserRole.superadmin || user.role === UserRole.admin)) {
    //   toast({ title: 'Error', description: 'Only Super Admin can manage other Super Admins and Admins', variant: 'destructive' });
    //   return;
    // }

    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    try {
      await deleteUser(user.id);
      toast({ title: 'Success', description: 'User deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (user: UserType) => {
    if (user.id === currentUser?.id) {
      toast({ title: 'Error', description: 'Cannot deactivate your own account', variant: 'destructive' });
      return;
    }

    // Only super admin can toggle status of super admins and admins
    if (!isSuperAdmin && (user.role === UserRole.superadmin || user.role === UserRole.admin)) {
      toast({ title: 'Error', description: 'Only Super Admin can manage other Super Admins and Admins', variant: 'destructive' });
      return;
    }

    try {
      await toggleUserStatus(user.id);
      toast({
        title: 'Success',
        description: `User ${user.active ? 'deactivated' : 'activated'} successfully`
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update user status', variant: 'destructive' });
    }
  };

  const handleUserSubmit = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone: string;
  }) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, data);
        toast({ title: 'Success', description: 'User updated successfully' });
      } else {
        await createUser(data.name, data.email, data.password, data.role, data.phone);
        toast({ title: 'Success', description: 'User created successfully' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save user', variant: 'destructive' });
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.superadmin: return 'destructive';
      case UserRole.admin: return 'default';
      case UserRole.owner: return 'secondary';
      case UserRole.manager: return 'outline';
      case UserRole.accountant: return 'default';
      case UserRole.staff: return 'secondary';
      case UserRole.employee: return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.superadmin: return 'Super Admin';
      case UserRole.admin: return 'Admin';
      case UserRole.owner: return 'Owner';
      case UserRole.manager: return 'Manager';
      case UserRole.accountant: return 'Accountant';
      case UserRole.staff: return 'Staff';
      case UserRole.employee: return 'Employee';
      default: return role;
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.active) ||
      (statusFilter === 'inactive' && !user.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (!canAccessUserManagement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only Super Admin or Admin can access User Management</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage system users and permissions</p>
          </div>
        </div>
        <Button onClick={handleAddUser} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-lg font-semibold text-blue-600">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-lg font-semibold text-green-600">
                  {users.filter(u => u.active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Admin Users</p>
                <p className="text-lg font-semibold text-orange-600">
                  {users.filter(u => u.role === UserRole.admin || u.role === UserRole.superadmin).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ToggleLeft className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Inactive Users</p>
                <p className="text-lg font-semibold text-red-600">
                  {users.filter(u => !u.active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>Role:</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value={UserRole.superadmin}>Super Admin</SelectItem>
                  <SelectItem value={UserRole.admin}>Admin</SelectItem>
                  <SelectItem value={UserRole.owner}>Owner</SelectItem>
                  <SelectItem value={UserRole.manager}>Manager</SelectItem>
                  <SelectItem value={UserRole.accountant}>Accountant</SelectItem>
                  <SelectItem value={UserRole.staff}>Staff</SelectItem>
                  <SelectItem value={UserRole.employee}>Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-lg">{user.name}</h4>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Badge variant={user.active ? 'default' : 'secondary'}>
                            {user.active ? 'Active' : 'Inactive'}
                          </Badge>
                          {user.id === currentUser?.id && (
                            <Badge variant="outline">You</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{user.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>Joined {formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                          disabled={user.id === currentUser?.id}
                          className={user.active ? 'text-orange-600' : 'text-green-600'}
                        >
                          {user.active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          disabled={false}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.id === currentUser?.id}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Form Modal */}
      <UserForm
        isOpen={showUserForm}
        onClose={() => setShowUserForm(false)}
        user={editingUser}
        onSubmit={handleUserSubmit}
      />
    </div>
  );
}
