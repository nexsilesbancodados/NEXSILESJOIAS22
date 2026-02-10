
-- Create funcionario_permissoes table for module-level permissions
CREATE TABLE public.funcionario_permissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  pode_ver BOOLEAN NOT NULL DEFAULT false,
  pode_criar BOOLEAN NOT NULL DEFAULT false,
  pode_editar BOOLEAN NOT NULL DEFAULT false,
  pode_excluir BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(funcionario_id, modulo)
);

-- Enable RLS
ALTER TABLE public.funcionario_permissoes ENABLE ROW LEVEL SECURITY;

-- RLS: users can manage permissions for funcionarios in their organization
CREATE POLICY "Users can view permissoes of their org funcionarios"
ON public.funcionario_permissoes
FOR SELECT
TO authenticated
USING (
  funcionario_id IN (
    SELECT f.id FROM public.funcionarios f
    JOIN public.memberships m ON m.organization_id = f.organization_id
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert permissoes for their org funcionarios"
ON public.funcionario_permissoes
FOR INSERT
TO authenticated
WITH CHECK (
  funcionario_id IN (
    SELECT f.id FROM public.funcionarios f
    JOIN public.memberships m ON m.organization_id = f.organization_id
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update permissoes of their org funcionarios"
ON public.funcionario_permissoes
FOR UPDATE
TO authenticated
USING (
  funcionario_id IN (
    SELECT f.id FROM public.funcionarios f
    JOIN public.memberships m ON m.organization_id = f.organization_id
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete permissoes of their org funcionarios"
ON public.funcionario_permissoes
FOR DELETE
TO authenticated
USING (
  funcionario_id IN (
    SELECT f.id FROM public.funcionarios f
    JOIN public.memberships m ON m.organization_id = f.organization_id
    WHERE m.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_funcionario_permissoes_updated_at
BEFORE UPDATE ON public.funcionario_permissoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
