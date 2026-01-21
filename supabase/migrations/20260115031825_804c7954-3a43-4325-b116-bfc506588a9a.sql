-- Function to create notification for low stock
CREATE OR REPLACE FUNCTION public.check_estoque_baixo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estoque <= COALESCE(NEW.estoque_minimo, 5) THEN
    INSERT INTO public.notificacoes (tipo, titulo, mensagem, user_id, entidade_tipo, entidade_id, dados)
    SELECT 
      'estoque_baixo',
      'Estoque Baixo',
      'A peça "' || NEW.nome || '" está com estoque baixo (' || NEW.estoque || ' unidades)',
      p.id,
      'pecas',
      NEW.id,
      jsonb_build_object('peca_id', NEW.id, 'peca_nome', NEW.nome, 'estoque', NEW.estoque)
    FROM auth.users p
    WHERE EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = p.id AND pr.role = 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for low stock notification
DROP TRIGGER IF EXISTS trigger_estoque_baixo ON pecas;
CREATE TRIGGER trigger_estoque_baixo
  AFTER UPDATE OF estoque ON pecas
  FOR EACH ROW
  EXECUTE FUNCTION public.check_estoque_baixo();