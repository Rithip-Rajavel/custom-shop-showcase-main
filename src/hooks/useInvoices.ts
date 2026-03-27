import { useState, useEffect, useCallback } from 'react';
import { Invoice } from '@/types';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export interface InvoiceStats {
  totalInvoices: number;
  todayInvoices: number;
  todayRevenue: number;
  monthlyRevenue: number;
  pendingAmount: number;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (params?: {
    customerId?: string;
    status?: 'paid' | 'pending' | 'cancelled';
    billType?: 'rough' | 'final_bill';
    fromDate?: string;
    toDate?: string;
    search?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<Invoice[]>('/api/invoices', params as Record<string, string | boolean | number | undefined>);
      setInvoices(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const generateInvoiceNumber = async (prefix: string = 'INV'): Promise<string> => {
    try {
      const result = await apiGet<string>('/api/invoices/next-number', { prefix });
      return result ?? `${prefix}000001`;
    } catch {
      return `${prefix}000001`;
    }
  };

  const addInvoice = async (
    invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>,
    prefix?: string
  ): Promise<Invoice> => {
    const invoiceNumber = await generateInvoiceNumber(prefix);
    const payload = { ...invoice, invoiceNumber };
    const newInvoice = await apiPost<Invoice>('/api/invoices', payload);
    setInvoices((prev) => [newInvoice, ...prev]);
    return newInvoice;
  };

  const applyPaymentToInvoices = async (invoiceId: string, amount: number, paymentMethod: string): Promise<Invoice> => {
    const updated = await apiPost<Invoice>(`/api/invoices/${invoiceId}/pay`, {
      amount,
      paymentMethod,
    });
    setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? updated : inv)));
    return updated;
  };

  const deleteInvoice = async (id: string): Promise<void> => {
    await apiDelete(`/api/invoices/${id}`);
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const getInvoiceById = (id: string): Invoice | undefined => {
    return invoices.find((inv) => inv.id === id);
  };

  const getInvoicesByCustomer = (customerId: string): Invoice[] => {
    return invoices.filter((inv) => inv.customerId === customerId);
  };

  const searchInvoices = (query: string): Invoice[] => {
    const lowerQuery = query.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(lowerQuery) ||
        inv.customerName.toLowerCase().includes(lowerQuery) ||
        (inv.customerPhone && inv.customerPhone.includes(query))
    );
  };

  const getInvoiceStats = async (period: string = 'month'): Promise<InvoiceStats> => {
    try {
      return await apiGet<InvoiceStats>('/api/invoices/stats', { period });
    } catch {
      // Fallback: compute from local list
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayInvoices = invoices.filter((inv) => {
        const d = new Date(inv.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
      const thisMonth = invoices.filter((inv) => {
        const d = new Date(inv.createdAt);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      });
      return {
        totalInvoices: invoices.length,
        todayInvoices: todayInvoices.length,
        todayRevenue: todayInvoices.reduce((s, inv) => s + inv.amountPaid, 0),
        monthlyRevenue: thisMonth.reduce((s, inv) => s + inv.amountPaid, 0),
        pendingAmount: invoices.reduce((s, inv) => s + (inv.balance || 0), 0),
      };
    }
  };

  const getCustomerBalance = async (customerId: string) => {
    try {
      return await apiGet<{
        totalBilled: number;
        totalPaid: number;
        pendingBalance: number;
        invoiceCount: number;
      }>(`/api/customers/${customerId}/balance`);
    } catch {
      const customerInvoices = getInvoicesByCustomer(customerId);
      const totalBilled = customerInvoices.reduce((s, inv) => s + inv.grandTotal, 0);
      const totalPaid = customerInvoices.reduce((s, inv) => s + (inv.amountPaid || inv.grandTotal), 0);
      return {
        totalBilled,
        totalPaid,
        pendingBalance: totalBilled - totalPaid,
        invoiceCount: customerInvoices.length,
      };
    }
  };

  return {
    invoices,
    isLoading,
    error,
    fetchInvoices,
    addInvoice,
    applyPaymentToInvoices,
    deleteInvoice,
    getInvoiceById,
    getInvoicesByCustomer,
    searchInvoices,
    getInvoiceStats,
    getCustomerBalance,
    generateInvoiceNumber,
  };
}
