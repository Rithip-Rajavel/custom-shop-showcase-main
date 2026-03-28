import { useState, useEffect, useCallback } from 'react';
import { Bonus, BonusRequest, BonusSummary } from '@/types/bonus';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export function useBonuses() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new bonus
  const createBonus = useCallback(async (
    customerId: string,
    bonusAmount: number,
    bonusMonth: number,
    bonusYear: number,
    reason: string
  ): Promise<Bonus> => {
    const payload: BonusRequest = {
      customerId,
      bonusAmount,
      bonusMonth,
      bonusYear,
      reason,
    };

    try {
      const data = await apiPost<Bonus>('/api/bonuses', payload);
      setBonuses(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create bonus');
    }
  }, []);

  // Update existing bonus
  const updateBonus = useCallback(async (
    bonusId: string,
    customerId: string,
    bonusAmount: number,
    bonusMonth: number,
    bonusYear: number,
    reason: string
  ): Promise<Bonus> => {
    const payload: BonusRequest = {
      customerId,
      bonusAmount,
      bonusMonth,
      bonusYear,
      reason,
    };

    try {
      const data = await apiPut<Bonus>(`/api/bonuses/${bonusId}`, payload);
      setBonuses(prev => prev.map(bonus =>
        bonus.id === bonusId ? data : bonus
      ));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update bonus');
    }
  }, []);

  // Delete a bonus
  const deleteBonus = useCallback(async (bonusId: string): Promise<void> => {
    try {
      await apiDelete(`/api/bonuses/${bonusId}`);
      setBonuses(prev => prev.filter(bonus => bonus.id !== bonusId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete bonus');
    }
  }, []);

  // Get all bonuses (including employee bonuses)
  const getAllBonuses = useCallback(async (): Promise<Bonus[]> => {
    try {
      const data = await apiGet<Bonus[]>('/api/bonuses');
      setBonuses(data ?? []);
      return data ?? [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to load all bonuses');
    }
  }, []);

  // Get bonuses by customer
  const getBonusesByCustomer = useCallback(async (customerId: string): Promise<Bonus[]> => {
    try {
      const data = await apiGet<Bonus[]>(`/api/bonuses/customer/${customerId}`);
      setBonuses(data ?? []);
      return data ?? [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to load bonuses');
    }
  }, []);

  // Get bonuses by customer and month/year
  const getBonusesByCustomerAndMonth = useCallback(async (
    customerId: string,
    month: number,
    year: number
  ): Promise<Bonus[]> => {
    try {
      const data = await apiGet<Bonus[]>(`/api/bonuses/customer/${customerId}/month/${month}/year/${year}`);
      return data ?? [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to load bonuses');
    }
  }, []);

  // Get bonuses by customer and year
  const getBonusesByCustomerAndYear = useCallback(async (
    customerId: string,
    year: number
  ): Promise<Bonus[]> => {
    try {
      const data = await apiGet<Bonus[]>(`/api/bonuses/customer/${customerId}/year/${year}`);
      setBonuses(data ?? []);
      return data ?? [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to bonuses');
    }
  }, []);

  // Get total bonus for customer by month and year
  const getTotalBonusByCustomerAndMonth = useCallback(async (
    customerId: string,
    month: number,
    year: number
  ): Promise<number> => {
    try {
      const data = await apiGet<number>(`/api/bonuses/customer/${customerId}/month/${month}/year/${year}/total`);
      return data ?? 0;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get total bonus');
    }
  }, []);

  // Get total bonus for customer by year
  const getTotalBonusByCustomerAndYear = useCallback(async (
    customerId: string,
    year: number
  ): Promise<number> => {
    try {
      const data = await apiGet<number>(`/api/bonuses/customer/${customerId}/year/${year}/total`);
      return data ?? 0;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get total bonus');
    }
  }, []);

  // Get all bonuses by month and year
  const getBonusesByMonthAndYear = useCallback(async (
    month: number,
    year: number
  ): Promise<Bonus[]> => {
    try {
      const data = await apiGet<Bonus[]>(`/api/bonuses/month/${month}/year/${year}`);
      return data ?? [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to load bonuses');
    }
  }, []);

  return {
    bonuses,
    isLoading,
    error,
    createBonus,
    updateBonus,
    deleteBonus,
    getAllBonuses,
    getBonusesByCustomer,
    getBonusesByCustomerAndMonth,
    getBonusesByCustomerAndYear,
    getTotalBonusByCustomerAndMonth,
    getTotalBonusByCustomerAndYear,
    getBonusesByMonthAndYear,
  };
}
