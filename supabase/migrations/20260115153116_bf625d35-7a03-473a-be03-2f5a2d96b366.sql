-- Create notificacoes table
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dados JSONB,
  entidade_tipo TEXT,
  entidade_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- RLS policies for notificacoes
CREATE POLICY "Users can view their own notifications"
ON public.notificacoes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notificacoes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notificacoes FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notificacoes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_notificacoes_user_lida ON public.notificacoes(user_id, lida);
CREATE INDEX idx_notificacoes_created_at ON public.notificacoes(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;

-- Create metas table
CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  valor_meta NUMERIC NOT NULL DEFAULT 0,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tipo, mes, ano, user_id)
);

-- Enable RLS
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- RLS policies for metas
CREATE POLICY "Users can view their own metas"
ON public.metas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metas"
ON public.metas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metas"
ON public.metas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metas"
ON public.metas FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_metas_user_ano ON public.metas(user_id, ano);
CREATE INDEX idx_metas_tipo_mes_ano ON public.metas(tipo, mes, ano);