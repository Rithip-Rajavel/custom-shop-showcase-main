import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<User[]>('/api/users');
      // Map API field `active` to local field `isActive`
      const mapped = (data ?? []).map((u: User & { active?: boolean }) => ({
        ...u,
        isActive: u.active ?? u.isActive ?? true,
      }));
      setUsers(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addUser = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const payload = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      // Password not in User type — caller must pass via a separate mechanism if needed
    };
    const newUser = await apiPost<User>('/api/users', payload);
    setUsers((prev) => [...prev, { ...newUser, isActive: (newUser as User & { active?: boolean }).active ?? true }]);
    return newUser;
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
    const updated = await apiPut<User>(`/api/users/${id}`, updates);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, ...updated, isActive: (updated as User & { active?: boolean }).active ?? updated.isActive ?? u.isActive }
          : u
      )
    );
    return updated;
  };

  const deleteUser = async (id: string): Promise<void> => {
    await apiDelete(`/api/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const toggleUserStatus = async (id: string): Promise<void> => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    await updateUser(id, { isActive: !user.isActive });
  };

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
  };
}
