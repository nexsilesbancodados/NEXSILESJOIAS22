-- Complete the remaining RLS policies that weren't created

-- MODELOS_ETIQUETAS - these already exist, so just ensure they're correct
DROP POLICY IF EXISTS "Users can view own modelos_etiquetas" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can insert own modelos_etiquetas" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can update own modelos_etiquetas" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can delete own modelos_etiquetas" ON public.modelos_etiquetas;

CREATE POLICY "Users can view own modelos_etiquetas" ON public.modelos_etiquetas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own modelos_etiquetas" ON public.modelos_etiquetas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own modelos_etiquetas" ON public.modelos_etiquetas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own modelos_etiquetas" ON public.modelos_etiquetas FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICACOES
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can view own notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can insert own notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can update own notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can delete own notificacoes" ON public.notificacoes;

CREATE POLICY "Users can view own notificacoes" ON public.notificacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notificacoes" ON public.notificacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notificacoes" ON public.notificacoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notificacoes" ON public.notificacoes FOR DELETE USING (auth.uid() = user_id);

-- HISTORICO_ATIVIDADES
DROP POLICY IF EXISTS "Users can view own history" ON public.historico_atividades;
DROP POLICY IF EXISTS "Users can insert history" ON public.historico_atividades;
DROP POLICY IF EXISTS "Users can view own historico" ON public.historico_atividades;
DROP POLICY IF EXISTS "Users can insert own historico" ON public.historico_atividades;

CREATE POLICY "Users can view own historico" ON public.historico_atividades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own historico" ON public.historico_atividades FOR INSERT WITH CHECK (auth.uid() = user_id);

-- HISTORICO_PRECOS
DROP POLICY IF EXISTS "Users can view price history" ON public.historico_precos;
DROP POLICY IF EXISTS "Users can insert price history" ON public.historico_precos;
DROP POLICY IF EXISTS "Users can view own historico_precos" ON public.historico_precos;
DROP POLICY IF EXISTS "Users can insert own historico_precos" ON public.historico_precos;

CREATE POLICY "Users can view own historico_precos" ON public.historico_precos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own historico_precos" ON public.historico_precos FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS on all tables
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revendedoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_precos ENABLE ROW LEVEL SECURITY;