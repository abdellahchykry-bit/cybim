import React, { createContext, useContext, useEffect, useState } from 'react';
import { Campaign, AppSettings, defaultSettings } from '@/types/campaign';
import { useCampaignsDB, useSettingsDB } from '@/hooks/useIndexedDB';

interface AppContextType {
  campaigns: Campaign[];
  setCampaigns: (campaigns: Campaign[] | ((prev: Campaign[]) => Campaign[])) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  currentTime: Date;
  isDataLoaded: boolean;
  // Preview orientation for Settings screen (not persisted until Save)
  previewOrientation: AppSettings['orientation'] | null;
  setPreviewOrientation: (orientation: AppSettings['orientation'] | null) => void;
  // Get effective orientation (preview if set, otherwise saved)
  effectiveOrientation: AppSettings['orientation'];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns, campaignsLoaded] = useCampaignsDB<Campaign>([]);
  const [settings, setSettings, settingsLoaded] = useSettingsDB<AppSettings>(defaultSettings);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [previewOrientation, setPreviewOrientation] = useState<AppSettings['orientation'] | null>(null);

  const isDataLoaded = campaignsLoaded && settingsLoaded;
  
  // Effective orientation: preview takes priority if set
  const effectiveOrientation = previewOrientation ?? settings.orientation;

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
    <AppContext.Provider value={{ 
      campaigns, 
      setCampaigns, 
      settings, 
      setSettings, 
      currentTime, 
      isDataLoaded,
      previewOrientation,
      setPreviewOrientation,
      effectiveOrientation,
    }}>
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
