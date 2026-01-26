-- Fix ALL RLS policies to use organization_id properly

-- ========== PECAS ==========
DROP POLICY IF EXISTS "Pecas are viewable by owner" ON public.pecas;
DROP POLICY IF EXISTS "Pecas can be managed by owner" ON public.pecas;
DROP POLICY IF EXISTS "pecas_select_policy" ON public.pecas;
DROP POLICY IF EXISTS "pecas_insert_policy" ON public.pecas;
DROP POLICY IF EXISTS "pecas_update_policy" ON public.pecas;
DROP POLICY IF EXISTS "pecas_delete_policy" ON public.pecas;

CREATE POLICY "pecas_select_policy" ON public.pecas
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "pecas_insert_policy" ON public.pecas
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "pecas_update_policy" ON public.pecas
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "pecas_delete_policy" ON public.pecas
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());

-- ========== CLIENTES ==========
DROP POLICY IF EXISTS "Clientes are viewable by owner" ON public.clientes;
DROP POLICY IF EXISTS "Clientes can be managed by owner" ON public.clientes;
DROP POLICY IF EXISTS "clientes_select_policy" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_policy" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_policy" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete_policy" ON public.clientes;

CREATE POLICY "clientes_select_policy" ON public.clientes
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "clientes_insert_policy" ON public.clientes
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "clientes_update_policy" ON public.clientes
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "clientes_delete_policy" ON public.clientes
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());

-- ========== REVENDEDORAS ==========
DROP POLICY IF EXISTS "Revendedoras are viewable by owner" ON public.revendedoras;
DROP POLICY IF EXISTS "Revendedoras can be managed by owner" ON public.revendedoras;
DROP POLICY IF EXISTS "revendedoras_select_policy" ON public.revendedoras;
DROP POLICY IF EXISTS "revendedoras_insert_policy" ON public.revendedoras;
DROP POLICY IF EXISTS "revendedoras_update_policy" ON public.revendedoras;
DROP POLICY IF EXISTS "revendedoras_delete_policy" ON public.revendedoras;

CREATE POLICY "revendedoras_select_policy" ON public.revendedoras
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "revendedoras_insert_policy" ON public.revendedoras
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "revendedoras_update_policy" ON public.revendedoras
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "revendedoras_delete_policy" ON public.revendedoras
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());

-- ========== VENDAS ==========
DROP POLICY IF EXISTS "Vendas are viewable by owner" ON public.vendas;
DROP POLICY IF EXISTS "Vendas can be managed by owner" ON public.vendas;
DROP POLICY IF EXISTS "vendas_select_policy" ON public.vendas;
DROP POLICY IF EXISTS "vendas_insert_policy" ON public.vendas;
DROP POLICY IF EXISTS "vendas_update_policy" ON public.vendas;
DROP POLICY IF EXISTS "vendas_delete_policy" ON public.vendas;

CREATE POLICY "vendas_select_policy" ON public.vendas
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "vendas_insert_policy" ON public.vendas
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "vendas_update_policy" ON public.vendas
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "vendas_delete_policy" ON public.vendas
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());

-- ========== FORNECEDORES ==========
DROP POLICY IF EXISTS "Fornecedores are viewable by owner" ON public.fornecedores;
DROP POLICY IF EXISTS "Fornecedores can be managed by owner" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_select_policy" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_insert_policy" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_update_policy" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_delete_policy" ON public.fornecedores;

CREATE POLICY "fornecedores_select_policy" ON public.fornecedores
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "fornecedores_insert_policy" ON public.fornecedores
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "fornecedores_update_policy" ON public.fornecedores
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "fornecedores_delete_policy" ON public.fornecedores
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());

-- ========== MALETAS ==========
DROP POLICY IF EXISTS "Maletas are viewable by owner" ON public.maletas;
DROP POLICY IF EXISTS "Maletas can be managed by owner" ON public.maletas;
DROP POLICY IF EXISTS "maletas_select_policy" ON public.maletas;
DROP POLICY IF EXISTS "maletas_insert_policy" ON public.maletas;
DROP POLICY IF EXISTS "maletas_update_policy" ON public.maletas;
DROP POLICY IF EXISTS "maletas_delete_policy" ON public.maletas;
DROP POLICY IF EXISTS "Public maletas are viewable" ON public.maletas;

CREATE POLICY "maletas_select_policy" ON public.maletas
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "maletas_select_public" ON public.maletas
FOR SELECT TO anon
USING (is_public = true);

CREATE POLICY "maletas_insert_policy" ON public.maletas
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "maletas_update_policy" ON public.maletas
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "maletas_delete_policy" ON public.maletas
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());

-- ========== CATALOGOS ==========
DROP POLICY IF EXISTS "Catalogos are viewable by owner" ON public.catalogos;
DROP POLICY IF EXISTS "Catalogos can be managed by owner" ON public.catalogos;
DROP POLICY IF EXISTS "catalogos_select_policy" ON public.catalogos;
DROP POLICY IF EXISTS "catalogos_insert_policy" ON public.catalogos;
DROP POLICY IF EXISTS "catalogos_update_policy" ON public.catalogos;
DROP POLICY IF EXISTS "catalogos_delete_policy" ON public.catalogos;
DROP POLICY IF EXISTS "Public catalogos are viewable" ON public.catalogos;

CREATE POLICY "catalogos_select_policy" ON public.catalogos
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "catalogos_select_public" ON public.catalogos
FOR SELECT TO anon
USING (ativo = true);

CREATE POLICY "catalogos_insert_policy" ON public.catalogos
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "catalogos_update_policy" ON public.catalogos
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "catalogos_delete_policy" ON public.catalogos
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());

-- ========== CAMPANHAS ==========
DROP POLICY IF EXISTS "Campanhas are viewable by owner" ON public.campanhas;
DROP POLICY IF EXISTS "Campanhas can be managed by owner" ON public.campanhas;
DROP POLICY IF EXISTS "campanhas_select_policy" ON public.campanhas;
DROP POLICY IF EXISTS "campanhas_insert_policy" ON public.campanhas;
DROP POLICY IF EXISTS "campanhas_update_policy" ON public.campanhas;
DROP POLICY IF EXISTS "campanhas_delete_policy" ON public.campanhas;

CREATE POLICY "campanhas_select_policy" ON public.campanhas
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "campanhas_insert_policy" ON public.campanhas
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "campanhas_update_policy" ON public.campanhas
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "campanhas_delete_policy" ON public.campanhas
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());

-- ========== ROMANEIOS ==========
DROP POLICY IF EXISTS "Romaneios are viewable by owner" ON public.romaneios;
DROP POLICY IF EXISTS "Romaneios can be managed by owner" ON public.romaneios;
DROP POLICY IF EXISTS "romaneios_select_policy" ON public.romaneios;
DROP POLICY IF EXISTS "romaneios_insert_policy" ON public.romaneios;
DROP POLICY IF EXISTS "romaneios_update_policy" ON public.romaneios;
DROP POLICY IF EXISTS "romaneios_delete_policy" ON public.romaneios;

CREATE POLICY "romaneios_select_policy" ON public.romaneios
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "romaneios_insert_policy" ON public.romaneios
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "romaneios_update_policy" ON public.romaneios
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "romaneios_delete_policy" ON public.romaneios
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());

-- ========== BANHOS ==========
DROP POLICY IF EXISTS "Banhos are viewable by owner" ON public.banhos;
DROP POLICY IF EXISTS "Banhos can be managed by owner" ON public.banhos;
DROP POLICY IF EXISTS "banhos_select_policy" ON public.banhos;
DROP POLICY IF EXISTS "banhos_insert_policy" ON public.banhos;
DROP POLICY IF EXISTS "banhos_update_policy" ON public.banhos;
DROP POLICY IF EXISTS "banhos_delete_policy" ON public.banhos;

CREATE POLICY "banhos_select_policy" ON public.banhos
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "banhos_insert_policy" ON public.banhos
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "banhos_update_policy" ON public.banhos
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "banhos_delete_policy" ON public.banhos
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());

-- ========== METAS ==========
DROP POLICY IF EXISTS "Metas are viewable by owner" ON public.metas;
DROP POLICY IF EXISTS "Metas can be managed by owner" ON public.metas;
DROP POLICY IF EXISTS "metas_select_policy" ON public.metas;
DROP POLICY IF EXISTS "metas_insert_policy" ON public.metas;
DROP POLICY IF EXISTS "metas_update_policy" ON public.metas;
DROP POLICY IF EXISTS "metas_delete_policy" ON public.metas;

CREATE POLICY "metas_select_policy" ON public.metas
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "metas_insert_policy" ON public.metas
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "metas_update_policy" ON public.metas
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "metas_delete_policy" ON public.metas
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());

-- ========== CAIXA_SESSOES ==========
DROP POLICY IF EXISTS "Caixa sessoes are viewable by owner" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "Caixa sessoes can be managed by owner" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "caixa_sessoes_select_policy" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "caixa_sessoes_insert_policy" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "caixa_sessoes_update_policy" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "caixa_sessoes_delete_policy" ON public.caixa_sessoes;

CREATE POLICY "caixa_sessoes_select_policy" ON public.caixa_sessoes
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "caixa_sessoes_insert_policy" ON public.caixa_sessoes
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "caixa_sessoes_update_policy" ON public.caixa_sessoes
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "caixa_sessoes_delete_policy" ON public.caixa_sessoes
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());