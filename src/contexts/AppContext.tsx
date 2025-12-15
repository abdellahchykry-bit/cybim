import React, { createContext, useContext, useEffect } from 'react';
import { Campaign, AppSettings, defaultSettings } from '@/types/campaign';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AppContextType {
  campaigns: Campaign[];
  setCampaigns: (campaigns: Campaign[] | ((prev: Campaign[]) => Campaign[])) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  currentTime: Date;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>('cybim-campaigns', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('cybim-settings', defaultSettings);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light');
    }
  }, [settings.theme]);

  return (
    <AppContext.Provider value={{ campaigns, setCampaigns, settings, setSettings, currentTime }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
