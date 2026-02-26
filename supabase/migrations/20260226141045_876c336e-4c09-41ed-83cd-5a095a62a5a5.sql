
-- Drop and recreate the portal public view with email instead of usuario_portal
DROP VIEW IF EXISTS public.revendedoras_portal_public;

CREATE VIEW public.revendedoras_portal_public
WITH (security_invoker=on) AS
  SELECT id, nome, email
  FROM public.revendedoras
  WHERE email IS NOT NULL AND senha_portal IS NOT NULL AND ativo = true;

-- Grant access
GRANT SELECT ON public.revendedoras_portal_public TO anon;
GRANT SELECT ON public.revendedoras_portal_public TO authenticated;
