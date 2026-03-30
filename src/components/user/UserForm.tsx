import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Lock, Shield, Eye, EyeOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { User as UserType, UserRole } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserType | null;
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone: string;
  }) => Promise<void>;
}

export function UserForm({ isOpen, onClose, user, onSubmit }: UserFormProps) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.employee,
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  // Available permissions
  const availablePermissions = [
    { id: 'dashboard', label: 'Dashboard', description: 'View main dashboard' },
    { id: 'billing', label: 'Billing', description: 'Manage billing and invoices' },
    { id: 'products', label: 'Products', description: 'Manage products and inventory' },
    { id: 'customers', label: 'Customers', description: 'Manage customers and contractors' },
    { id: 'invoices', label: 'Invoices', description: 'View and manage invoices' },
    { id: 'employees', label: 'Employees', description: 'Manage employee records' },
    { id: 'attendance', label: 'Attendance', description: 'Manage attendance tracking' },
    { id: 'reports', label: 'Reports', description: 'View reports and analytics' },
    { id: 'admin', label: 'Admin', description: 'Administrative functions' },
    { id: 'settings', label: 'Settings', description: 'System settings' },
  ];

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        phone: user.phone,
      });
      // Reset permissions when form is opened
      setSelectedPermissions([]);
      setShowPermissions(false);
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: UserRole.employee,
        phone: '',
      });
      setSelectedPermissions([]);
      setShowPermissions(false);
    }
    setErrors({});
  }, [user, isOpen]);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permissionId));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!user && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (user && formData.password.trim() && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const roleOptions = [
    { value: UserRole.superadmin, label: 'Super Admin', description: 'Full system access' },
    { value: UserRole.admin, label: 'Admin', description: 'Administrative access' },
    { value: UserRole.owner, label: 'Owner', description: 'Business owner access' },
    { value: UserRole.manager, label: 'Manager', description: 'Management access' },
    { value: UserRole.accountant, label: 'Accountant', description: 'Financial access' },
    { value: UserRole.staff, label: 'Staff', description: 'Staff access' },
    { value: UserRole.employee, label: 'Employee', description: 'Basic employee access' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {user ? 'Edit User' : 'Add New User'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter password"
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
          )}

          {user && (
            <div className="space-y-2">
              <Label htmlFor="password">New Password (optional)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Leave empty to keep current password"
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to keep current password, or enter new password to update
              </p>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
          </div>

          {/* Permissions Section - Show for admin and super admin when editing existing users */}
          {user && (currentUser?.role === UserRole.admin || currentUser?.role === UserRole.superadmin) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPermissions(!showPermissions)}
                  className="text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  {showPermissions ? 'Hide' : 'Show'} Permissions
                </Button>
              </div>

              {showPermissions && (
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        Select permissions for this user:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {availablePermissions.map((permission) => (
                          <div key={permission.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(permission.id, checked as boolean)
                              }
                              disabled={isLoading}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <Label
                                htmlFor={permission.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {permission.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
