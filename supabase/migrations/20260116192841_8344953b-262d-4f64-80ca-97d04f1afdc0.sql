-- =====================================================
-- MIGRAÇÃO: Corrigir Isolamento de Dados Entre Admins
-- Remove "OR is_admin()" das políticas RLS para que
-- cada admin veja apenas seus próprios dados
-- =====================================================

-- =====================================================
-- 1. PROFILES - Admins veem apenas seu perfil + suas revendedoras
-- =====================================================
DROP POLICY IF EXISTS "Users see own profile or admin sees their resellers" ON profiles;
CREATE POLICY "Users see own profile or admin sees their resellers" ON profiles
FOR SELECT USING (
  id = auth.uid() 
  OR (role = 'reseller' AND admin_id = auth.uid())
);

DROP POLICY IF EXISTS "Users update own profile or admins update their resellers" ON profiles;
CREATE POLICY "Users update own profile or admins update their resellers" ON profiles
FOR UPDATE USING (
  id = auth.uid() 
  OR (role = 'reseller' AND admin_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can insert resellers under them" ON profiles;
CREATE POLICY "Admins can insert resellers under them" ON profiles
FOR INSERT WITH CHECK (
  id = auth.uid() 
  OR (role = 'reseller' AND admin_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins delete their resellers" ON profiles;
CREATE POLICY "Admins delete their resellers" ON profiles
FOR DELETE USING (
  (role = 'reseller' AND admin_id = auth.uid())
);

-- =====================================================
-- 2. MALETAS - Admin vê apenas suas maletas
-- =====================================================
DROP POLICY IF EXISTS "Users see own maletas or admin sees their maletas" ON maletas;
CREATE POLICY "Users see own maletas or admin sees their maletas" ON maletas
FOR SELECT USING (
  reseller_id = auth.uid() 
  OR admin_id = auth.uid()
);

DROP POLICY IF EXISTS "Admins can insert maletas for their resellers" ON maletas;
CREATE POLICY "Admins can insert maletas for their resellers" ON maletas
FOR INSERT WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update their maletas" ON maletas;
CREATE POLICY "Admins can update their maletas" ON maletas
FOR UPDATE USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete their maletas" ON maletas;
CREATE POLICY "Admins can delete their maletas" ON maletas
FOR DELETE USING (admin_id = auth.uid());

-- =====================================================
-- 3. MALETA_ITENS - via maleta (que já está corrigida)
-- =====================================================
DROP POLICY IF EXISTS "Users see maleta items they have access to" ON maleta_itens;
CREATE POLICY "Users see maleta items they have access to" ON maleta_itens
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM maletas 
    WHERE maletas.id = maleta_itens.maleta_id 
    AND (maletas.reseller_id = auth.uid() OR maletas.admin_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Only admins can insert maleta items" ON maleta_itens;
CREATE POLICY "Only admins can insert maleta items" ON maleta_itens
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM maletas 
    WHERE maletas.id = maleta_itens.maleta_id 
    AND maletas.admin_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Only admins can update maleta items" ON maleta_itens;
CREATE POLICY "Only admins can update maleta items" ON maleta_itens
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM maletas 
    WHERE maletas.id = maleta_itens.maleta_id 
    AND maletas.admin_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Only admins can delete maleta items" ON maleta_itens;
CREATE POLICY "Only admins can delete maleta items" ON maleta_itens
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM maletas 
    WHERE maletas.id = maleta_itens.maleta_id 
    AND maletas.admin_id = auth.uid()
  )
);

-- =====================================================
-- 4. ROMANEIOS - Admin vê apenas seus romaneios
-- =====================================================
DROP POLICY IF EXISTS "Users see own romaneios or admin sees their romaneios" ON romaneios;
CREATE POLICY "Users see own romaneios or admin sees their romaneios" ON romaneios
FOR SELECT USING (
  reseller_id = auth.uid() 
  OR admin_id = auth.uid()
);

DROP POLICY IF EXISTS "Admins can update their romaneios" ON romaneios;
CREATE POLICY "Admins can update their romaneios" ON romaneios
FOR UPDATE USING (
  reseller_id = auth.uid() 
  OR admin_id = auth.uid()
);

DROP POLICY IF EXISTS "Admins can delete their romaneios" ON romaneios;
CREATE POLICY "Admins can delete their romaneios" ON romaneios
FOR DELETE USING (admin_id = auth.uid());

-- =====================================================
-- 5. ROMANEIO_ITENS - via romaneio
-- =====================================================
DROP POLICY IF EXISTS "Users see romaneio items they have access to" ON romaneio_itens;
CREATE POLICY "Users see romaneio items they have access to" ON romaneio_itens
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM romaneios 
    WHERE romaneios.id = romaneio_itens.romaneio_id 
    AND (romaneios.reseller_id = auth.uid() OR romaneios.admin_id = auth.uid())
  )
);

-- =====================================================
-- 6. VENDAS - Admin vê apenas suas vendas
-- =====================================================
DROP POLICY IF EXISTS "Users see own vendas or admin sees their vendas" ON vendas;
DROP POLICY IF EXISTS "Users see vendas they have access to" ON vendas;
CREATE POLICY "Users see vendas they have access to" ON vendas
FOR SELECT USING (
  reseller_id = auth.uid() 
  OR admin_id = auth.uid()
  OR (admin_id IS NULL AND reseller_id IS NULL)
);

DROP POLICY IF EXISTS "Admins can update their vendas" ON vendas;
CREATE POLICY "Admins can update their vendas" ON vendas
FOR UPDATE USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete their vendas" ON vendas;
CREATE POLICY "Admins can delete their vendas" ON vendas
FOR DELETE USING (admin_id = auth.uid());

-- =====================================================
-- 7. VENDA_ITENS - via venda
-- =====================================================
DROP POLICY IF EXISTS "Users see venda items they have access to" ON venda_itens;
CREATE POLICY "Users see venda items they have access to" ON venda_itens
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM vendas 
    WHERE vendas.id = venda_itens.venda_id 
    AND (vendas.reseller_id = auth.uid() OR vendas.admin_id = auth.uid() OR (vendas.admin_id IS NULL AND vendas.reseller_id IS NULL))
  )
);

-- =====================================================
-- 8. PAGAMENTOS - via venda
-- =====================================================
DROP POLICY IF EXISTS "Users see pagamentos they have access to" ON pagamentos;
CREATE POLICY "Users see pagamentos they have access to" ON pagamentos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM vendas 
    WHERE vendas.id = pagamentos.venda_id 
    AND (vendas.reseller_id = auth.uid() OR vendas.admin_id = auth.uid() OR (vendas.admin_id IS NULL AND vendas.reseller_id IS NULL))
  )
);

-- =====================================================
-- 9. PECAS - Admin vê apenas suas peças
-- =====================================================
DROP POLICY IF EXISTS "Users see own pecas" ON pecas;
CREATE POLICY "Users see own pecas" ON pecas
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own pecas" ON pecas;
CREATE POLICY "Users can insert own pecas" ON pecas
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own pecas" ON pecas;
CREATE POLICY "Users can update own pecas" ON pecas
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own pecas" ON pecas;
CREATE POLICY "Users can delete own pecas" ON pecas
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 10. CLIENTES - Admin vê apenas seus clientes
-- =====================================================
DROP POLICY IF EXISTS "Users see own clientes" ON clientes;
CREATE POLICY "Users see own clientes" ON clientes
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own clientes" ON clientes;
CREATE POLICY "Users can insert own clientes" ON clientes
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own clientes" ON clientes;
CREATE POLICY "Users can update own clientes" ON clientes
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own clientes" ON clientes;
CREATE POLICY "Users can delete own clientes" ON clientes
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 11. FORNECEDORES - Admin vê apenas seus fornecedores
-- =====================================================
DROP POLICY IF EXISTS "Users see own fornecedores" ON fornecedores;
CREATE POLICY "Users see own fornecedores" ON fornecedores
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own fornecedores" ON fornecedores;
CREATE POLICY "Users can insert own fornecedores" ON fornecedores
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own fornecedores" ON fornecedores;
CREATE POLICY "Users can update own fornecedores" ON fornecedores
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own fornecedores" ON fornecedores;
CREATE POLICY "Users can delete own fornecedores" ON fornecedores
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 12. CATALOGOS - Admin vê apenas seus catálogos
-- =====================================================
DROP POLICY IF EXISTS "Users see own catalogos" ON catalogos;
CREATE POLICY "Users see own catalogos" ON catalogos
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own catalogos" ON catalogos;
CREATE POLICY "Users can insert own catalogos" ON catalogos
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own catalogos" ON catalogos;
CREATE POLICY "Users can update own catalogos" ON catalogos
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own catalogos" ON catalogos;
CREATE POLICY "Users can delete own catalogos" ON catalogos
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 13. CATALOGO_ITENS - via catalogo
-- =====================================================
DROP POLICY IF EXISTS "Users see catalogo_itens from own catalogos" ON catalogo_itens;
CREATE POLICY "Users see catalogo_itens from own catalogos" ON catalogo_itens
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = catalogo_itens.catalogo_id 
    AND catalogos.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert catalogo_itens in own catalogos" ON catalogo_itens;
CREATE POLICY "Users can insert catalogo_itens in own catalogos" ON catalogo_itens
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = catalogo_itens.catalogo_id 
    AND catalogos.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update catalogo_itens in own catalogos" ON catalogo_itens;
CREATE POLICY "Users can update catalogo_itens in own catalogos" ON catalogo_itens
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = catalogo_itens.catalogo_id 
    AND catalogos.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete catalogo_itens in own catalogos" ON catalogo_itens;
CREATE POLICY "Users can delete catalogo_itens in own catalogos" ON catalogo_itens
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = catalogo_itens.catalogo_id 
    AND catalogos.user_id = auth.uid()
  )
);

-- =====================================================
-- 14. PEDIDOS_CATALOGO - via catalogo
-- =====================================================
DROP POLICY IF EXISTS "Users see pedidos from own catalogos" ON pedidos_catalogo;
CREATE POLICY "Users see pedidos from own catalogos" ON pedidos_catalogo
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = pedidos_catalogo.catalogo_id 
    AND catalogos.user_id = auth.uid()
  )
  OR auth.role() IS NULL
);

DROP POLICY IF EXISTS "Users can update pedidos from own catalogos" ON pedidos_catalogo;
CREATE POLICY "Users can update pedidos from own catalogos" ON pedidos_catalogo
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = pedidos_catalogo.catalogo_id 
    AND catalogos.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete pedidos from own catalogos" ON pedidos_catalogo;
CREATE POLICY "Users can delete pedidos from own catalogos" ON pedidos_catalogo
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = pedidos_catalogo.catalogo_id 
    AND catalogos.user_id = auth.uid()
  )
);

-- =====================================================
-- 15. PEDIDOS_CATALOGO_ITENS - via pedido/catalogo
-- =====================================================
DROP POLICY IF EXISTS "Users see pedido items from own catalogos" ON pedidos_catalogo_itens;
CREATE POLICY "Users see pedido items from own catalogos" ON pedidos_catalogo_itens
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pedidos_catalogo pc
    JOIN catalogos c ON c.id = pc.catalogo_id
    WHERE pc.id = pedidos_catalogo_itens.pedido_id 
    AND c.user_id = auth.uid()
  )
  OR auth.role() IS NULL
);

DROP POLICY IF EXISTS "Users can delete pedido items from own catalogos" ON pedidos_catalogo_itens;
CREATE POLICY "Users can delete pedido items from own catalogos" ON pedidos_catalogo_itens
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM pedidos_catalogo pc
    JOIN catalogos c ON c.id = pc.catalogo_id
    WHERE pc.id = pedidos_catalogo_itens.pedido_id 
    AND c.user_id = auth.uid()
  )
);

-- =====================================================
-- 16. CONFIGURACOES - Admin vê apenas suas configs
-- =====================================================
DROP POLICY IF EXISTS "Users see own configuracoes" ON configuracoes;
CREATE POLICY "Users see own configuracoes" ON configuracoes
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own configuracoes" ON configuracoes;
CREATE POLICY "Users can insert own configuracoes" ON configuracoes
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own configuracoes" ON configuracoes;
CREATE POLICY "Users can update own configuracoes" ON configuracoes
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own configuracoes" ON configuracoes;
CREATE POLICY "Users can delete own configuracoes" ON configuracoes
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 17. CAIXA_SESSOES - Admin vê apenas suas sessões
-- =====================================================
DROP POLICY IF EXISTS "Users see own caixa sessions, admins see all" ON caixa_sessoes;
CREATE POLICY "Users see own caixa sessions" ON caixa_sessoes
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own caixa sessions" ON caixa_sessoes;
CREATE POLICY "Users can update own caixa sessions" ON caixa_sessoes
FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- 18. MOVIMENTOS_CAIXA - via caixa
-- =====================================================
DROP POLICY IF EXISTS "Users see movimentos from their caixa sessions" ON movimentos_caixa;
CREATE POLICY "Users see movimentos from their caixa sessions" ON movimentos_caixa
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM caixa_sessoes 
    WHERE caixa_sessoes.id = movimentos_caixa.caixa_id 
    AND caixa_sessoes.user_id = auth.uid()
  )
);

-- =====================================================
-- 19. HISTORICO_ATIVIDADES - Admin vê apenas seu histórico
-- =====================================================
DROP POLICY IF EXISTS "Users see own history" ON historico_atividades;
CREATE POLICY "Users see own history" ON historico_atividades
FOR SELECT USING (usuario_id = auth.uid());