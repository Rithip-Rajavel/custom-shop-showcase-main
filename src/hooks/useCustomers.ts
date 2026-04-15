import { useState, useEffect, useCallback } from 'react';
import { Customer } from '@/types';
import { apiGet, apiPost, apiPut, apiDelete, getCustomersByContractor } from '@/lib/api';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (params?: { type?: 'customer' | 'contractor'; search?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<Customer[]>('/api/customers', params as Record<string, string | boolean | number | undefined>);
      setCustomers(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
    const newCustomer = await apiPost<Customer>('/api/customers', customer);
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    const updated = await apiPut<Customer>(`/api/customers/${id}`, updates);
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    // Walk-in customer cannot be deleted (enforced by API too)
    if (id === 'walk-in') return;
    await apiDelete(`/api/customers/${id}`);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const searchCustomers = (query: string): Customer[] => {
    // Client-side filter over already-fetched list
    const lowerQuery = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        (c.phone && c.phone.includes(query))
    );
  };

  const getCustomerById = (id: string): Customer | undefined => {
    return customers.find((c) => c.id === id);
  };

  const getCustomersByType = (type: 'customer' | 'contractor'): Customer[] => {
    return customers.filter((c) => c.type === type);
  };

  const getCustomersByContractorId = useCallback(async (contractorId: string): Promise<Customer[]> => {
    const data = await getCustomersByContractor(contractorId);
    return data ?? [];
  }, []);

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    getCustomerById,
    getCustomersByType,
    getCustomersByContractorId,
  };
}
