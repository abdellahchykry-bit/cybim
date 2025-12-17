// IndexedDB wrapper for persistent storage
const DB_NAME = 'cybim-db';
const DB_VERSION = 1;
const CAMPAIGNS_STORE = 'campaigns';
const SETTINGS_STORE = 'settings';

let dbInstance: IDBDatabase | null = null;
let migrationDone = false;

// Migrate data from localStorage to IndexedDB (one-time migration)
async function migrateFromLocalStorage(db: IDBDatabase): Promise<void> {
  if (migrationDone) return;
  
  try {
    // Check and migrate campaigns
    const localCampaigns = localStorage.getItem('cybim-campaigns');
    if (localCampaigns) {
      const campaigns = JSON.parse(localCampaigns);
      if (Array.isArray(campaigns) && campaigns.length > 0) {
        const transaction = db.transaction(CAMPAIGNS_STORE, 'readwrite');
        const store = transaction.objectStore(CAMPAIGNS_STORE);
        
        // Check if IndexedDB already has data
        const existingCount = await new Promise<number>((resolve) => {
          const countRequest = store.count();
          countRequest.onsuccess = () => resolve(countRequest.result);
          countRequest.onerror = () => resolve(0);
        });
        
        // Only migrate if IndexedDB is empty
        if (existingCount === 0) {
          campaigns.forEach((campaign: any) => store.put(campaign));
          console.log('Migrated campaigns from localStorage to IndexedDB');
        }
      }
      // Remove from localStorage after successful migration
      localStorage.removeItem('cybim-campaigns');
    }
    
    // Check and migrate settings
    const localSettings = localStorage.getItem('cybim-settings');
    if (localSettings) {
      const settings = JSON.parse(localSettings);
      const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      
      // Check if IndexedDB already has settings
      const existingSettings = await new Promise<any>((resolve) => {
        const getRequest = store.get('app-settings');
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => resolve(null);
      });
      
      // Only migrate if IndexedDB has no settings
      if (!existingSettings) {
        store.put({ id: 'app-settings', ...settings });
        console.log('Migrated settings from localStorage to IndexedDB');
      }
      // Remove from localStorage after successful migration
      localStorage.removeItem('cybim-settings');
    }
    
    migrationDone = true;
  } catch (error) {
    console.error('Migration from localStorage failed:', error);
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = async () => {
      dbInstance = request.result;
      // Run migration from localStorage
      await migrateFromLocalStorage(dbInstance);
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create campaigns store
      if (!db.objectStoreNames.contains(CAMPAIGNS_STORE)) {
        db.createObjectStore(CAMPAIGNS_STORE, { keyPath: 'id' });
      }
      
      // Create settings store (single record with key 'app-settings')
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
      }
    };
  });
}

// Campaign operations
export async function getAllCampaigns<T>(): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CAMPAIGNS_STORE, 'readonly');
    const store = transaction.objectStore(CAMPAIGNS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      console.error('Failed to get campaigns:', request.error);
      reject(request.error);
    };
  });
}

export async function saveCampaigns<T extends { id: string }>(campaigns: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CAMPAIGNS_STORE, 'readwrite');
    const store = transaction.objectStore(CAMPAIGNS_STORE);

    // Clear existing and add all campaigns
    const clearRequest = store.clear();
    
    clearRequest.onsuccess = () => {
      campaigns.forEach(campaign => {
        store.put(campaign);
      });
    };

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      console.error('Failed to save campaigns:', transaction.error);
      reject(transaction.error);
    };
  });
}

// Settings operations
export async function getSettings<T>(defaultValue: T): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get('app-settings');

    request.onsuccess = () => {
      if (request.result) {
        const { id, ...settings } = request.result;
        resolve(settings as T);
      } else {
        resolve(defaultValue);
      }
    };

    request.onerror = () => {
      console.error('Failed to get settings:', request.error);
      reject(request.error);
    };
  });
}

export async function saveSettings<T>(settings: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.put({ id: 'app-settings', ...settings });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error('Failed to save settings:', request.error);
      reject(request.error);
    };
  });
}

// Initialize DB on module load
openDB().catch(console.error);
