-- Corrigir as últimas políticas permissivas
-- Estas são para pedidos_catalogo e pedidos_catalogo_itens que precisam permitir
-- inserções públicas (clientes fazendo pedidos via catálogo sem login)

-- PEDIDOS_CATALOGO: Tornar mais restritivo - só pode criar se o catálogo existir e está aberto
DROP POLICY IF EXISTS "Anyone can create catalog orders" ON public.pedidos_catalogo;

CREATE POLICY "Public can create orders on open catalogs" 
ON public.pedidos_catalogo 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM catalogos 
    WHERE catalogos.id = catalogo_id 
    AND catalogos.status = 'aberto'
  )
);

-- PEDIDOS_CATALOGO_ITENS: Só pode criar se o pedido existe
DROP POLICY IF EXISTS "Anyone can create catalog order items" ON public.pedidos_catalogo_itens;

CREATE POLICY "Public can create order items for existing orders" 
ON public.pedidos_catalogo_itens 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pedidos_catalogo 
    WHERE pedidos_catalogo.id = pedido_id
  )
);