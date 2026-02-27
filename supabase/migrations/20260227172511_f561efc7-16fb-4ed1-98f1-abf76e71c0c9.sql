
DROP FUNCTION IF EXISTS public.portal_fetch_maletas(uuid);

CREATE FUNCTION public.portal_fetch_maletas(p_revendedora_id uuid)
 RETURNS TABLE(id uuid, nome text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, is_public boolean, slug text, observacoes text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT m.id, m.nome, m.status, m.created_at, m.updated_at, m.is_public, m.sharing_slug as slug, m.observacoes
  FROM public.maletas m
  WHERE m.revendedora_id = p_revendedora_id
  ORDER BY m.created_at DESC;
END;
$function$;
