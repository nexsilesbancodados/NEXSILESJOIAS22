-- =============================================================================
-- Sessão: resolver o token não pode escrever no banco
-- =============================================================================
-- Sintoma: pelo PostgREST, portal_fetch_maletas(p_token) devolvia
--   25006 — "cannot execute UPDATE in a read-only transaction"
--
-- Causa: o PostgREST executa função STABLE/IMMUTABLE dentro de uma transação
-- READ ONLY. As funções de leitura do portal e da loja são STABLE (correto: só
-- leem), mas chamavam `session_subject()`, que atualizava `last_seen_at` da
-- sessão. Uma escrita dentro de transação somente-leitura aborta a chamada.
--
-- Isso não aparece ao chamar a função direto no SQL Editor (transação normal,
-- read-write) — só pela API. Por isso passou nos testes locais.
--
-- Correção: `session_subject` passa a ser somente leitura (STABLE). Perde-se a
-- "última atividade" da sessão, que era só informativa — a validade continua
-- sendo o `expires_at` de 12h definido no login.
--
-- Idempotente.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.session_subject(p_token TEXT, p_subject_type TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT s.subject_id
    INTO v_id
    FROM public.public_sessions s
   WHERE s.token_hash = public.session_hash(p_token)
     AND s.subject_type = p_subject_type
     AND s.expires_at > now();

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'SESSAO_INVALIDA' USING ERRCODE = '28000';
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.session_subject(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- `session_open` continua escrevendo (é chamada pelos logins, que são VOLATILE),
-- e a limpeza de sessões vencidas acontece lá. Nada a mudar nela.

-- ---------------------------------------------------------------------------
-- Conferência: simula o que o PostgREST faz com função STABLE.
--
--   BEGIN;
--     SET TRANSACTION READ ONLY;
--     SELECT * FROM public.portal_fetch_maletas('token-invalido');  -- deve dar
--     -- SESSAO_INVALIDA (28000), e NÃO 25006 read-only
--   ROLLBACK;
-- ---------------------------------------------------------------------------
