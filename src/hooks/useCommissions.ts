import { useState, useEffect, useCallback } from 'react';
import { CommissionRecord } from '@/types';
import { apiGet, apiPost } from '@/lib/api';

export function useCommissions() {
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissions = useCallback(async (params?: {
    contractorId?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<CommissionRecord[]>('/api/commissions', params as Record<string, string | boolean | number | undefined>);
      setCommissions(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commissions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const addCommission = async (
    contractorId: string,
    contractorName: string,
    invoiceId: string,
    invoiceNumber: string,
    endCustomerName: string,
    amount: number
  ): Promise<CommissionRecord> => {
    const payload = {
      contractorId,
      contractorName,
      invoiceId,
      invoiceNumber,
      endCustomerName,
      amount,
    };
    const record = await apiPost<CommissionRecord>('/api/commissions', payload);
    setCommissions((prev) => [record, ...prev]);
    return record;
  };

  const getContractorCommissions = (contractorId: string): CommissionRecord[] => {
    return commissions
      .filter((c) => c.contractorId === contractorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getTotalCommission = async (contractorId: string): Promise<number> => {
    try {
      const result = await apiGet<Record<string, number>>(
        `/api/commissions/contractor/${contractorId}/total`
      );
      return result?.total ?? 0;
    } catch {
      return commissions
        .filter((c) => c.contractorId === contractorId)
        .reduce((sum, c) => sum + c.amount, 0);
    }
  };

  return {
    commissions,
    isLoading,
    error,
    fetchCommissions,
    addCommission,
    getContractorCommissions,
    getTotalCommission,
  };
}
