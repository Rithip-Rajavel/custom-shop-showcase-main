import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ShopSettings } from '@/types';
import { apiGet } from '@/lib/api';

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

interface SettingsContextType {
  settings: ShopSettings;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<ShopSettings>('/api/settings');
      if (data) setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, error, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}
