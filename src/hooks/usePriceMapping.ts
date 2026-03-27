import { useState, useEffect, useCallback } from 'react';
import { PriceMapping } from '@/types';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export function usePriceMapping() {
  const [priceMappings, setPriceMappings] = useState<PriceMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceMappingsForCustomer = useCallback(async (customerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<PriceMapping[]>(`/api/pricing/customer/${customerId}`);
      // Merge into existing mappings (avoid duplicates for other customers)
      setPriceMappings((prev) => {
        const withoutThisCustomer = prev.filter((m) => m.customerId !== customerId);
        return [...withoutThisCustomer, ...(data ?? [])];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load price mappings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLastPrice = (customerId: string, productId: string): number | undefined => {
    const mapping = priceMappings.find(
      (m) => m.customerId === customerId && m.productId === productId
    );
    return mapping?.lastPrice;
  };

  const updatePriceMapping = async (customerId: string, productId: string, price: number): Promise<void> => {
    try {
      const saved = await apiPost<PriceMapping>('/api/pricing', {
        customerId,
        productId,
        lastPrice: price,
      });
      setPriceMappings((prev) => {
        const existingIndex = prev.findIndex(
          (m) => m.customerId === customerId && m.productId === productId
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = saved;
          return updated;
        }
        return [...prev, saved];
      });
    } catch {
      // Non-critical — silently fail price mapping updates
    }
  };

  const deletePriceMapping = async (id: string): Promise<void> => {
    await apiDelete(`/api/pricing/${id}`);
    setPriceMappings((prev) => prev.filter((m) => (m as PriceMapping & { id?: string }).id !== id));
  };

  const updatePriceMappingsFromInvoice = async (
    customerId: string,
    items: { productId: string; price: number }[]
  ): Promise<void> => {
    await Promise.allSettled(
      items.map((item) => updatePriceMapping(customerId, item.productId, item.price))
    );
  };

  return {
    priceMappings,
    isLoading,
    error,
    fetchPriceMappingsForCustomer,
    getLastPrice,
    updatePriceMapping,
    deletePriceMapping,
    updatePriceMappingsFromInvoice,
  };
}
