
-- CORREÇÃO 6: Add usuario_nome column to historico_atividades
ALTER TABLE public.historico_atividades ADD COLUMN IF NOT EXISTS usuario_nome TEXT;

-- Update the log_activity trigger to populate usuario_nome from profiles
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_organization_id UUID;
  v_usuario_nome TEXT;
BEGIN
  -- Get user name from profiles
  SELECT nome INTO v_usuario_nome
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Get organization_id from the record if it exists
  IF TG_OP = 'DELETE' THEN
    v_organization_id := CASE 
      WHEN TG_TABLE_NAME IN ('pecas', 'clientes', 'vendas', 'maletas', 'catalogos', 'romaneios', 'revendedoras', 'campanhas', 'fornecedores', 'banhos', 'metas') 
      THEN (OLD).organization_id
      ELSE NULL
    END;
    
    INSERT INTO public.historico_atividades (tabela, acao, registro_id, user_id, dados_anteriores, organization_id, usuario_nome)
    VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, auth.uid(), to_jsonb(OLD), v_organization_id, v_usuario_nome);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_organization_id := CASE 
      WHEN TG_TABLE_NAME IN ('pecas', 'clientes', 'vendas', 'maletas', 'catalogos', 'romaneios', 'revendedoras', 'campanhas', 'fornecedores', 'banhos', 'metas') 
      THEN (NEW).organization_id
      ELSE NULL
    END;
    
    INSERT INTO public.historico_atividades (tabela, acao, registro_id, user_id, dados_anteriores, dados_novos, organization_id, usuario_nome)
    VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, auth.uid(), to_jsonb(OLD), to_jsonb(NEW), v_organization_id, v_usuario_nome);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    v_organization_id := CASE 
      WHEN TG_TABLE_NAME IN ('pecas', 'clientes', 'vendas', 'maletas', 'catalogos', 'romaneios', 'revendedoras', 'campanhas', 'fornecedores', 'banhos', 'metas') 
      THEN (NEW).organization_id
      ELSE NULL
    END;
    
    INSERT INTO public.historico_atividades (tabela, acao, registro_id, user_id, dados_novos, organization_id, usuario_nome)
    VALUES (TG_TABLE_NAME, 'INSERT', NEW.id, auth.uid(), to_jsonb(NEW), v_organization_id, v_usuario_nome);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- CORREÇÃO 8: Create comissoes_revendedoras table
CREATE TABLE IF NOT EXISTS public.comissoes_revendedoras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  revendedora_id UUID NOT NULL REFERENCES public.revendedoras(id),
  mes_referencia DATE NOT NULL,
  valor_vendas DECIMAL(10,2) DEFAULT 0,
  percentual_comissao DECIMAL(5,2) DEFAULT 0,
  valor_comissao DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  data_pagamento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(revendedora_id, mes_referencia)
);

-- Enable RLS
ALTER TABLE public.comissoes_revendedoras ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view org commissions"
  ON public.comissoes_revendedoras
  FOR SELECT
  USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Members can insert org commissions"
  ON public.comissoes_revendedoras
  FOR INSERT
  WITH CHECK (public.user_belongs_to_org(organization_id));

CREATE POLICY "Members can update org commissions"
  ON public.comissoes_revendedoras
  FOR UPDATE
  USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Members can delete org commissions"
  ON public.comissoes_revendedoras
  FOR DELETE
  USING (public.user_belongs_to_org(organization_id));

-- Trigger for updated_at
CREATE TRIGGER update_comissoes_revendedoras_updated_at
  BEFORE UPDATE ON public.comissoes_revendedoras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_comissao_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('pendente', 'pago') THEN
    RAISE EXCEPTION 'Status deve ser pendente ou pago';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_comissao_status_trigger
  BEFORE INSERT OR UPDATE ON public.comissoes_revendedoras
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_comissao_status();
