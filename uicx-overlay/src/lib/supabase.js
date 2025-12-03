import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase credentials
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials not found or invalid. Running in offline mode.');
}

// Dedicated storage key for auth - separate from Zustand
const AUTH_STORAGE_KEY = 'code-eternal-supabase-auth';
const BACKUP_AUTH_KEY = 'code-eternal-auth-backup';

// Custom storage adapter for persistent session storage with backup
const customStorage = {
  getItem: (key) => {
    try {
      // Try primary storage first
      let item = localStorage.getItem(key);
      
      // If not found and this is the auth key, try backup
      if (!item && key === AUTH_STORAGE_KEY) {
        const backup = localStorage.getItem(BACKUP_AUTH_KEY);
        if (backup) {
          console.log('Restoring auth from backup storage');
          localStorage.setItem(key, backup);
          item = backup;
        }
      }
      
      return item;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      
      // Also save to backup if this is auth data
      if (key === AUTH_STORAGE_KEY && value) {
        localStorage.setItem(BACKUP_AUTH_KEY, value);
      }
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      // Don't remove backup on regular removeItem - only on explicit logout
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },
};

// Function to clear all auth storage (call on intentional logout)
export const clearAuthStorage = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(BACKUP_AUTH_KEY);
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
};

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && Boolean(window.electron);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: customStorage,
      storageKey: AUTH_STORAGE_KEY,
      // Use implicit flow for web (works with cross-origin OAuth)
      // PKCE only works when OAuth starts and ends in the same browser context
      flowType: 'implicit',
    },
    global: {
      headers: {
        'x-client-info': 'code-eternal',
      },
      // Add fetch timeout
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      timeout: 10000,
    },
  }
);

// Helper to get public URL for storage items
export const getStorageUrl = (bucket, path) => {
  if (!path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl;
};

// Upload file to storage
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;
  return getStorageUrl(bucket, data.path);
};

// Delete file from storage
export const deleteFile = async (bucket, path) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};

export default supabase;
