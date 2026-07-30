-- =============================================================================
-- Funções e policies que JÁ EXISTEM no banco de produção e que a migration de
-- hardening usa, substitui ou derruba. Copiadas das migrations originais.
-- =============================================================================

-- --- helpers de organização / role ------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
     WHERE user_id = auth.uid() AND organization_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = _user_id AND role::text = _role::text
  )
$$;

-- --- rate limit --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text, p_endpoint text, p_max_requests int DEFAULT 60, p_window_seconds int DEFAULT 60
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.rate_limits
   WHERE identifier = p_identifier AND endpoint = p_endpoint
     AND created_at > now() - (p_window_seconds || ' seconds')::interval;
  IF v_count >= p_max_requests THEN RETURN false; END IF;
  INSERT INTO public.rate_limits (identifier, endpoint) VALUES (p_identifier, p_endpoint);
  RETURN true;
END; $$;

-- --- cadastro de cliente da loja --------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_cliente_loja(
  p_nome text, p_email text, p_senha text, p_telefone text, p_organization_id uuid
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.clientes (nome, email, senha, telefone, organization_id, ativo)
  VALUES (p_nome, lower(trim(p_email)), crypt(p_senha, gen_salt('bf')), p_telefone, p_organization_id, true)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

-- --- funções que a migration REVOGA/DROPA (precisam existir para o teste) ----
CREATE OR REPLACE FUNCTION public.verify_portal_password_by_id(p_revendedora_id uuid, p_password text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $$
  SELECT EXISTS (SELECT 1 FROM public.revendedoras r
                  WHERE r.id = p_revendedora_id AND r.senha_portal = crypt(p_password, r.senha_portal))
$$;

CREATE OR REPLACE FUNCTION public.verify_cliente_password(p_email text, p_organization_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT true $$;

CREATE OR REPLACE FUNCTION public.verify_cliente_login(p_email text, p_password text, p_organization_id uuid)
RETURNS TABLE(cliente_id uuid, cliente_nome text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $$
  SELECT c.id, c.nome FROM public.clientes c
   WHERE c.email = lower(trim(p_email)) AND c.organization_id = p_organization_id
     AND c.senha = crypt(p_password, c.senha)
$$;

CREATE OR REPLACE FUNCTION public.get_pending_access_code(p_email text)
RETURNS TABLE(codigo text, plano text, periodo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ca.codigo::text, ca.plano::text, ca.periodo::text FROM public.codigos_acesso ca
   WHERE lower(ca.email) = lower(p_email) AND ca.usado = false AND ca.valido_ate > now()
   ORDER BY ca.created_at DESC LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_pending_access_code(text) TO anon, authenticated;

-- assinaturas antigas do portal (a migration precisa dropá-las)
CREATE OR REPLACE FUNCTION public.portal_login_lookup(p_email text)
RETURNS TABLE(id uuid, nome text, email text, comissao_percentual numeric, telefone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.nome, r.email, r.comissao_percentual, r.telefone
    FROM public.revendedoras r WHERE r.email = lower(trim(p_email))
$$;

CREATE OR REPLACE FUNCTION public.portal_fetch_maletas(p_revendedora_id uuid)
RETURNS TABLE(id uuid, nome text, status text, created_at timestamptz, updated_at timestamptz,
              is_public boolean, slug text, observacoes text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.nome, m.status, m.created_at, m.updated_at, m.is_public, m.sharing_slug, m.observacoes
    FROM public.maletas m WHERE m.revendedora_id = p_revendedora_id
$$;

CREATE OR REPLACE FUNCTION public.portal_fetch_maleta_pecas(p_maleta_id uuid, p_revendedora_id uuid)
RETURNS TABLE(id uuid, quantidade integer, quantidade_vendida integer, vendida boolean,
              preco_unitario numeric, data_venda date, peca_id uuid, peca_nome text,
              peca_codigo text, peca_preco_venda numeric, peca_imagem_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT mp.id, mp.quantidade, mp.quantidade_vendida, mp.vendida, mp.preco_unitario, mp.data_venda,
         p.id, p.nome, p.codigo, p.preco_venda, p.imagem_url
    FROM public.maletas_pecas mp LEFT JOIN public.pecas p ON mp.peca_id = p.id
   WHERE mp.maleta_id = p_maleta_id
$$;

CREATE OR REPLACE FUNCTION public.portal_fetch_interesses(p_revendedora_id uuid)
RETURNS TABLE(id uuid, maleta_id uuid, cliente_nome text, cliente_telefone text, cliente_email text,
              status text, observacoes text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT mi.id, mi.maleta_id, mi.cliente_nome, mi.cliente_telefone, mi.cliente_email,
         mi.status, mi.observacoes, mi.created_at, mi.updated_at
    FROM public.maleta_interesses mi JOIN public.maletas m ON mi.maleta_id = m.id
   WHERE m.revendedora_id = p_revendedora_id
$$;

CREATE OR REPLACE FUNCTION public.portal_fetch_interesse_itens(p_interesse_id uuid, p_revendedora_id uuid)
RETURNS TABLE(id uuid, quantidade integer, peca_id uuid, peca_nome text, peca_codigo text, peca_preco_venda numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT mii.id, mii.quantidade, p.id, p.nome, p.codigo, p.preco_venda
    FROM public.maleta_interesse_itens mii LEFT JOIN public.pecas p ON mii.peca_id = p.id
   WHERE mii.interesse_id = p_interesse_id
$$;

CREATE OR REPLACE FUNCTION public.portal_marcar_vendida(p_revendedora_id uuid, p_maleta_peca_id uuid, p_quantidade_venda integer)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT true $$;

CREATE OR REPLACE FUNCTION public.portal_desfazer_venda(p_revendedora_id uuid, p_maleta_peca_id uuid, p_quantidade_desfazer integer)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT true $$;

CREATE OR REPLACE FUNCTION public.portal_update_interesse_status(p_revendedora_id uuid, p_interesse_id uuid, p_status text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT true $$;

CREATE OR REPLACE FUNCTION public.fetch_cliente_pedidos(p_cliente_email text, p_organization_id uuid)
RETURNS TABLE(id uuid, numero_pedido bigint, status text, valor_total numeric, valor_frete numeric,
              created_at timestamptz, metodo_pagamento text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ep.id, ep.numero_pedido::bigint, ep.status, ep.valor_total, ep.valor_frete,
         ep.created_at, ep.metodo_pagamento
    FROM public.ecommerce_pedidos ep WHERE ep.cliente_email = lower(trim(p_cliente_email))
$$;

CREATE OR REPLACE FUNCTION public.fetch_cliente_pedido_itens(p_pedido_id uuid)
RETURNS TABLE(id uuid, quantidade integer, preco_unitario numeric, peca_nome text, peca_codigo text, peca_imagem_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT epi.id, epi.quantidade, epi.preco_unitario, p.nome, p.codigo, p.imagem_url
    FROM public.ecommerce_pedido_itens epi LEFT JOIN public.pecas p ON p.id = epi.peca_id
   WHERE epi.pedido_id = p_pedido_id
$$;

-- algumas funções da Seção 9 (para o REVOKE ter efeito real)
CREATE OR REPLACE FUNCTION public.debitar_estoque_ecommerce(p_peca_id uuid, p_quantidade integer)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT NULL::void $$;
CREATE OR REPLACE FUNCTION public.gerar_codigo_acesso() RETURNS varchar(12)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT 'ABCDEFGH1234'::varchar(12) $$;
CREATE OR REPLACE FUNCTION public.maleta_registrar_venda(p_maleta_peca_id uuid, p_quantidade integer, p_preco numeric)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT '{}'::jsonb $$;
CREATE OR REPLACE FUNCTION public.hash_portal_password(password text) RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$ SELECT crypt(password, gen_salt('bf')) $$;
CREATE OR REPLACE FUNCTION public.seed_default_email_templates(p_organization_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT NULL::void $$;
CREATE OR REPLACE FUNCTION public.log_activity(p_acao text, p_entidade text, p_entidade_id uuid, p_dados jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT NULL::void $$;

-- =============================================================================
-- RLS + policies pré-existentes (as permissivas que a migration derruba)
-- =============================================================================
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role', t.tablename);
  END LOOP;
END $$;

-- purchases: leitura pública (o furo)
CREATE POLICY "Users can read purchases by access_code" ON public.purchases FOR SELECT USING (true);

-- user_roles: auto-atribuição (o furo)
CREATE POLICY "roles_insert_own_policy" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "roles_select_own_policy" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Portal anon can view resellers or admin sees own resellers" ON public.profiles
  FOR SELECT USING (auth.uid() IS NULL);

-- maleta_interesses: leitura por qualquer autenticado (o furo)
CREATE POLICY maleta_interesses_select_public ON public.maleta_interesses
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.maletas m WHERE m.id = maleta_interesses.maleta_id AND m.is_public = true)
  );
CREATE POLICY maleta_interesses_select_portal ON public.maleta_interesses
  FOR SELECT USING (auth.uid() IS NULL);

-- pedidos_catalogo: UPDATE aberto + leitura anônima (os furos)
CREATE POLICY "Anyone can update pedidos_catalogo" ON public.pedidos_catalogo FOR UPDATE USING (true);
CREATE POLICY "Users see pedidos from own catalogos" ON public.pedidos_catalogo
  FOR SELECT USING (auth.role() IS NULL);

-- fidelidade / historico_precos / maletas_pecas / romaneios_pecas / catalogos_pecas
CREATE POLICY "Authenticated can manage fidelidade" ON public.fidelidade_transacoes
  FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated can view historico_precos" ON public.historico_precos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view maletas_pecas" ON public.maletas_pecas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view romaneios_pecas" ON public.romaneios_pecas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view catalogos_pecas" ON public.catalogos_pecas FOR SELECT USING (true);
CREATE POLICY "Allow romaneios_pecas insert" ON public.romaneios_pecas
  FOR INSERT WITH CHECK (romaneio_id IS NOT NULL AND (auth.uid() IS NOT NULL OR auth.uid() IS NULL));

-- pecas: pilha antiga + a org-scoped que a migration mantém
CREATE POLICY "Users can insert own pecas" ON public.pecas FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view org pecas" ON public.pecas
  FOR SELECT USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);
CREATE POLICY pecas_select_org_only ON public.pecas
  FOR SELECT TO authenticated USING (organization_id = public.get_user_organization_id());

-- funcionario_permissoes: qualquer membro reescreve (o furo)
CREATE POLICY "Users can update permissoes of their org funcionarios" ON public.funcionario_permissoes
  FOR UPDATE TO authenticated USING (true);

-- codigos_acesso: UPDATE anônimo (o furo)
CREATE POLICY codigos_acesso_update_on_use ON public.codigos_acesso
  FOR UPDATE USING (usado = false) WITH CHECK (usado = true);

-- memberships: em produção o usuário só vê a PRÓPRIA linha (o owner vê as da
-- organização). Isso é essencial no teste: policies que consultam memberships
-- por dentro também passam por RLS.
CREATE POLICY membership_select_own_policy ON public.memberships
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY membership_insert_policy ON public.memberships
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY membership_owner_manage_policy ON public.memberships
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.organizations o
     WHERE o.id = memberships.organization_id AND o.owner_id = auth.uid()));

-- maletas / clientes / catalogos / romaneios org-scoped (produção)
CREATE POLICY maletas_select_policy ON public.maletas
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id() OR organization_id IS NULL);
CREATE POLICY maletas_write_policy ON public.maletas
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());
CREATE POLICY anon_can_view_public_maletas ON public.maletas
  FOR SELECT TO anon USING (is_public = true);
CREATE POLICY clientes_org ON public.clientes
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());
CREATE POLICY catalogos_org ON public.catalogos
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());
CREATE POLICY romaneios_select_policy ON public.romaneios
  FOR SELECT TO authenticated USING (organization_id = public.get_user_organization_id());
CREATE POLICY funcionarios_select_org ON public.funcionarios
  FOR SELECT TO authenticated USING (organization_id = public.get_user_organization_id());

-- policies org-scoped que a migration ASSUME existirem
CREATE POLICY historico_precos_select_org ON public.historico_precos
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.pecas WHERE pecas.id = historico_precos.peca_id
      AND pecas.organization_id = public.get_user_organization_id()));
CREATE POLICY maletas_pecas_select_org ON public.maletas_pecas
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.maletas m WHERE m.id = maletas_pecas.maleta_id
      AND m.organization_id = public.get_user_organization_id()));
CREATE POLICY anon_select_catalogos_pecas ON public.catalogos_pecas
  FOR SELECT TO anon USING (EXISTS (
    SELECT 1 FROM public.catalogos c WHERE c.id = catalogos_pecas.catalogo_id
      AND c.ativo = true AND c.slug IS NOT NULL));
