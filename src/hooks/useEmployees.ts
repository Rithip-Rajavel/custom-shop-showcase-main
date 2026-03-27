import { useState, useEffect, useCallback } from 'react';
import { Employee, EmployeeRequest } from '@/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<Employee[]>('/api/employees');
      setEmployees(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const addEmployee = async (
    employee: EmployeeRequest
  ): Promise<Employee> => {
    const newEmployee = await apiPost<Employee>('/api/employees', employee);
    setEmployees((prev) => [newEmployee, ...prev]);
    return newEmployee;
  };

  const updateEmployee = async (
    id: string,
    updates: Partial<EmployeeRequest>
  ): Promise<Employee> => {
    const updated = await apiPut<Employee>(`/api/employees/${id}`, updates);
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? updated : emp))
    );
    return updated;
  };

  const deleteEmployee = async (id: string): Promise<void> => {
    await apiDelete(`/api/employees/${id}`);
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  };

  const getEmployeeById = (id: string): Employee | undefined => {
    return employees.find((emp) => emp.id === id);
  };

  const getActiveEmployees = (): Employee[] => {
    return employees.filter((emp) => emp.active);
  };

  return {
    employees,
    isLoading,
    error,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    getActiveEmployees,
  };
}
