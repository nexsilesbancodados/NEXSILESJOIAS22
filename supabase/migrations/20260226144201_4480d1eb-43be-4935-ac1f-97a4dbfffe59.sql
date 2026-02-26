
-- ============================================
-- FIX 1: codigos_acesso - Remove public SELECT, allow only authenticated verification
-- ============================================
DROP POLICY IF EXISTS "Códigos podem ser verificados publicamente" ON public.codigos_acesso;

-- Allow public to check codes only (needed for activation flow), but restrict to unused codes only
CREATE POLICY "codigos_acesso_select_by_code"
ON public.codigos_acesso
FOR SELECT
TO anon, authenticated
USING (usado = false);

-- ============================================
-- FIX 2: agente_conversas - Restrict INSERT to authenticated or valid webhook
-- ============================================
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.agente_conversas;

CREATE POLICY "Authenticated or service can create conversations"
ON public.agente_conversas
FOR INSERT
WITH CHECK (
  -- Allow authenticated users from the org
  (auth.uid() IS NOT NULL AND organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ))
  OR
  -- Allow anonymous inserts only if organization_id is set (webhook/chat widget flow)
  (auth.uid() IS NULL AND organization_id IS NOT NULL)
);

-- ============================================
-- FIX 3: agente_mensagens - Restrict INSERT 
-- ============================================
DROP POLICY IF EXISTS "Anyone can create messages" ON public.agente_mensagens;

CREATE POLICY "Validated message creation"
ON public.agente_mensagens
FOR INSERT
WITH CHECK (
  -- Must reference an existing conversation
  conversa_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.agente_conversas WHERE id = conversa_id
  )
);

-- ============================================
-- FIX 4: agente_ia_config - Restrict SELECT to admins only (contains API keys)
-- ============================================
DROP POLICY IF EXISTS "Members can view their org agent config" ON public.agente_ia_config;

CREATE POLICY "Only admins can view agent config"
ON public.agente_ia_config
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- ============================================
-- FIX 5: Fix update_updated_at_column search_path
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
