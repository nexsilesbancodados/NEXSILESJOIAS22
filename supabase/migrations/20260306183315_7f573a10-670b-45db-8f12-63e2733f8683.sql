
-- Table for custom categories per organization
CREATE TABLE public.categorias_pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, nome)
);

ALTER TABLE public.categorias_pecas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view categories"
  ON public.categorias_pecas FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Members can insert categories"
  ON public.categorias_pecas FOR INSERT
  TO authenticated
  WITH CHECK (public.user_belongs_to_org(organization_id));

CREATE POLICY "Members can update categories"
  ON public.categorias_pecas FOR UPDATE
  TO authenticated
  USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Members can delete categories"
  ON public.categorias_pecas FOR DELETE
  TO authenticated
  USING (public.user_belongs_to_org(organization_id));

-- Seed default categories for existing organizations
INSERT INTO public.categorias_pecas (organization_id, nome, ordem)
SELECT o.id, cat.nome, cat.ordem
FROM public.organizations o
CROSS JOIN (
  VALUES 
    ('Anel', 0), ('Brinco', 1), ('Pulseira', 2), ('Colar', 3), ('Corrente', 4),
    ('Chocker', 5), ('Gargantilha', 6), ('Tornozeleira', 7), ('Bracelete', 8),
    ('Conjunto', 9), ('Elo', 10), ('Escapulário', 11), ('Pingente', 12),
    ('Tarraxa', 13), ('Outros', 14)
) AS cat(nome, ordem)
ON CONFLICT (organization_id, nome) DO NOTHING;
