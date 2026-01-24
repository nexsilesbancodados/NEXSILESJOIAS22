-- =============================================
-- NEXSILES - MIGRAÇÃO COMPLETA DO BANCO DE DADOS
-- =============================================

-- 1. ENUM PARA ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'vendedor', 'revendedora');

-- 2. FUNÇÃO PARA ATUALIZAR UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. TABELA DE PROFILES (dados adicionais do usuário)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE ROLES
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- 5. FUNÇÃO HAS_ROLE (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. TABELA FORNECEDORES
CREATE TABLE public.fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cnpj TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA PEÇAS
CREATE TABLE public.pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE,
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT,
    subcategoria TEXT,
    material TEXT,
    peso NUMERIC(10, 3),
    preco_custo NUMERIC(10, 2),
    preco_venda NUMERIC(10, 2),
    preco_revenda NUMERIC(10, 2),
    estoque INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 0,
    fornecedor_id UUID REFERENCES public.fornecedores(id),
    imagem_url TEXT,
    codigo_barras TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA CLIENTES
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cpf TEXT,
    email TEXT,
    telefone TEXT,
    whatsapp TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    data_nascimento DATE,
    observacoes TEXT,
    pontos_fidelidade INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA REVENDEDORAS
CREATE TABLE public.revendedoras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    cpf TEXT,
    email TEXT,
    telefone TEXT,
    whatsapp TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    data_nascimento DATE,
    comissao_percentual NUMERIC(5, 2) DEFAULT 30.00,
    saldo_comissao NUMERIC(10, 2) DEFAULT 0,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABELA MALETAS
CREATE TABLE public.maletas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE,
    nome TEXT NOT NULL,
    descricao TEXT,
    revendedora_id UUID REFERENCES public.revendedoras(id),
    data_entrega DATE,
    data_devolucao DATE,
    valor_total NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'ativa',
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABELA MALETAS_PECAS (itens da maleta)
CREATE TABLE public.maletas_pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maleta_id UUID NOT NULL REFERENCES public.maletas(id) ON DELETE CASCADE,
    peca_id UUID NOT NULL REFERENCES public.pecas(id),
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10, 2),
    vendida BOOLEAN DEFAULT FALSE,
    data_venda DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(maleta_id, peca_id)
);

-- 12. TABELA VENDAS
CREATE TABLE public.vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT UNIQUE,
    cliente_id UUID REFERENCES public.clientes(id),
    revendedora_id UUID REFERENCES public.revendedoras(id),
    vendedor_id UUID REFERENCES auth.users(id),
    data_venda TIMESTAMPTZ DEFAULT NOW(),
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    desconto NUMERIC(10, 2) DEFAULT 0,
    desconto_percentual NUMERIC(5, 2) DEFAULT 0,
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    forma_pagamento TEXT,
    parcelas INTEGER DEFAULT 1,
    status TEXT DEFAULT 'finalizada',
    observacoes TEXT,
    cupom_desconto TEXT,
    pontos_utilizados INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TABELA VENDAS_PECAS (itens da venda)
CREATE TABLE public.vendas_pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
    peca_id UUID NOT NULL REFERENCES public.pecas(id),
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    desconto NUMERIC(10, 2) DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. TABELA ROMANEIOS (entregas)
CREATE TABLE public.romaneios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT UNIQUE,
    revendedora_id UUID REFERENCES public.revendedoras(id),
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    data_entrega DATE,
    data_previsao DATE,
    status TEXT DEFAULT 'pendente',
    endereco_entrega TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    valor_frete NUMERIC(10, 2) DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. TABELA ROMANEIOS_PECAS
CREATE TABLE public.romaneios_pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    romaneio_id UUID NOT NULL REFERENCES public.romaneios(id) ON DELETE CASCADE,
    peca_id UUID NOT NULL REFERENCES public.pecas(id),
    quantidade INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. TABELA CATÁLOGOS
CREATE TABLE public.catalogos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    slug TEXT UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    data_validade DATE,
    imagem_capa TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. TABELA CATALOGOS_PECAS
CREATE TABLE public.catalogos_pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalogo_id UUID NOT NULL REFERENCES public.catalogos(id) ON DELETE CASCADE,
    peca_id UUID NOT NULL REFERENCES public.pecas(id),
    ordem INTEGER DEFAULT 0,
    destaque BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(catalogo_id, peca_id)
);

-- 18. TABELA CAMPANHAS
CREATE TABLE public.campanhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT,
    data_inicio DATE,
    data_fim DATE,
    desconto_percentual NUMERIC(5, 2),
    meta_valor NUMERIC(10, 2),
    premio TEXT,
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. TABELA METAS
CREATE TABLE public.metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT,
    valor_meta NUMERIC(10, 2) NOT NULL,
    valor_atual NUMERIC(10, 2) DEFAULT 0,
    data_inicio DATE,
    data_fim DATE,
    revendedora_id UUID REFERENCES public.revendedoras(id),
    campanha_id UUID REFERENCES public.campanhas(id),
    atingida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. TABELA NOTIFICAÇÕES
CREATE TABLE public.notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensagem TEXT,
    tipo TEXT DEFAULT 'info',
    lida BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. TABELA HISTÓRICO DE ATIVIDADES
CREATE TABLE public.historico_atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tabela TEXT NOT NULL,
    registro_id UUID,
    acao TEXT NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. TABELA BANHOS GALVÂNICOS
CREATE TABLE public.banhos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tipo TEXT,
    descricao TEXT,
    custo_por_grama NUMERIC(10, 4),
    tempo_medio_minutos INTEGER,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. TABELA FUNCIONÁRIOS
CREATE TABLE public.funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    cpf TEXT,
    email TEXT,
    telefone TEXT,
    cargo TEXT,
    salario NUMERIC(10, 2),
    data_admissao DATE,
    data_demissao DATE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. TABELA FIDELIDADE (pontos)
CREATE TABLE public.fidelidade_transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    venda_id UUID REFERENCES public.vendas(id),
    pontos INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. TABELA HISTÓRICO DE PREÇOS
CREATE TABLE public.historico_precos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    peca_id UUID NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
    preco_anterior NUMERIC(10, 2),
    preco_novo NUMERIC(10, 2),
    tipo_preco TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. TABELA PEDIDOS CATÁLOGO
CREATE TABLE public.pedidos_catalogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalogo_id UUID REFERENCES public.catalogos(id),
    cliente_nome TEXT NOT NULL,
    cliente_telefone TEXT,
    cliente_email TEXT,
    status TEXT DEFAULT 'pendente',
    observacoes TEXT,
    valor_total NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. TABELA PEDIDOS_CATALOGO_ITENS
CREATE TABLE public.pedidos_catalogo_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos_catalogo(id) ON DELETE CASCADE,
    peca_id UUID NOT NULL REFERENCES public.pecas(id),
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. TABELA CONFIGURAÇÕES
CREATE TABLE public.configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave TEXT UNIQUE NOT NULL,
    valor TEXT,
    tipo TEXT DEFAULT 'string',
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pecas_updated_at BEFORE UPDATE ON public.pecas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revendedoras_updated_at BEFORE UPDATE ON public.revendedoras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maletas_updated_at BEFORE UPDATE ON public.maletas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maletas_pecas_updated_at BEFORE UPDATE ON public.maletas_pecas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_romaneios_updated_at BEFORE UPDATE ON public.romaneios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_catalogos_updated_at BEFORE UPDATE ON public.catalogos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON public.campanhas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON public.metas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banhos_updated_at BEFORE UPDATE ON public.banhos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedidos_catalogo_updated_at BEFORE UPDATE ON public.pedidos_catalogo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON public.configuracoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revendedoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maletas_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneios_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogos_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelidade_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_precos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_catalogo_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- USER_ROLES (apenas admins podem gerenciar)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- FORNECEDORES (autenticados podem ver, admin/gerente podem editar)
CREATE POLICY "Authenticated can view fornecedores" ON public.fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage fornecedores" ON public.fornecedores FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- PEÇAS (autenticados podem ver, admin/gerente podem editar)
CREATE POLICY "Authenticated can view pecas" ON public.pecas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage pecas" ON public.pecas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- CLIENTES (autenticados podem ver e gerenciar)
CREATE POLICY "Authenticated can view clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage clientes" ON public.clientes FOR ALL TO authenticated USING (true);

-- REVENDEDORAS
CREATE POLICY "Authenticated can view revendedoras" ON public.revendedoras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Revendedora can view own" ON public.revendedoras FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage revendedoras" ON public.revendedoras FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- MALETAS
CREATE POLICY "Authenticated can view maletas" ON public.maletas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage maletas" ON public.maletas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- MALETAS_PECAS
CREATE POLICY "Authenticated can view maletas_pecas" ON public.maletas_pecas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage maletas_pecas" ON public.maletas_pecas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- VENDAS
CREATE POLICY "Authenticated can view vendas" ON public.vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create vendas" ON public.vendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage vendas" ON public.vendas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- VENDAS_PECAS
CREATE POLICY "Authenticated can view vendas_pecas" ON public.vendas_pecas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create vendas_pecas" ON public.vendas_pecas FOR INSERT TO authenticated WITH CHECK (true);

-- ROMANEIOS
CREATE POLICY "Authenticated can view romaneios" ON public.romaneios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage romaneios" ON public.romaneios FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- ROMANEIOS_PECAS
CREATE POLICY "Authenticated can view romaneios_pecas" ON public.romaneios_pecas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage romaneios_pecas" ON public.romaneios_pecas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- CATÁLOGOS (públicos para visualização)
CREATE POLICY "Anyone can view active catalogos" ON public.catalogos FOR SELECT USING (ativo = true);
CREATE POLICY "Authenticated can view all catalogos" ON public.catalogos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage catalogos" ON public.catalogos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- CATALOGOS_PECAS
CREATE POLICY "Anyone can view catalogos_pecas" ON public.catalogos_pecas FOR SELECT USING (true);
CREATE POLICY "Admins can manage catalogos_pecas" ON public.catalogos_pecas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- CAMPANHAS
CREATE POLICY "Authenticated can view campanhas" ON public.campanhas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage campanhas" ON public.campanhas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- METAS
CREATE POLICY "Authenticated can view metas" ON public.metas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage metas" ON public.metas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- NOTIFICAÇÕES
CREATE POLICY "Users can view own notificacoes" ON public.notificacoes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notificacoes" ON public.notificacoes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can create notificacoes" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true);

-- HISTÓRICO
CREATE POLICY "Admins can view historico" ON public.historico_atividades FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can create historico" ON public.historico_atividades FOR INSERT TO authenticated WITH CHECK (true);

-- BANHOS
CREATE POLICY "Authenticated can view banhos" ON public.banhos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage banhos" ON public.banhos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- FUNCIONÁRIOS
CREATE POLICY "Admins can view funcionarios" ON public.funcionarios FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));
CREATE POLICY "Admins can manage funcionarios" ON public.funcionarios FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- FIDELIDADE
CREATE POLICY "Authenticated can view fidelidade" ON public.fidelidade_transacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage fidelidade" ON public.fidelidade_transacoes FOR ALL TO authenticated USING (true);

-- HISTÓRICO PREÇOS
CREATE POLICY "Authenticated can view historico_precos" ON public.historico_precos FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can create historico_precos" ON public.historico_precos FOR INSERT TO authenticated WITH CHECK (true);

-- PEDIDOS CATÁLOGO (públicos para criação)
CREATE POLICY "Anyone can view pedidos_catalogo" ON public.pedidos_catalogo FOR SELECT USING (true);
CREATE POLICY "Anyone can create pedidos_catalogo" ON public.pedidos_catalogo FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage pedidos_catalogo" ON public.pedidos_catalogo FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

-- PEDIDOS_CATALOGO_ITENS
CREATE POLICY "Anyone can view pedidos_catalogo_itens" ON public.pedidos_catalogo_itens FOR SELECT USING (true);
CREATE POLICY "Anyone can create pedidos_catalogo_itens" ON public.pedidos_catalogo_itens FOR INSERT WITH CHECK (true);

-- CONFIGURAÇÕES
CREATE POLICY "Authenticated can view configuracoes" ON public.configuracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage configuracoes" ON public.configuracoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_pecas_codigo ON public.pecas(codigo);
CREATE INDEX idx_pecas_codigo_barras ON public.pecas(codigo_barras);
CREATE INDEX idx_pecas_fornecedor ON public.pecas(fornecedor_id);
CREATE INDEX idx_clientes_cpf ON public.clientes(cpf);
CREATE INDEX idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX idx_vendas_data ON public.vendas(data_venda);
CREATE INDEX idx_vendas_cliente ON public.vendas(cliente_id);
CREATE INDEX idx_vendas_revendedora ON public.vendas(revendedora_id);
CREATE INDEX idx_maletas_revendedora ON public.maletas(revendedora_id);
CREATE INDEX idx_romaneios_revendedora ON public.romaneios(revendedora_id);
CREATE INDEX idx_notificacoes_user ON public.notificacoes(user_id);
CREATE INDEX idx_historico_user ON public.historico_atividades(user_id);
CREATE INDEX idx_historico_tabela ON public.historico_atividades(tabela);
CREATE INDEX idx_catalogos_slug ON public.catalogos(slug);