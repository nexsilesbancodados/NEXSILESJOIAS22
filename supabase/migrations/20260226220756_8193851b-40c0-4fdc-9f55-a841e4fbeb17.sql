
-- Add missing columns to ecommerce_pedidos for cupons, tracking
ALTER TABLE public.ecommerce_pedidos 
  ADD COLUMN IF NOT EXISTS valor_desconto numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cupom_id uuid DEFAULT null,
  ADD COLUMN IF NOT EXISTS codigo_rastreio text DEFAULT null,
  ADD COLUMN IF NOT EXISTS transportadora text DEFAULT null;

-- Create cupons table if not exists
CREATE TABLE IF NOT EXISTS public.cupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  codigo text NOT NULL,
  tipo text NOT NULL DEFAULT 'percentual',
  valor numeric NOT NULL DEFAULT 0,
  valor_minimo_pedido numeric NOT NULL DEFAULT 0,
  uso_maximo integer DEFAULT null,
  uso_atual integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  valido_ate timestamp with time zone DEFAULT null,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, codigo)
);

ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage cupons" ON public.cupons
  FOR ALL USING (public.user_belongs_to_org(organization_id));

-- RPC to validate coupon
CREATE OR REPLACE FUNCTION public.validar_cupom(p_codigo text, p_organization_id uuid, p_valor_pedido numeric)
RETURNS TABLE(cupom_id uuid, desconto numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_cupom RECORD;
BEGIN
  SELECT * INTO v_cupom FROM public.cupons
  WHERE organization_id = p_organization_id 
    AND codigo = upper(trim(p_codigo))
    AND ativo = true;

  IF NOT FOUND THEN RAISE EXCEPTION 'Cupom não encontrado'; END IF;
  IF v_cupom.valido_ate IS NOT NULL AND v_cupom.valido_ate < now() THEN RAISE EXCEPTION 'Cupom expirado'; END IF;
  IF v_cupom.uso_maximo IS NOT NULL AND v_cupom.uso_atual >= v_cupom.uso_maximo THEN RAISE EXCEPTION 'Cupom esgotado'; END IF;
  IF p_valor_pedido < v_cupom.valor_minimo_pedido THEN RAISE EXCEPTION 'Pedido mínimo de R$ %', v_cupom.valor_minimo_pedido; END IF;

  IF v_cupom.tipo = 'percentual' THEN
    RETURN QUERY SELECT v_cupom.id, ROUND((p_valor_pedido * v_cupom.valor / 100)::numeric, 2);
  ELSE
    RETURN QUERY SELECT v_cupom.id, LEAST(v_cupom.valor, p_valor_pedido);
  END IF;
END;
$$;

-- RPC to increment coupon usage
CREATE OR REPLACE FUNCTION public.usar_cupom(p_cupom_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.cupons SET uso_atual = uso_atual + 1 WHERE id = p_cupom_id;
END;
$$;

-- RPC to debit stock
CREATE OR REPLACE FUNCTION public.debitar_estoque_ecommerce(p_peca_id uuid, p_quantidade integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.pecas SET estoque = GREATEST(0, estoque - p_quantidade) WHERE id = p_peca_id;
END;
$$;

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Avise-me table
CREATE TABLE IF NOT EXISTS public.loja_avise_me (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  peca_id uuid NOT NULL REFERENCES public.pecas(id),
  email text NOT NULL,
  notificado boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, peca_id, email)
);

ALTER TABLE public.loja_avise_me ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view avise_me" ON public.loja_avise_me
  FOR SELECT USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Anyone can register avise_me" ON public.loja_avise_me
  FOR INSERT WITH CHECK (true);
