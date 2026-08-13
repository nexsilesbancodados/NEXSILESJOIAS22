-- Baixa o estoque do PIX direto somente quando a loja confirma o pagamento.
-- O webhook do Mercado Pago já faz sua própria baixa; por isso o gatilho é
-- restrito ao método pix_direto e à transição para pago.
ALTER TABLE public.ecommerce_pedidos
  ADD COLUMN IF NOT EXISTS estoque_baixado BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.baixar_estoque_pix_confirmado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
BEGIN
  IF NEW.status = 'pago'
     AND OLD.status IS DISTINCT FROM 'pago'
     AND NEW.metodo_pagamento = 'pix_direto'
     AND COALESCE(NEW.estoque_baixado, false) = false THEN
    FOR item IN
      SELECT peca_id, quantidade
      FROM public.ecommerce_pedido_itens
      WHERE pedido_id = NEW.id
    LOOP
      UPDATE public.pecas
         SET estoque = GREATEST(0, estoque - item.quantidade)
       WHERE id = item.peca_id
         AND organization_id = NEW.organization_id;
    END LOOP;

    UPDATE public.ecommerce_pedidos
       SET estoque_baixado = true
     WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ecommerce_pix_baixa_estoque ON public.ecommerce_pedidos;
CREATE TRIGGER ecommerce_pix_baixa_estoque
  AFTER UPDATE OF status ON public.ecommerce_pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.baixar_estoque_pix_confirmado();
