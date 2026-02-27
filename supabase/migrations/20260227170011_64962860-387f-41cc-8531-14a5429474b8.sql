
DROP FUNCTION IF EXISTS public.portal_fetch_maleta_pecas(uuid, uuid);

CREATE FUNCTION public.portal_fetch_maleta_pecas(p_maleta_id uuid, p_revendedora_id uuid)
 RETURNS TABLE(id uuid, quantidade integer, quantidade_vendida integer, vendida boolean, preco_unitario numeric, data_venda date, peca_id uuid, peca_nome text, peca_codigo text, peca_preco_venda numeric, peca_imagem_url text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.maletas m 
    WHERE m.id = p_maleta_id AND m.revendedora_id = p_revendedora_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT mp.id, mp.quantidade, mp.quantidade_vendida, mp.vendida, mp.preco_unitario, mp.data_venda,
         p.id as peca_id, p.nome as peca_nome, p.codigo as peca_codigo, p.preco_venda as peca_preco_venda, p.imagem_url as peca_imagem_url
  FROM public.maletas_pecas mp
  LEFT JOIN public.pecas p ON mp.peca_id = p.id
  WHERE mp.maleta_id = p_maleta_id;
END;
$function$;
