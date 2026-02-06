-- Create agent configuration table
CREATE TABLE public.agente_ia_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome_agente TEXT NOT NULL DEFAULT 'Assistente Virtual',
  prompt_sistema TEXT NOT NULL DEFAULT 'Você é um assistente virtual de uma joalheria. Ajude os clientes com informações sobre produtos, pedidos e pagamentos.',
  cor_primaria TEXT DEFAULT '#9b87f5',
  avatar_url TEXT,
  mensagem_boas_vindas TEXT DEFAULT 'Olá! 👋 Sou o assistente virtual. Como posso ajudar você hoje?',
  ativo BOOLEAN DEFAULT true,
  pix_chave TEXT,
  pix_tipo TEXT DEFAULT 'email',
  pix_nome TEXT,
  whatsapp_numero TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.agente_ia_config ENABLE ROW LEVEL SECURITY;

-- Policies for agent config (only org members can view/edit)
CREATE POLICY "Members can view their org agent config"
ON public.agente_ia_config
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage agent config"
ON public.agente_ia_config
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Create conversation history table
CREATE TABLE public.agente_conversas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agente_conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their org conversations"
ON public.agente_conversas
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can create conversations"
ON public.agente_conversas
FOR INSERT
WITH CHECK (true);

-- Create messages table
CREATE TABLE public.agente_mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id UUID REFERENCES public.agente_conversas(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agente_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view conversation messages"
ON public.agente_mensagens
FOR SELECT
USING (
  conversa_id IN (
    SELECT id FROM public.agente_conversas 
    WHERE organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Anyone can create messages"
ON public.agente_mensagens
FOR INSERT
WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_agente_conversas_session ON public.agente_conversas(session_id);
CREATE INDEX idx_agente_mensagens_conversa ON public.agente_mensagens(conversa_id);

-- Trigger for updated_at
CREATE TRIGGER update_agente_ia_config_updated_at
BEFORE UPDATE ON public.agente_ia_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agente_conversas_updated_at
BEFORE UPDATE ON public.agente_conversas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();