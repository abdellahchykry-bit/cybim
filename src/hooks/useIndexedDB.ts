import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllCampaigns, saveCampaigns, getSettings, saveSettings } from '@/lib/indexedDB';

export function useCampaignsDB<T extends { id: string }>(initialValue: T[]): [T[], (value: T[] | ((prev: T[]) => T[])) => void, boolean] {
  const [campaigns, setCampaignsState] = useState<T[]>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialLoad = useRef(true);

  // Load campaigns from IndexedDB on mount
  useEffect(() => {
    getAllCampaigns<T>()
      .then((stored) => {
        if (stored.length > 0) {
          setCampaignsState(stored);
        }
        setIsLoaded(true);
        isInitialLoad.current = false;
      })
      .catch((error) => {
        console.error('Failed to load campaigns from IndexedDB:', error);
        setIsLoaded(true);
        isInitialLoad.current = false;
      });
  }, []);

  // Save campaigns to IndexedDB whenever they change (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad.current && isLoaded) {
      saveCampaigns(campaigns).catch((error) => {
        console.error('Failed to save campaigns to IndexedDB:', error);
      });
    }
  }, [campaigns, isLoaded]);

  const setCampaigns = useCallback((value: T[] | ((prev: T[]) => T[])) => {
    setCampaignsState(value);
  }, []);

  return [campaigns, setCampaigns, isLoaded];
}

export function useSettingsDB<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [settings, setSettingsState] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialLoad = useRef(true);

  // Load settings from IndexedDB on mount
  useEffect(() => {
    getSettings<T>(initialValue)
      .then((stored) => {
        setSettingsState(stored);
        setIsLoaded(true);
        isInitialLoad.current = false;
      })
      .catch((error) => {
        console.error('Failed to load settings from IndexedDB:', error);
        setIsLoaded(true);
        isInitialLoad.current = false;
      });
  }, []);

  // Save settings to IndexedDB whenever they change (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad.current && isLoaded) {
      saveSettings(settings).catch((error) => {
        console.error('Failed to save settings to IndexedDB:', error);
      });
    }
  }, [settings, isLoaded]);

  const setSettings = useCallback((value: T | ((prev: T) => T)) => {
    setSettingsState(value);
  }, []);

  return [settings, setSettings, isLoaded];
}
