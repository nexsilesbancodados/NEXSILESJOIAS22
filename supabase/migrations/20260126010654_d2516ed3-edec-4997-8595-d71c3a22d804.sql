-- Add organization_id to historico_atividades table
ALTER TABLE public.historico_atividades 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_historico_atividades_org_id ON public.historico_atividades(organization_id);

-- Drop existing policies if any
DROP POLICY IF EXISTS "historico_select_policy" ON public.historico_atividades;
DROP POLICY IF EXISTS "historico_insert_policy" ON public.historico_atividades;
DROP POLICY IF EXISTS "historico_update_policy" ON public.historico_atividades;
DROP POLICY IF EXISTS "historico_delete_policy" ON public.historico_atividades;

-- Enable RLS
ALTER TABLE public.historico_atividades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for historico_atividades
CREATE POLICY "historico_select_policy" ON public.historico_atividades
FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "historico_insert_policy" ON public.historico_atividades
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "historico_update_policy" ON public.historico_atividades
FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "historico_delete_policy" ON public.historico_atividades
FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id());