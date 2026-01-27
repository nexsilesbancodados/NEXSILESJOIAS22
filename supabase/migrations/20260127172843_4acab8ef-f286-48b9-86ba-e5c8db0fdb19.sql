-- Adicionar campos de autenticação do portal na tabela revendedoras
ALTER TABLE public.revendedoras 
ADD COLUMN IF NOT EXISTS usuario_portal TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS senha_portal TEXT;

-- Criar índice para busca rápida por usuario_portal
CREATE INDEX IF NOT EXISTS idx_revendedoras_usuario_portal ON public.revendedoras(usuario_portal);

-- Política para permitir leitura anônima para login do portal (apenas campos não sensíveis)
CREATE POLICY "revendedoras_select_portal_login" ON public.revendedoras
FOR SELECT
USING (
  (auth.uid() IS NULL AND usuario_portal IS NOT NULL AND senha_portal IS NOT NULL)
  OR (organization_id = get_user_organization_id())
);

-- Política para revendedora atualizar status de peças na maleta via portal
CREATE POLICY "maletas_pecas_update_portal" ON public.maletas_pecas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM maletas m
    JOIN revendedoras r ON m.revendedora_id = r.id
    WHERE m.id = maletas_pecas.maleta_id
    AND r.usuario_portal IS NOT NULL
  )
);

-- Política para revendedora ver suas maletas via portal (anônimo)
CREATE POLICY "maletas_select_portal" ON public.maletas
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND revendedora_id IN (
    SELECT id FROM revendedoras WHERE usuario_portal IS NOT NULL
  )
);

-- Política para revendedora ver itens das suas maletas via portal
CREATE POLICY "maletas_pecas_select_portal" ON public.maletas_pecas
FOR SELECT
USING (
  auth.uid() IS NULL
  AND EXISTS (
    SELECT 1 FROM maletas m
    JOIN revendedoras r ON m.revendedora_id = r.id
    WHERE m.id = maletas_pecas.maleta_id
    AND r.usuario_portal IS NOT NULL
  )
);

-- Política para revendedora ver interesses das suas maletas
CREATE POLICY "maleta_interesses_select_portal" ON public.maleta_interesses
FOR SELECT
USING (
  auth.uid() IS NULL
  AND EXISTS (
    SELECT 1 FROM maletas m
    JOIN revendedoras r ON m.revendedora_id = r.id
    WHERE m.id = maleta_interesses.maleta_id
    AND r.usuario_portal IS NOT NULL
  )
);

-- Política para revendedora atualizar status de interesses
CREATE POLICY "maleta_interesses_update_portal" ON public.maleta_interesses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM maletas m
    JOIN revendedoras r ON m.revendedora_id = r.id
    WHERE m.id = maleta_interesses.maleta_id
    AND r.usuario_portal IS NOT NULL
  )
);

-- Política para ver itens dos interesses
CREATE POLICY "maleta_interesse_itens_select_portal" ON public.maleta_interesse_itens
FOR SELECT
USING (
  auth.uid() IS NULL
  AND EXISTS (
    SELECT 1 FROM maleta_interesses mi
    JOIN maletas m ON m.id = mi.maleta_id
    JOIN revendedoras r ON m.revendedora_id = r.id
    WHERE mi.id = maleta_interesse_itens.interesse_id
    AND r.usuario_portal IS NOT NULL
  )
);

-- Política para ver peças (necessário para exibir dados)
CREATE POLICY "pecas_select_portal" ON public.pecas
FOR SELECT
USING (
  auth.uid() IS NULL
  AND EXISTS (
    SELECT 1 FROM maletas_pecas mp
    JOIN maletas m ON m.id = mp.maleta_id
    JOIN revendedoras r ON m.revendedora_id = r.id
    WHERE mp.peca_id = pecas.id
    AND r.usuario_portal IS NOT NULL
  )
);