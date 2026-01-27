-- Create envios_galvanica table for galvanoplasty shipments
CREATE TABLE public.envios_galvanica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  data_envio TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pendente',
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  peso_total NUMERIC DEFAULT 0,
  peso_cobrado NUMERIC DEFAULT 0,
  valor_total NUMERIC DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create envio_galvanica_itens table for items in each shipment
CREATE TABLE public.envio_galvanica_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  envio_id UUID REFERENCES public.envios_galvanica(id) ON DELETE CASCADE,
  peca_id UUID REFERENCES public.pecas(id) ON DELETE CASCADE,
  banho_id UUID REFERENCES public.banhos(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  peso NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.envios_galvanica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envio_galvanica_itens ENABLE ROW LEVEL SECURITY;

-- RLS policies for envios_galvanica
CREATE POLICY "envios_galvanica_select_org" ON public.envios_galvanica
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "envios_galvanica_insert_org" ON public.envios_galvanica
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "envios_galvanica_update_org" ON public.envios_galvanica
  FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "envios_galvanica_delete_org" ON public.envios_galvanica
  FOR DELETE USING (organization_id = get_user_organization_id());

-- RLS policies for envio_galvanica_itens
CREATE POLICY "envio_galvanica_itens_select" ON public.envio_galvanica_itens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.envios_galvanica e
      WHERE e.id = envio_galvanica_itens.envio_id
      AND e.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "envio_galvanica_itens_insert" ON public.envio_galvanica_itens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.envios_galvanica e
      WHERE e.id = envio_galvanica_itens.envio_id
      AND e.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "envio_galvanica_itens_update" ON public.envio_galvanica_itens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.envios_galvanica e
      WHERE e.id = envio_galvanica_itens.envio_id
      AND e.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "envio_galvanica_itens_delete" ON public.envio_galvanica_itens
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.envios_galvanica e
      WHERE e.id = envio_galvanica_itens.envio_id
      AND e.organization_id = get_user_organization_id()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_envios_galvanica_updated_at
  BEFORE UPDATE ON public.envios_galvanica
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();