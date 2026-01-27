-- Create envios table for shipping management
CREATE TABLE public.envios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  romaneio_id UUID REFERENCES public.romaneios(id),
  maleta_id UUID REFERENCES public.maletas(id),
  destinatario_nome TEXT NOT NULL,
  destinatario_telefone TEXT,
  destinatario_endereco TEXT,
  destinatario_cidade TEXT,
  destinatario_estado TEXT,
  destinatario_cep TEXT,
  codigo_rastreio TEXT,
  transportadora TEXT,
  tipo_envio TEXT NOT NULL DEFAULT 'pac',
  valor_frete NUMERIC NOT NULL DEFAULT 0,
  peso NUMERIC,
  status TEXT NOT NULL DEFAULT 'preparando',
  data_postagem TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  previsao_entrega TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create rastreio_eventos table for tracking events
CREATE TABLE public.rastreio_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  envio_id UUID NOT NULL REFERENCES public.envios(id) ON DELETE CASCADE,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  local TEXT,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreio_eventos ENABLE ROW LEVEL SECURITY;

-- RLS policies for envios
CREATE POLICY "envios_select_org" ON public.envios
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "envios_insert_org" ON public.envios
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "envios_update_org" ON public.envios
  FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "envios_delete_org" ON public.envios
  FOR DELETE USING (organization_id = get_user_organization_id());

-- RLS policies for rastreio_eventos
CREATE POLICY "rastreio_eventos_select_org" ON public.rastreio_eventos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.envios e
      WHERE e.id = rastreio_eventos.envio_id
      AND e.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "rastreio_eventos_insert_org" ON public.rastreio_eventos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.envios e
      WHERE e.id = rastreio_eventos.envio_id
      AND e.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "rastreio_eventos_delete_org" ON public.rastreio_eventos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.envios e
      WHERE e.id = rastreio_eventos.envio_id
      AND e.organization_id = get_user_organization_id()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_envios_updated_at
  BEFORE UPDATE ON public.envios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();