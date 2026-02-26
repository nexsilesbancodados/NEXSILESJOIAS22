
-- Fix: remover SECURITY DEFINER da view pública
DROP VIEW IF EXISTS public.ecommerce_avaliacoes_public;
CREATE OR REPLACE VIEW public.ecommerce_avaliacoes_public 
WITH (security_invoker = true) AS
SELECT id, organization_id, peca_id, cliente_nome, nota, comentario, created_at
FROM public.ecommerce_avaliacoes
WHERE aprovada = true;
