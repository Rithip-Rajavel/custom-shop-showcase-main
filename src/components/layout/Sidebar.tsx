import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  FileText,
  Settings,
  UserCog,
  Menu,
  X,
  Hammer,
  BarChart3,
  LogOut,
  Shield,
  User,
  UserCheck,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, ROLE_PERMISSIONS } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { to: '/billing', label: 'Billing', icon: Receipt, permission: 'billing' },
  { to: '/products', label: 'Products', icon: Package, permission: 'products' },
  { to: '/customers', label: 'Customers & Contractors', icon: Users, permission: 'customers' },
  { to: '/invoices', label: 'Invoices', icon: FileText, permission: 'invoices' },
  { to: '/employees', label: 'Employees', icon: UserCheck, permission: 'employees' },
  { to: '/attendance', label: 'Attendance', icon: Calendar, permission: 'attendance' },
  { to: '/bonus', label: 'Bonus Management', icon: DollarSign, permission: 'admin' },
  { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports' },
  { to: '/admin', label: 'Admin', icon: UserCog, permission: 'admin' },
  { to: '/settings', label: 'Settings', icon: Settings, permission: 'settings' },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter nav items based on user permissions
  const userPermissions = user ? ROLE_PERMISSIONS[user.role] : [];
  const visibleNavItems = navItems.filter((item) => userPermissions.includes(item.permission));

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-sidebar z-50 transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Hammer className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground text-sm leading-tight">
                  Sri Sai Shiva
                </h1>
                <p className="text-xs text-sidebar-foreground/60">Hardwares</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  user.role === 'admin' ? 'bg-primary/20' : 'bg-accent/20'
                )}>
                  {user.role === 'admin' ? (
                    <Shield className="w-5 h-5 text-primary" />
                  ) : (
                    <User className="w-5 h-5 text-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.name}
                  </p>
                  <p className={cn(
                    "text-xs capitalize font-medium",
                    user.role === 'admin' ? 'text-primary' : 'text-accent'
                  )}>
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'sidebar-link',
                    isActive && 'sidebar-link-active'
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </Button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/50 text-center">
              © 2025 Shiva Hardwares
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
