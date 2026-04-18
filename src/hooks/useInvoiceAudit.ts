import { useState, useCallback } from 'react';
import {
  getInvoiceAuditTrail,
  getCustomerAuditLogs,
  getOverduePaymentLogs,
} from '@/lib/api';

export function useInvoiceAudit() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInvoiceAudit = useCallback(async (invoiceId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvoiceAuditTrail(invoiceId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice audit');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCustomerAudit = useCallback(async (customerId: string): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomerAuditLogs(customerId);
      setAuditLogs(data ?? []);
      return data ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer audit logs');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOverdueAudits = useCallback(async (): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOverduePaymentLogs();
      setAuditLogs(data ?? []);
      return data ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overdue payment logs');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    auditLogs,
    isLoading,
    error,
    getInvoiceAudit,
    getCustomerAudit,
    getOverdueAudits,
  };
}
