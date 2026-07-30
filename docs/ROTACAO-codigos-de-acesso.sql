-- =============================================================================
-- Rotação dos códigos de acesso que ficaram expostos
-- =============================================================================
-- A tabela `purchases` esteve legível por qualquer visitante até 30/07/2026,
-- com nome, CPF, telefone, e-mail e o `access_code` de cada comprador. Os
-- códigos ainda NÃO USADOS precisam ser trocados: quem tiver copiado a lista
-- consegue saber quem comprou e qual o código.
--
-- O que este script faz:
--   1. lista o que vai mexer (você confere antes de confirmar);
--   2. expira os códigos não usados;
--   3. emite um código novo para cada comprador, com a mesma validade restante;
--   4. devolve a lista e-mail → código novo, para você avisar cada pessoa.
--
-- Códigos JÁ USADOS não são tocados: a conta já foi criada e o código não
-- serve mais para nada.
--
-- COMO RODAR: cole no SQL Editor do Supabase e execute. O resultado da última
-- consulta é a lista que você vai usar para avisar os compradores.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PASSO 1 — o que existe hoje (rode sozinho primeiro, se quiser conferir)
-- -----------------------------------------------------------------------------
-- SELECT email, codigo, plano, periodo, valido_ate, usado, created_at
--   FROM public.codigos_acesso
--  ORDER BY usado, created_at DESC;

-- -----------------------------------------------------------------------------
-- PASSO 2 — rotação (transacional: ou faz tudo, ou não faz nada)
-- -----------------------------------------------------------------------------
BEGIN;

CREATE TEMP TABLE _rotacao ON COMMIT DROP AS
SELECT
  id,
  email,
  codigo AS codigo_antigo,
  plano,
  periodo,
  valor_pago,
  mercadopago_payment_id,
  valido_ate,
  -- Código novo: 12 caracteres (A-F, 0-9), um por linha.
  -- Usa gen_random_uuid() de propósito: é avaliada linha a linha. Um gerador
  -- com subconsulta sem referência à linha seria calculado UMA vez só e daria
  -- o mesmo código para todo mundo (o teste pegou isso).
  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)) AS codigo_novo
FROM public.codigos_acesso
WHERE usado = false
  AND valido_ate > now();

-- 2.1 expira os antigos (não apaga: fica o histórico de que existiram)
UPDATE public.codigos_acesso c
   SET valido_ate = now() - interval '1 second',
       updated_at = now()
  FROM _rotacao r
 WHERE c.id = r.id;

-- 2.2 emite os novos, com a mesma validade que o antigo tinha
INSERT INTO public.codigos_acesso
  (codigo, email, plano, periodo, valor_pago, mercadopago_payment_id, valido_ate, usado)
SELECT r.codigo_novo, r.email, r.plano, r.periodo, r.valor_pago,
       r.mercadopago_payment_id, r.valido_ate, false
  FROM _rotacao r;

-- 2.3 a lista para avisar cada comprador
SELECT email,
       codigo_antigo AS "código antigo (não vale mais)",
       codigo_novo   AS "código novo",
       plano,
       periodo,
       to_char(valido_ate, 'DD/MM/YYYY') AS "válido até"
  FROM _rotacao
 ORDER BY email;

COMMIT;

-- -----------------------------------------------------------------------------
-- PASSO 3 — conferência (rode depois)
-- -----------------------------------------------------------------------------
-- Nenhum código antigo pode continuar valendo:
--   SELECT count(*) AS ainda_validos
--     FROM public.codigos_acesso
--    WHERE usado = false AND valido_ate > now();
--   -- deve ser igual à quantidade de linhas da lista acima
-- =============================================================================
