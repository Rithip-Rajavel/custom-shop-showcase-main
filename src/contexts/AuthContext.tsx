import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiGet, apiPost, setToken, clearToken } from '@/lib/api';

export type UserRole = 'admin' | 'staff';

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
  admin: [
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
  staff: [
    'dashboard',
    'billing',
    'products',
    'customers',
    'invoices',
    'employees',
    'attendance',
    'reports',
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
    return roles.includes(user.role) || user.role === 'admin';
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
