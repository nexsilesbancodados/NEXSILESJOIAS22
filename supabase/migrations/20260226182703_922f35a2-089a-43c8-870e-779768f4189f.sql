
-- 1. Tabela ecommerce_config
CREATE TABLE public.ecommerce_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  nome_loja TEXT NOT NULL DEFAULT 'Minha Loja',
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#9b87f5',
  cor_secundaria TEXT DEFAULT '#7c3aed',
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT false,
  frete_gratis_acima NUMERIC,
  taxa_entrega NUMERIC DEFAULT 0,
  whatsapp TEXT,
  instagram TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ecommerce_config_slug_unique UNIQUE (slug),
  CONSTRAINT ecommerce_config_org_unique UNIQUE (organization_id)
);

-- 2. Coluna disponivel_loja na tabela pecas
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS disponivel_loja BOOLEAN NOT NULL DEFAULT false;

-- 3. Sequência para numero_pedido
CREATE SEQUENCE IF NOT EXISTS ecommerce_pedido_numero_seq START 1001;

-- 4. Tabela ecommerce_pedidos
CREATE TABLE public.ecommerce_pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  numero_pedido INTEGER NOT NULL DEFAULT nextval('ecommerce_pedido_numero_seq'),
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefone TEXT,
  cliente_cpf TEXT,
  endereco JSONB,
  valor_subtotal NUMERIC NOT NULL DEFAULT 0,
  valor_frete NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  mercadopago_payment_id TEXT,
  metodo_pagamento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela ecommerce_pedido_itens
CREATE TABLE public.ecommerce_pedido_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.ecommerce_pedidos(id) ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. RLS para ecommerce_config
ALTER TABLE public.ecommerce_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver config da loja da sua org"
  ON public.ecommerce_config FOR SELECT
  USING (public.user_is_member_of_org(organization_id));

CREATE POLICY "Membros podem inserir config da loja da sua org"
  ON public.ecommerce_config FOR INSERT
  WITH CHECK (public.user_is_member_of_org(organization_id));

CREATE POLICY "Membros podem atualizar config da loja da sua org"
  ON public.ecommerce_config FOR UPDATE
  USING (public.user_is_member_of_org(organization_id));

CREATE POLICY "Membros podem deletar config da loja da sua org"
  ON public.ecommerce_config FOR DELETE
  USING (public.user_is_member_of_org(organization_id));

-- 7. RLS para ecommerce_pedidos
ALTER TABLE public.ecommerce_pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver pedidos da sua org"
  ON public.ecommerce_pedidos FOR SELECT
  USING (public.user_is_member_of_org(organization_id));

CREATE POLICY "Membros podem atualizar pedidos da sua org"
  ON public.ecommerce_pedidos FOR UPDATE
  USING (public.user_is_member_of_org(organization_id));

-- 8. RLS para ecommerce_pedido_itens
ALTER TABLE public.ecommerce_pedido_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver itens de pedidos da sua org"
  ON public.ecommerce_pedido_itens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ecommerce_pedidos ep
      WHERE ep.id = pedido_id AND public.user_is_member_of_org(ep.organization_id)
    )
  );

-- 9. Secure View para config pública (anônimos)
CREATE OR REPLACE VIEW public.ecommerce_config_public 
WITH (security_invoker = on) AS
SELECT id, slug, nome_loja, logo_url, cor_primaria, cor_secundaria, descricao, ativo, frete_gratis_acima, taxa_entrega, whatsapp, instagram, organization_id
FROM public.ecommerce_config
WHERE ativo = true;

GRANT SELECT ON public.ecommerce_config_public TO anon, authenticated;

-- 10. Secure View para peças da loja (anônimos)
CREATE OR REPLACE VIEW public.pecas_loja_public
WITH (security_invoker = on) AS
SELECT p.id, p.nome, p.codigo, p.preco_venda, p.imagem_url, p.categoria, p.material, p.descricao, p.estoque, p.peso, p.organization_id
FROM public.pecas p
WHERE p.disponivel_loja = true AND p.ativo = true AND p.estoque > 0;

GRANT SELECT ON public.pecas_loja_public TO anon, authenticated;

-- 11. Política de acesso anônimo à view de config
CREATE POLICY "Acesso anônimo à config ativa da loja"
  ON public.ecommerce_config FOR SELECT
  TO anon
  USING (ativo = true);

-- 12. Política de acesso anônimo às peças na loja
CREATE POLICY "Acesso anônimo às peças da loja"
  ON public.pecas FOR SELECT
  TO anon
  USING (disponivel_loja = true AND ativo = true AND estoque > 0);

-- 13. Triggers de updated_at
CREATE TRIGGER update_ecommerce_config_updated_at
  BEFORE UPDATE ON public.ecommerce_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ecommerce_pedidos_updated_at
  BEFORE UPDATE ON public.ecommerce_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Índices
CREATE INDEX idx_ecommerce_config_slug ON public.ecommerce_config(slug);
CREATE INDEX idx_ecommerce_pedidos_org ON public.ecommerce_pedidos(organization_id);
CREATE INDEX idx_ecommerce_pedidos_status ON public.ecommerce_pedidos(status);
CREATE INDEX idx_pecas_disponivel_loja ON public.pecas(disponivel_loja) WHERE disponivel_loja = true;
