-- Criar função criar_notificacao que está faltando
CREATE OR REPLACE FUNCTION public.criar_notificacao(
  p_user_id UUID,
  p_tipo TEXT,
  p_titulo TEXT,
  p_mensagem TEXT,
  p_dados JSONB DEFAULT NULL,
  p_entidade_tipo TEXT DEFAULT NULL,
  p_entidade_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_notificacao_id UUID;
BEGIN
  INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, dados, entidade_tipo, entidade_id, lida)
  VALUES (p_user_id, p_tipo, p_titulo, p_mensagem, p_dados, p_entidade_tipo, p_entidade_id, false)
  RETURNING id INTO v_notificacao_id;
  
  RETURN v_notificacao_id;
END;
$function$;