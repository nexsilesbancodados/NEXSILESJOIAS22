-- =============================================
-- SISTEMA DE JOIAS - ESTRUTURA COMPLETA
-- =============================================

-- 1. TABELA DE PERFIS (profiles)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'revendedora')),
  avatar_url TEXT,
  comissao DECIMAL(5,2) DEFAULT 10.00,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todos os perfis" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. TABELA DE FORNECEDORES
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus fornecedores" ON public.fornecedores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar fornecedores" ON public.fornecedores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus fornecedores" ON public.fornecedores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus fornecedores" ON public.fornecedores FOR DELETE USING (auth.uid() = user_id);

-- 3. TABELA DE PEÇAS (produtos/joias)
CREATE TABLE public.pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  subcategoria TEXT,
  material TEXT,
  peso DECIMAL(10,3),
  preco_custo DECIMAL(10,2) NOT NULL DEFAULT 0,
  preco_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
  estoque INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 1,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  imagem_url TEXT,
  codigo_barras TEXT,
  localizacao TEXT,
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas peças" ON public.pecas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar peças" ON public.pecas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas peças" ON public.pecas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas peças" ON public.pecas FOR DELETE USING (auth.uid() = user_id);

-- 4. TABELA DE CLIENTES
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  data_nascimento DATE,
  observacoes TEXT,
  pontos_fidelidade INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus clientes" ON public.clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar clientes" ON public.clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus clientes" ON public.clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus clientes" ON public.clientes FOR DELETE USING (auth.uid() = user_id);

-- 5. TABELA DE MALETAS
CREATE TABLE public.maletas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  revendedora_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'em_acerto')),
  data_envio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_retorno TIMESTAMP WITH TIME ZONE,
  prazo_retorno TIMESTAMP WITH TIME ZONE,
  valor_total DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.maletas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas maletas" ON public.maletas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar maletas" ON public.maletas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas maletas" ON public.maletas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas maletas" ON public.maletas FOR DELETE USING (auth.uid() = user_id);

-- 6. TABELA DE ITENS DA MALETA
CREATE TABLE public.maleta_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maleta_id UUID REFERENCES public.maletas(id) ON DELETE CASCADE NOT NULL,
  peca_id UUID REFERENCES public.pecas(id) ON DELETE CASCADE NOT NULL,
  quantidade INTEGER DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'vendido', 'devolvido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.maleta_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver itens das suas maletas" ON public.maleta_itens FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.maletas WHERE maletas.id = maleta_itens.maleta_id AND maletas.user_id = auth.uid()));
CREATE POLICY "Usuários podem criar itens nas suas maletas" ON public.maleta_itens FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.maletas WHERE maletas.id = maleta_itens.maleta_id AND maletas.user_id = auth.uid()));
CREATE POLICY "Usuários podem atualizar itens das suas maletas" ON public.maleta_itens FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.maletas WHERE maletas.id = maleta_itens.maleta_id AND maletas.user_id = auth.uid()));
CREATE POLICY "Usuários podem deletar itens das suas maletas" ON public.maleta_itens FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.maletas WHERE maletas.id = maleta_itens.maleta_id AND maletas.user_id = auth.uid()));

-- 7. TABELA DE SESSÕES DE CAIXA
CREATE TABLE public.caixa_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_abertura TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  data_fechamento TIMESTAMP WITH TIME ZONE,
  fundo_troco DECIMAL(10,2) DEFAULT 0,
  valor_final DECIMAL(10,2),
  status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.caixa_sessoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas sessões de caixa" ON public.caixa_sessoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar sessões de caixa" ON public.caixa_sessoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas sessões de caixa" ON public.caixa_sessoes FOR UPDATE USING (auth.uid() = user_id);

-- 8. TABELA DE VENDAS
CREATE TABLE public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER GENERATED ALWAYS AS IDENTITY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT,
  revendedora_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  caixa_sessao_id UUID REFERENCES public.caixa_sessoes(id) ON DELETE SET NULL,
  maleta_id UUID REFERENCES public.maletas(id) ON DELETE SET NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  tipo TEXT DEFAULT 'pdv' CHECK (tipo IN ('pdv', 'revendedora', 'catalogo')),
  status TEXT DEFAULT 'finalizada' CHECK (status IN ('pendente', 'finalizada', 'cancelada')),
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas vendas" ON public.vendas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar vendas" ON public.vendas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas vendas" ON public.vendas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas vendas" ON public.vendas FOR DELETE USING (auth.uid() = user_id);

-- 9. TABELA DE ITENS DA VENDA
CREATE TABLE public.venda_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE NOT NULL,
  peca_id UUID REFERENCES public.pecas(id) ON DELETE SET NULL,
  peca_nome TEXT NOT NULL,
  quantidade INTEGER DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.venda_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver itens das suas vendas" ON public.venda_itens FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.vendas WHERE vendas.id = venda_itens.venda_id AND vendas.user_id = auth.uid()));
CREATE POLICY "Usuários podem criar itens nas suas vendas" ON public.venda_itens FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendas WHERE vendas.id = venda_itens.venda_id AND vendas.user_id = auth.uid()));

-- 10. TABELA DE PAGAMENTOS
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('dinheiro', 'pix', 'credito', 'debito', 'boleto', 'transferencia')),
  valor DECIMAL(10,2) NOT NULL,
  parcelas INTEGER DEFAULT 1,
  bandeira TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver pagamentos das suas vendas" ON public.pagamentos FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.vendas WHERE vendas.id = pagamentos.venda_id AND vendas.user_id = auth.uid()));
CREATE POLICY "Usuários podem criar pagamentos" ON public.pagamentos FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendas WHERE vendas.id = pagamentos.venda_id AND vendas.user_id = auth.uid()));

-- 11. TABELA DE ROMANEIOS
CREATE TABLE public.romaneios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER GENERATED ALWAYS AS IDENTITY,
  reseller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revendedora_nome TEXT,
  cliente_nome TEXT,
  maleta_id UUID REFERENCES public.maletas(id) ON DELETE SET NULL,
  total DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'entregue')),
  data_entrega TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus romaneios" ON public.romaneios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar romaneios" ON public.romaneios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus romaneios" ON public.romaneios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus romaneios" ON public.romaneios FOR DELETE USING (auth.uid() = user_id);

-- 12. TABELA DE ITENS DO ROMANEIO
CREATE TABLE public.romaneio_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  romaneio_id UUID REFERENCES public.romaneios(id) ON DELETE CASCADE NOT NULL,
  peca_id UUID REFERENCES public.pecas(id) ON DELETE SET NULL,
  peca_nome TEXT NOT NULL,
  quantidade INTEGER DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.romaneio_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver itens dos seus romaneios" ON public.romaneio_itens FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.romaneios WHERE romaneios.id = romaneio_itens.romaneio_id AND romaneios.user_id = auth.uid()));
CREATE POLICY "Usuários podem criar itens nos seus romaneios" ON public.romaneio_itens FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.romaneios WHERE romaneios.id = romaneio_itens.romaneio_id AND romaneios.user_id = auth.uid()));

-- 13. TABELA DE CATÁLOGOS
CREATE TABLE public.catalogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  slug TEXT UNIQUE,
  ativo BOOLEAN DEFAULT true,
  publico BOOLEAN DEFAULT true,
  imagem_capa TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.catalogos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catálogos públicos são visíveis para todos" ON public.catalogos FOR SELECT USING (publico = true OR auth.uid() = user_id);
CREATE POLICY "Usuários podem criar catálogos" ON public.catalogos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus catálogos" ON public.catalogos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus catálogos" ON public.catalogos FOR DELETE USING (auth.uid() = user_id);

-- 14. TABELA DE PEÇAS DO CATÁLOGO
CREATE TABLE public.catalogo_pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo_id UUID REFERENCES public.catalogos(id) ON DELETE CASCADE NOT NULL,
  peca_id UUID REFERENCES public.pecas(id) ON DELETE CASCADE NOT NULL,
  ordem INTEGER DEFAULT 0,
  destaque BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(catalogo_id, peca_id)
);

ALTER TABLE public.catalogo_pecas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Peças de catálogos públicos são visíveis" ON public.catalogo_pecas FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.catalogos WHERE catalogos.id = catalogo_pecas.catalogo_id AND (catalogos.publico = true OR catalogos.user_id = auth.uid())));
CREATE POLICY "Usuários podem adicionar peças aos seus catálogos" ON public.catalogo_pecas FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.catalogos WHERE catalogos.id = catalogo_pecas.catalogo_id AND catalogos.user_id = auth.uid()));
CREATE POLICY "Usuários podem atualizar peças dos seus catálogos" ON public.catalogo_pecas FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.catalogos WHERE catalogos.id = catalogo_pecas.catalogo_id AND catalogos.user_id = auth.uid()));
CREATE POLICY "Usuários podem remover peças dos seus catálogos" ON public.catalogo_pecas FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.catalogos WHERE catalogos.id = catalogo_pecas.catalogo_id AND catalogos.user_id = auth.uid()));

-- 15. TABELA DE PEDIDOS DO CATÁLOGO
CREATE TABLE public.pedidos_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo_id UUID REFERENCES public.catalogos(id) ON DELETE SET NULL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  total DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'enviado', 'entregue', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.pedidos_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pedidos são visíveis para donos do catálogo" ON public.pedidos_catalogo FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.catalogos WHERE catalogos.id = pedidos_catalogo.catalogo_id AND catalogos.user_id = auth.uid()));
CREATE POLICY "Qualquer um pode criar pedidos" ON public.pedidos_catalogo FOR INSERT WITH CHECK (true);
CREATE POLICY "Donos podem atualizar pedidos" ON public.pedidos_catalogo FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.catalogos WHERE catalogos.id = pedidos_catalogo.catalogo_id AND catalogos.user_id = auth.uid()));
CREATE POLICY "Donos podem deletar pedidos" ON public.pedidos_catalogo FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.catalogos WHERE catalogos.id = pedidos_catalogo.catalogo_id AND catalogos.user_id = auth.uid()));

-- 16. TABELA DE ITENS DO PEDIDO
CREATE TABLE public.pedidos_catalogo_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES public.pedidos_catalogo(id) ON DELETE CASCADE NOT NULL,
  peca_id UUID REFERENCES public.pecas(id) ON DELETE SET NULL,
  peca_nome TEXT NOT NULL,
  quantidade INTEGER DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.pedidos_catalogo_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Itens visíveis para donos do catálogo" ON public.pedidos_catalogo_itens FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.pedidos_catalogo pc 
    JOIN public.catalogos c ON c.id = pc.catalogo_id 
    WHERE pc.id = pedidos_catalogo_itens.pedido_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "Qualquer um pode criar itens de pedido" ON public.pedidos_catalogo_itens FOR INSERT WITH CHECK (true);

-- 17. TABELA DE BANHOS (galvânica)
CREATE TABLE public.banhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT,
  cor TEXT,
  preco_por_grama DECIMAL(10,4) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.banhos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus banhos" ON public.banhos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar banhos" ON public.banhos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus banhos" ON public.banhos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus banhos" ON public.banhos FOR DELETE USING (auth.uid() = user_id);

-- 18. TABELA DE ENVIOS PARA GALVÂNICA
CREATE TABLE public.envios_galvanica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_envio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_retorno TIMESTAMP WITH TIME ZONE,
  banho_id UUID REFERENCES public.banhos(id) ON DELETE SET NULL,
  peso_total DECIMAL(10,3) DEFAULT 0,
  valor_total DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'enviado' CHECK (status IN ('enviado', 'em_processo', 'finalizado', 'retornado')),
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.envios_galvanica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus envios" ON public.envios_galvanica FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar envios" ON public.envios_galvanica FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus envios" ON public.envios_galvanica FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus envios" ON public.envios_galvanica FOR DELETE USING (auth.uid() = user_id);

-- 19. TABELA DE HISTÓRICO DE ATIVIDADES
CREATE TABLE public.historico_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  entidade TEXT,
  entidade_id TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nome TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  valor DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.historico_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu histórico" ON public.historico_atividades FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem criar histórico" ON public.historico_atividades FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- 20. TABELA DE NOTIFICAÇÕES
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  entidade_tipo TEXT,
  entidade_id TEXT,
  dados JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas notificações" ON public.notificacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar notificações" ON public.notificacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas notificações" ON public.notificacoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas notificações" ON public.notificacoes FOR DELETE USING (auth.uid() = user_id);

-- 21. TABELA DE METAS
CREATE TABLE public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('faturamento', 'vendas', 'clientes', 'pecas')),
  valor DECIMAL(10,2) NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(tipo, mes, ano, user_id)
);

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas metas" ON public.metas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar metas" ON public.metas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas metas" ON public.metas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas metas" ON public.metas FOR DELETE USING (auth.uid() = user_id);

-- 22. TABELA DE CONFIGURAÇÕES
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL,
  valor TEXT,
  tipo TEXT DEFAULT 'string',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(chave, user_id)
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas configurações" ON public.configuracoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar configurações" ON public.configuracoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas configurações" ON public.configuracoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas configurações" ON public.configuracoes FOR DELETE USING (auth.uid() = user_id);

-- 23. TABELA DE MODELOS DE ETIQUETAS
CREATE TABLE public.modelos_etiquetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  largura DECIMAL(6,2) NOT NULL,
  altura DECIMAL(6,2) NOT NULL,
  campos JSONB DEFAULT '[]'::jsonb,
  padrao BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.modelos_etiquetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus modelos" ON public.modelos_etiquetas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar modelos" ON public.modelos_etiquetas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus modelos" ON public.modelos_etiquetas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus modelos" ON public.modelos_etiquetas FOR DELETE USING (auth.uid() = user_id);

-- 24. TABELA DE MOVIMENTOS DE CAIXA
CREATE TABLE public.movimentos_caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caixa_sessao_id UUID REFERENCES public.caixa_sessoes(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('sangria', 'suprimento')),
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.movimentos_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver movimentos do seu caixa" ON public.movimentos_caixa FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.caixa_sessoes WHERE caixa_sessoes.id = movimentos_caixa.caixa_sessao_id AND caixa_sessoes.user_id = auth.uid()));
CREATE POLICY "Usuários podem criar movimentos" ON public.movimentos_caixa FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.caixa_sessoes WHERE caixa_sessoes.id = movimentos_caixa.caixa_sessao_id AND caixa_sessoes.user_id = auth.uid()));

-- FUNÇÃO PARA ATUALIZAR UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pecas_updated_at BEFORE UPDATE ON public.pecas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maletas_updated_at BEFORE UPDATE ON public.maletas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_romaneios_updated_at BEFORE UPDATE ON public.romaneios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_catalogos_updated_at BEFORE UPDATE ON public.catalogos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pedidos_catalogo_updated_at BEFORE UPDATE ON public.pedidos_catalogo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON public.configuracoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER PARA CRIAR PERFIL EM NOVO USUÁRIO
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_pecas_codigo ON public.pecas(codigo);
CREATE INDEX idx_pecas_categoria ON public.pecas(categoria);
CREATE INDEX idx_pecas_user_id ON public.pecas(user_id);
CREATE INDEX idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX idx_vendas_user_id ON public.vendas(user_id);
CREATE INDEX idx_vendas_created_at ON public.vendas(created_at);
CREATE INDEX idx_romaneios_user_id ON public.romaneios(user_id);
CREATE INDEX idx_maletas_user_id ON public.maletas(user_id);
CREATE INDEX idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX idx_catalogos_slug ON public.catalogos(slug);