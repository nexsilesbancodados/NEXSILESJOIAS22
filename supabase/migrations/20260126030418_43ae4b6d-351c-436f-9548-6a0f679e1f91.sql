-- Create function to notify revendedora when a new interest is registered
CREATE OR REPLACE FUNCTION public.notificar_interesse_maleta()
RETURNS TRIGGER AS $$
DECLARE
  v_maleta RECORD;
  v_revendedora RECORD;
  v_pecas_count INT;
BEGIN
  -- Get maleta and revendedora info
  SELECT m.*, r.user_id as revendedora_user_id, r.nome as revendedora_nome
  INTO v_maleta
  FROM maletas m
  LEFT JOIN revendedoras r ON m.revendedora_id = r.id
  WHERE m.id = NEW.maleta_id;

  -- Only proceed if maleta has a revendedora with a user_id
  IF v_maleta.revendedora_user_id IS NOT NULL THEN
    -- Count items in the interest
    SELECT COUNT(*) INTO v_pecas_count
    FROM maleta_interesse_itens
    WHERE interesse_id = NEW.id;

    -- Create notification for revendedora
    INSERT INTO public.notificacoes (
      user_id,
      tipo,
      titulo,
      mensagem,
      link,
      lida
    ) VALUES (
      v_maleta.revendedora_user_id,
      'interesse_maleta',
      'Novo interesse na sua maleta!',
      NEW.cliente_nome || ' demonstrou interesse em ' || 
        CASE WHEN v_pecas_count > 0 THEN v_pecas_count || ' peça(s)' ELSE 'peças' END ||
        ' da maleta "' || COALESCE(v_maleta.nome, 'Maleta') || '"',
      '/revendedoras?maleta=' || v_maleta.id,
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new interests
DROP TRIGGER IF EXISTS trigger_notificar_interesse_maleta ON public.maleta_interesses;
CREATE TRIGGER trigger_notificar_interesse_maleta
  AFTER INSERT ON public.maleta_interesses
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_interesse_maleta();

-- Also notify when interest items are added (to update count)
CREATE OR REPLACE FUNCTION public.atualizar_notificacao_interesse()
RETURNS TRIGGER AS $$
DECLARE
  v_interesse RECORD;
  v_maleta RECORD;
  v_pecas_count INT;
  v_notificacao_id UUID;
BEGIN
  -- Get the interest
  SELECT * INTO v_interesse
  FROM maleta_interesses
  WHERE id = NEW.interesse_id;

  -- Get maleta and revendedora info
  SELECT m.*, r.user_id as revendedora_user_id
  INTO v_maleta
  FROM maletas m
  LEFT JOIN revendedoras r ON m.revendedora_id = r.id
  WHERE m.id = v_interesse.maleta_id;

  IF v_maleta.revendedora_user_id IS NOT NULL THEN
    -- Count total items
    SELECT COUNT(*) INTO v_pecas_count
    FROM maleta_interesse_itens
    WHERE interesse_id = NEW.interesse_id;

    -- Update the most recent notification for this interest
    UPDATE public.notificacoes
    SET mensagem = v_interesse.cliente_nome || ' demonstrou interesse em ' || 
        v_pecas_count || ' peça(s) da maleta "' || COALESCE(v_maleta.nome, 'Maleta') || '"'
    WHERE user_id = v_maleta.revendedora_user_id
      AND tipo = 'interesse_maleta'
      AND link = '/revendedoras?maleta=' || v_maleta.id
      AND created_at > NOW() - INTERVAL '1 minute';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for interest items
DROP TRIGGER IF EXISTS trigger_atualizar_notificacao_interesse ON public.maleta_interesse_itens;
CREATE TRIGGER trigger_atualizar_notificacao_interesse
  AFTER INSERT ON public.maleta_interesse_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_notificacao_interesse();