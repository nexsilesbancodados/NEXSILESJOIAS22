-- =====================================================================
-- RLS HARDENING — remove policies permissivas residuais que sobreviveram ao
-- estado final do schema. Como o Postgres COMBINA policies permissivas com OR,
-- uma policy antiga `USING(true)` / `WITH CHECK(true)` / `auth.role()='authenticated'`
-- que nunca foi dropada vence a policy org-scoped e permite acesso cross-tenant.
--
-- Alvos confirmados por auditoria (linhagem de produção pós-reset 20260124):
--   LEITURA cross-tenant:  vendas_pecas, movimentos_caixa, profiles
--   ESCRITA cross-tenant:  vendas, caixa_sessoes, movimentos_caixa,
--                          historico_atividades (+ venda_itens/pagamentos legadas)
--
-- Estratégia de segurança: para cada tabela onde dropar a policy permissiva
-- poderia remover o único caminho de acesso legítimo, criamos a policy
-- org-scoped correta ANTES de dropar a permissiva. Todos os DROP usam IF EXISTS
-- (no-op quando a policy não existe nesta base — ex.: tabelas da linhagem antiga).
--
-- Referência de escopo: public.get_user_organization_id() (já existe no schema).
-- =====================================================================

-- ---------------------------------------------------------------------
-- vendas_pecas — SELECT USING(true) cross-tenant.
-- Já existe "Users can view vendas_pecas via venda" (org-scoped via parent vendas).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can view vendas_pecas" ON public.vendas_pecas;
DROP POLICY IF EXISTS "Authenticated can create vendas_pecas" ON public.vendas_pecas;

-- ---------------------------------------------------------------------
-- vendas — INSERT frouxo (auth.role()='authenticated').
-- Já existe "vendas_insert_policy" (organization_id = get_user_organization_id()).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert vendas" ON public.vendas;

-- ---------------------------------------------------------------------
-- caixa_sessoes — INSERT frouxo. Já existe "caixa_sessoes_insert_secure" (org+role).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert caixa sessions" ON public.caixa_sessoes;

-- ---------------------------------------------------------------------
-- movimentos_caixa — SELECT e INSERT USING/WITH CHECK(true).
-- Cria policies org-scoped (via parent caixa_sessoes) ANTES de dropar as frouxas.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "movimentos_caixa_select_org" ON public.movimentos_caixa;
CREATE POLICY "movimentos_caixa_select_org" ON public.movimentos_caixa
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.caixa_sessoes s
    WHERE s.id = movimentos_caixa.sessao_id
      AND s.organization_id = public.get_user_organization_id()
  ));

DROP POLICY IF EXISTS "movimentos_caixa_insert_org" ON public.movimentos_caixa;
CREATE POLICY "movimentos_caixa_insert_org" ON public.movimentos_caixa
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.caixa_sessoes s
    WHERE s.id = movimentos_caixa.sessao_id
      AND s.organization_id = public.get_user_organization_id()
  ));

DROP POLICY IF EXISTS "Authenticated can view movimentos_caixa" ON public.movimentos_caixa;
DROP POLICY IF EXISTS "Authenticated can create movimentos_caixa" ON public.movimentos_caixa;
DROP POLICY IF EXISTS "Authenticated users can insert movimentos" ON public.movimentos_caixa;

-- ---------------------------------------------------------------------
-- historico_atividades — INSERT WITH CHECK(true) (várias policies).
-- SELECT já é org-scoped (historico_select_policy). Cria INSERT org-scoped antes.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "historico_insert_org" ON public.historico_atividades;
CREATE POLICY "historico_insert_org" ON public.historico_atividades
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Users can insert historico_atividades" ON public.historico_atividades;
DROP POLICY IF EXISTS "System can create historico" ON public.historico_atividades;
DROP POLICY IF EXISTS "Authenticated users can insert history" ON public.historico_atividades;

-- ---------------------------------------------------------------------
-- profiles — SELECT USING(true) ("ver todos os perfis"), cross-tenant.
-- Permanecem "Users can view own profile" e "Admins can view reseller profiles".
-- OBS: se alguma tela que lista membros da equipe parar de funcionar, crie uma
-- policy de SELECT restrita à MESMA organização (via memberships) — nunca
-- reabra USING(true).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;

-- ---------------------------------------------------------------------
-- Tabelas da linhagem antiga (venda_itens/pagamentos) — podem não existir na
-- base de produção. Fecha o INSERT frouxo SE existirem; no-op caso contrário.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.venda_itens') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert venda items" ON public.venda_itens';
  END IF;
  IF to_regclass('public.pagamentos') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert pagamentos" ON public.pagamentos';
  END IF;
END $$;
