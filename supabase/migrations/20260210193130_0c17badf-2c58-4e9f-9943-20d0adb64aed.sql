
-- Add sentiment analysis column to conversations
ALTER TABLE public.agente_conversas 
ADD COLUMN IF NOT EXISTS sentimento text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sentimento_score numeric DEFAULT NULL;

-- Add sentiment to messages
ALTER TABLE public.agente_mensagens
ADD COLUMN IF NOT EXISTS sentimento text DEFAULT NULL;

-- A/B Testing tables
CREATE TABLE IF NOT EXISTS public.ab_testes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id),
  nome text NOT NULL,
  descricao text,
  variante_a_prompt text NOT NULL,
  variante_b_prompt text NOT NULL,
  variante_a_conversas integer DEFAULT 0,
  variante_b_conversas integer DEFAULT 0,
  variante_a_nps_total numeric DEFAULT 0,
  variante_b_nps_total numeric DEFAULT 0,
  variante_a_resolucoes integer DEFAULT 0,
  variante_b_resolucoes integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ab_testes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ab_testes_org_select" ON public.ab_testes
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "ab_testes_org_insert" ON public.ab_testes
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "ab_testes_org_update" ON public.ab_testes
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "ab_testes_org_delete" ON public.ab_testes
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Track which variant was used per conversation
ALTER TABLE public.agente_conversas
ADD COLUMN IF NOT EXISTS ab_teste_id uuid REFERENCES public.ab_testes(id),
ADD COLUMN IF NOT EXISTS ab_variante text DEFAULT NULL;
