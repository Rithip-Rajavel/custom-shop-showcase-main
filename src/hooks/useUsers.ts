import { useState, useEffect, useCallback } from 'react';
import { User, UserRequest, UserUpdateRequest, UserRole } from '@/types/user';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users
  const fetchUsers = useCallback(async (): Promise<User[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<User[]>('/api/users');
      setUsers(data ?? []);
      return data ?? [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new user with password
  const createUser = useCallback(async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    phone: string
  ): Promise<User> => {
    const payload: UserRequest = {
      name,
      email,
      password,
      role,
      phone,
    };

    try {
      const data = await apiPost<User>('/api/users', payload);
      setUsers(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create user');
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (
    id: string,
    updates: UserUpdateRequest
  ): Promise<User> => {
    try {
      const data = await apiPut<User>(`/api/users/${id}`, updates);
      setUsers(prev => prev.map(user =>
        user.id === id ? data : user
      ));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update user');
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (id: string): Promise<void> => {
    try {
      await apiDelete(`/api/users/${id}`);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }, []);

  // Toggle user active status
  const toggleUserStatus = useCallback(async (id: string): Promise<User> => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) throw new Error('User not found');

      const updatedUser = await updateUser(id, {
        active: !user.active
      } as any);

      return updatedUser;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update user status');
    }
  }, [users, updateUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
  };
}
