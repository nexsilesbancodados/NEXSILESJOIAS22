-- =============================================================================
-- HARDENING DE SEGURANÇA — NEXSILES
-- =============================================================================
-- Corrige, em uma única transação lógica:
--
--   C1  Portal da revendedora sem sessão no servidor. As RPCs portal_* recebiam
--       p_revendedora_id e só verificavam se o REGISTRO pertencia àquela
--       revendedora — nunca se QUEM CHAMA é ela. Como todas as funções mantinham
--       o EXECUTE default para PUBLIC, qualquer pessoa com a chave anon (que está
--       no bundle do site) lia e ESCREVIA dados de qualquer revendedora de
--       qualquer tenant. O mesmo vale para a área do cliente da loja
--       (fetch_cliente_pedidos por e-mail, fetch_cliente_pedido_itens sem
--       nenhuma checagem).
--       → Passa a existir sessão real: public_sessions + token opaco.
--
--   C2  purchases com "FOR SELECT USING (true)" expondo nome/CPF/telefone/e-mail
--       e o access_code de todos os compradores para qualquer visitante.
--
--   C3  Escalada de privilégio: user_roles permitia auto-INSERT de role 'admin';
--       profiles permitia auto-UPDATE de is_super_admin; funcionario_permissoes
--       podia ser reescrita por qualquer membro da organização.
--
--   A1  ~20 policies permissivas antigas (USING(true) / CHECK(true) / sem TO)
--       sobreviventes que, por serem combinadas com OR, anulavam as policies
--       org-scoped corretas.
--
--   A2  codigos_acesso: RPC de consulta por e-mail liberada para anon e UPDATE
--       que permitia a anônimos queimar códigos pagos.
--
--   PDV Baixa de estoque atômica (o app fazia read-modify-write no cliente).
--
-- ORDEM DE APLICAÇÃO — IMPORTANTE
--   Este script DROPA as assinaturas antigas das RPCs do portal e da área do
--   cliente. O frontend correspondente (mesmo commit) precisa ir ao ar junto.
--   Se o SQL for aplicado antes do deploy do frontend, o portal e a área
--   "Meus pedidos" ficam fora do ar até o deploy — nenhum dado é perdido.
--   Revendedoras e clientes logados serão deslogados uma vez (sessão nova).
--
-- Idempotente: pode ser reexecutado sem efeito colateral.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- SEÇÃO 1 — SESSÕES PÚBLICAS (portal da revendedora + área do cliente da loja)
-- =============================================================================
-- Token opaco de 256 bits gerado no servidor, guardado apenas como hash SHA-256.
-- O cliente recebe o token em claro uma única vez e o mantém em sessionStorage.
-- Toda RPC pública passa a receber o token e derivar o sujeito dele.

CREATE TABLE IF NOT EXISTS public.public_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash    TEXT NOT NULL UNIQUE,
  subject_type  TEXT NOT NULL CHECK (subject_type IN ('revendedora', 'cliente')),
  subject_id    UUID NOT NULL,
  organization_id UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_public_sessions_hash    ON public.public_sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_public_sessions_expires ON public.public_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_public_sessions_subject ON public.public_sessions (subject_type, subject_id);

ALTER TABLE public.public_sessions ENABLE ROW LEVEL SECURITY;

-- Ninguém acessa a tabela direto: só as funções SECURITY DEFINER abaixo.
DROP POLICY IF EXISTS public_sessions_no_direct_access ON public.public_sessions;
CREATE POLICY public_sessions_no_direct_access ON public.public_sessions
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

REVOKE ALL ON TABLE public.public_sessions FROM anon, authenticated;

-- --- helpers internos -------------------------------------------------------

CREATE OR REPLACE FUNCTION public.session_hash(p_token TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'extensions'
AS $$
  SELECT encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

/**
 * Abre uma sessão pública e devolve o token em claro (única vez que ele existe
 * fora do hash). TTL de 12h.
 */
CREATE OR REPLACE FUNCTION public.session_open(
  p_subject_type TEXT,
  p_subject_id UUID,
  p_organization_id UUID DEFAULT NULL,
  p_ttl_hours INT DEFAULT 12
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_token TEXT;
BEGIN
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Limpeza oportunista de sessões expiradas (barato, sem cron).
  DELETE FROM public.public_sessions WHERE expires_at < now() - INTERVAL '1 day';

  INSERT INTO public.public_sessions (
    token_hash, subject_type, subject_id, organization_id, expires_at
  ) VALUES (
    public.session_hash(v_token), p_subject_type, p_subject_id, p_organization_id,
    now() + make_interval(hours => p_ttl_hours)
  );

  RETURN v_token;
END;
$$;

/**
 * Resolve o sujeito de um token válido. Renova last_seen_at.
 * Levanta exceção quando o token é inválido/expirado — as RPCs propagam isso ao
 * cliente, que trata como "sessão expirada" e força novo login.
 */
CREATE OR REPLACE FUNCTION public.session_subject(p_token TEXT, p_subject_type TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_id UUID;
BEGIN
  UPDATE public.public_sessions s
     SET last_seen_at = now()
   WHERE s.token_hash = public.session_hash(p_token)
     AND s.subject_type = p_subject_type
     AND s.expires_at > now()
  RETURNING s.subject_id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'SESSAO_INVALIDA' USING ERRCODE = '28000';
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.session_close(p_token TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  DELETE FROM public.public_sessions WHERE token_hash = public.session_hash(p_token);
$$;

-- session_hash / session_open / session_subject são internas.
REVOKE ALL ON FUNCTION public.session_hash(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.session_open(TEXT, UUID, UUID, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.session_subject(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.session_close(TEXT) TO anon, authenticated;

-- =============================================================================
-- SEÇÃO 2 — PORTAL DA REVENDEDORA: login com sessão + RPCs por token
-- =============================================================================

/**
 * Login do portal. Verifica a senha (bcrypt, coluna revendedoras.senha_portal),
 * aplica rate limit por e-mail e abre sessão.
 * Retorna 0 linhas quando as credenciais são inválidas (mesma resposta para
 * e-mail inexistente e senha errada — não vira oráculo de enumeração).
 */
CREATE OR REPLACE FUNCTION public.portal_login(p_email TEXT, p_senha TEXT)
RETURNS TABLE(
  token TEXT,
  id UUID,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  comissao_percentual NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_r RECORD;
  v_email TEXT := lower(trim(coalesce(p_email, '')));
  v_token TEXT;
BEGIN
  IF v_email = '' OR coalesce(p_senha, '') = '' THEN
    RETURN;
  END IF;

  -- Anti brute force: 10 tentativas por e-mail a cada 10 minutos.
  IF NOT public.check_rate_limit('portal_login:' || v_email, 'portal_login', 10, 600) THEN
    RAISE EXCEPTION 'MUITAS_TENTATIVAS' USING ERRCODE = '54000';
  END IF;

  SELECT r.id, r.nome, r.email, r.telefone, r.comissao_percentual, r.organization_id
    INTO v_r
    FROM public.revendedoras r
   WHERE lower(r.email) = v_email
     AND r.ativo = true
     AND r.senha_portal IS NOT NULL
     AND r.senha_portal = crypt(p_senha, r.senha_portal)
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_token := public.session_open('revendedora', v_r.id, v_r.organization_id);

  RETURN QUERY SELECT v_token, v_r.id, v_r.nome, v_r.email, v_r.telefone,
                      coalesce(v_r.comissao_percentual, 30);
END;
$$;

-- --- leitura ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.portal_fetch_maletas(p_token TEXT)
RETURNS TABLE(
  id UUID, nome TEXT, status TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  is_public BOOLEAN, slug TEXT, observacoes TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_rev UUID := public.session_subject(p_token, 'revendedora');
BEGIN
  RETURN QUERY
  SELECT m.id, m.nome, m.status, m.created_at, m.updated_at,
         m.is_public, m.sharing_slug AS slug, m.observacoes
    FROM public.maletas m
   WHERE m.revendedora_id = v_rev
   ORDER BY m.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_fetch_maleta_pecas(p_token TEXT, p_maleta_id UUID)
RETURNS TABLE(
  id UUID, quantidade INTEGER, quantidade_vendida INTEGER, vendida BOOLEAN,
  preco_unitario NUMERIC, data_venda DATE, peca_id UUID, peca_nome TEXT,
  peca_codigo TEXT, peca_preco_venda NUMERIC, peca_imagem_url TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_rev UUID := public.session_subject(p_token, 'revendedora');
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.maletas m
     WHERE m.id = p_maleta_id AND m.revendedora_id = v_rev
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT mp.id, mp.quantidade, mp.quantidade_vendida, mp.vendida,
         mp.preco_unitario, mp.data_venda,
         p.id, p.nome, p.codigo, p.preco_venda, p.imagem_url
    FROM public.maletas_pecas mp
    LEFT JOIN public.pecas p ON mp.peca_id = p.id
   WHERE mp.maleta_id = p_maleta_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_fetch_interesses(p_token TEXT)
RETURNS TABLE(
  id UUID, maleta_id UUID, cliente_nome TEXT, cliente_telefone TEXT,
  cliente_email TEXT, status TEXT, observacoes TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_rev UUID := public.session_subject(p_token, 'revendedora');
BEGIN
  RETURN QUERY
  SELECT mi.id, mi.maleta_id, mi.cliente_nome, mi.cliente_telefone,
         mi.cliente_email, mi.status, mi.observacoes, mi.created_at, mi.updated_at
    FROM public.maleta_interesses mi
    JOIN public.maletas m ON mi.maleta_id = m.id
   WHERE m.revendedora_id = v_rev
   ORDER BY mi.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_fetch_interesse_itens(p_token TEXT, p_interesse_id UUID)
RETURNS TABLE(
  id UUID, quantidade INTEGER, peca_id UUID,
  peca_nome TEXT, peca_codigo TEXT, peca_preco_venda NUMERIC
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_rev UUID := public.session_subject(p_token, 'revendedora');
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM public.maleta_interesses mi
      JOIN public.maletas m ON mi.maleta_id = m.id
     WHERE mi.id = p_interesse_id AND m.revendedora_id = v_rev
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT mii.id, mii.quantidade, p.id, p.nome, p.codigo, p.preco_venda
    FROM public.maleta_interesse_itens mii
    LEFT JOIN public.pecas p ON mii.peca_id = p.id
   WHERE mii.interesse_id = p_interesse_id;
END;
$$;

/**
 * Substitui a leitura direta de maletas/maleta_interesses que o hook
 * usePortalNotifications fazia como anon.
 */
CREATE OR REPLACE FUNCTION public.portal_fetch_notificacoes(p_token TEXT)
RETURNS TABLE(
  id UUID, cliente_nome TEXT, status TEXT,
  created_at TIMESTAMPTZ, maleta_id UUID, maleta_nome TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_rev UUID := public.session_subject(p_token, 'revendedora');
BEGIN
  RETURN QUERY
  SELECT mi.id, mi.cliente_nome, mi.status, mi.created_at, m.id, m.nome
    FROM public.maleta_interesses mi
    JOIN public.maletas m ON mi.maleta_id = m.id
   WHERE m.revendedora_id = v_rev
   ORDER BY mi.created_at DESC
   LIMIT 20;
END;
$$;

-- --- escrita ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.portal_marcar_vendida(
  p_token TEXT, p_maleta_peca_id UUID, p_quantidade_venda INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_rev UUID := public.session_subject(p_token, 'revendedora');
  v_id  UUID;
BEGIN
  IF coalesce(p_quantidade_venda, 0) <= 0 THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;

  -- Trava a linha: duas vendas simultâneas no portal não podem se sobrepor.
  SELECT mp.id INTO v_id
    FROM public.maletas_pecas mp
    JOIN public.maletas m ON mp.maleta_id = m.id
   WHERE mp.id = p_maleta_peca_id
     AND m.revendedora_id = v_rev
     FOR UPDATE OF mp;

  IF v_id IS NULL THEN
    RETURN false;
  END IF;

  -- Atômico: usa as colunas, não um snapshot lido antes.
  UPDATE public.maletas_pecas
     SET quantidade          = GREATEST(0, coalesce(quantidade, 0) - p_quantidade_venda),
         quantidade_vendida  = coalesce(quantidade_vendida, 0) + p_quantidade_venda,
         vendida             = (GREATEST(0, coalesce(quantidade, 0) - p_quantidade_venda) <= 0),
         data_venda          = CURRENT_DATE,
         updated_at          = now()
   WHERE id = v_id
     AND coalesce(quantidade, 0) >= p_quantidade_venda;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quantidade indisponível na maleta';
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_desfazer_venda(
  p_token TEXT, p_maleta_peca_id UUID, p_quantidade_desfazer INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_rev UUID := public.session_subject(p_token, 'revendedora');
  v_id  UUID;
BEGIN
  IF coalesce(p_quantidade_desfazer, 0) <= 0 THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;

  SELECT mp.id INTO v_id
    FROM public.maletas_pecas mp
    JOIN public.maletas m ON mp.maleta_id = m.id
   WHERE mp.id = p_maleta_peca_id
     AND m.revendedora_id = v_rev
     FOR UPDATE OF mp;

  IF v_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.maletas_pecas
     SET quantidade         = coalesce(quantidade, 0) + p_quantidade_desfazer,
         quantidade_vendida = coalesce(quantidade_vendida, 0) - p_quantidade_desfazer,
         vendida            = CASE WHEN coalesce(quantidade_vendida, 0) - p_quantidade_desfazer <= 0
                                   THEN false ELSE vendida END,
         data_venda         = CASE WHEN coalesce(quantidade_vendida, 0) - p_quantidade_desfazer <= 0
                                   THEN NULL ELSE data_venda END,
         updated_at         = now()
   WHERE id = v_id
     AND coalesce(quantidade_vendida, 0) >= p_quantidade_desfazer;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quantidade a desfazer maior que a quantidade vendida';
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_update_interesse_status(
  p_token TEXT, p_interesse_id UUID, p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_rev UUID := public.session_subject(p_token, 'revendedora');
BEGIN
  IF p_status NOT IN ('pendente', 'atendido', 'cancelado') THEN
    RAISE EXCEPTION 'Status inválido';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.maleta_interesses mi
      JOIN public.maletas m ON mi.maleta_id = m.id
     WHERE mi.id = p_interesse_id AND m.revendedora_id = v_rev
  ) THEN
    RETURN false;
  END IF;

  UPDATE public.maleta_interesses
     SET status = p_status, updated_at = now()
   WHERE id = p_interesse_id;

  RETURN true;
END;
$$;

-- --- remove as assinaturas antigas (as que aceitavam p_revendedora_id) ------

DROP FUNCTION IF EXISTS public.portal_login_lookup(TEXT);
DROP FUNCTION IF EXISTS public.portal_fetch_maletas(UUID);
DROP FUNCTION IF EXISTS public.portal_fetch_maleta_pecas(UUID, UUID);
DROP FUNCTION IF EXISTS public.portal_fetch_interesses(UUID);
DROP FUNCTION IF EXISTS public.portal_fetch_interesse_itens(UUID, UUID);
DROP FUNCTION IF EXISTS public.portal_marcar_vendida(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.portal_desfazer_venda(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.portal_update_interesse_status(UUID, UUID, TEXT);

-- Verificação de senha por id: só a Edge Function (service_role) pode chamar.
REVOKE ALL ON FUNCTION public.verify_portal_password_by_id(UUID, TEXT) FROM PUBLIC, anon, authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.proname = 'verify_portal_password') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.verify_portal_password(TEXT, TEXT) FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.portal_login(TEXT, TEXT)                          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_fetch_maletas(TEXT)                        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_fetch_maleta_pecas(TEXT, UUID)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_fetch_interesses(TEXT)                     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_fetch_interesse_itens(TEXT, UUID)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_fetch_notificacoes(TEXT)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_marcar_vendida(TEXT, UUID, INTEGER)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_desfazer_venda(TEXT, UUID, INTEGER)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_update_interesse_status(TEXT, UUID, TEXT)   TO anon, authenticated;

-- =============================================================================
-- SEÇÃO 3 — ÁREA DO CLIENTE DA LOJA: login com sessão + pedidos por token
-- =============================================================================
-- Antes: fetch_cliente_pedidos(email, org) devolvia o histórico de qualquer
-- cliente a quem soubesse o e-mail, e fetch_cliente_pedido_itens(pedido_id) não
-- checava nada.

CREATE OR REPLACE FUNCTION public.cliente_login(
  p_email TEXT, p_senha TEXT, p_organization_id UUID
)
RETURNS TABLE(token TEXT, cliente_id UUID, cliente_nome TEXT, cliente_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_c RECORD;
  v_email TEXT := lower(trim(coalesce(p_email, '')));
  v_token TEXT;
BEGIN
  IF v_email = '' OR coalesce(p_senha, '') = '' OR p_organization_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT public.check_rate_limit('cliente_login:' || v_email, 'cliente_login', 10, 600) THEN
    RAISE EXCEPTION 'MUITAS_TENTATIVAS' USING ERRCODE = '54000';
  END IF;

  SELECT c.id, c.nome, c.email
    INTO v_c
    FROM public.clientes c
   WHERE lower(c.email) = v_email
     AND c.organization_id = p_organization_id
     AND c.ativo = true
     AND c.senha IS NOT NULL
     AND c.senha = crypt(p_senha, c.senha)
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_token := public.session_open('cliente', v_c.id, p_organization_id);
  RETURN QUERY SELECT v_token, v_c.id, v_c.nome, v_c.email;
END;
$$;

CREATE OR REPLACE FUNCTION public.cliente_fetch_pedidos(p_token TEXT)
RETURNS TABLE(
  id UUID, numero_pedido BIGINT, status TEXT, valor_total NUMERIC,
  valor_frete NUMERIC, valor_desconto NUMERIC, created_at TIMESTAMPTZ,
  metodo_pagamento TEXT, codigo_rastreio TEXT, transportadora TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_cli   UUID := public.session_subject(p_token, 'cliente');
  v_email TEXT;
  v_org   UUID;
BEGIN
  SELECT lower(c.email), c.organization_id INTO v_email, v_org
    FROM public.clientes c WHERE c.id = v_cli;

  RETURN QUERY
  SELECT ep.id, ep.numero_pedido::BIGINT, ep.status, ep.valor_total,
         ep.valor_frete, ep.valor_desconto, ep.created_at,
         ep.metodo_pagamento, ep.codigo_rastreio, ep.transportadora
    FROM public.ecommerce_pedidos ep
   WHERE lower(ep.cliente_email) = v_email
     AND ep.organization_id = v_org
   ORDER BY ep.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.cliente_fetch_pedido_itens(p_token TEXT, p_pedido_id UUID)
RETURNS TABLE(
  id UUID, quantidade INTEGER, preco_unitario NUMERIC,
  peca_nome TEXT, peca_codigo TEXT, peca_imagem_url TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_cli   UUID := public.session_subject(p_token, 'cliente');
  v_email TEXT;
  v_org   UUID;
BEGIN
  SELECT lower(c.email), c.organization_id INTO v_email, v_org
    FROM public.clientes c WHERE c.id = v_cli;

  -- O pedido tem de ser do próprio cliente.
  IF NOT EXISTS (
    SELECT 1 FROM public.ecommerce_pedidos ep
     WHERE ep.id = p_pedido_id
       AND lower(ep.cliente_email) = v_email
       AND ep.organization_id = v_org
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT epi.id, epi.quantidade, epi.preco_unitario,
         p.nome, p.codigo, p.imagem_url
    FROM public.ecommerce_pedido_itens epi
    LEFT JOIN public.pecas p ON p.id = epi.peca_id
   WHERE epi.pedido_id = p_pedido_id;
END;
$$;

-- registrar_cliente_loja já valida e-mail/org; passa a devolver token também.
-- (mantém a assinatura antiga funcionando para não quebrar o checkout)
CREATE OR REPLACE FUNCTION public.cliente_registrar_com_sessao(
  p_nome TEXT, p_email TEXT, p_senha TEXT, p_telefone TEXT, p_organization_id UUID
)
RETURNS TABLE(token TEXT, cliente_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_id UUID;
BEGIN
  v_id := public.registrar_cliente_loja(p_nome, p_email, p_senha, p_telefone, p_organization_id);
  RETURN QUERY SELECT public.session_open('cliente', v_id, p_organization_id), v_id;
END;
$$;

DROP FUNCTION IF EXISTS public.fetch_cliente_pedidos(TEXT, UUID);
DROP FUNCTION IF EXISTS public.fetch_cliente_pedido_itens(UUID);
REVOKE ALL ON FUNCTION public.verify_cliente_password(TEXT, UUID) FROM PUBLIC, anon, authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.proname = 'verify_cliente_login') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.verify_cliente_login(TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.cliente_login(TEXT, TEXT, UUID)                            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cliente_fetch_pedidos(TEXT)                                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cliente_fetch_pedido_itens(TEXT, UUID)                     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cliente_registrar_com_sessao(TEXT, TEXT, TEXT, TEXT, UUID)  TO anon, authenticated;

-- =============================================================================
-- SEÇÃO 4 — purchases: fecha a leitura pública (nome, CPF, telefone, código)
-- =============================================================================

DO $$
BEGIN
  IF to_regclass('public.purchases') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Users can read purchases by access_code" ON public.purchases';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read purchases by access_code" ON public.purchases';
    EXECUTE 'DROP POLICY IF EXISTS "Service role can manage purchases" ON public.purchases';
    -- Nenhuma policy para anon/authenticated: o acesso é só via service_role
    -- (Edge Functions), que não passa por RLS.
    EXECUTE 'DROP POLICY IF EXISTS purchases_no_client_access ON public.purchases';
    EXECUTE 'CREATE POLICY purchases_no_client_access ON public.purchases
               FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
    EXECUTE 'REVOKE ALL ON TABLE public.purchases FROM anon, authenticated';
  END IF;
END $$;

-- =============================================================================
-- SEÇÃO 5 — ESCALADA DE PRIVILÉGIO
-- =============================================================================

-- 5.1 user_roles: ninguém dá role a si mesmo.
-- O bootstrap do primeiro admin continua funcionando: é feito pelo trigger
-- handle_new_user() (SECURITY DEFINER, não passa por RLS), e funcionários são
-- criados pela Edge Function criar-funcionario com service_role.
DROP POLICY IF EXISTS "roles_insert_own_policy" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;

-- Admin/gerente só concede role a quem é da própria organização.
DROP POLICY IF EXISTS roles_admin_grant_same_org ON public.user_roles;
CREATE POLICY roles_admin_grant_same_org ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.memberships m_target
       JOIN public.memberships m_self ON m_self.organization_id = m_target.organization_id
      WHERE m_target.user_id = user_roles.user_id
        AND m_self.user_id = auth.uid()
    )
  );

-- 5.2 profiles.is_super_admin não pode ser alterado pelo próprio usuário.
-- (Feito por trigger, e não por REVOKE de coluna: no Postgres um privilégio de
--  UPDATE no nível da TABELA — que o Supabase concede por padrão a
--  authenticated — não é anulado por REVOKE de coluna. Trigger cobre todos os
--  caminhos, inclusive RPC, e não quebra quando novas colunas são criadas.)
CREATE OR REPLACE FUNCTION public.proteger_is_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF coalesce(NEW.is_super_admin, false) IS DISTINCT FROM coalesce(OLD.is_super_admin, false) THEN
    -- auth.uid() nulo = chamada server-side (service_role, trigger, SQL Editor):
    -- é assim que o primeiro super admin é definido, então continua permitido.
    -- Já um usuário logado só altera a flag se ele mesmo for super admin.
    IF auth.uid() IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.user_id = auth.uid() AND p.is_super_admin = true
    ) THEN
      RAISE EXCEPTION 'Alteração de is_super_admin não permitida';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_is_super_admin ON public.profiles;
CREATE TRIGGER trg_proteger_is_super_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.proteger_is_super_admin();

-- 5.3 profiles: fecha o SELECT que expunha revendedoras a anônimos e o UPDATE
-- de perfis alheios herdado da linhagem antiga (colunas role/admin_id).
DROP POLICY IF EXISTS "Portal anon can view resellers or admin sees own resellers" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile or admins update their resellers" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert resellers under them" ON public.profiles;
DROP POLICY IF EXISTS "Admins delete their resellers" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view reseller profiles" ON public.profiles;

-- Equipe da mesma organização continua se vendo (telas de funcionários).
DROP POLICY IF EXISTS profiles_select_same_org ON public.profiles;
CREATE POLICY profiles_select_same_org ON public.profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
        FROM public.memberships m_self
        JOIN public.memberships m_other ON m_other.organization_id = m_self.organization_id
       WHERE m_self.user_id = auth.uid()
         AND m_other.user_id = profiles.user_id
    )
  );

-- 5.4 funcionario_permissoes: só admin/gerente da organização altera.
DROP POLICY IF EXISTS "Users can insert permissoes for their org funcionarios" ON public.funcionario_permissoes;
DROP POLICY IF EXISTS "Users can update permissoes of their org funcionarios" ON public.funcionario_permissoes;
DROP POLICY IF EXISTS "Users can delete permissoes of their org funcionarios" ON public.funcionario_permissoes;

DROP POLICY IF EXISTS perm_admin_manage ON public.funcionario_permissoes;
CREATE POLICY perm_admin_manage ON public.funcionario_permissoes
  FOR ALL TO authenticated
  USING (
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'))
    AND funcionario_id IN (
      SELECT f.id FROM public.funcionarios f
       WHERE f.organization_id = public.get_user_organization_id()
    )
  )
  WITH CHECK (
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'))
    AND funcionario_id IN (
      SELECT f.id FROM public.funcionarios f
       WHERE f.organization_id = public.get_user_organization_id()
    )
  );

-- =============================================================================
-- SEÇÃO 6 — CÓDIGOS DE ACESSO (planos pagos)
-- =============================================================================

-- 6.1 Qualquer anônimo podia marcar um código não usado como usado (queimar o
-- acesso de quem pagou). O consumo legítimo é feito pelo trigger
-- ativar_codigo_no_signup() (SECURITY DEFINER) e pelas Edge Functions.
DROP POLICY IF EXISTS codigos_acesso_update_on_use ON public.codigos_acesso;

-- 6.2 get_pending_access_code(email) permitia enumerar quem comprou e capturar
-- o código. Sai do alcance do cliente: passa a ser chamada pela Edge Function
-- consultar-codigo-pendente, que aplica rate limit por IP.
REVOKE ALL ON FUNCTION public.get_pending_access_code(TEXT) FROM PUBLIC, anon, authenticated;

-- 6.3 A validação do código na tela de cadastro lia codigos_acesso direto do
-- cliente (não autenticado) — a policy atual só libera para o dono autenticado,
-- então a leitura retornava vazio e o cadastro pago não validava.
-- A tela passa a usar a Edge Function validate-access (já existente, com rate
-- limit). Aqui só garantimos que não há caminho anônimo de leitura da tabela.
DROP POLICY IF EXISTS codigos_acesso_select_by_code ON public.codigos_acesso;
DROP POLICY IF EXISTS "Anyone can validate access codes" ON public.codigos_acesso;

-- 6.4 Ativação do código: era feita pelo cliente (SELECT + UPDATE direto), sem
-- nenhuma amarração entre o código e o e-mail do usuário — quem conhecesse um
-- código válido ativava o plano na própria conta. Passa a ser uma RPC única,
-- transacional e idempotente, com a mesma regra do trigger de signup:
-- o e-mail do código tem de ser o e-mail do usuário logado.
CREATE OR REPLACE FUNCTION public.ativar_codigo_acesso(p_codigo TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code   public.codigos_acesso%ROWTYPE;
  v_email  TEXT := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_dias   INT;
  v_valor  NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF NOT public.check_rate_limit('ativar_codigo:' || auth.uid()::text, 'ativar_codigo', 10, 600) THEN
    RAISE EXCEPTION 'MUITAS_TENTATIVAS' USING ERRCODE = '54000';
  END IF;

  SELECT * INTO v_code
    FROM public.codigos_acesso
   WHERE codigo = upper(trim(p_codigo))
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'codigo_invalido');
  END IF;

  -- Já usado pelo próprio usuário: idempotente.
  IF v_code.usado AND v_code.usado_por = auth.uid() THEN
    RETURN jsonb_build_object('ok', true, 'plano', v_code.plano, 'reaproveitado', true);
  END IF;

  IF v_code.usado THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'codigo_ja_usado');
  END IF;

  IF v_code.valido_ate <= now() THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'codigo_expirado');
  END IF;

  IF v_email = '' OR lower(v_code.email) <> v_email THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'email_divergente');
  END IF;

  v_dias  := CASE WHEN v_code.periodo = 'anual' THEN 365 ELSE 30 END;
  v_valor := CASE WHEN v_code.periodo = 'anual' THEN v_code.valor_pago / 12.0 ELSE v_code.valor_pago END;

  INSERT INTO public.assinaturas (
    user_id, plano, status, data_inicio, data_vencimento,
    valor_mensal, metodo_pagamento, mercadopago_payment_id, trial_ativo
  ) VALUES (
    auth.uid(), v_code.plano, 'ativo', now(), now() + make_interval(days => v_dias),
    round(v_valor, 2), 'pix', v_code.mercadopago_payment_id, false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plano           = EXCLUDED.plano,
    status          = 'ativo',
    data_inicio     = EXCLUDED.data_inicio,
    data_vencimento = EXCLUDED.data_vencimento,
    valor_mensal    = EXCLUDED.valor_mensal,
    mercadopago_payment_id = COALESCE(EXCLUDED.mercadopago_payment_id,
                                      public.assinaturas.mercadopago_payment_id);

  UPDATE public.codigos_acesso
     SET usado = true, usado_por = auth.uid(), usado_em = now()
   WHERE id = v_code.id;

  RETURN jsonb_build_object('ok', true, 'plano', v_code.plano, 'periodo', v_code.periodo);
END;
$$;

REVOKE ALL ON FUNCTION public.ativar_codigo_acesso(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ativar_codigo_acesso(TEXT) TO authenticated;

-- =============================================================================
-- SEÇÃO 7 — POLICIES PERMISSIVAS LEGADAS
-- =============================================================================
-- O Postgres combina policies permissivas com OR: uma sobrevivente USING(true)
-- anula a policy org-scoped correta. Onde a substituta org-scoped já existe,
-- só derrubamos a frouxa; onde não existe, criamos ANTES de derrubar.

-- 7.1 fidelidade_transacoes — escopo via clientes.
DROP POLICY IF EXISTS fidelidade_select_org ON public.fidelidade_transacoes;
CREATE POLICY fidelidade_select_org ON public.fidelidade_transacoes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clientes c
     WHERE c.id = fidelidade_transacoes.cliente_id
       AND c.organization_id = public.get_user_organization_id()
  ));

DROP POLICY IF EXISTS fidelidade_write_org ON public.fidelidade_transacoes;
CREATE POLICY fidelidade_write_org ON public.fidelidade_transacoes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clientes c
     WHERE c.id = fidelidade_transacoes.cliente_id
       AND c.organization_id = public.get_user_organization_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clientes c
     WHERE c.id = fidelidade_transacoes.cliente_id
       AND c.organization_id = public.get_user_organization_id()
  ));

DROP POLICY IF EXISTS "Authenticated can view fidelidade" ON public.fidelidade_transacoes;
DROP POLICY IF EXISTS "Authenticated can manage fidelidade" ON public.fidelidade_transacoes;

-- 7.2 historico_precos — historico_precos_select_org/insert_org já existem.
DROP POLICY IF EXISTS "Authenticated can view historico_precos" ON public.historico_precos;
DROP POLICY IF EXISTS "System can create historico_precos" ON public.historico_precos;
DROP POLICY IF EXISTS "Users can insert own historico_precos" ON public.historico_precos;

-- 7.3 maletas_pecas — maletas_pecas_*_org + maletas_pecas_select_public_anon já
-- cobrem app e maleta pública. As de portal saem (o portal usa RPC agora).
DROP POLICY IF EXISTS "Authenticated can view maletas_pecas" ON public.maletas_pecas;
DROP POLICY IF EXISTS maletas_pecas_select_portal ON public.maletas_pecas;
DROP POLICY IF EXISTS maletas_pecas_update_portal ON public.maletas_pecas;

-- 7.4 romaneios_pecas — escopo via romaneios.
DROP POLICY IF EXISTS romaneios_pecas_select_org ON public.romaneios_pecas;
CREATE POLICY romaneios_pecas_select_org ON public.romaneios_pecas
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.romaneios r
     WHERE r.id = romaneios_pecas.romaneio_id
       AND r.organization_id = public.get_user_organization_id()
  ));
DROP POLICY IF EXISTS "Authenticated can view romaneios_pecas" ON public.romaneios_pecas;

-- 7.5 romaneios / romaneio_itens — INSERT com auth.role() frouxo.
DROP POLICY IF EXISTS "Authenticated users can insert romaneios" ON public.romaneios;
DROP POLICY IF EXISTS "Portal or authenticated can create romaneios" ON public.romaneios;
DROP POLICY IF EXISTS romaneios_insert_org ON public.romaneios;
CREATE POLICY romaneios_insert_org ON public.romaneios
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id());

DO $$
BEGIN
  IF to_regclass('public.romaneio_itens') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert romaneio items" ON public.romaneio_itens';
    EXECUTE 'DROP POLICY IF EXISTS "Portal or authenticated can create romaneio items" ON public.romaneio_itens';
  END IF;
END $$;

-- 7.6 catalogos_pecas — anon_select_catalogos_pecas (catálogo público) já existe.
DROP POLICY IF EXISTS "Anyone can view catalogos_pecas" ON public.catalogos_pecas;
DROP POLICY IF EXISTS catalogos_pecas_select_org ON public.catalogos_pecas;
CREATE POLICY catalogos_pecas_select_org ON public.catalogos_pecas
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.catalogos c
     WHERE c.id = catalogos_pecas.catalogo_id
       AND c.organization_id = public.get_user_organization_id()
  ));

-- 7.7 maleta_interesses / _itens — leitura era liberada a qualquer autenticado
-- (PII de clientes de maletas públicas, cross-tenant) e o INSERT anônimo era
-- direto na tabela. O caminho público legítimo é a RPC criar_interesse_maleta.
DROP POLICY IF EXISTS maleta_interesses_select_public ON public.maleta_interesses;
DROP POLICY IF EXISTS maleta_interesses_update_portal ON public.maleta_interesses;
DROP POLICY IF EXISTS "Anyone can create interesse" ON public.maleta_interesses;
DROP POLICY IF EXISTS maleta_interesse_itens_select_public ON public.maleta_interesse_itens;
DROP POLICY IF EXISTS "Anyone can create interesse items" ON public.maleta_interesse_itens;
DROP POLICY IF EXISTS "Authenticated can view interesse_itens" ON public.maleta_interesse_itens;

DROP POLICY IF EXISTS interesses_select_org ON public.maleta_interesses;
CREATE POLICY interesses_select_org ON public.maleta_interesses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.maletas m
     WHERE m.id = maleta_interesses.maleta_id
       AND m.organization_id = public.get_user_organization_id()
  ));

DROP POLICY IF EXISTS interesses_update_org ON public.maleta_interesses;
CREATE POLICY interesses_update_org ON public.maleta_interesses
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.maletas m
     WHERE m.id = maleta_interesses.maleta_id
       AND m.organization_id = public.get_user_organization_id()
  ));

DROP POLICY IF EXISTS interesse_itens_select_org ON public.maleta_interesse_itens;
CREATE POLICY interesse_itens_select_org ON public.maleta_interesse_itens
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
      FROM public.maleta_interesses mi
      JOIN public.maletas m ON m.id = mi.maleta_id
     WHERE mi.id = maleta_interesse_itens.interesse_id
       AND m.organization_id = public.get_user_organization_id()
  ));

-- 7.8 pedidos_catalogo / _itens — UPDATE e INSERT abertos (inclusive a anon).
-- O caminho público legítimo é a RPC criar_pedido_catalogo.
DROP POLICY IF EXISTS "Anyone can update pedidos_catalogo" ON public.pedidos_catalogo;
DROP POLICY IF EXISTS "Anyone can create pedidos_catalogo" ON public.pedidos_catalogo;
DROP POLICY IF EXISTS "Qualquer um pode criar pedidos" ON public.pedidos_catalogo;
DROP POLICY IF EXISTS "Public can create orders on open catalogs" ON public.pedidos_catalogo;
DROP POLICY IF EXISTS "Qualquer um pode criar itens de pedido" ON public.pedidos_catalogo_itens;
DROP POLICY IF EXISTS "Public can create order items for existing orders" ON public.pedidos_catalogo_itens;

DROP POLICY IF EXISTS pedidos_catalogo_manage_org ON public.pedidos_catalogo;
CREATE POLICY pedidos_catalogo_manage_org ON public.pedidos_catalogo
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.catalogos c
     WHERE c.id = pedidos_catalogo.catalogo_id
       AND c.organization_id = public.get_user_organization_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.catalogos c
     WHERE c.id = pedidos_catalogo.catalogo_id
       AND c.organization_id = public.get_user_organization_id()
  ));

DROP POLICY IF EXISTS pedidos_catalogo_itens_manage_org ON public.pedidos_catalogo_itens;
CREATE POLICY pedidos_catalogo_itens_manage_org ON public.pedidos_catalogo_itens
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1
      FROM public.pedidos_catalogo pc
      JOIN public.catalogos c ON c.id = pc.catalogo_id
     WHERE pc.id = pedidos_catalogo_itens.pedido_id
       AND c.organization_id = public.get_user_organization_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1
      FROM public.pedidos_catalogo pc
      JOIN public.catalogos c ON c.id = pc.catalogo_id
     WHERE pc.id = pedidos_catalogo_itens.pedido_id
       AND c.organization_id = public.get_user_organization_id()
  ));

-- 7.9 notificacoes — INSERT com WITH CHECK(true) permitia injetar notificação
-- em qualquer usuário de qualquer tenant. Passa a permitir só o próprio usuário
-- ou colegas da mesma organização (triggers e Edge Functions usam
-- SECURITY DEFINER / service_role e não passam por aqui).
DROP POLICY IF EXISTS "System can create notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS notificacoes_insert_self ON public.notificacoes;
CREATE POLICY notificacoes_insert_self ON public.notificacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
        FROM public.memberships m_self
        JOIN public.memberships m_target ON m_target.organization_id = m_self.organization_id
       WHERE m_self.user_id = auth.uid()
         AND m_target.user_id = notificacoes.user_id
    )
  );

-- 7.10 agente_mensagens — INSERT só checava que a conversa existe.
DROP POLICY IF EXISTS "Validated message creation" ON public.agente_mensagens;
DROP POLICY IF EXISTS agente_mensagens_insert_org ON public.agente_mensagens;
CREATE POLICY agente_mensagens_insert_org ON public.agente_mensagens
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.agente_conversas ac
     WHERE ac.id = agente_mensagens.conversa_id
       AND ac.organization_id = public.get_user_organization_id()
  ));

-- 7.11 loja_avise_me / loja_favoritos / newsletter — INSERT público continua
-- (formulários da loja), leitura passa a ser da organização dona.
DROP POLICY IF EXISTS "Public select own avise_me" ON public.loja_avise_me;
DROP POLICY IF EXISTS "Anyone can register avise_me" ON public.loja_avise_me;
DROP POLICY IF EXISTS avise_me_select_org ON public.loja_avise_me;
CREATE POLICY avise_me_select_org ON public.loja_avise_me
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Public select favoritos" ON public.loja_favoritos;
DROP POLICY IF EXISTS "Public delete favoritos" ON public.loja_favoritos;
DROP POLICY IF EXISTS favoritos_select_org ON public.loja_favoritos;
CREATE POLICY favoritos_select_org ON public.loja_favoritos
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS newsletter_select_org ON public.newsletter_subscribers;
CREATE POLICY newsletter_select_org ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id());

-- 7.12 pecas — 17 policies de 3 gerações. Consolida em: leitura/escrita da
-- organização + as duas leituras anônimas legítimas (loja e catálogo público)
-- + leitura anônima das peças de maletas PÚBLICAS (MaletaPublicaPage).
DROP POLICY IF EXISTS "Users can insert own pecas" ON public.pecas;
DROP POLICY IF EXISTS "Users can update own pecas" ON public.pecas;
DROP POLICY IF EXISTS "Users can delete own pecas" ON public.pecas;
DROP POLICY IF EXISTS "Users see own pecas or anon sees public catalog pecas" ON public.pecas;
DROP POLICY IF EXISTS "Usuários podem ver suas peças" ON public.pecas;
DROP POLICY IF EXISTS "Usuários podem criar peças" ON public.pecas;
DROP POLICY IF EXISTS "Usuários podem atualizar suas peças" ON public.pecas;
DROP POLICY IF EXISTS "Usuários podem deletar suas peças" ON public.pecas;
DROP POLICY IF EXISTS "Users can view their own pecas" ON public.pecas;
DROP POLICY IF EXISTS "Users can insert their own pecas" ON public.pecas;
DROP POLICY IF EXISTS "Users can update their own pecas" ON public.pecas;
DROP POLICY IF EXISTS "Users can delete their own pecas" ON public.pecas;
DROP POLICY IF EXISTS "Users can view org pecas" ON public.pecas;
DROP POLICY IF EXISTS pecas_select_portal ON public.pecas;

DROP POLICY IF EXISTS pecas_write_org ON public.pecas;
CREATE POLICY pecas_write_org ON public.pecas
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS pecas_select_maleta_publica ON public.pecas;
CREATE POLICY pecas_select_maleta_publica ON public.pecas
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1
      FROM public.maletas_pecas mp
      JOIN public.maletas m ON m.id = mp.maleta_id
     WHERE mp.peca_id = pecas.id
       AND m.is_public = true
       AND m.sharing_slug IS NOT NULL
  ));

-- 7.13 maletas — remove leituras anônimas amplas e resquícios da linhagem
-- antiga (colunas admin_id/reseller_id). anon_can_view_public_maletas e
-- maletas_*_policy continuam cobrindo maleta pública e app.
DROP POLICY IF EXISTS "Portal or owner can view maletas" ON public.maletas;
DROP POLICY IF EXISTS "Admin sees own maletas or reseller sees their maletas" ON public.maletas;
DROP POLICY IF EXISTS "Users see own maletas or admin sees their maletas" ON public.maletas;
DROP POLICY IF EXISTS "Admins can insert maletas for their resellers" ON public.maletas;
DROP POLICY IF EXISTS "Admins can update their maletas" ON public.maletas;
DROP POLICY IF EXISTS "Admins can delete their maletas" ON public.maletas;
DROP POLICY IF EXISTS "Usuários podem ver suas maletas" ON public.maletas;
DROP POLICY IF EXISTS "Usuários podem criar maletas" ON public.maletas;
DROP POLICY IF EXISTS "Usuários podem atualizar suas maletas" ON public.maletas;
DROP POLICY IF EXISTS "Usuários podem deletar suas maletas" ON public.maletas;
DROP POLICY IF EXISTS "Users can view their own maletas" ON public.maletas;
DROP POLICY IF EXISTS "Users can insert their own maletas" ON public.maletas;
DROP POLICY IF EXISTS "Users can update their own maletas" ON public.maletas;
DROP POLICY IF EXISTS "Users can delete their own maletas" ON public.maletas;

-- 7.14 maleta_itens (tabela da linhagem antiga, se existir).
DO $$
BEGIN
  IF to_regclass('public.maleta_itens') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view maleta items for portal" ON public.maleta_itens';
  END IF;
END $$;

-- 7.15 Ramos anônimos escondidos em policies que "parecem" escopadas.
-- Estas não usam USING(true): elas têm um `OR auth.uid() IS NULL` /
-- `OR auth.role() IS NULL`, que vale exatamente para quem chama com a chave
-- anon. Nenhuma tela pública precisa desses caminhos — as páginas públicas usam
-- as RPCs criar_pedido_catalogo / criar_interesse_maleta e as views *_public.

-- Leitura anônima de TODOS os pedidos de catálogo (nome, telefone, e-mail).
DROP POLICY IF EXISTS "Users see pedidos from own catalogos" ON public.pedidos_catalogo;
DROP POLICY IF EXISTS "Users see pedido items from own catalogos" ON public.pedidos_catalogo_itens;

-- Leitura anônima de PII de clientes interessados (era o caminho do portal).
DROP POLICY IF EXISTS maleta_interesses_select_portal ON public.maleta_interesses;
DROP POLICY IF EXISTS maleta_interesse_itens_select_portal ON public.maleta_interesse_itens;

-- Escrita anônima em romaneios de qualquer organização.
DROP POLICY IF EXISTS "Allow romaneios insert with org_id" ON public.romaneios;
DROP POLICY IF EXISTS "Allow romaneios_pecas insert" ON public.romaneios_pecas;

-- romaneios_pecas: a policy de escrita não tinha escopo de organização
-- (has_role admin/gerente valia para itens de qualquer tenant).
DROP POLICY IF EXISTS "Admins can manage romaneios_pecas" ON public.romaneios_pecas;
DROP POLICY IF EXISTS romaneios_pecas_write_org ON public.romaneios_pecas;
CREATE POLICY romaneios_pecas_write_org ON public.romaneios_pecas
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.romaneios r
     WHERE r.id = romaneios_pecas.romaneio_id
       AND r.organization_id = public.get_user_organization_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.romaneios r
     WHERE r.id = romaneios_pecas.romaneio_id
       AND r.organization_id = public.get_user_organization_id()
  ));

-- agente_conversas: INSERT anônimo com qualquer organization_id. O webhook do
-- WhatsApp usa service_role (não passa por RLS), então o ramo anônimo é
-- desnecessário.
DROP POLICY IF EXISTS "Authenticated or service can create conversations" ON public.agente_conversas;
DROP POLICY IF EXISTS agente_conversas_insert_org ON public.agente_conversas;
CREATE POLICY agente_conversas_insert_org ON public.agente_conversas
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id());

-- =============================================================================
-- SEÇÃO 8 — ESTOQUE ATÔMICO (PDV, maletas, devoluções)
-- =============================================================================
-- O app fazia SELECT estoque → calcular no JS → UPDATE estoque = valor. Dois
-- caixas simultâneos perdiam baixa (lost update), agravado pelo cache de 10 min
-- do React Query. Esta RPC resolve no banco, em uma única instrução.

CREATE OR REPLACE FUNCTION public.ajustar_estoque_peca(
  p_peca_id UUID,
  p_delta INTEGER,
  p_permitir_negativo BOOLEAN DEFAULT false
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org       UUID;
  v_novo      INTEGER;
BEGIN
  SELECT organization_id INTO v_org FROM public.pecas WHERE id = p_peca_id;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Peça não encontrada';
  END IF;
  IF NOT public.user_belongs_to_org(v_org) THEN
    RAISE EXCEPTION 'Sem permissão para movimentar o estoque desta peça';
  END IF;

  UPDATE public.pecas
     SET estoque = CASE
                     WHEN p_permitir_negativo THEN coalesce(estoque, 0) + p_delta
                     ELSE GREATEST(0, coalesce(estoque, 0) + p_delta)
                   END,
         updated_at = now()
   WHERE id = p_peca_id
  RETURNING estoque INTO v_novo;

  RETURN v_novo;
END;
$$;

REVOKE ALL ON FUNCTION public.ajustar_estoque_peca(UUID, INTEGER, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ajustar_estoque_peca(UUID, INTEGER, BOOLEAN) TO authenticated;

-- =============================================================================
-- SEÇÃO 9 — EXECUTE de funções sensíveis fora do alcance de anon
-- =============================================================================
-- Em 213 migrations havia UM único REVOKE: todas as demais funções SECURITY
-- DEFINER mantinham o EXECUTE default para PUBLIC. Estas só são chamadas por
-- Edge Functions (service_role) ou por usuários logados.

DO $$
DECLARE
  v_sig TEXT;
  v_anon_only TEXT[] := ARRAY[
    -- só service_role (Edge Functions)
    'public.check_rate_limit(text, text, integer, integer)',
    'public.debitar_estoque_ecommerce(uuid, integer)',
    'public.gerar_codigo_acesso()',
    'public.cleanup_rate_limits()',
    'public.cleanup_webhook_queue()',
    'public.cleanup_edge_function_errors()',
    'public.hash_portal_password(text)',
    'public.hash_cliente_password()',
    'public.provisionar_ecommerce_config(uuid, text)',
    'public.criar_dados_exemplo(uuid)',
    'public.seed_default_email_templates(uuid)',
    -- só usuário logado
    'public.maleta_adicionar_peca(uuid, uuid, integer)',
    'public.maleta_conferir(uuid, jsonb)',
    'public.maleta_fechar_v2(uuid)',
    'public.maleta_marcar_perdida(uuid, integer, text)',
    'public.maleta_registrar_venda(uuid, integer, numeric)',
    'public.maleta_remover_peca(uuid)',
    'public.maleta_desfazer_venda(uuid, integer)',
    'public.maleta_excluir_definitivo(uuid, boolean)',
    'public.reabrir_maleta(uuid, text)',
    'public.transferir_peca_entre_maletas(uuid, uuid, integer)',
    'public.ranking_revendedoras_mes(date)',
    'public.sugerir_reposicao_revendedora(uuid)',
    'public.maletas_vencidas()',
    'public.log_activity(text, text, uuid, jsonb)'
  ];
BEGIN
  FOREACH v_sig IN ARRAY v_anon_only LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', v_sig);
    EXCEPTION WHEN OTHERS THEN
      -- Assinatura diferente nesta base (ou função inexistente): ignora, para não
      -- abortar a migration inteira. A query de conferência da Seção 10 lista o
      -- que ainda ficou executável por anon, com a assinatura exata.
      RAISE NOTICE 'REVOKE ignorado (%): %', SQLERRM, v_sig;
    END;
  END LOOP;
END $$;

-- =============================================================================
-- SEÇÃO 10 — CONFERÊNCIA (rodar depois, no SQL Editor)
-- =============================================================================
-- 1) Policies permissivas que ainda restam:
--
--    SELECT tablename, policyname, cmd, roles, qual, with_check
--      FROM pg_policies
--     WHERE schemaname = 'public'
--       AND (qual ILIKE '%true%' OR with_check ILIKE '%true%')
--     ORDER BY tablename;
--
-- 2) Funções SECURITY DEFINER ainda executáveis por anon:
--
--    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
--      FROM pg_proc p
--      JOIN pg_namespace n ON n.oid = p.pronamespace
--     WHERE n.nspname = 'public' AND p.prosecdef
--       AND has_function_privilege('anon', p.oid, 'EXECUTE')
--     ORDER BY 1;
--
-- 3) Tabelas sem RLS:
--
--    SELECT tablename FROM pg_tables t
--     WHERE schemaname = 'public'
--       AND NOT EXISTS (SELECT 1 FROM pg_class c
--                        WHERE c.relname = t.tablename AND c.relrowsecurity);
-- =============================================================================
