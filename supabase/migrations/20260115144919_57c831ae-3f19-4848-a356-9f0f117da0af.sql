-- Adicionar user_id às tabelas que precisam de isolamento por proprietário

-- 1. CLIENTES - adicionar user_id
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);

-- 2. PECAS - adicionar user_id  
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);

-- 3. FORNECEDORES - adicionar user_id
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);

-- 4. CONFIGURACOES - adicionar user_id
ALTER TABLE public.configuracoes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);

-- 5. METAS - adicionar user_id se não existir
-- (já tem user_id na tabela metas conforme hooks)

-- Atualizar dados existentes para associar ao primeiro admin
UPDATE public.clientes SET user_id = (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.pecas SET user_id = (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.fornecedores SET user_id = (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.configuracoes SET user_id = (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1) WHERE user_id IS NULL;

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS PARA CLIENTES
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Only admins can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Only admins can delete clientes" ON public.clientes;

CREATE POLICY "Users see own clientes"
  ON public.clientes FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own clientes"
  ON public.clientes FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can delete own clientes"
  ON public.clientes FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS PARA PECAS
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view pecas" ON public.pecas;
DROP POLICY IF EXISTS "Only admins can insert pecas" ON public.pecas;
DROP POLICY IF EXISTS "Only admins can update pecas" ON public.pecas;
DROP POLICY IF EXISTS "Only admins can delete pecas" ON public.pecas;

CREATE POLICY "Users see own pecas"
  ON public.pecas FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own pecas"
  ON public.pecas FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own pecas"
  ON public.pecas FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can delete own pecas"
  ON public.pecas FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS PARA FORNECEDORES
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Only admins can insert fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Only admins can update fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Only admins can delete fornecedores" ON public.fornecedores;

CREATE POLICY "Users see own fornecedores"
  ON public.fornecedores FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own fornecedores"
  ON public.fornecedores FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own fornecedores"
  ON public.fornecedores FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can delete own fornecedores"
  ON public.fornecedores FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS PARA CONFIGURACOES
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Only admins can insert configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Only admins can update configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Only admins can delete configuracoes" ON public.configuracoes;

CREATE POLICY "Users see own configuracoes"
  ON public.configuracoes FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own configuracoes"
  ON public.configuracoes FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own configuracoes"
  ON public.configuracoes FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can delete own configuracoes"
  ON public.configuracoes FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- =====================================================
-- ATUALIZAR POLÍTICAS RLS PARA CATALOGOS (já tem user_id)
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view catalogos" ON public.catalogos;
DROP POLICY IF EXISTS "Only admins can create catalogos" ON public.catalogos;
DROP POLICY IF EXISTS "Only admins can update catalogos" ON public.catalogos;
DROP POLICY IF EXISTS "Only admins can delete catalogos" ON public.catalogos;

CREATE POLICY "Users see own catalogos"
  ON public.catalogos FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own catalogos"
  ON public.catalogos FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own catalogos"
  ON public.catalogos FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can delete own catalogos"
  ON public.catalogos FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- =====================================================
-- ATUALIZAR POLÍTICAS PARA CATALOGO_ITENS (via catalogo)
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view catalogo_itens" ON public.catalogo_itens;
DROP POLICY IF EXISTS "Only admins can create catalogo_itens" ON public.catalogo_itens;
DROP POLICY IF EXISTS "Only admins can update catalogo_itens" ON public.catalogo_itens;
DROP POLICY IF EXISTS "Only admins can delete catalogo_itens" ON public.catalogo_itens;

CREATE POLICY "Users see catalogo_itens from own catalogos"
  ON public.catalogo_itens FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.catalogos 
    WHERE catalogos.id = catalogo_itens.catalogo_id 
    AND (catalogos.user_id = auth.uid() OR is_admin())
  ));

CREATE POLICY "Users can insert catalogo_itens in own catalogos"
  ON public.catalogo_itens FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.catalogos 
    WHERE catalogos.id = catalogo_itens.catalogo_id 
    AND (catalogos.user_id = auth.uid() OR is_admin())
  ));

CREATE POLICY "Users can update catalogo_itens in own catalogos"
  ON public.catalogo_itens FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.catalogos 
    WHERE catalogos.id = catalogo_itens.catalogo_id 
    AND (catalogos.user_id = auth.uid() OR is_admin())
  ));

CREATE POLICY "Users can delete catalogo_itens in own catalogos"
  ON public.catalogo_itens FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.catalogos 
    WHERE catalogos.id = catalogo_itens.catalogo_id 
    AND (catalogos.user_id = auth.uid() OR is_admin())
  ));

-- =====================================================
-- ATUALIZAR POLÍTICAS PARA PEDIDOS_CATALOGO (via catalogo)
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view catalog orders" ON public.pedidos_catalogo;
DROP POLICY IF EXISTS "Authenticated users can update catalog orders" ON public.pedidos_catalogo;
DROP POLICY IF EXISTS "Authenticated users can delete catalog orders" ON public.pedidos_catalogo;

CREATE POLICY "Users see pedidos from own catalogos"
  ON public.pedidos_catalogo FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.catalogos 
    WHERE catalogos.id = pedidos_catalogo.catalogo_id 
    AND (catalogos.user_id = auth.uid() OR is_admin())
  ) OR auth.role() IS NULL);

CREATE POLICY "Users can update pedidos from own catalogos"
  ON public.pedidos_catalogo FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.catalogos 
    WHERE catalogos.id = pedidos_catalogo.catalogo_id 
    AND (catalogos.user_id = auth.uid() OR is_admin())
  ));

CREATE POLICY "Users can delete pedidos from own catalogos"
  ON public.pedidos_catalogo FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.catalogos 
    WHERE catalogos.id = pedidos_catalogo.catalogo_id 
    AND (catalogos.user_id = auth.uid() OR is_admin())
  ));

-- =====================================================
-- ATUALIZAR POLÍTICAS PARA PEDIDOS_CATALOGO_ITENS (via pedido/catalogo)
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view catalog order items" ON public.pedidos_catalogo_itens;
DROP POLICY IF EXISTS "Authenticated users can delete catalog order items" ON public.pedidos_catalogo_itens;

CREATE POLICY "Users see pedido items from own catalogos"
  ON public.pedidos_catalogo_itens FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.pedidos_catalogo pc
    JOIN public.catalogos c ON c.id = pc.catalogo_id
    WHERE pc.id = pedidos_catalogo_itens.pedido_id 
    AND (c.user_id = auth.uid() OR is_admin())
  ) OR auth.role() IS NULL);

CREATE POLICY "Users can delete pedido items from own catalogos"
  ON public.pedidos_catalogo_itens FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.pedidos_catalogo pc
    JOIN public.catalogos c ON c.id = pc.catalogo_id
    WHERE pc.id = pedidos_catalogo_itens.pedido_id 
    AND (c.user_id = auth.uid() OR is_admin())
  ));

-- =====================================================
-- ATUALIZAR POLÍTICAS PARA HISTORICO (por usuário)
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all history" ON public.historico_atividades;

CREATE POLICY "Users see own history"
  ON public.historico_atividades FOR SELECT
  USING (usuario_id = auth.uid() OR is_admin());