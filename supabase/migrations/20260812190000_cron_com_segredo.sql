-- =============================================================================
-- Crons passam a enviar x-cron-secret, e os 4 jobs que faltavam entram no ar
-- =============================================================================
--
-- PROBLEMA QUE ISTO RESOLVE
--
-- Os agendamentos anteriores chamavam as Edge Functions com apenas
-- `Authorization: Bearer <anon_key>`. As funções protegidas por
-- `requireCronSecret` liberavam a chamada só porque CRON_SECRET não estava
-- configurado. No momento em que o segredo fosse configurado — como o
-- SEGURANCA.md recomenda — todos os jobs passariam a responder 401 em silêncio:
-- nenhuma assinatura expiraria e nenhum aviso de vencimento sairia.
--
-- Agora o segredo viaja no header `x-cron-secret`, lido do Vault. Configurar o
-- CRON_SECRET deixou de ter efeito colateral.
--
-- -----------------------------------------------------------------------------
-- O QUE VOCÊ PRECISA FAZER PARA FECHAR DE VERDADE (dois lugares, mesmo valor)
--
--   1. Painel → Project Settings → Edge Functions → Secrets
--      Nome: CRON_SECRET      Valor: <uma senha longa e aleatória>
--
--   2. Painel → SQL Editor, uma vez:
--      SELECT vault.create_secret('<a MESMA senha>', 'cron_secret');
--
-- Enquanto os dois não estiverem preenchidos nada quebra: o header vai vazio e
-- as funções continuam liberando, exatamente como hoje. Quando estiverem, os
-- endpoints fecham para o resto do mundo e os jobs seguem funcionando.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- -----------------------------------------------------------------------------
-- Helper: chama uma Edge Function já com o segredo de cron
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invoke_edge_function(
  fn text,
  payload jsonb DEFAULT '{}'::jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $function$
DECLARE
  v_secret text;
  v_request_id bigint;
BEGIN
  -- Ausente no Vault → header vazio → a função decide (hoje, libera).
  BEGIN
    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
    WHERE name = 'cron_secret'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_secret := NULL;
  END;

  SELECT net.http_post(
    url := 'https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/' || fn,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', COALESCE(v_secret, '')
    ),
    body := payload || jsonb_build_object('triggered_at', now()::text, 'source', 'cron')
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.invoke_edge_function(text, jsonb) FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Reagendar tudo pelo helper
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT jobname FROM cron.job WHERE jobname IN (
    'verificar-assinaturas-diario',
    'verificar-lembretes-cada-15min',
    'process-webhook-queue-every-minute',
    'verificar-alertas-diario',
    'verificar-fiado-diario',
    'automacoes-vendas-horario',
    'follow-up-agente-diario'
  ) LOOP
    PERFORM cron.unschedule(r.jobname);
  END LOOP;
END $$;

-- Já existiam, agora com o header correto -------------------------------------

-- 8h BRT (11:00 UTC): expira planos vencidos e avisa quem está por vencer.
SELECT cron.schedule(
  'verificar-assinaturas-diario', '0 11 * * *',
  $$SELECT public.invoke_edge_function('verificar-assinaturas');$$
);

-- A cada 15 minutos: lembretes de agendamento por WhatsApp e e-mail.
SELECT cron.schedule(
  'verificar-lembretes-cada-15min', '*/15 * * * *',
  $$SELECT public.invoke_edge_function('verificar-lembretes');$$
);

-- A cada minuto: fila de webhooks de pagamento.
SELECT cron.schedule(
  'process-webhook-queue-every-minute', '* * * * *',
  $$SELECT public.invoke_edge_function('process-webhook-queue');$$
);

-- Faltavam ---------------------------------------------------------------------

-- A tela de Alertas Inteligentes já dizia "verificados automaticamente
-- diariamente às 8h", mas nunca existiu agendamento para esta função.
SELECT cron.schedule(
  'verificar-alertas-diario', '0 11 * * *',
  $$SELECT public.invoke_edge_function('verificar-alertas');$$
);

-- 9h BRT: cobrança de fiado vencido.
SELECT cron.schedule(
  'verificar-fiado-diario', '0 12 * * *',
  $$SELECT public.invoke_edge_function('verificar-fiado');$$
);

-- De hora em hora: automações de venda (carrinho abandonado, pós-venda).
SELECT cron.schedule(
  'automacoes-vendas-horario', '0 * * * *',
  $$SELECT public.invoke_edge_function('automacoes-vendas');$$
);

-- 10h BRT: follow-up do agente de IA.
SELECT cron.schedule(
  'follow-up-agente-diario', '0 13 * * *',
  $$SELECT public.invoke_edge_function('follow-up-agente');$$
);

-- =============================================================================
-- ⚠️ PRIMEIRA EXECUÇÃO DOS QUATRO JOBS NOVOS
--
-- verificar-fiado, automacoes-vendas e follow-up-agente nunca rodaram. A
-- primeira execução vai processar todo o histórico acumulado das lojas de uma
-- vez — potencialmente muitas cobranças e mensagens no mesmo minuto.
--
-- Acompanhe a primeira rodada de cada um:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- Para pausar um job específico sem remover:
--   UPDATE cron.job SET active = false WHERE jobname = 'automacoes-vendas-horario';
-- =============================================================================
