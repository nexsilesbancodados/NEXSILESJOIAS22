-- FASE 1.1: Corrigir assinaturas - remover política permissiva
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON assinaturas;

-- FASE 1.2: Corrigir configuracoes - restringir gerenciamento a admins
DROP POLICY IF EXISTS "Authenticated can view configuracoes" ON configuracoes;
DROP POLICY IF EXISTS "Authenticated users can manage configuracoes" ON configuracoes;

-- Permitir leitura para todos autenticados (configs são necessárias para app funcionar)
CREATE POLICY "Authenticated can view configuracoes" ON configuracoes
FOR SELECT TO authenticated USING (true);

-- Apenas admins podem modificar configurações
CREATE POLICY "Admins can insert configuracoes" ON configuracoes
FOR INSERT TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update configuracoes" ON configuracoes
FOR UPDATE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete configuracoes" ON configuracoes
FOR DELETE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- FASE 2: Corrigir movimentos_caixa - remover políticas permissivas
DROP POLICY IF EXISTS "Authenticated can create movimentos_caixa" ON movimentos_caixa;
DROP POLICY IF EXISTS "Authenticated can delete movimentos_caixa" ON movimentos_caixa;
DROP POLICY IF EXISTS "Authenticated can update movimentos_caixa" ON movimentos_caixa;

-- FASE 3: Corrigir vendas_pecas - criar políticas seguras baseadas em organização
DROP POLICY IF EXISTS "Authenticated can create vendas_pecas" ON vendas_pecas;

-- Permitir inserção apenas se a venda pertence à organização do usuário
CREATE POLICY "Users can insert vendas_pecas via venda" ON vendas_pecas
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendas v 
    WHERE v.id = vendas_pecas.venda_id 
    AND v.organization_id = get_user_organization_id()
  )
);

-- Permitir SELECT apenas para vendas da organização
CREATE POLICY "Users can view vendas_pecas via venda" ON vendas_pecas
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM vendas v 
    WHERE v.id = vendas_pecas.venda_id 
    AND v.organization_id = get_user_organization_id()
  )
);

-- Permitir UPDATE apenas para vendas da organização
CREATE POLICY "Users can update vendas_pecas via venda" ON vendas_pecas
FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM vendas v 
    WHERE v.id = vendas_pecas.venda_id 
    AND v.organization_id = get_user_organization_id()
  )
);

-- Permitir DELETE apenas para vendas da organização
CREATE POLICY "Users can delete vendas_pecas via venda" ON vendas_pecas
FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM vendas v 
    WHERE v.id = vendas_pecas.venda_id 
    AND v.organization_id = get_user_organization_id()
  )
);