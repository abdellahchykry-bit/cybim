import React, { createContext, useContext, useEffect } from 'react';
import { Campaign, AppSettings, defaultSettings } from '@/types/campaign';
import { useCampaignsDB, useSettingsDB } from '@/hooks/useIndexedDB';

interface AppContextType {
  campaigns: Campaign[];
  setCampaigns: (campaigns: Campaign[] | ((prev: Campaign[]) => Campaign[])) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  currentTime: Date;
  isDataLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns, campaignsLoaded] = useCampaignsDB<Campaign>([]);
  const [settings, setSettings, settingsLoaded] = useSettingsDB<AppSettings>(defaultSettings);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  const isDataLoaded = campaignsLoaded && settingsLoaded;

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
    <AppContext.Provider value={{ campaigns, setCampaigns, settings, setSettings, currentTime, isDataLoaded }}>
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
