import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const rawUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    'https://ogldhoxfbjhgvwpjocoj.supabase.co';

  // Crucial: Automatically strip /rest/v1 or trailing slashes entered in Vercel or Supabase Dashboard
  const supabaseUrl = rawUrl
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '') || 'https://ogldhoxfbjhgvwpjocoj.supabase.co';

  const defaultKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbGRob3hmYmpoZ3Z3cGpvY29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjA2MzUsImV4cCI6MjEwODQzNjYzNX0.y0SC-PYdh0pXgAkmnjWS_GaOWbCdpgkhMTFlWgqbdGs';

  const rawKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    defaultKey;

  const cleanKey = rawKey.trim().replace(/^["']|["']$/g, '').trim();
  const supabaseAnonKey = (cleanKey && cleanKey !== 'SEU_ANON_KEY_AQUI') ? cleanKey : defaultKey;

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
  };
});
