-- Criar tabela modelos_etiquetas
CREATE TABLE IF NOT EXISTS public.modelos_etiquetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT 'Novo Modelo',
  largura NUMERIC NOT NULL DEFAULT 50,
  altura NUMERIC NOT NULL DEFAULT 30,
  ativo BOOLEAN DEFAULT true,
  campos JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.modelos_etiquetas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own modelos_etiquetas"
ON public.modelos_etiquetas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own modelos_etiquetas"
ON public.modelos_etiquetas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own modelos_etiquetas"
ON public.modelos_etiquetas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own modelos_etiquetas"
ON public.modelos_etiquetas FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_modelos_etiquetas_updated_at
  BEFORE UPDATE ON public.modelos_etiquetas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();