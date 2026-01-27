-- Create trigger function to notify revendedora of new orders
CREATE OR REPLACE FUNCTION public.notificar_novo_pedido_revendedora()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_maleta RECORD;
  v_revendedora RECORD;
  v_pecas_count INT;
  v_valor_total NUMERIC := 0;
BEGIN
  -- Get maleta and revendedora info
  SELECT m.*, r.user_id as revendedora_user_id, r.nome as revendedora_nome, r.id as revendedora_id
  INTO v_maleta
  FROM maletas m
  LEFT JOIN revendedoras r ON m.revendedora_id = r.id
  WHERE m.id = NEW.maleta_id;

  -- Only proceed if maleta has a revendedora with a user_id
  IF v_maleta.revendedora_user_id IS NOT NULL THEN
    -- Count items in the interesse
    SELECT COUNT(*), COALESCE(SUM(mii.quantidade * COALESCE(p.preco_venda, 0)), 0)
    INTO v_pecas_count, v_valor_total
    FROM maleta_interesse_itens mii
    LEFT JOIN pecas p ON mii.peca_id = p.id
    WHERE mii.interesse_id = NEW.id;

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
      'novo_pedido_portal',
      '🛒 Novo Pedido Recebido!',
      NEW.cliente_nome || ' fez um pedido de ' || 
        COALESCE(v_pecas_count, 0) || ' item(s) na maleta "' || COALESCE(v_maleta.nome, 'Maleta') || '". Acesse o portal para aprovar!',
      '/portal/' || v_maleta.revendedora_id,
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_notificar_novo_pedido_revendedora ON maleta_interesses;

CREATE TRIGGER trigger_notificar_novo_pedido_revendedora
AFTER INSERT ON maleta_interesses
FOR EACH ROW
EXECUTE FUNCTION public.notificar_novo_pedido_revendedora();