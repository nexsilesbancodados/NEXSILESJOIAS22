-- Adicionar campos para compartilhamento público em maletas
ALTER TABLE public.maletas
ADD COLUMN IF NOT EXISTS sharing_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Criar tabela de interesses de maleta (clientes demonstrando interesse)
CREATE TABLE IF NOT EXISTS public.maleta_interesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maleta_id UUID REFERENCES public.maletas(id) ON DELETE CASCADE NOT NULL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_email TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendido', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de itens de interesse
CREATE TABLE IF NOT EXISTS public.maleta_interesse_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interesse_id UUID REFERENCES public.maleta_interesses(id) ON DELETE CASCADE NOT NULL,
  peca_id UUID REFERENCES public.pecas(id) ON DELETE CASCADE NOT NULL,
  quantidade INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.maleta_interesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maleta_interesse_itens ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso público (anônimo) às maletas públicas
CREATE POLICY "Anyone can view public maletas"
ON public.maletas FOR SELECT TO anon
USING (is_public = true);

-- Políticas para acesso público aos itens de maletas públicas
CREATE POLICY "Anyone can view public maleta items"
ON public.maletas_pecas FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.maletas m
    WHERE m.id = maleta_id AND m.is_public = true
  )
);

-- Qualquer pessoa pode criar interesse em maleta pública
CREATE POLICY "Anyone can create interesse"
ON public.maleta_interesses FOR INSERT TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.maletas m
    WHERE m.id = maleta_id AND m.is_public = true
  )
);

-- Qualquer pessoa pode criar itens de interesse
CREATE POLICY "Anyone can create interesse items"
ON public.maleta_interesse_itens FOR INSERT TO anon
WITH CHECK (true);

-- Usuários autenticados podem ver interesses das suas maletas
CREATE POLICY "Authenticated can view maleta_interesses"
ON public.maleta_interesses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.maletas m
    WHERE m.id = maleta_id
  )
);

-- Usuários autenticados podem gerenciar interesses
CREATE POLICY "Authenticated can manage maleta_interesses"
ON public.maleta_interesses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.maletas m
    WHERE m.id = maleta_id
  )
);

-- Usuários autenticados podem ver itens de interesse
CREATE POLICY "Authenticated can view interesse_itens"
ON public.maleta_interesse_itens FOR SELECT
USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_maletas_sharing_slug ON public.maletas(sharing_slug);
CREATE INDEX IF NOT EXISTS idx_maletas_is_public ON public.maletas(is_public);
CREATE INDEX IF NOT EXISTS idx_maleta_interesses_maleta ON public.maleta_interesses(maleta_id);
CREATE INDEX IF NOT EXISTS idx_maleta_interesse_itens_interesse ON public.maleta_interesse_itens(interesse_id);