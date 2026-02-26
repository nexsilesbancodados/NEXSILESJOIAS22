-- Create a public view for agent config (excludes sensitive fields)
CREATE VIEW public.agente_ia_config_public
WITH (security_invoker=on) AS
  SELECT 
    organization_id,
    nome_agente,
    cor_primaria,
    avatar_url,
    mensagem_boas_vindas,
    ativo
  FROM public.agente_ia_config;

-- Allow anonymous read access to the public view
-- We need a SELECT policy on the base table for the view to work
-- But we don't want to expose sensitive data, so we use the view
CREATE POLICY "Public can read basic agent config"
  ON public.agente_ia_config
  FOR SELECT
  TO anon
  USING (ativo = true);