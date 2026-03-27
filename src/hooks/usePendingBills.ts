import { useState, useEffect, useCallback } from 'react';
import { BillItem, Customer, PaymentMethod } from '@/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export interface PendingBill {
  id: string;
  items: BillItem[];
  customerId: string;
  customerName: string;
  customerType: 'customer' | 'contractor';
  paymentMethod: PaymentMethod;
  billDiscount: number;
  amountPaid: number;
  endCustomerName: string;
  commission: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export function usePendingBills() {
  const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingBills = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<PendingBill[]>('/api/pending-bills');
      setPendingBills(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending bills');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingBills();
  }, [fetchPendingBills]);

  const savePendingBill = async (
    items: BillItem[],
    customer: Customer | null,
    paymentMethod: PaymentMethod,
    billDiscount: number,
    amountPaid: number,
    endCustomerName: string,
    commission: number,
    notes: string,
    existingId?: string
  ): Promise<PendingBill> => {
    const payload = {
      customerId: customer?.id || 'walk-in',
      customerName: customer?.name || 'Walk-in Customer',
      customerType: customer?.type || 'customer',
      paymentMethod,
      billDiscount,
      amountPaid,
      endCustomerName,
      commission,
      notes,
      items,
    };

    if (existingId) {
      const updated = await apiPut<PendingBill>(`/api/pending-bills/${existingId}`, payload);
      setPendingBills((prev) => prev.map((b) => (b.id === existingId ? updated : b)));
      return updated;
    }

    const newBill = await apiPost<PendingBill>('/api/pending-bills', payload);
    setPendingBills((prev) => [newBill, ...prev]);
    return newBill;
  };

  const removePendingBill = async (id: string): Promise<void> => {
    await apiDelete(`/api/pending-bills/${id}`);
    setPendingBills((prev) => prev.filter((b) => b.id !== id));
  };

  const getPendingBill = (id: string): PendingBill | undefined => {
    return pendingBills.find((b) => b.id === id);
  };

  return {
    pendingBills,
    isLoading,
    error,
    fetchPendingBills,
    savePendingBill,
    removePendingBill,
    getPendingBill,
  };
}
