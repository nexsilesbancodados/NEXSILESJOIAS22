CREATE TABLE IF NOT EXISTS public.edge_function_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  request_payload jsonb,
  request_ip text,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  status_code integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.edge_function_errors TO authenticated;
GRANT ALL ON public.edge_function_errors TO service_role;

ALTER TABLE public.edge_function_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root admin can view all errors"
ON public.edge_function_errors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND u.email = 'beneloahsemijoias@gmail.com'
  )
);

CREATE INDEX idx_edge_errors_function_created
  ON public.edge_function_errors (function_name, created_at DESC);

CREATE INDEX idx_edge_errors_org
  ON public.edge_function_errors (organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;