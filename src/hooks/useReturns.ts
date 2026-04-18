import { useState, useCallback } from 'react';
import {
  getReturnsByInvoice,
  getReturnById,
  getReturnsByCustomer,
  createReturnRequest,
  processReturn,
  refundReturn,
  cancelReturn,
  getTotalReturnedAmountByCustomer,
} from '@/lib/api';

export function useReturns() {
  const [returns, setReturns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getReturnsForInvoice = useCallback(async (invoiceId: string): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReturnsByInvoice(invoiceId);
      setReturns(data ?? []);
      return data ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load returns');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getReturnDetails = useCallback(async (returnId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReturnById(returnId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load return details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getReturnsForCustomer = useCallback(async (customerId: string): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReturnsByCustomer(customerId);
      setReturns(data ?? []);
      return data ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load returns');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createReturn = useCallback(async (returnData: any): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await createReturnRequest(returnData);
      setReturns(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create return');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processReturnRequest = useCallback(async (returnId: string, refundMethod: string, processedBy: string): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await processReturn(returnId, refundMethod, processedBy);
      setReturns(prev => prev.map(r => r.id === returnId ? data : r));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process return');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refundReturnRequest = useCallback(async (returnId: string, refundMethod: string, processedBy: string): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await refundReturn(returnId, refundMethod, processedBy);
      setReturns(prev => prev.map(r => r.id === returnId ? data : r));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refund return');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteReturn = useCallback(async (returnId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await cancelReturn(returnId);
      setReturns(prev => prev.filter(r => r.id !== returnId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel return');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTotalReturned = useCallback(async (customerId: string): Promise<number> => {
    try {
      const data = await getTotalReturnedAmountByCustomer(customerId);
      return data?.totalReturned || 0;
    } catch (err) {
      console.error('Failed to get total returned amount:', err);
      return 0;
    }
  }, []);

  return {
    returns,
    isLoading,
    error,
    getReturnsForInvoice,
    getReturnDetails,
    getReturnsForCustomer,
    createReturn,
    processReturnRequest,
    refundReturnRequest,
    deleteReturn,
    getTotalReturned,
  };
}
