-- Create activity history table for tracking all system operations
CREATE TABLE public.historico_atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nome TEXT,
  valor NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_historico_tipo ON public.historico_atividades(tipo);
CREATE INDEX idx_historico_entidade ON public.historico_atividades(entidade);
CREATE INDEX idx_historico_created_at ON public.historico_atividades(created_at DESC);
CREATE INDEX idx_historico_usuario ON public.historico_atividades(usuario_id);

-- Enable Row Level Security
ALTER TABLE public.historico_atividades ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all history" 
ON public.historico_atividades 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert history" 
ON public.historico_atividades 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Also allow anon/service to insert for background logging
CREATE POLICY "Allow insert for logging" 
ON public.historico_atividades 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for history table
ALTER PUBLICATION supabase_realtime ADD TABLE public.historico_atividades;

-- Create trigger function to automatically log changes
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_nome TEXT;
  v_tipo TEXT;
  v_descricao TEXT;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  SELECT nome INTO v_user_nome FROM public.profiles WHERE id = v_user_id;
  
  IF TG_OP = 'INSERT' THEN
    v_tipo := 'criacao';
    v_descricao := 'Registro criado em ' || TG_TABLE_NAME;
    
    INSERT INTO public.historico_atividades (tipo, descricao, entidade, entidade_id, dados_novos, usuario_id, usuario_nome, valor)
    VALUES (v_tipo, v_descricao, TG_TABLE_NAME, NEW.id, to_jsonb(NEW), v_user_id, v_user_nome, 
      CASE WHEN TG_TABLE_NAME IN ('vendas', 'romaneios') THEN (NEW.total)::NUMERIC ELSE NULL END);
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_tipo := 'atualizacao';
    v_descricao := 'Registro atualizado em ' || TG_TABLE_NAME;
    
    INSERT INTO public.historico_atividades (tipo, descricao, entidade, entidade_id, dados_anteriores, dados_novos, usuario_id, usuario_nome, valor)
    VALUES (v_tipo, v_descricao, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), v_user_id, v_user_nome,
      CASE WHEN TG_TABLE_NAME IN ('vendas', 'romaneios') THEN (NEW.total)::NUMERIC ELSE NULL END);
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_tipo := 'exclusao';
    v_descricao := 'Registro removido de ' || TG_TABLE_NAME;
    
    INSERT INTO public.historico_atividades (tipo, descricao, entidade, entidade_id, dados_anteriores, usuario_id, usuario_nome, valor)
    VALUES (v_tipo, v_descricao, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), v_user_id, v_user_nome,
      CASE WHEN TG_TABLE_NAME IN ('vendas', 'romaneios') THEN (OLD.total)::NUMERIC ELSE NULL END);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for main tables
CREATE TRIGGER log_vendas_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.vendas
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_romaneios_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.romaneios
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_maletas_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.maletas
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_pecas_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.pecas
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_catalogos_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.catalogos
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_pedidos_catalogo_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.pedidos_catalogo
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_caixa_sessoes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.caixa_sessoes
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();