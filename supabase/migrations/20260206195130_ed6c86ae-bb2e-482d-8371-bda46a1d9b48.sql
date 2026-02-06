-- =============================================
-- FASE 2.2: Dashboard NPS - já temos os campos, só precisa de índices
-- =============================================
CREATE INDEX IF NOT EXISTS idx_conversas_nps_rating ON public.agente_conversas(nps_rating) WHERE nps_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversas_created_at ON public.agente_conversas(created_at);

-- =============================================
-- FASE 3.1: Instagram Direct - Configuração
-- =============================================
ALTER TABLE public.agente_ia_config 
ADD COLUMN IF NOT EXISTS instagram_page_id text,
ADD COLUMN IF NOT EXISTS instagram_access_token text,
ADD COLUMN IF NOT EXISTS instagram_ativo boolean DEFAULT false;

-- =============================================
-- FASE 3.2: E-mail Automático
-- =============================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  nome text NOT NULL,
  assunto text NOT NULL,
  corpo_html text NOT NULL,
  corpo_texto text,
  tipo text NOT NULL DEFAULT 'geral', -- confirmacao_pedido, follow_up, resumo_conversa, marketing
  ativo boolean DEFAULT true,
  variaveis text[], -- lista de variáveis disponíveis
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage email templates" ON public.email_templates
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  template_id uuid REFERENCES public.email_templates(id),
  destinatario_email text NOT NULL,
  destinatario_nome text,
  assunto text NOT NULL,
  status text DEFAULT 'pendente', -- pendente, enviado, erro, aberto, clicado
  erro_mensagem text,
  conversa_id uuid REFERENCES public.agente_conversas(id),
  metadata jsonb,
  enviado_at timestamptz,
  aberto_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email logs" ON public.email_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Configurações de e-mail na config do agente
ALTER TABLE public.agente_ia_config
ADD COLUMN IF NOT EXISTS email_remetente text,
ADD COLUMN IF NOT EXISTS email_nome_remetente text,
ADD COLUMN IF NOT EXISTS email_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_follow_up_horas integer DEFAULT 24;

-- =============================================
-- FASE 4.1: Áudio/Voz
-- =============================================
ALTER TABLE public.agente_ia_config
ADD COLUMN IF NOT EXISTS audio_transcricao_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS audio_tts_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS audio_voz_preferida text DEFAULT 'alloy';

-- Armazenar transcrições
ALTER TABLE public.agente_mensagens
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS transcricao text,
ADD COLUMN IF NOT EXISTS duracao_segundos integer;

-- =============================================
-- FASE 4.2: Agendamento Automático
-- =============================================
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  cliente_nome text NOT NULL,
  cliente_telefone text,
  cliente_email text,
  conversa_id uuid REFERENCES public.agente_conversas(id),
  titulo text NOT NULL,
  descricao text,
  data_hora timestamptz NOT NULL,
  duracao_minutos integer DEFAULT 30,
  status text DEFAULT 'agendado', -- agendado, confirmado, cancelado, concluido, no_show
  lembrete_enviado boolean DEFAULT false,
  lembrete_horas_antes integer DEFAULT 24,
  google_event_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage agendamentos" ON public.agendamentos
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_agendamentos_data ON public.agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON public.agendamentos(status);

-- Configuração de agendamento
ALTER TABLE public.agente_ia_config
ADD COLUMN IF NOT EXISTS agendamento_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS agendamento_horarios jsonb, -- {seg: [{inicio: "09:00", fim: "18:00"}], ...}
ADD COLUMN IF NOT EXISTS agendamento_duracao_padrao integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS agendamento_antecedencia_min_horas integer DEFAULT 2;

-- =============================================
-- FASE 4.3: Multi-agentes
-- =============================================
CREATE TABLE IF NOT EXISTS public.agentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  nome text NOT NULL,
  departamento text NOT NULL, -- vendas, suporte, financeiro, etc
  prompt_sistema text NOT NULL,
  palavras_chave text[], -- para roteamento automático
  ativo boolean DEFAULT true,
  avatar_url text,
  cor text,
  ferramentas_ativas jsonb,
  ordem_prioridade integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.agentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage agentes" ON public.agentes
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Vincular conversa a um agente específico
ALTER TABLE public.agente_conversas
ADD COLUMN IF NOT EXISTS agente_id uuid REFERENCES public.agentes(id);

-- =============================================
-- FASE 2.1: Recomendações Inteligentes
-- =============================================
-- Tabela para preferências detectadas do cliente
CREATE TABLE IF NOT EXISTS public.cliente_preferencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_telefone text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  categorias_favoritas text[],
  faixa_preco_min numeric,
  faixa_preco_max numeric,
  materiais_preferidos text[],
  ultima_compra_at timestamptz,
  total_compras integer DEFAULT 0,
  valor_total_compras numeric DEFAULT 0,
  produtos_visualizados uuid[], -- IDs das peças
  produtos_comprados uuid[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cliente_telefone, organization_id)
);

ALTER TABLE public.cliente_preferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage cliente_preferencias" ON public.cliente_preferencias
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Tabela para "quem comprou X também comprou Y"
CREATE TABLE IF NOT EXISTS public.produto_associacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  peca_origem_id uuid REFERENCES public.pecas(id),
  peca_associada_id uuid REFERENCES public.pecas(id),
  score integer DEFAULT 1, -- quantas vezes foram comprados juntos
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, peca_origem_id, peca_associada_id)
);

ALTER TABLE public.produto_associacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage produto_associacoes" ON public.produto_associacoes
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_produto_associacoes_origem ON public.produto_associacoes(peca_origem_id);
CREATE INDEX idx_produto_associacoes_score ON public.produto_associacoes(score DESC);

-- =============================================
-- Triggers para atualização automática
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas novas tabelas
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY['email_templates', 'agendamentos', 'agentes', 'cliente_preferencias', 'produto_associacoes'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
      CREATE TRIGGER update_%I_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;