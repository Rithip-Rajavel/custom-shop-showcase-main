import { useState, useEffect, useCallback } from 'react';
import { LastPaymentValue, LastPaymentValueRequest } from '@/types';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export function useLastPaymentValues() {
  const [lastPaymentValues, setLastPaymentValues] = useState<LastPaymentValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get last payment value for specific customer and product
  const getLastPaymentValue = useCallback(async (customerId: string, productId: string): Promise<LastPaymentValue | null> => {
    try {
      console.log(`Fetching last payment value for customer: ${customerId}, product: ${productId}`);
      const data = await apiGet<LastPaymentValue>(`/api/last-payment-values/customer/${customerId}/product/${productId}`);
      console.log('Last payment value response:', data);
      return data;
    } catch (err) {
      // Return null if not found (404) or other error
      console.warn('Last payment value not found:', err);
      return null;
    }
  }, []);

  // Get all last payment values for a customer
  const getLastPaymentValuesByCustomer = useCallback(async (customerId: string): Promise<LastPaymentValue[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<LastPaymentValue[]>(`/api/last-payment-values/customer/${customerId}`);
      setLastPaymentValues(data ?? []);
      return data ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load last payment values');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get all last payment values for a product
  const getLastPaymentValuesByProduct = useCallback(async (productId: string): Promise<LastPaymentValue[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<LastPaymentValue[]>(`/api/last-payment-values/product/${productId}`);
      return data ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load last payment values');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search last payment values by product name for a customer
  const searchByProductName = useCallback(async (customerId: string, productName: string): Promise<LastPaymentValue[]> => {
    try {
      const data = await apiGet<LastPaymentValue[]>(`/api/last-payment-values/customer/${customerId}/search?productName=${encodeURIComponent(productName)}`);
      return data ?? [];
    } catch (err) {
      return [];
    }
  }, []);

  // Create or update last payment value
  const saveLastPaymentValue = useCallback(async (
    customerId: string,
    productId: string,
    productName: string,
    productCode: string,
    lastAmount: number,
    lastQuantity: number,
    lastUnitPrice: number
  ): Promise<LastPaymentValue> => {
    const payload: LastPaymentValueRequest = {
      customerId,
      productId,
      lastAmount,
      lastQuantity,
      lastUnitPrice,
    };

    try {
      const data = await apiPost<LastPaymentValue>('/api/last-payment-values', payload);

      // Update local state if we have customer values loaded
      if (lastPaymentValues.length > 0) {
        const existingIndex = lastPaymentValues.findIndex(
          item => item.customerId === customerId && item.productId === productId
        );

        const newValue: LastPaymentValue = {
          ...data,
          productName,
          productCode,
          lastAmount: data.lastAmount ?? lastAmount,
          lastQuantity: data.lastQuantity ?? lastQuantity,
          lastUnitPrice: data.lastUnitPrice ?? lastUnitPrice,
        };

        if (existingIndex >= 0) {
          setLastPaymentValues(prev => prev.map((item, index) =>
            index === existingIndex ? newValue : item
          ));
        } else {
          setLastPaymentValues(prev => [...prev, newValue]);
        }
      }

      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save last payment value');
    }
  }, [lastPaymentValues]);

  // Delete last payment value
  const deleteLastPaymentValue = useCallback(async (customerId: string, productId: string): Promise<void> => {
    try {
      await apiDelete(`/api/last-payment-values/customer/${customerId}/product/${productId}`);

      // Update local state
      setLastPaymentValues(prev => prev.filter(
        item => !(item.customerId === customerId && item.productId === productId)
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete last payment value');
    }
  }, []);

  // Batch save last payment values for multiple items (used when creating invoice)
  const saveLastPaymentValuesForInvoice = useCallback(async (
    items: Array<{
      customerId: string;
      productId: string;
      productName: string;
      productCode: string;
      lastAmount: number;
      lastQuantity: number;
      lastUnitPrice: number;
    }>
  ): Promise<void> => {
    const promises = items.map(item =>
      saveLastPaymentValue(
        item.customerId,
        item.productId,
        item.productName,
        item.productCode,
        item.lastAmount,
        item.lastQuantity,
        item.lastUnitPrice
      )
    );

    try {
      await Promise.all(promises);
    } catch (err) {
      // Continue even if some fail, but log the error
      console.error('Some last payment values failed to save:', err);
    }
  }, [saveLastPaymentValue]);

  return {
    lastPaymentValues,
    isLoading,
    error,
    getLastPaymentValue,
    getLastPaymentValuesByCustomer,
    getLastPaymentValuesByProduct,
    searchByProductName,
    saveLastPaymentValue,
    deleteLastPaymentValue,
    saveLastPaymentValuesForInvoice,
  };
}
