import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllCampaigns, saveCampaigns, getSettings, saveSettings } from '@/lib/indexedDB';

export function useCampaignsDB<T extends { id: string }>(initialValue: T[]): [T[], (value: T[] | ((prev: T[]) => T[])) => void, boolean] {
  const [campaigns, setCampaignsState] = useState<T[]>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load campaigns from IndexedDB on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    
    getAllCampaigns<T>()
      .then((stored) => {
        hasLoadedRef.current = true;
        if (stored && stored.length > 0) {
          setCampaignsState(stored);
        }
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load campaigns from IndexedDB:', error);
        hasLoadedRef.current = true;
        setIsLoaded(true);
      });
  }, []);

  // Save campaigns to IndexedDB with debounce
  const saveCampaignsToDb = useCallback((data: T[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveCampaigns(data).catch((error) => {
        console.error('Failed to save campaigns to IndexedDB:', error);
      });
    }, 100);
  }, []);

  const setCampaigns = useCallback((value: T[] | ((prev: T[]) => T[])) => {
    setCampaignsState((prev) => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      // Only save if data has loaded and we have actual changes
      if (hasLoadedRef.current) {
        saveCampaignsToDb(newValue);
      }
      return newValue;
    });
  }, [saveCampaignsToDb]);

  return [campaigns, setCampaigns, isLoaded];
}

export function useSettingsDB<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [settings, setSettingsState] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from IndexedDB on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    
    getSettings<T>(initialValue)
      .then((stored) => {
        hasLoadedRef.current = true;
        setSettingsState(stored);
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load settings from IndexedDB:', error);
        hasLoadedRef.current = true;
        setIsLoaded(true);
      });
  }, [initialValue]);

  // Save settings to IndexedDB with debounce
  const saveSettingsToDb = useCallback((data: T) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveSettings(data).catch((error) => {
        console.error('Failed to save settings to IndexedDB:', error);
      });
    }, 100);
  }, []);

  const setSettings = useCallback((value: T | ((prev: T) => T)) => {
    setSettingsState((prev) => {
      const newValue = typeof value === 'function' 
        ? (value as (prev: T) => T)(prev) 
        : value;
      // Only save if data has loaded
      if (hasLoadedRef.current) {
        saveSettingsToDb(newValue);
      }
      return newValue;
    });
  }, [saveSettingsToDb]);

  return [settings, setSettings, isLoaded];
}
