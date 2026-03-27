import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (params?: { category?: string; search?: string; lowStock?: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<Product[]>('/api/products', params as Record<string, string | boolean | number | undefined>);
      setProducts(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const newProduct = await apiPost<Product>('/api/products', product);
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
    const updated = await apiPut<Product>(`/api/products/${id}`, updates);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteProduct = async (id: string): Promise<void> => {
    await apiDelete(`/api/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const searchProducts = async (query: string): Promise<Product[]> => {
    try {
      const result = await apiGet<Product>('/api/products/search', { q: query });
      // API returns a single product; wrap in array for backwards compatibility
      return result ? [result] : [];
    } catch {
      // Fall back to local filter if search endpoint errors
      const lowerQuery = query.toLowerCase();
      return products.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.code.toLowerCase().includes(lowerQuery) ||
          (p.barcode && p.barcode.includes(query))
      );
    }
  };

  const getProductByCode = async (code: string): Promise<Product | undefined> => {
    try {
      const result = await apiGet<Product>('/api/products/search', { q: code });
      return result ?? undefined;
    } catch {
      return products.find((p) => p.code === code || p.barcode === code);
    }
  };

  const updateStock = async (id: string, quantity: number, operation: 'add' | 'subtract' = 'subtract'): Promise<Product> => {
    const updated = await apiPut<Product>(`/api/products/${id}/stock`, { quantity, operation });
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductByCode,
    updateStock,
  };
}
