-- =============================================================================
-- Desativa o "oráculo de senha" do portal antigo
-- =============================================================================
-- A Edge Function `verificar-senha-portal` continua publicada e responde a
-- qualquer pessoa, testando senha de revendedora sem limite de tentativas. Ela
-- funciona porque chama a função `verify_portal_password_by_id` com a chave de
-- serviço. O site novo não usa mais nenhuma das duas — entra pelo `portal_login`,
-- que confere a senha e aplica limite de 10 tentativas por e-mail a cada 10 min.
--
-- Removendo a função do banco, a Edge Function antiga passa a falhar mesmo que
-- continue publicada. É o mesmo efeito de apagá-la, e dá para fazer pelo
-- SQL Editor.
--
-- Idempotente.
-- =============================================================================

DROP FUNCTION IF EXISTS public.verify_portal_password_by_id(uuid, text);
DROP FUNCTION IF EXISTS public.verify_portal_password(text, text);
DROP FUNCTION IF EXISTS public.verify_portal_password(uuid, text);

-- Confirmação: as duas consultas abaixo devem voltar VAZIAS.
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS argumentos
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname LIKE 'verify_portal_password%';
