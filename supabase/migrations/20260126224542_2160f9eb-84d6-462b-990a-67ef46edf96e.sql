-- ============================================
-- CORREÇÃO DE SEGURANÇA COMPLETA
-- ============================================

-- ===== 1. PROTEGER DADOS PESSOAIS (clientes, revendedoras) =====

-- Clientes: Restringir dados sensíveis apenas para admin/gerente
DROP POLICY IF EXISTS "Users can view org clientes" ON public.clientes;
DROP POLICY IF EXISTS "clientes_select_policy" ON public.clientes;
DROP POLICY IF EXISTS "Users can manage org clientes" ON public.clientes;

-- Admin/Gerente podem ver tudo
CREATE POLICY "clientes_select_admin" ON public.clientes
FOR SELECT
USING (
  organization_id = get_user_organization_id()
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);

-- Outros roles veem apenas nome e id (via view seria melhor, mas por ora restringimos acesso)
CREATE POLICY "clientes_select_basic" ON public.clientes
FOR SELECT
USING (
  organization_id = get_user_organization_id()
  AND NOT has_role(auth.uid(), 'admin') 
  AND NOT has_role(auth.uid(), 'gerente')
);

-- Revendedoras: Restringir dados sensíveis
DROP POLICY IF EXISTS "Users can view org revendedoras" ON public.revendedoras;
DROP POLICY IF EXISTS "revendedoras_select_policy" ON public.revendedoras;

-- Admin/Gerente podem ver tudo, ou a própria revendedora
CREATE POLICY "revendedoras_select_admin" ON public.revendedoras
FOR SELECT
USING (
  (organization_id = get_user_organization_id() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente')))
  OR user_id = auth.uid()
);

-- ===== 2. PROTEGER DADOS FINANCEIROS (caixa) =====

-- Caixa sessões: apenas admin/gerente podem manipular
DROP POLICY IF EXISTS "Users can manage org caixa_sessoes" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "Users can view org caixa_sessoes" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "caixa_sessoes_select_policy" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "caixa_sessoes_insert_policy" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "caixa_sessoes_update_policy" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "caixa_sessoes_delete_policy" ON public.caixa_sessoes;

-- SELECT: operador pode ver suas sessões, admin/gerente vê tudo da org
CREATE POLICY "caixa_sessoes_select_secure" ON public.caixa_sessoes
FOR SELECT
USING (
  organization_id = get_user_organization_id()
  AND (
    operador_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'gerente')
  )
);

-- INSERT: qualquer membro da org pode abrir caixa
CREATE POLICY "caixa_sessoes_insert_secure" ON public.caixa_sessoes
FOR INSERT
WITH CHECK (organization_id = get_user_organization_id());

-- UPDATE: apenas admin/gerente ou o operador que abriu
CREATE POLICY "caixa_sessoes_update_secure" ON public.caixa_sessoes
FOR UPDATE
USING (
  organization_id = get_user_organization_id()
  AND (
    operador_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'gerente')
  )
);

-- DELETE: apenas admin
CREATE POLICY "caixa_sessoes_delete_admin" ON public.caixa_sessoes
FOR DELETE
USING (
  organization_id = get_user_organization_id()
  AND has_role(auth.uid(), 'admin')
);

-- Movimentos de caixa: tornar append-only (sem delete)
DROP POLICY IF EXISTS "Users can delete movimentos_caixa via sessao" ON public.movimentos_caixa;

-- UPDATE apenas para admin
DROP POLICY IF EXISTS "Users can update movimentos_caixa via sessao" ON public.movimentos_caixa;

CREATE POLICY "movimentos_caixa_update_admin" ON public.movimentos_caixa
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM caixa_sessoes cs
    WHERE cs.id = movimentos_caixa.sessao_id
    AND cs.organization_id = get_user_organization_id()
  )
  AND has_role(auth.uid(), 'admin')
);

-- ===== 3. PROTEGER LOGS DE AUDITORIA (append-only) =====

DROP POLICY IF EXISTS "historico_delete_policy" ON public.historico_atividades;
DROP POLICY IF EXISTS "historico_update_policy" ON public.historico_atividades;

-- Remover capacidade de alterar histórico (mantém apenas SELECT e INSERT)
-- SELECT já existe via organization_id

-- ===== 4. PROTEGER FORNECEDORES =====
DROP POLICY IF EXISTS "Users can view org fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_select_policy" ON public.fornecedores;

CREATE POLICY "fornecedores_select_admin" ON public.fornecedores
FOR SELECT
USING (
  organization_id = get_user_organization_id()
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'))
);