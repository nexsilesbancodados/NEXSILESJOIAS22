
-- Tabela de avaliações de produtos no e-commerce
CREATE TABLE public.ecommerce_avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  peca_id UUID NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  aprovada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para busca por peça
CREATE INDEX idx_ecommerce_avaliacoes_peca ON public.ecommerce_avaliacoes(peca_id);
CREATE INDEX idx_ecommerce_avaliacoes_org ON public.ecommerce_avaliacoes(organization_id);

-- Enable RLS
ALTER TABLE public.ecommerce_avaliacoes ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ver avaliações aprovadas (loja pública)
CREATE POLICY "Avaliações aprovadas são públicas"
ON public.ecommerce_avaliacoes FOR SELECT
USING (aprovada = true);

-- Qualquer pessoa pode submeter avaliação (loja pública, sem auth)
CREATE POLICY "Qualquer pessoa pode submeter avaliação"
ON public.ecommerce_avaliacoes FOR INSERT
WITH CHECK (true);

-- Membros da organização podem gerenciar avaliações
CREATE POLICY "Membros podem gerenciar avaliações"
ON public.ecommerce_avaliacoes FOR ALL
USING (public.user_belongs_to_org(organization_id));

-- View pública para avaliações (sem necessidade de auth)
CREATE OR REPLACE VIEW public.ecommerce_avaliacoes_public AS
SELECT id, organization_id, peca_id, cliente_nome, nota, comentario, created_at
FROM public.ecommerce_avaliacoes
WHERE aprovada = true;

-- RPC para submeter avaliação (sem auth necessário)
CREATE OR REPLACE FUNCTION public.submeter_avaliacao(
  p_organization_id UUID,
  p_peca_id UUID,
  p_cliente_nome TEXT,
  p_cliente_email TEXT,
  p_nota INTEGER,
  p_comentario TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_nota < 1 OR p_nota > 5 THEN
    RAISE EXCEPTION 'Nota deve ser entre 1 e 5';
  END IF;
  
  INSERT INTO public.ecommerce_avaliacoes (organization_id, peca_id, cliente_nome, cliente_email, nota, comentario, aprovada)
  VALUES (p_organization_id, p_peca_id, p_cliente_nome, p_cliente_email, p_nota, p_comentario, true)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- RPC para buscar avaliações de uma peça (público)
CREATE OR REPLACE FUNCTION public.fetch_avaliacoes_produto(p_peca_id UUID)
RETURNS TABLE(id UUID, cliente_nome TEXT, nota INTEGER, comentario TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.cliente_nome, a.nota, a.comentario, a.created_at
  FROM public.ecommerce_avaliacoes a
  WHERE a.peca_id = p_peca_id AND a.aprovada = true
  ORDER BY a.created_at DESC
  LIMIT 50;
END;
$$;

-- RPC para média de avaliações por organização (para exibir nas cards)
CREATE OR REPLACE FUNCTION public.fetch_avaliacoes_media(p_organization_id UUID)
RETURNS TABLE(peca_id UUID, media_nota NUMERIC, total_avaliacoes BIGINT)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT a.peca_id, ROUND(AVG(a.nota)::numeric, 1), COUNT(*)
  FROM public.ecommerce_avaliacoes a
  WHERE a.organization_id = p_organization_id AND a.aprovada = true
  GROUP BY a.peca_id;
END;
$$;
