-- Tabela de vendas fiado (crediário)
CREATE TABLE public.fiado (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  venda_id uuid REFERENCES public.vendas(id) ON DELETE SET NULL,
  valor_total numeric NOT NULL DEFAULT 0,
  valor_pago numeric NOT NULL DEFAULT 0,
  data_vencimento date NOT NULL,
  status text NOT NULL DEFAULT 'aberto', -- aberto, pago, vencido
  observacoes text,
  notificacao_enviada boolean DEFAULT false,
  notificacao_enviada_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fiado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiado_select_org" ON public.fiado FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "fiado_insert_org" ON public.fiado FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "fiado_update_org" ON public.fiado FOR UPDATE USING (organization_id = get_user_organization_id());
CREATE POLICY "fiado_delete_org" ON public.fiado FOR DELETE USING (organization_id = get_user_organization_id());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_fiado_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_fiado_updated_at
BEFORE UPDATE ON public.fiado
FOR EACH ROW EXECUTE FUNCTION public.update_fiado_updated_at();

-- Index para performance
CREATE INDEX idx_fiado_organization_id ON public.fiado(organization_id);
CREATE INDEX idx_fiado_cliente_id ON public.fiado(cliente_id);
CREATE INDEX idx_fiado_status ON public.fiado(status);
CREATE INDEX idx_fiado_data_vencimento ON public.fiado(data_vencimento);
