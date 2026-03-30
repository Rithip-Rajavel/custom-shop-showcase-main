import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiGet, apiPost, setToken, clearToken } from '@/lib/api';
import { UserRole } from '@/types/user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role permissions
export const ROLE_PERMISSIONS = {
  [UserRole.superadmin]: [
    'dashboard',
    'billing',
    'products',
    'customers',
    'invoices',
    'employees',
    'attendance',
    'reports',
    'admin',
    'settings',
  ],
  [UserRole.admin]: [
    'dashboard',
    'billing',
    'products',
    'customers',
    'invoices',
    'employees',
    'attendance',
    'reports',
    'admin',
    'settings',
  ],
  [UserRole.owner]: [
    'dashboard',
    'billing',
    'products',
    'customers',
    'invoices',
    'employees',
    'attendance',
    'reports',
    'settings',
  ],
  [UserRole.manager]: [
    'dashboard',
    'billing',
    'products',
    'customers',
    'invoices',
    'employees',
    'attendance',
    'reports',
  ],
  [UserRole.accountant]: [
    'dashboard',
    'billing',
    'customers',
    'invoices',
    'reports',
  ],
  [UserRole.staff]: [
    'dashboard',
    'billing',
    'products',
    'customers',
    'invoices',
    'employees',
    'attendance',
    'reports',
  ],
  [UserRole.employee]: [
    'dashboard',
    'billing',
    'products',
    'customers',
    'invoices',
    'attendance',
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session by calling /api/auth/me if JWT token exists
    const token = localStorage.getItem('shiva-jwt-token');
    if (token) {
      apiGet<AuthUser>('/api/auth/me')
        .then((u) => {
          if (u) setUser(u);
        })
        .catch(() => {
          // Token invalid/expired — clear it
          clearToken();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiPost<LoginResponse>('/api/auth/login', { email, password });
      if (response?.token) {
        setToken(response.token);
        // Fetch user profile after login
        const me = await apiGet<AuthUser>('/api/auth/me');
        setUser(me);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await apiPost('/api/auth/logout');
    } catch {
      // Ignore logout errors — always clear local state
    }
    clearToken();
    setUser(null);
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // Super admin has access to everything
    if (user.role === UserRole.superadmin) return true;
    // Admin has access to most things except super admin only features
    if (user.role === UserRole.admin) return true;
    // Check if user's role is in the required roles
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
