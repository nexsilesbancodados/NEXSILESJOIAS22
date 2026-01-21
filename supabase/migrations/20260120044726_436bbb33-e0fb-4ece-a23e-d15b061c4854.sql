-- =====================================================
-- CORREÇÃO DE POLÍTICAS RLS PARA ISOLAMENTO COMPLETO
-- =====================================================

-- 1. Corrigir historico_atividades - remover política USING (true) e adicionar correta
DROP POLICY IF EXISTS "Users can view historico_atividades" ON public.historico_atividades;

CREATE POLICY "Users can view their own historico" 
ON public.historico_atividades 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Adicionar política DELETE para caixa_sessoes
CREATE POLICY "Users can delete their own caixa_sessoes" 
ON public.caixa_sessoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Adicionar política DELETE para pedidos_catalogo (somente dono do catálogo)
CREATE POLICY "Catalog owners can delete their orders" 
ON public.pedidos_catalogo 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM catalogos 
  WHERE catalogos.id = pedidos_catalogo.catalogo_id 
  AND catalogos.user_id = auth.uid()
));

-- 4. Adicionar políticas UPDATE/DELETE para pedidos_catalogo_itens
CREATE POLICY "Catalog owners can update order items" 
ON public.pedidos_catalogo_itens 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM pedidos_catalogo pc 
  JOIN catalogos c ON c.id = pc.catalogo_id 
  WHERE pc.id = pedidos_catalogo_itens.pedido_id 
  AND c.user_id = auth.uid()
));

CREATE POLICY "Catalog owners can delete order items" 
ON public.pedidos_catalogo_itens 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM pedidos_catalogo pc 
  JOIN catalogos c ON c.id = pc.catalogo_id 
  WHERE pc.id = pedidos_catalogo_itens.pedido_id 
  AND c.user_id = auth.uid()
));

-- 5. Adicionar políticas UPDATE/DELETE para whatsapp_mensagens
CREATE POLICY "Users can update own messages" 
ON public.whatsapp_mensagens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" 
ON public.whatsapp_mensagens 
FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Adicionar política DELETE para whatsapp_config
CREATE POLICY "Users can delete own config" 
ON public.whatsapp_config 
FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Remover política duplicada de historico_atividades INSERT
DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.historico_atividades;

-- 8. Remover políticas duplicadas de movimentos_caixa
DROP POLICY IF EXISTS "Users can insert own movimentos" ON public.movimentos_caixa;
DROP POLICY IF EXISTS "Users can view own movimentos" ON public.movimentos_caixa;
DROP POLICY IF EXISTS "Users can delete own movimentos" ON public.movimentos_caixa;