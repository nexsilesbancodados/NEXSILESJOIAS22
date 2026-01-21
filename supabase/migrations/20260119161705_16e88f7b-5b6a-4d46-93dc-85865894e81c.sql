-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cpf TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  data_nascimento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fornecedores table
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cnpj TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  contato TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create banhos table (for galvanic baths/plating)
CREATE TABLE public.banhos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT,
  descricao TEXT,
  custo DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pecas table (jewelry pieces)
CREATE TABLE public.pecas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  material TEXT,
  peso DECIMAL(10,4),
  custo DECIMAL(10,2) DEFAULT 0,
  preco DECIMAL(10,2) DEFAULT 0,
  preco_revenda DECIMAL(10,2) DEFAULT 0,
  estoque INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  banho_id UUID REFERENCES public.banhos(id),
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create revendedoras (resellers) table using profiles reference
CREATE TABLE public.revendedoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cpf TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  comissao DECIMAL(5,2) DEFAULT 30,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maletas table (briefcases for resellers)
CREATE TABLE public.maletas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revendedora_id UUID REFERENCES public.revendedoras(id),
  codigo TEXT,
  status TEXT DEFAULT 'disponivel',
  data_emprestimo TIMESTAMP WITH TIME ZONE,
  data_devolucao_prevista TIMESTAMP WITH TIME ZONE,
  data_devolucao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maleta_itens table
CREATE TABLE public.maleta_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maleta_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
  peca_id UUID REFERENCES public.pecas(id),
  quantidade INTEGER DEFAULT 1,
  preco_unitario DECIMAL(10,2),
  status TEXT DEFAULT 'disponivel',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendas table (sales)
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nome TEXT,
  total DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  forma_pagamento TEXT,
  status TEXT DEFAULT 'concluida',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create venda_itens table
CREATE TABLE public.venda_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  peca_id UUID REFERENCES public.pecas(id),
  peca_nome TEXT,
  quantidade INTEGER DEFAULT 1,
  preco_unitario DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create romaneios table (consignment records)
CREATE TABLE public.romaneios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reseller_id UUID REFERENCES public.revendedoras(id),
  reseller_nome TEXT,
  maleta_id UUID REFERENCES public.maletas(id),
  cliente_nome TEXT,
  total DECIMAL(10,2) DEFAULT 0,
  comissao DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  data TIMESTAMP WITH TIME ZONE DEFAULT now(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create romaneio_itens table
CREATE TABLE public.romaneio_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  romaneio_id UUID NOT NULL REFERENCES public.romaneios(id) ON DELETE CASCADE,
  peca_id UUID REFERENCES public.pecas(id),
  peca_nome TEXT,
  quantidade INTEGER DEFAULT 1,
  preco_unitario DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create catalogos table
CREATE TABLE public.catalogos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  slug TEXT UNIQUE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create catalogo_pecas table (junction)
CREATE TABLE public.catalogo_pecas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalogo_id UUID NOT NULL REFERENCES public.catalogos(id) ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  preco_catalogo DECIMAL(10,2),
  destaque BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(catalogo_id, peca_id)
);

-- Create pedidos_catalogo table (catalog orders)
CREATE TABLE public.pedidos_catalogo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalogo_id UUID REFERENCES public.catalogos(id),
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_email TEXT,
  endereco TEXT,
  total DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pedidos_catalogo_itens table
CREATE TABLE public.pedidos_catalogo_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos_catalogo(id) ON DELETE CASCADE,
  peca_id UUID REFERENCES public.pecas(id),
  peca_nome TEXT,
  quantidade INTEGER DEFAULT 1,
  preco_unitario DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create metas table (goals)
CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'faturamento',
  valor DECIMAL(10,2) DEFAULT 0,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tipo, mes, ano)
);

-- Create notificacoes table
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  entidade_tipo TEXT,
  entidade_id TEXT,
  dados JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create historico_atividades table
CREATE TABLE public.historico_atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  entidade TEXT,
  entidade_id TEXT,
  usuario_id TEXT,
  usuario_nome TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  valor DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create caixa_sessoes table (cash register sessions)
CREATE TABLE public.caixa_sessoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valor_inicial DECIMAL(10,2) DEFAULT 0,
  valor_final DECIMAL(10,2),
  data_abertura TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'aberto',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revendedoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maleta_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneio_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_catalogo_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_sessoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for clientes
CREATE POLICY "Users can view their own clientes" ON public.clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clientes" ON public.clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clientes" ON public.clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clientes" ON public.clientes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for fornecedores
CREATE POLICY "Users can view their own fornecedores" ON public.fornecedores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own fornecedores" ON public.fornecedores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fornecedores" ON public.fornecedores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own fornecedores" ON public.fornecedores FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for banhos
CREATE POLICY "Users can view their own banhos" ON public.banhos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own banhos" ON public.banhos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own banhos" ON public.banhos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own banhos" ON public.banhos FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pecas
CREATE POLICY "Users can view their own pecas" ON public.pecas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pecas" ON public.pecas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pecas" ON public.pecas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pecas" ON public.pecas FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for revendedoras
CREATE POLICY "Users can view their own revendedoras" ON public.revendedoras FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own revendedoras" ON public.revendedoras FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own revendedoras" ON public.revendedoras FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own revendedoras" ON public.revendedoras FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for maletas
CREATE POLICY "Users can view their own maletas" ON public.maletas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own maletas" ON public.maletas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own maletas" ON public.maletas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own maletas" ON public.maletas FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for maleta_itens (through maletas)
CREATE POLICY "Users can view maleta_itens through maletas" ON public.maleta_itens FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.maletas WHERE maletas.id = maleta_itens.maleta_id AND maletas.user_id = auth.uid())
);
CREATE POLICY "Users can insert maleta_itens through maletas" ON public.maleta_itens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.maletas WHERE maletas.id = maleta_itens.maleta_id AND maletas.user_id = auth.uid())
);
CREATE POLICY "Users can update maleta_itens through maletas" ON public.maleta_itens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.maletas WHERE maletas.id = maleta_itens.maleta_id AND maletas.user_id = auth.uid())
);
CREATE POLICY "Users can delete maleta_itens through maletas" ON public.maleta_itens FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.maletas WHERE maletas.id = maleta_itens.maleta_id AND maletas.user_id = auth.uid())
);

-- RLS Policies for vendas
CREATE POLICY "Users can view their own vendas" ON public.vendas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vendas" ON public.vendas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vendas" ON public.vendas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vendas" ON public.vendas FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for venda_itens (through vendas)
CREATE POLICY "Users can view venda_itens through vendas" ON public.venda_itens FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.vendas WHERE vendas.id = venda_itens.venda_id AND vendas.user_id = auth.uid())
);
CREATE POLICY "Users can insert venda_itens through vendas" ON public.venda_itens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.vendas WHERE vendas.id = venda_itens.venda_id AND vendas.user_id = auth.uid())
);
CREATE POLICY "Users can update venda_itens through vendas" ON public.venda_itens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.vendas WHERE vendas.id = venda_itens.venda_id AND vendas.user_id = auth.uid())
);
CREATE POLICY "Users can delete venda_itens through vendas" ON public.venda_itens FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.vendas WHERE vendas.id = venda_itens.venda_id AND vendas.user_id = auth.uid())
);

-- RLS Policies for romaneios
CREATE POLICY "Users can view their own romaneios" ON public.romaneios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own romaneios" ON public.romaneios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own romaneios" ON public.romaneios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own romaneios" ON public.romaneios FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for romaneio_itens (through romaneios)
CREATE POLICY "Users can view romaneio_itens through romaneios" ON public.romaneio_itens FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.romaneios WHERE romaneios.id = romaneio_itens.romaneio_id AND romaneios.user_id = auth.uid())
);
CREATE POLICY "Users can insert romaneio_itens through romaneios" ON public.romaneio_itens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.romaneios WHERE romaneios.id = romaneio_itens.romaneio_id AND romaneios.user_id = auth.uid())
);
CREATE POLICY "Users can update romaneio_itens through romaneios" ON public.romaneio_itens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.romaneios WHERE romaneios.id = romaneio_itens.romaneio_id AND romaneios.user_id = auth.uid())
);
CREATE POLICY "Users can delete romaneio_itens through romaneios" ON public.romaneio_itens FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.romaneios WHERE romaneios.id = romaneio_itens.romaneio_id AND romaneios.user_id = auth.uid())
);

-- RLS Policies for catalogos
CREATE POLICY "Users can view their own catalogos" ON public.catalogos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own catalogos" ON public.catalogos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own catalogos" ON public.catalogos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own catalogos" ON public.catalogos FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active catalogos" ON public.catalogos FOR SELECT USING (ativo = true);

-- RLS Policies for catalogo_pecas (through catalogos)
CREATE POLICY "Users can view catalogo_pecas through catalogos" ON public.catalogo_pecas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.catalogos WHERE catalogos.id = catalogo_pecas.catalogo_id AND (catalogos.user_id = auth.uid() OR catalogos.ativo = true))
);
CREATE POLICY "Users can insert catalogo_pecas through catalogos" ON public.catalogo_pecas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.catalogos WHERE catalogos.id = catalogo_pecas.catalogo_id AND catalogos.user_id = auth.uid())
);
CREATE POLICY "Users can update catalogo_pecas through catalogos" ON public.catalogo_pecas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.catalogos WHERE catalogos.id = catalogo_pecas.catalogo_id AND catalogos.user_id = auth.uid())
);
CREATE POLICY "Users can delete catalogo_pecas through catalogos" ON public.catalogo_pecas FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.catalogos WHERE catalogos.id = catalogo_pecas.catalogo_id AND catalogos.user_id = auth.uid())
);

-- RLS Policies for pedidos_catalogo (public for customers to create orders)
CREATE POLICY "Anyone can view pedidos_catalogo" ON public.pedidos_catalogo FOR SELECT USING (true);
CREATE POLICY "Anyone can create pedidos_catalogo" ON public.pedidos_catalogo FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pedidos_catalogo" ON public.pedidos_catalogo FOR UPDATE USING (true);

-- RLS Policies for pedidos_catalogo_itens
CREATE POLICY "Anyone can view pedidos_catalogo_itens" ON public.pedidos_catalogo_itens FOR SELECT USING (true);
CREATE POLICY "Anyone can create pedidos_catalogo_itens" ON public.pedidos_catalogo_itens FOR INSERT WITH CHECK (true);

-- RLS Policies for metas
CREATE POLICY "Users can view their own metas" ON public.metas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own metas" ON public.metas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own metas" ON public.metas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own metas" ON public.metas FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notificacoes
CREATE POLICY "Users can view their own notificacoes" ON public.notificacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notificacoes" ON public.notificacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notificacoes" ON public.notificacoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notificacoes" ON public.notificacoes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for historico_atividades
CREATE POLICY "Users can view historico_atividades" ON public.historico_atividades FOR SELECT USING (true);
CREATE POLICY "Users can insert historico_atividades" ON public.historico_atividades FOR INSERT WITH CHECK (true);

-- RLS Policies for caixa_sessoes
CREATE POLICY "Users can view their own caixa_sessoes" ON public.caixa_sessoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own caixa_sessoes" ON public.caixa_sessoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own caixa_sessoes" ON public.caixa_sessoes FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to call the function on new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_banhos_updated_at BEFORE UPDATE ON public.banhos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pecas_updated_at BEFORE UPDATE ON public.pecas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_revendedoras_updated_at BEFORE UPDATE ON public.revendedoras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maletas_updated_at BEFORE UPDATE ON public.maletas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_romaneios_updated_at BEFORE UPDATE ON public.romaneios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_catalogos_updated_at BEFORE UPDATE ON public.catalogos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pedidos_catalogo_updated_at BEFORE UPDATE ON public.pedidos_catalogo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON public.metas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to create notifications
CREATE OR REPLACE FUNCTION public.criar_notificacao(
  p_user_id UUID,
  p_tipo TEXT,
  p_titulo TEXT,
  p_mensagem TEXT,
  p_entidade_tipo TEXT DEFAULT NULL,
  p_entidade_id TEXT DEFAULT NULL,
  p_dados JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, entidade_tipo, entidade_id, dados)
  VALUES (p_user_id, p_tipo, p_titulo, p_mensagem, p_entidade_tipo, p_entidade_id, p_dados)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;