
-- CRM Leads table
CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  empresa TEXT,
  origem TEXT NOT NULL DEFAULT 'manual', -- signup, landing_page, ecommerce, manual
  status TEXT NOT NULL DEFAULT 'novo', -- novo, contato, negociacao, qualificado, convertido, perdido
  valor_potencial NUMERIC DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  notas TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  plano_interesse TEXT,
  convertido_em TIMESTAMPTZ,
  user_id_convertido UUID, -- references auth.users when lead converts to user
  score INTEGER DEFAULT 0,
  ultimo_contato_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- Only super admin can access
CREATE POLICY "Super admin full access to crm_leads"
  ON public.crm_leads FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_super_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_super_admin = true)
  );

-- CRM Activities / Interactions
CREATE TABLE public.crm_atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'nota', -- nota, email, ligacao, reuniao, tarefa, sistema
  titulo TEXT NOT NULL,
  descricao TEXT,
  realizado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access to crm_atividades"
  ON public.crm_atividades FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_super_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_super_admin = true)
  );

-- CRM Conversion Events (funnel tracking)
CREATE TABLE public.crm_conversoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  evento TEXT NOT NULL, -- visita_landing, cadastro, inicio_trial, pagamento, upgrade
  valor NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_conversoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access to crm_conversoes"
  ON public.crm_conversoes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_super_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_super_admin = true)
  );

-- Indexes
CREATE INDEX idx_crm_leads_status ON public.crm_leads(status);
CREATE INDEX idx_crm_leads_origem ON public.crm_leads(origem);
CREATE INDEX idx_crm_leads_email ON public.crm_leads(email);
CREATE INDEX idx_crm_leads_created ON public.crm_leads(created_at DESC);
CREATE INDEX idx_crm_conversoes_evento ON public.crm_conversoes(evento);
CREATE INDEX idx_crm_conversoes_created ON public.crm_conversoes(created_at DESC);
CREATE INDEX idx_crm_atividades_lead ON public.crm_atividades(lead_id);

-- Trigger for updated_at
CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create lead from new user signup
CREATE OR REPLACE FUNCTION public.crm_capturar_lead_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.crm_leads (nome, email, origem, status, notas)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    'signup',
    'novo',
    'Lead capturado automaticamente via cadastro no sistema'
  );
  
  -- Register conversion event
  INSERT INTO public.crm_conversoes (evento, metadata)
  VALUES ('cadastro', jsonb_build_object('email', NEW.email, 'user_id', NEW.id));
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users for auto lead capture
CREATE TRIGGER crm_lead_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_capturar_lead_signup();
