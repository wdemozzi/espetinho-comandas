import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getStoredKey = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('ct_supabase_anon_key') || '';
};

export const DEFAULT_SUPABASE_URL = 'https://ogldhoxfbjhgvwpjocoj.supabase.co';

export const getSupabaseUrl = (): string => {
  return import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
};

export const getSupabaseAnonKey = (): string => {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey && envKey !== 'SEU_ANON_KEY_AQUI' && envKey !== 'your-anon-key-here') {
    return envKey;
  }
  return getStoredKey();
};

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
      key &&
      key !== 'SEU_ANON_KEY_AQUI' &&
      key !== 'your-anon-key-here' &&
      !url.includes('your-project-id')
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return clientInstance;
};

export const setSupabaseAnonKey = (key: string): boolean => {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem('ct_supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('ct_supabase_anon_key');
    }
    // Reset instance so it recreates with the new key
    clientInstance = null;
  }
  return isSupabaseConfigured();
};

// Export backward compatible `supabase` client instance
export const supabase = getSupabaseClient();
