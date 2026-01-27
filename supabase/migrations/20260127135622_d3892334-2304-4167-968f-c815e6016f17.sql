-- Permitir inserções anônimas em romaneios quando organization_id é fornecido
-- Isso é necessário para criar romaneios automaticamente a partir de pedidos de catálogo público

-- Drop existing insert policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert org romaneios" ON public.romaneios;
DROP POLICY IF EXISTS "romaneios_insert_policy" ON public.romaneios;

-- Create new insert policy that allows inserts if:
-- 1. User is authenticated and inserting for their org, OR
-- 2. Organization_id is provided (for public catalog orders)
CREATE POLICY "Allow romaneios insert with org_id"
ON public.romaneios
FOR INSERT
WITH CHECK (
  organization_id IS NOT NULL AND (
    -- Authenticated users can insert for their org
    (auth.uid() IS NOT NULL AND organization_id = get_user_organization_id())
    OR
    -- Allow anonymous inserts if organization_id is provided (from public catalog)
    (auth.uid() IS NULL AND organization_id IS NOT NULL)
  )
);

-- Also allow insertion in romaneios_pecas for anonymous users when romaneio exists
DROP POLICY IF EXISTS "Users can insert romaneio pecas" ON public.romaneios_pecas;
DROP POLICY IF EXISTS "romaneios_pecas_insert_policy" ON public.romaneios_pecas;

CREATE POLICY "Allow romaneios_pecas insert"
ON public.romaneios_pecas
FOR INSERT
WITH CHECK (
  romaneio_id IS NOT NULL AND (
    -- Authenticated users
    auth.uid() IS NOT NULL
    OR
    -- Anonymous users (from public catalog)
    auth.uid() IS NULL
  )
);