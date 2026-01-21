-- Create movimentos_caixa table (if not exists)
CREATE TABLE IF NOT EXISTS public.movimentos_caixa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caixa_sessao_id uuid REFERENCES public.caixa_sessoes(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  descricao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.movimentos_caixa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own movimentos_caixa" ON public.movimentos_caixa;
DROP POLICY IF EXISTS "Users can create their own movimentos_caixa" ON public.movimentos_caixa;
DROP POLICY IF EXISTS "Users can update their own movimentos_caixa" ON public.movimentos_caixa;
DROP POLICY IF EXISTS "Users can delete their own movimentos_caixa" ON public.movimentos_caixa;

CREATE POLICY "Users can view their own movimentos_caixa" ON public.movimentos_caixa
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own movimentos_caixa" ON public.movimentos_caixa
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own movimentos_caixa" ON public.movimentos_caixa
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own movimentos_caixa" ON public.movimentos_caixa
  FOR DELETE USING (auth.uid() = user_id);

-- Create configuracoes table (if not exists)
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave text NOT NULL,
  valor text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id, chave)
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Users can create their own configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Users can update their own configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Users can delete their own configuracoes" ON public.configuracoes;

CREATE POLICY "Users can view their own configuracoes" ON public.configuracoes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own configuracoes" ON public.configuracoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own configuracoes" ON public.configuracoes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own configuracoes" ON public.configuracoes
  FOR DELETE USING (auth.uid() = user_id);

-- Create envios_galvanica table (if not exists)
CREATE TABLE IF NOT EXISTS public.envios_galvanica (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_envio timestamp with time zone NOT NULL DEFAULT now(),
  data_retorno timestamp with time zone,
  status text NOT NULL DEFAULT 'enviado',
  observacoes text,
  peso_total numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.envios_galvanica ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own envios_galvanica" ON public.envios_galvanica;
DROP POLICY IF EXISTS "Users can create their own envios_galvanica" ON public.envios_galvanica;
DROP POLICY IF EXISTS "Users can update their own envios_galvanica" ON public.envios_galvanica;
DROP POLICY IF EXISTS "Users can delete their own envios_galvanica" ON public.envios_galvanica;

CREATE POLICY "Users can view their own envios_galvanica" ON public.envios_galvanica
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own envios_galvanica" ON public.envios_galvanica
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own envios_galvanica" ON public.envios_galvanica
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own envios_galvanica" ON public.envios_galvanica
  FOR DELETE USING (auth.uid() = user_id);

-- Create envio_galvanica_itens table (if not exists)
CREATE TABLE IF NOT EXISTS public.envio_galvanica_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  envio_id uuid REFERENCES public.envios_galvanica(id) ON DELETE CASCADE,
  peca_id uuid REFERENCES public.pecas(id) ON DELETE CASCADE,
  banho_id uuid REFERENCES public.banhos(id) ON DELETE SET NULL,
  quantidade integer NOT NULL DEFAULT 1,
  peso numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.envio_galvanica_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view envio_galvanica_itens" ON public.envio_galvanica_itens;
DROP POLICY IF EXISTS "Users can create envio_galvanica_itens" ON public.envio_galvanica_itens;
DROP POLICY IF EXISTS "Users can update envio_galvanica_itens" ON public.envio_galvanica_itens;
DROP POLICY IF EXISTS "Users can delete envio_galvanica_itens" ON public.envio_galvanica_itens;

CREATE POLICY "Users can view envio_galvanica_itens" ON public.envio_galvanica_itens
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.envios_galvanica WHERE id = envio_id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can create envio_galvanica_itens" ON public.envio_galvanica_itens
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.envios_galvanica WHERE id = envio_id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can update envio_galvanica_itens" ON public.envio_galvanica_itens
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.envios_galvanica WHERE id = envio_id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can delete envio_galvanica_itens" ON public.envio_galvanica_itens
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.envios_galvanica WHERE id = envio_id AND user_id = auth.uid()
  ));

-- Create modelos_etiquetas table (if not exists)
CREATE TABLE IF NOT EXISTS public.modelos_etiquetas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  largura numeric NOT NULL DEFAULT 50,
  altura numeric NOT NULL DEFAULT 30,
  campos jsonb DEFAULT '[]'::jsonb,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.modelos_etiquetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own modelos_etiquetas" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can create their own modelos_etiquetas" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can update their own modelos_etiquetas" ON public.modelos_etiquetas;
DROP POLICY IF EXISTS "Users can delete their own modelos_etiquetas" ON public.modelos_etiquetas;

CREATE POLICY "Users can view their own modelos_etiquetas" ON public.modelos_etiquetas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own modelos_etiquetas" ON public.modelos_etiquetas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own modelos_etiquetas" ON public.modelos_etiquetas
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own modelos_etiquetas" ON public.modelos_etiquetas
  FOR DELETE USING (auth.uid() = user_id);