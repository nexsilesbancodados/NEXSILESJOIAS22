-- Corrigir função check_estoque_baixo para usar 'codigo' ao invés de 'referencia'
CREATE OR REPLACE FUNCTION public.check_estoque_baixo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Only trigger when stock goes below minimum (default 5)
  IF NEW.estoque < COALESCE(NEW.estoque_minimo, 5) AND (OLD.estoque IS NULL OR OLD.estoque >= COALESCE(OLD.estoque_minimo, 5)) THEN
    -- Get admin user to notify
    FOR v_admin_id IN 
      SELECT id FROM public.profiles WHERE role = 'admin'
    LOOP
      PERFORM public.criar_notificacao(
        v_admin_id,
        'estoque_baixo',
        'Estoque Baixo: ' || NEW.nome,
        'A peça "' || NEW.nome || '" (Cód: ' || COALESCE(NEW.codigo, 'N/A') || ') está com estoque baixo: ' || NEW.estoque || ' unidades.',
        jsonb_build_object('peca_id', NEW.id, 'estoque', NEW.estoque),
        'peca',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;