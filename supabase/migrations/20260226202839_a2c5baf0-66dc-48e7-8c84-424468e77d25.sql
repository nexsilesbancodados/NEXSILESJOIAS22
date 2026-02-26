
-- Wishlist / Favoritos
CREATE TABLE public.loja_favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_email TEXT NOT NULL,
  peca_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cliente_email, peca_id, organization_id)
);
ALTER TABLE public.loja_favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert favoritos" ON public.loja_favoritos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select favoritos" ON public.loja_favoritos FOR SELECT USING (true);
CREATE POLICY "Public delete favoritos" ON public.loja_favoritos FOR DELETE USING (true);

-- Avaliações de produtos
CREATE TABLE public.loja_avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  peca_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario TEXT,
  aprovada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loja_avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert avaliacoes" ON public.loja_avaliacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select aprovadas" ON public.loja_avaliacoes FOR SELECT USING (aprovada = true);
CREATE POLICY "Org members manage avaliacoes" ON public.loja_avaliacoes FOR ALL USING (
  organization_id IN (SELECT public.get_user_organization_ids())
);

-- Notificação de estoque
CREATE TABLE public.loja_avise_me (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  peca_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  email TEXT NOT NULL,
  notificado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(peca_id, email, organization_id)
);
ALTER TABLE public.loja_avise_me ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert avise_me" ON public.loja_avise_me FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select own avise_me" ON public.loja_avise_me FOR SELECT USING (true);
CREATE POLICY "Org members manage avise_me" ON public.loja_avise_me FOR ALL USING (
  organization_id IN (SELECT public.get_user_organization_ids())
);
