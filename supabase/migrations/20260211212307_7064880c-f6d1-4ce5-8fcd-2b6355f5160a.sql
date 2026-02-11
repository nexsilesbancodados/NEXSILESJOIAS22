
-- Add agent sales tracking columns to agente_conversas
ALTER TABLE public.agente_conversas 
  ADD COLUMN IF NOT EXISTS lead_score TEXT DEFAULT 'frio',
  ADD COLUMN IF NOT EXISTS venda_realizada BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_venda NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS venda_id UUID REFERENCES public.vendas(id),
  ADD COLUMN IF NOT EXISTS follow_up_enviado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ultimo_contato_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS produtos_interesse TEXT[];

-- Create index for follow-up queries
CREATE INDEX IF NOT EXISTS idx_conversas_follow_up ON public.agente_conversas (follow_up_enviado, ultimo_contato_at) WHERE status = 'ativa';
CREATE INDEX IF NOT EXISTS idx_conversas_lead_score ON public.agente_conversas (lead_score, organization_id);
CREATE INDEX IF NOT EXISTS idx_conversas_venda ON public.agente_conversas (venda_realizada, organization_id);
