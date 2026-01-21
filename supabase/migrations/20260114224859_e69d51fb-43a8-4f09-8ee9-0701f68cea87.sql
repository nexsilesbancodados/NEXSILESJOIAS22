-- Profiles table (linked to auth.users) - CREATE FIRST
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'reseller')),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  comissao NUMERIC(5,2) DEFAULT 10.00,
  senha_portal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Now create helper functions after profiles exists
CREATE OR REPLACE FUNCTION public.get_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.get_role() = 'admin', false)
$$;

-- Pecas (inventory)
CREATE TABLE public.pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  estoque INTEGER NOT NULL DEFAULT 0,
  preco_custo NUMERIC(10,2) NOT NULL DEFAULT 0,
  preco_venda NUMERIC(10,2) NOT NULL DEFAULT 0,
  categoria TEXT,
  fornecedor TEXT,
  imagem_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maletas (briefcases assigned to resellers)
CREATE TABLE public.maletas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada')),
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fechamento TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maleta items
CREATE TABLE public.maleta_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maleta_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'vendido', 'devolvido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vendas (sales)
CREATE TABLE public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'pdv' CHECK (tipo IN ('pdv', 'revendedora')),
  reseller_id UUID REFERENCES public.profiles(id),
  cliente_nome TEXT,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  caixa_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Venda items
CREATE TABLE public.venda_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id),
  peca_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pagamentos (payments per sale)
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  metodo TEXT NOT NULL CHECK (metodo IN ('dinheiro', 'pix', 'credito', 'debito')),
  valor NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Romaneios (pending sales from resellers)
CREATE TABLE public.romaneios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reseller_nome TEXT NOT NULL,
  cliente_nome TEXT,
  maleta_id UUID REFERENCES public.maletas(id),
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Romaneio items
CREATE TABLE public.romaneio_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  romaneio_id UUID NOT NULL REFERENCES public.romaneios(id) ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id),
  peca_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Caixa sessions
CREATE TABLE public.caixa_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fechamento TIMESTAMPTZ,
  fundo_troco NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key from vendas to caixa_sessoes
ALTER TABLE public.vendas ADD CONSTRAINT vendas_caixa_id_fkey 
  FOREIGN KEY (caixa_id) REFERENCES public.caixa_sessoes(id);

-- Cash movements
CREATE TABLE public.movimentos_caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caixa_id UUID NOT NULL REFERENCES public.caixa_sessoes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('sangria', 'suprimento')),
  valor NUMERIC(10,2) NOT NULL,
  descricao TEXT,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configuracoes (settings)
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.configuracoes (chave, valor) VALUES
  ('nome_loja', 'Minha Loja de Semijoias'),
  ('telefone_loja', ''),
  ('endereco_loja', ''),
  ('cnpj_loja', ''),
  ('comissao_padrao', '10'),
  ('impressora_termica', 'false'),
  ('largura_recibo', '80');

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maleta_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneio_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentos_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile or admins can view all"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "First user or admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Only admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (is_admin() OR id = auth.uid());

CREATE POLICY "Only admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (is_admin());

-- RLS Policies for pecas
CREATE POLICY "Authenticated users can view pecas"
  ON public.pecas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can insert pecas"
  ON public.pecas FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update pecas"
  ON public.pecas FOR UPDATE
  USING (is_admin());

CREATE POLICY "Only admins can delete pecas"
  ON public.pecas FOR DELETE
  USING (is_admin());

-- RLS Policies for maletas
CREATE POLICY "Resellers see own maletas, admins see all"
  ON public.maletas FOR SELECT
  USING (reseller_id = auth.uid() OR is_admin());

CREATE POLICY "Only admins can insert maletas"
  ON public.maletas FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update maletas"
  ON public.maletas FOR UPDATE
  USING (is_admin());

CREATE POLICY "Only admins can delete maletas"
  ON public.maletas FOR DELETE
  USING (is_admin());

-- RLS Policies for maleta_itens
CREATE POLICY "Users see maleta items they have access to"
  ON public.maleta_itens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.maletas 
      WHERE id = maleta_itens.maleta_id 
      AND (reseller_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Only admins can insert maleta items"
  ON public.maleta_itens FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update maleta items"
  ON public.maleta_itens FOR UPDATE
  USING (is_admin());

CREATE POLICY "Only admins can delete maleta items"
  ON public.maleta_itens FOR DELETE
  USING (is_admin());

-- RLS Policies for vendas
CREATE POLICY "Resellers see own vendas, admins see all"
  ON public.vendas FOR SELECT
  USING (reseller_id = auth.uid() OR is_admin() OR reseller_id IS NULL);

CREATE POLICY "Authenticated users can insert vendas"
  ON public.vendas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only admins can update vendas"
  ON public.vendas FOR UPDATE
  USING (is_admin());

CREATE POLICY "Only admins can delete vendas"
  ON public.vendas FOR DELETE
  USING (is_admin());

-- RLS Policies for venda_itens
CREATE POLICY "Users see venda items they have access to"
  ON public.venda_itens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendas 
      WHERE id = venda_itens.venda_id 
      AND (reseller_id = auth.uid() OR is_admin() OR reseller_id IS NULL)
    )
  );

CREATE POLICY "Authenticated users can insert venda items"
  ON public.venda_itens FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for pagamentos
CREATE POLICY "Users see pagamentos they have access to"
  ON public.pagamentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendas 
      WHERE id = pagamentos.venda_id 
      AND (reseller_id = auth.uid() OR is_admin() OR reseller_id IS NULL)
    )
  );

CREATE POLICY "Authenticated users can insert pagamentos"
  ON public.pagamentos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for romaneios
CREATE POLICY "Resellers see own romaneios, admins see all"
  ON public.romaneios FOR SELECT
  USING (reseller_id = auth.uid() OR is_admin());

CREATE POLICY "Authenticated users can insert romaneios"
  ON public.romaneios FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only admins can update romaneios"
  ON public.romaneios FOR UPDATE
  USING (is_admin());

-- RLS Policies for romaneio_itens
CREATE POLICY "Users see romaneio items they have access to"
  ON public.romaneio_itens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.romaneios 
      WHERE id = romaneio_itens.romaneio_id 
      AND (reseller_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Authenticated users can insert romaneio items"
  ON public.romaneio_itens FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for caixa_sessoes
CREATE POLICY "Users see own caixa sessions, admins see all"
  ON public.caixa_sessoes FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Authenticated users can insert caixa sessions"
  ON public.caixa_sessoes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own caixa sessions"
  ON public.caixa_sessoes FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

-- RLS Policies for movimentos_caixa
CREATE POLICY "Users see movimentos from their caixa sessions"
  ON public.movimentos_caixa FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caixa_sessoes 
      WHERE id = movimentos_caixa.caixa_id 
      AND (user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Authenticated users can insert movimentos"
  ON public.movimentos_caixa FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for configuracoes
CREATE POLICY "Authenticated users can view configuracoes"
  ON public.configuracoes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can insert configuracoes"
  ON public.configuracoes FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update configuracoes"
  ON public.configuracoes FOR UPDATE
  USING (is_admin());

CREATE POLICY "Only admins can delete configuracoes"
  ON public.configuracoes FOR DELETE
  USING (is_admin());

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_pecas_updated_at
  BEFORE UPDATE ON public.pecas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();