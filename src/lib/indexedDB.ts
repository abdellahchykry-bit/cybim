// IndexedDB wrapper for persistent storage
const DB_NAME = 'cybim-db';
const DB_VERSION = 1;
const CAMPAIGNS_STORE = 'campaigns';
const SETTINGS_STORE = 'settings';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      dbPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('IndexedDB opened successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      console.log('IndexedDB upgrade needed');
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create campaigns store
      if (!db.objectStoreNames.contains(CAMPAIGNS_STORE)) {
        db.createObjectStore(CAMPAIGNS_STORE, { keyPath: 'id' });
        console.log('Created campaigns store');
      }
      
      // Create settings store
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
        console.log('Created settings store');
      }
    };
  });

  return dbPromise;
}

// Campaign operations
export async function getAllCampaigns<T>(): Promise<T[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CAMPAIGNS_STORE, 'readonly');
      const store = transaction.objectStore(CAMPAIGNS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log('Loaded campaigns from IndexedDB:', request.result?.length || 0);
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Failed to get campaigns:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('getAllCampaigns error:', error);
    return [];
  }
}

export async function saveCampaigns<T extends { id: string }>(campaigns: T[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CAMPAIGNS_STORE, 'readwrite');
      const store = transaction.objectStore(CAMPAIGNS_STORE);

      // Clear existing and add all campaigns
      store.clear();
      
      campaigns.forEach(campaign => {
        store.put(campaign);
      });

      transaction.oncomplete = () => {
        console.log('Saved campaigns to IndexedDB:', campaigns.length);
        resolve();
      };

      transaction.onerror = () => {
        console.error('Failed to save campaigns:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('saveCampaigns error:', error);
  }
}

// Settings operations
export async function getSettings<T>(defaultValue: T): Promise<T> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get('app-settings');

      request.onsuccess = () => {
        if (request.result) {
          const { id, ...storedSettings } = request.result;
          // Merge with defaults to ensure all fields exist
          const mergedSettings = { ...defaultValue, ...storedSettings } as T;
          console.log('Loaded settings from IndexedDB');
          resolve(mergedSettings);
        } else {
          console.log('No settings found, using defaults');
          resolve(defaultValue);
        }
      };

      request.onerror = () => {
        console.error('Failed to get settings:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('getSettings error:', error);
    return defaultValue;
  }
}

export async function saveSettings<T>(settings: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ id: 'app-settings', ...settings });

      request.onsuccess = () => {
        console.log('Saved settings to IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save settings:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('saveSettings error:', error);
  }
}
