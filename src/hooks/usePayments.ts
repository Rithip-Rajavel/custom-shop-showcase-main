import { useState, useEffect, useCallback } from 'react';
import { PaymentTransaction, PaymentMethod } from '@/types';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export function usePayments() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (params?: {
    customerId?: string;
    type?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<PaymentTransaction[]>('/api/payments', params as Record<string, string | boolean | number | undefined>);
      setTransactions(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addBillingTransaction = async (
    customerId: string,
    customerName: string,
    invoiceId: string,
    invoiceNumber: string,
    billAmount: number,
    amountPaid: number,
    balanceAfterTransaction: number,
    paymentMethod: PaymentMethod
  ): Promise<PaymentTransaction> => {
    const notes =
      amountPaid < billAmount
        ? `Bill: ₹${billAmount.toFixed(2)}, Paid: ₹${amountPaid.toFixed(2)}, Credit: ₹${(billAmount - amountPaid).toFixed(2)}`
        : 'Fully paid';

    const payload = {
      customerId,
      customerName,
      invoiceId,
      invoiceNumber,
      type: 'billing',
      amount: billAmount,
      balanceAfter: balanceAfterTransaction,
      paymentMethod,
      notes,
    };

    const transaction = await apiPost<PaymentTransaction>('/api/payments', payload);
    setTransactions((prev) => [transaction, ...prev]);
    return transaction;
  };

  const addPaymentTransaction = async (
    customerId: string,
    customerName: string,
    amount: number,
    balanceAfterTransaction: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ): Promise<PaymentTransaction> => {
    const payload = {
      customerId,
      customerName,
      type: 'payment',
      amount,
      balanceAfter: balanceAfterTransaction,
      paymentMethod,
      notes: notes || 'Payment received',
    };

    const transaction = await apiPost<PaymentTransaction>('/api/payments', payload);
    setTransactions((prev) => [transaction, ...prev]);
    return transaction;
  };

  const getCustomerTransactions = (customerId: string): PaymentTransaction[] => {
    return transactions
      .filter((t) => t.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    await apiDelete(`/api/payments/${id}`);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    addBillingTransaction,
    addPaymentTransaction,
    getCustomerTransactions,
    deleteTransaction,
  };
}
