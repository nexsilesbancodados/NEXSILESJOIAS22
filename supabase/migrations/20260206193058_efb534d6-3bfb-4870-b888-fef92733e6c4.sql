-- Adicionar campos extras para conversas
ALTER TABLE public.agente_conversas 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS nps_rating INTEGER CHECK (nps_rating >= 0 AND nps_rating <= 10),
ADD COLUMN IF NOT EXISTS nps_comentario TEXT,
ADD COLUMN IF NOT EXISTS nps_enviado_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_mensagens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tempo_primeira_resposta INTEGER,
ADD COLUMN IF NOT EXISTS origem VARCHAR(50) DEFAULT 'widget';

-- Tabela de FAQs/Respostas Rápidas
CREATE TABLE IF NOT EXISTS public.agente_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  categoria VARCHAR(100),
  palavras_chave TEXT[],
  ativo BOOLEAN DEFAULT true,
  uso_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agente_faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for FAQs
CREATE POLICY "FAQs visible to org members"
ON public.agente_faqs FOR SELECT
TO authenticated
USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "FAQs can be created by org members"
ON public.agente_faqs FOR INSERT
TO authenticated
WITH CHECK (public.user_belongs_to_org(organization_id));

CREATE POLICY "FAQs can be updated by org members"
ON public.agente_faqs FOR UPDATE
TO authenticated
USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "FAQs can be deleted by org members"
ON public.agente_faqs FOR DELETE
TO authenticated
USING (public.user_belongs_to_org(organization_id));

-- Tabela de fila de atendimento humano
CREATE TABLE IF NOT EXISTS public.agente_fila_humana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversa_id UUID REFERENCES public.agente_conversas(id) ON DELETE CASCADE,
  motivo TEXT,
  prioridade INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'aguardando',
  atendente_id UUID REFERENCES auth.users(id),
  entrou_fila_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atendido_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agente_fila_humana ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fila humana
CREATE POLICY "Fila visible to org members"
ON public.agente_fila_humana FOR SELECT
TO authenticated
USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Fila can be managed by org members"
ON public.agente_fila_humana FOR ALL
TO authenticated
USING (public.user_belongs_to_org(organization_id));

-- Function to update conversation message count
CREATE OR REPLACE FUNCTION public.update_conversa_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.agente_conversas 
  SET total_mensagens = (
    SELECT COUNT(*) FROM public.agente_mensagens 
    WHERE conversa_id = NEW.conversa_id
  ),
  updated_at = now()
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for message count
DROP TRIGGER IF EXISTS trg_update_conversa_message_count ON public.agente_mensagens;
CREATE TRIGGER trg_update_conversa_message_count
AFTER INSERT ON public.agente_mensagens
FOR EACH ROW EXECUTE FUNCTION public.update_conversa_message_count();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agente_conversas_org_status ON public.agente_conversas(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_agente_conversas_updated ON public.agente_conversas(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_agente_mensagens_conversa ON public.agente_mensagens(conversa_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agente_faqs_org ON public.agente_faqs(organization_id, ativo);
CREATE INDEX IF NOT EXISTS idx_agente_fila_org_status ON public.agente_fila_humana(organization_id, status);