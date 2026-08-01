-- =============================================================================
-- Arquivos: só o dono (ou a própria organização) altera e apaga
-- =============================================================================
-- Hoje as regras dos buckets exigem apenas "estar logado":
--
--   USING (bucket_id = 'pecas' AND auth.role() = 'authenticated')
--
-- Sem checar de quem é o arquivo nem de qual organização. Com 19 lojas na
-- plataforma, o usuário de uma loja pode sobrescrever ou apagar as fotos de
-- peças, catálogos e maletas de outra. Não é vazamento de dado — é perda de
-- conteúdo e vandalismo entre inquilinos.
--
-- Correção: manter o envio liberado para quem está logado e a leitura pública
-- (a vitrine precisa), mas restringir ALTERAR e APAGAR a:
--   a) quem enviou o arquivo (`owner`, que o Storage grava sozinho); ou
--   b) arquivos cujo caminho começa com o id da organização de quem chama —
--      é a convenção usada no bucket `maleta-vendas-fotos`
--      (`<organization_id>/<maleta_id>/arquivo.jpg`).
--
-- IMPACTO NO APP: nenhum. Hoje nenhuma tela apaga arquivo — a função
-- `deleteImage` existe em src/hooks/useImageUpload.ts e não é chamada em lugar
-- nenhum. Uploads e leitura continuam iguais.
--
-- Idempotente.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Derruba as regras de ALTERAR/APAGAR que só pediam "estar logado"
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can delete own maleta images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own maleta images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete piece images"      ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update piece images"      ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars"               ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own catalogo images"       ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own peca images"           ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars"               ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own catalogo images"       ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own peca images"           ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar imagens de catálogos"    ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio avatar"          ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar imagens de catálogos"      ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar próprio avatar"            ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_authenticated"                     ON storage.objects;
DROP POLICY IF EXISTS "pecas_delete_authenticated"                       ON storage.objects;
DROP POLICY IF EXISTS "pecas_update_authenticated"                       ON storage.objects;
DROP POLICY IF EXISTS "fotos_vendas_auth_delete"                         ON storage.objects;

-- ---------------------------------------------------------------------------
-- 2. Regras novas: dono do arquivo ou arquivo da própria organização
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS objetos_update_dono_ou_org ON storage.objects;
CREATE POLICY objetos_update_dono_ou_org ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('pecas', 'pecas-images', 'avatars', 'catalogos',
                  'maletas-images', 'maleta-vendas-fotos')
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = public.get_user_organization_id()::text
    )
  );

DROP POLICY IF EXISTS objetos_delete_dono_ou_org ON storage.objects;
CREATE POLICY objetos_delete_dono_ou_org ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('pecas', 'pecas-images', 'avatars', 'catalogos',
                  'maletas-images', 'maleta-vendas-fotos')
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = public.get_user_organization_id()::text
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Envio e leitura continuam como estavam
-- ---------------------------------------------------------------------------
-- As policies de INSERT (upload) e de SELECT (leitura pública das imagens da
-- vitrine) não são tocadas de propósito: a loja, o catálogo e a maleta pública
-- dependem delas.

-- ---------------------------------------------------------------------------
-- Conferência (rodar depois):
--
--   SELECT policyname, cmd
--     FROM pg_policies
--    WHERE schemaname = 'storage' AND tablename = 'objects'
--      AND cmd IN ('UPDATE','DELETE')
--    ORDER BY policyname;
--
--   -- devem sobrar só objetos_update_dono_ou_org e objetos_delete_dono_ou_org
-- ---------------------------------------------------------------------------
