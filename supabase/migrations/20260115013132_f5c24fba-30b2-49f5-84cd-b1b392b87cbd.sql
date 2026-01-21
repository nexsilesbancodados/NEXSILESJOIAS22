-- Drop existing log_activity function and recreate with proper handling
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_nome TEXT;
  v_tipo TEXT;
  v_descricao TEXT;
  v_valor NUMERIC := NULL;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  SELECT nome INTO v_user_nome FROM public.profiles WHERE id = v_user_id;
  
  -- Only set valor for tables that have the total column
  IF TG_TABLE_NAME IN ('vendas', 'romaneios') THEN
    IF TG_OP = 'DELETE' THEN
      v_valor := (OLD.total)::NUMERIC;
    ELSE
      v_valor := (NEW.total)::NUMERIC;
    END IF;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    v_tipo := 'criacao';
    v_descricao := 'Registro criado em ' || TG_TABLE_NAME;
    
    INSERT INTO public.historico_atividades (tipo, descricao, entidade, entidade_id, dados_novos, usuario_id, usuario_nome, valor)
    VALUES (v_tipo, v_descricao, TG_TABLE_NAME, NEW.id, to_jsonb(NEW), v_user_id, v_user_nome, v_valor);
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_tipo := 'atualizacao';
    v_descricao := 'Registro atualizado em ' || TG_TABLE_NAME;
    
    INSERT INTO public.historico_atividades (tipo, descricao, entidade, entidade_id, dados_anteriores, dados_novos, usuario_id, usuario_nome, valor)
    VALUES (v_tipo, v_descricao, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), v_user_id, v_user_nome, v_valor);
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_tipo := 'exclusao';
    v_descricao := 'Registro removido de ' || TG_TABLE_NAME;
    
    INSERT INTO public.historico_atividades (tipo, descricao, entidade, entidade_id, dados_anteriores, usuario_id, usuario_nome, valor)
    VALUES (v_tipo, v_descricao, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), v_user_id, v_user_nome, v_valor);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;