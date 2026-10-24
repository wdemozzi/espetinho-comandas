import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getStoredKey = (): string => {
  if (typeof window === 'undefined') return '';
  // Check URL query param first for automatic device pairing (?anonKey=...)
  try {
    const params = new URLSearchParams(window.location.search);
    const paramKey = params.get('anonKey') || params.get('supabase_key');
    if (paramKey && paramKey.startsWith('eyJ')) {
      localStorage.setItem('ct_supabase_anon_key', paramKey.trim());
      // Clean URL without refresh
      params.delete('anonKey');
      params.delete('supabase_key');
      const cleanSearch = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState({}, '', `${window.location.pathname}${cleanSearch}`);
      return paramKey.trim();
    }
  } catch {
    // Ignore URL parse error
  }
  return localStorage.getItem('ct_supabase_anon_key') || '';
};

export const DEFAULT_SUPABASE_URL = 'https://ogldhoxfbjhgvwpjocoj.supabase.co';

export const getSupabaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  return envUrl
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '') || DEFAULT_SUPABASE_URL;
};

export const getSupabaseAnonKey = (): string => {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey && envKey !== 'SEU_ANON_KEY_AQUI' && envKey !== 'your-anon-key-here') {
    return envKey.trim().replace(/^["']|["']$/g, '').trim();
  }
  return getStoredKey().trim().replace(/^["']|["']$/g, '').trim();
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

export const getSupabaseDiagnostics = () => {
  const url = getSupabaseUrl();
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('ct_supabase_anon_key') || '' : '';
  const activeKey = getSupabaseAnonKey();

  let source = 'Nenhum';
  if (envKey && envKey !== 'SEU_ANON_KEY_AQUI' && envKey !== 'your-anon-key-here') {
    source = 'Vercel / Build (.env)';
  } else if (storedKey) {
    source = 'Navegador Local (Painel)';
  }

  return {
    url,
    isConfigured: isSupabaseConfigured(),
    source,
    keyMasked: activeKey && activeKey.length > 15 ? `${activeKey.slice(0, 12)}...${activeKey.slice(-6)}` : (activeKey ? 'Chave curta' : 'Não configurada'),
    rawKey: activeKey,
  };
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
