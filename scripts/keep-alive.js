// Script para pingar o banco Supabase e evitar a pausa por inatividade de 7 dias
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ogldhoxfbjhgvwpjocoj.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbGRob3hmYmpoZ3Z3cGpvY29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjA2MzUsImV4cCI6MjEwODQzNjYzNX0.y0SC-PYdh0pXgAkmnjWS_GaOWbCdpgkhMTFlWgqbdGs';

async function pingSupabase() {
  console.log(`[Keep-Alive] Pingando Supabase: ${SUPABASE_URL}...`);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=count`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    });

    console.log(`[Keep-Alive] Status HTTP retornado: ${res.status}`);
    if (res.ok) {
      console.log('✅ Sucesso! O banco de dados Supabase recebeu atividade e o contador de 7 dias foi resetado.');
    } else {
      console.warn(`⚠️ O servidor respondeu com status ${res.status}.`);
    }
  } catch (err) {
    console.error('❌ Erro ao conectar ao Supabase:', err.message);
  }
}

pingSupabase();
