-- ========================================================
-- CT CONVENIÊNCIA: CONFIGURAÇÃO DE SINCRONIZAÇÃO EM TEMPO REAL
-- ========================================================
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/ogldhoxfbjhgvwpjocoj/sql/new

-- 1. Habilitar extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Sincronização em Nuvem em Tempo Real (Document Sync)
-- Garante sincronização bidirecional instantânea entre celulares dos clientes,
-- celulares dos garçons, tela da cozinha (KDS) e computador do caixa.
CREATE TABLE IF NOT EXISTS public.ct_cloud_sync (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.ct_cloud_sync ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para acesso anônimo seguro (anon key)
DROP POLICY IF EXISTS "Leitura publica ct_cloud_sync" ON public.ct_cloud_sync;
CREATE POLICY "Leitura publica ct_cloud_sync" ON public.ct_cloud_sync
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Insercao publica ct_cloud_sync" ON public.ct_cloud_sync;
CREATE POLICY "Insercao publica ct_cloud_sync" ON public.ct_cloud_sync
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Atualizacao publica ct_cloud_sync" ON public.ct_cloud_sync;
CREATE POLICY "Atualizacao publica ct_cloud_sync" ON public.ct_cloud_sync
    FOR UPDATE TO anon, authenticated USING (true);

-- 3. Adicionar ct_cloud_sync na publicação de Realtime do Supabase
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'ct_cloud_sync'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ct_cloud_sync;
    END IF;
END $$;

-- 4. Notificação de Sucesso
SELECT 'Sincronização em tempo real configurada com sucesso para CT Conveniência!' AS resultado;
