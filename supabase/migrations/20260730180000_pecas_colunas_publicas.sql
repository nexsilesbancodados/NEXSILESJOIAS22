-- =============================================================================
-- Peças: visitante só enxerga as colunas de vitrine (não o custo)
-- =============================================================================
-- Verificação ao vivo depois do hardening mostrou que qualquer visitante lia
-- `pecas.preco_custo` — e também preco_revenda, comissão e fornecedor. RLS
-- controla QUAIS LINHAS cada um vê, não QUAIS COLUNAS: as policies de vitrine
-- (loja, catálogo público, maleta pública) devolvem a linha inteira.
--
-- A exposição existia antes desta correção (63 peças, pelas policies da loja) e
-- aumentou para 192 quando a policy `pecas_select_maleta_publica` passou a
-- cobrir as peças das maletas públicas — que é o comportamento correto para a
-- página de maleta compartilhada, mas não com o custo junto.
--
-- Solução: tirar o SELECT de tabela inteira do `anon` e devolver o SELECT
-- apenas nas colunas que as telas públicas realmente usam:
--   MaletaPublicaPage:   id, nome, codigo, imagem_url, categoria, preco_venda, material
--   CatalogoPublicoPage: as mesmas + estoque
--   LojaPublicaPage:     usa a view pecas_loja_public (não muda nada aqui)
--
-- Fica de fora do alcance do visitante: preco_custo, preco_revenda,
-- comissao_percentual_override, fornecedor_id, lote, estoque_minimo,
-- codigo_barras.
--
-- Idempotente.
-- =============================================================================

REVOKE SELECT ON TABLE public.pecas FROM anon;

GRANT SELECT (
  id,
  organization_id,   -- usado nos filtros das telas públicas
  nome,
  codigo,
  descricao,
  categoria,
  subcategoria,
  material,
  imagem_url,
  preco_venda,
  estoque,           -- a loja mostra "esgotado"
  disponivel_loja,
  catalogo_only,
  ativo,
  peso,              -- cálculo de frete
  created_at,
  updated_at
) ON TABLE public.pecas TO anon;

-- Usuário logado continua com acesso completo (as policies org-scoped é que
-- limitam as linhas à própria organização).
GRANT SELECT ON TABLE public.pecas TO authenticated;

-- ---------------------------------------------------------------------------
-- Conferência (rodar depois):
--
--   -- deve dar erro de permissão:
--   SET ROLE anon; SELECT preco_custo FROM public.pecas LIMIT 1; RESET ROLE;
--
--   -- deve funcionar:
--   SET ROLE anon; SELECT nome, preco_venda FROM public.pecas LIMIT 1; RESET ROLE;
-- ---------------------------------------------------------------------------
