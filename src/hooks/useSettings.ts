import { useState, useEffect, useCallback } from 'react';
import { ShopSettings } from '@/types';
import { apiGet, apiPut } from '@/lib/api';

const DEFAULT_SETTINGS: ShopSettings = {
  name: 'Sri Sai Shiva Hardwares, Plywoods & Glass',
  address: 'No 121/12, Tirupattur Main Road, opp. TVS showroom, Vakkanampatti, Jolarpet, Tamil Nadu 635851',
  phone: '',
  email: '',
  gstNumber: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upiId: '',
  defaultGstPercentage: 18,
  invoicePrefix: 'INV',
  termsAndConditions: 'Goods once sold will not be taken back. All disputes are subject to local jurisdiction.',
};

export function useSettings() {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<ShopSettings>('/api/settings');
      if (data) setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      // Keep defaults on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<ShopSettings>): Promise<void> => {
    const merged = { ...settings, ...updates };
    const saved = await apiPut<ShopSettings>('/api/settings', merged);
    setSettings(saved ?? merged);
  };

  const resetSettings = async (): Promise<void> => {
    const saved = await apiPut<ShopSettings>('/api/settings', DEFAULT_SETTINGS);
    setSettings(saved ?? DEFAULT_SETTINGS);
  };

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    updateSettings,
    resetSettings,
  };
}
