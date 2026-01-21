-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_estoque_baixo ON public.pecas;

-- =============================================
-- 4. Trigger for low stock notifications
-- =============================================
CREATE OR REPLACE FUNCTION public.check_estoque_baixo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Only trigger when stock goes below 5
  IF NEW.estoque < 5 AND (OLD.estoque IS NULL OR OLD.estoque >= 5) THEN
    -- Get admin user to notify
    FOR v_admin_id IN 
      SELECT id FROM public.profiles WHERE role = 'admin'
    LOOP
      PERFORM public.criar_notificacao(
        v_admin_id,
        'estoque_baixo',
        'Estoque Baixo: ' || NEW.nome,
        'A peça "' || NEW.nome || '" (Ref: ' || COALESCE(NEW.referencia, 'N/A') || ') está com estoque baixo: ' || NEW.estoque || ' unidades.',
        jsonb_build_object('peca_id', NEW.id, 'estoque', NEW.estoque),
        'peca',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_estoque_baixo
AFTER INSERT OR UPDATE OF estoque ON public.pecas
FOR EACH ROW
EXECUTE FUNCTION public.check_estoque_baixo();

-- =============================================
-- 5. Trigger for new catalog orders
-- =============================================
DROP TRIGGER IF EXISTS trigger_novo_pedido ON public.pedidos_catalogo;

CREATE OR REPLACE FUNCTION public.notify_novo_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Notify admins about new order
  FOR v_admin_id IN 
    SELECT id FROM public.profiles WHERE role = 'admin'
  LOOP
    PERFORM public.criar_notificacao(
      v_admin_id,
      'novo_pedido',
      'Novo Pedido do Catálogo',
      'Cliente: ' || NEW.cliente_nome || ' - Total: R$ ' || ROUND(NEW.total::numeric, 2),
      jsonb_build_object('pedido_id', NEW.id, 'cliente_nome', NEW.cliente_nome, 'total', NEW.total),
      'pedido_catalogo',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_novo_pedido
AFTER INSERT ON public.pedidos_catalogo
FOR EACH ROW
EXECUTE FUNCTION public.notify_novo_pedido();

-- =============================================
-- 6. Trigger for pending romaneios
-- =============================================
DROP TRIGGER IF EXISTS trigger_romaneio_pendente ON public.romaneios;

CREATE OR REPLACE FUNCTION public.notify_romaneio_pendente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_revendedora_nome TEXT;
BEGIN
  -- Only when status changes to pending or stays pending for too long
  IF NEW.status = 'pendente' AND (OLD.status IS NULL OR OLD.status != 'pendente') THEN
    -- Get revendedora name
    SELECT nome INTO v_revendedora_nome 
    FROM public.profiles 
    WHERE id = NEW.revendedora_id;
    
    -- Notify admins
    FOR v_admin_id IN 
      SELECT id FROM public.profiles WHERE role = 'admin'
    LOOP
      PERFORM public.criar_notificacao(
        v_admin_id,
        'romaneio_pendente',
        'Romaneio Pendente',
        'O romaneio de ' || COALESCE(v_revendedora_nome, 'Revendedora') || ' está pendente de confirmação.',
        jsonb_build_object('romaneio_id', NEW.id, 'revendedora_nome', v_revendedora_nome),
        'romaneio',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_romaneio_pendente
AFTER UPDATE OF status ON public.romaneios
FOR EACH ROW
EXECUTE FUNCTION public.notify_romaneio_pendente();