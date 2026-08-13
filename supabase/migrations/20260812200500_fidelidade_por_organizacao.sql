-- =============================================================================
-- Fidelidade passa a ser da loja, não de cada vendedor
-- =============================================================================
--
-- PROBLEMA
--
-- `pontos_fidelidade` foi criada com RLS por usuário:
--
--     CREATE POLICY "pontos_fidelidade_select" ON public.pontos_fidelidade
--       FOR SELECT USING (user_id = auth.uid());
--
-- A tabela tem coluna `organization_id`, mas nenhuma policy a usa e o app filtra
-- e insere apenas por `user_id`. Numa loja com mais de um usuário o resultado é:
--
--   1. A vendedora A vende para o cliente João  → cria linha (user_id = A, 100 pts)
--   2. A vendedora B vende para o MESMO João    → o SELECT dela não acha nada,
--                                                  cria OUTRA linha (user_id = B, 50 pts)
--   3. João passa a ter dois saldos. Nenhuma das duas vê o da outra, e ninguém
--      vê o total real de 150.
--   4. Se a conta da A for removida, os 100 pontos dela somem para todo mundo.
--
-- O mesmo vale para `niveis_fidelidade`: o SELECT já aceitava organização, mas
-- INSERT/UPDATE/DELETE eram por usuário e o app nunca preenchia
-- `organization_id` — então os níveis criados por uma pessoa ficavam invisíveis
-- para as demais.
--
-- Esta migration consolida os saldos, passa as duas tabelas para escopo de
-- organização e cria a RPC atômica que o app usa para creditar e debitar.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Preencher organization_id a partir do vínculo de cada usuário
-- -----------------------------------------------------------------------------
UPDATE public.pontos_fidelidade p
SET organization_id = m.organization_id
FROM public.memberships m
WHERE p.organization_id IS NULL
  AND m.user_id = p.user_id;

UPDATE public.niveis_fidelidade n
SET organization_id = m.organization_id
FROM public.memberships m
WHERE n.organization_id IS NULL
  AND m.user_id = n.user_id;

UPDATE public.recompensas_fidelidade r
SET organization_id = m.organization_id
FROM public.memberships m
WHERE r.organization_id IS NULL
  AND m.user_id = r.user_id;

-- Recurso de último caso: linha cujo dono não tem mais membership resolve pela
-- organização do próprio cliente, para não ficar órfã e sumir do saldo.
UPDATE public.pontos_fidelidade p
SET organization_id = c.organization_id
FROM public.clientes c
WHERE p.organization_id IS NULL
  AND c.id = p.cliente_id;

DELETE FROM public.pontos_fidelidade WHERE organization_id IS NULL;
DELETE FROM public.niveis_fidelidade WHERE organization_id IS NULL;
DELETE FROM public.recompensas_fidelidade WHERE organization_id IS NULL;

-- -----------------------------------------------------------------------------
-- 2. Consolidar saldos duplicados do mesmo cliente
-- -----------------------------------------------------------------------------
-- Os pontos foram todos ganhos na mesma loja, então a soma é o saldo correto.
-- Mantemos a linha mais antiga e movemos para ela o histórico das outras.
DO $$
DECLARE
  v_fundidas int := 0;
BEGIN
  CREATE TEMP TABLE _fid_canonica ON COMMIT DROP AS
  SELECT DISTINCT ON (organization_id, cliente_id)
         id AS canonica_id, organization_id, cliente_id
  FROM public.pontos_fidelidade
  ORDER BY organization_id, cliente_id, created_at ASC, id ASC;

  -- Soma os totais das duplicatas na linha canônica.
  UPDATE public.pontos_fidelidade alvo
  SET pontos_totais = somas.total,
      pontos_disponiveis = somas.disponivel,
      updated_at = now()
  FROM (
    SELECT c.canonica_id,
           SUM(p.pontos_totais)::int      AS total,
           SUM(p.pontos_disponiveis)::int AS disponivel
    FROM public.pontos_fidelidade p
    JOIN _fid_canonica c
      ON c.organization_id = p.organization_id
     AND c.cliente_id = p.cliente_id
    GROUP BY c.canonica_id
  ) somas
  WHERE alvo.id = somas.canonica_id;

  -- Reaponta o histórico das duplicatas para a linha canônica.
  UPDATE public.movimentos_pontos mp
  SET pontos_fidelidade_id = c.canonica_id
  FROM public.pontos_fidelidade p
  JOIN _fid_canonica c
    ON c.organization_id = p.organization_id
   AND c.cliente_id = p.cliente_id
  WHERE mp.pontos_fidelidade_id = p.id
    AND p.id <> c.canonica_id;

  WITH removidas AS (
    DELETE FROM public.pontos_fidelidade p
    USING _fid_canonica c
    WHERE c.organization_id = p.organization_id
      AND c.cliente_id = p.cliente_id
      AND p.id <> c.canonica_id
    RETURNING 1
  )
  SELECT count(*) INTO v_fundidas FROM removidas;

  RAISE NOTICE 'fidelidade: % saldo(s) duplicado(s) consolidado(s)', v_fundidas;
END $$;

ALTER TABLE public.pontos_fidelidade
  ALTER COLUMN organization_id SET NOT NULL;

-- Impede que a duplicação volte a acontecer.
CREATE UNIQUE INDEX IF NOT EXISTS pontos_fidelidade_org_cliente_uniq
  ON public.pontos_fidelidade (organization_id, cliente_id);

-- -----------------------------------------------------------------------------
-- 3. RLS por organização
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pontos_fidelidade_select" ON public.pontos_fidelidade;
DROP POLICY IF EXISTS "pontos_fidelidade_insert" ON public.pontos_fidelidade;
DROP POLICY IF EXISTS "pontos_fidelidade_update" ON public.pontos_fidelidade;
DROP POLICY IF EXISTS "pontos_fidelidade_delete" ON public.pontos_fidelidade;

CREATE POLICY "pontos_fidelidade_select_org" ON public.pontos_fidelidade
  FOR SELECT USING (organization_id = public.get_user_organization_id());
CREATE POLICY "pontos_fidelidade_insert_org" ON public.pontos_fidelidade
  FOR INSERT WITH CHECK (organization_id = public.get_user_organization_id());
CREATE POLICY "pontos_fidelidade_update_org" ON public.pontos_fidelidade
  FOR UPDATE USING (organization_id = public.get_user_organization_id());
CREATE POLICY "pontos_fidelidade_delete_org" ON public.pontos_fidelidade
  FOR DELETE USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "niveis_fidelidade_select" ON public.niveis_fidelidade;
DROP POLICY IF EXISTS "niveis_fidelidade_insert" ON public.niveis_fidelidade;
DROP POLICY IF EXISTS "niveis_fidelidade_update" ON public.niveis_fidelidade;
DROP POLICY IF EXISTS "niveis_fidelidade_delete" ON public.niveis_fidelidade;

CREATE POLICY "niveis_fidelidade_select_org" ON public.niveis_fidelidade
  FOR SELECT USING (organization_id = public.get_user_organization_id());
CREATE POLICY "niveis_fidelidade_insert_org" ON public.niveis_fidelidade
  FOR INSERT WITH CHECK (organization_id = public.get_user_organization_id());
CREATE POLICY "niveis_fidelidade_update_org" ON public.niveis_fidelidade
  FOR UPDATE USING (organization_id = public.get_user_organization_id());
CREATE POLICY "niveis_fidelidade_delete_org" ON public.niveis_fidelidade
  FOR DELETE USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "recompensas_fidelidade_select" ON public.recompensas_fidelidade;
DROP POLICY IF EXISTS "recompensas_fidelidade_insert" ON public.recompensas_fidelidade;
DROP POLICY IF EXISTS "recompensas_fidelidade_update" ON public.recompensas_fidelidade;
DROP POLICY IF EXISTS "recompensas_fidelidade_delete" ON public.recompensas_fidelidade;

CREATE POLICY "recompensas_fidelidade_select_org" ON public.recompensas_fidelidade
  FOR SELECT USING (organization_id = public.get_user_organization_id());
CREATE POLICY "recompensas_fidelidade_insert_org" ON public.recompensas_fidelidade
  FOR INSERT WITH CHECK (organization_id = public.get_user_organization_id());
CREATE POLICY "recompensas_fidelidade_update_org" ON public.recompensas_fidelidade
  FOR UPDATE USING (organization_id = public.get_user_organization_id());
CREATE POLICY "recompensas_fidelidade_delete_org" ON public.recompensas_fidelidade
  FOR DELETE USING (organization_id = public.get_user_organization_id());

-- movimentos_pontos herda o escopo pelo saldo a que pertence.
ALTER TABLE public.movimentos_pontos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "movimentos_pontos_select" ON public.movimentos_pontos;
DROP POLICY IF EXISTS "movimentos_pontos_insert" ON public.movimentos_pontos;
DROP POLICY IF EXISTS "movimentos_pontos_select_org" ON public.movimentos_pontos;
DROP POLICY IF EXISTS "movimentos_pontos_insert_org" ON public.movimentos_pontos;

CREATE POLICY "movimentos_pontos_select_org" ON public.movimentos_pontos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pontos_fidelidade p
      WHERE p.id = movimentos_pontos.pontos_fidelidade_id
        AND p.organization_id = public.get_user_organization_id()
    )
  );
CREATE POLICY "movimentos_pontos_insert_org" ON public.movimentos_pontos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pontos_fidelidade p
      WHERE p.id = movimentos_pontos.pontos_fidelidade_id
        AND p.organization_id = public.get_user_organization_id()
    )
  );

-- -----------------------------------------------------------------------------
-- 4. RPC atômica para creditar e debitar
-- -----------------------------------------------------------------------------
-- O app fazia SELECT do saldo, calculava em JavaScript e gravava o valor
-- absoluto. Duas operações simultâneas (uma venda no PDV e um resgate no CRM,
-- por exemplo) sobrescreviam uma à outra e o saldo saía errado. É o mesmo
-- problema que `ajustar_estoque_peca` já resolve para o estoque: o cálculo tem
-- que acontecer no banco, numa instrução só.
CREATE OR REPLACE FUNCTION public.ajustar_pontos_fidelidade(
  p_cliente_id uuid,
  p_quantidade integer,
  p_tipo text DEFAULT 'credito',
  p_venda_id uuid DEFAULT NULL,
  p_descricao text DEFAULT NULL
)
RETURNS TABLE (pontos_totais integer, pontos_disponiveis integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_org uuid;
  v_id uuid;
  v_delta_disponivel integer;
  v_delta_total integer;
BEGIN
  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser positiva';
  END IF;
  IF p_tipo NOT IN ('credito', 'debito', 'bonus') THEN
    RAISE EXCEPTION 'Tipo inválido: %', p_tipo;
  END IF;

  v_org := public.get_user_organization_id();
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Organização não encontrada';
  END IF;

  -- O cliente precisa ser da mesma organização.
  IF NOT EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = p_cliente_id AND c.organization_id = v_org
  ) THEN
    RAISE EXCEPTION 'Cliente não pertence a esta organização';
  END IF;

  IF p_tipo = 'debito' THEN
    v_delta_disponivel := -p_quantidade;
    v_delta_total := 0;
  ELSE
    v_delta_disponivel := p_quantidade;
    v_delta_total := p_quantidade;
  END IF;

  -- Cria o saldo se ainda não existir; o índice único garante uma linha por
  -- (organização, cliente) mesmo sob concorrência.
  INSERT INTO public.pontos_fidelidade (organization_id, user_id, cliente_id, pontos_totais, pontos_disponiveis)
  VALUES (v_org, auth.uid(), p_cliente_id, 0, 0)
  ON CONFLICT (organization_id, cliente_id) DO NOTHING;

  UPDATE public.pontos_fidelidade
  SET pontos_totais = pontos_totais + v_delta_total,
      pontos_disponiveis = GREATEST(0, pontos_disponiveis + v_delta_disponivel),
      updated_at = now()
  WHERE organization_id = v_org AND cliente_id = p_cliente_id
  RETURNING id, pontos_fidelidade.pontos_totais, pontos_fidelidade.pontos_disponiveis
  INTO v_id, pontos_totais, pontos_disponiveis;

  INSERT INTO public.movimentos_pontos (pontos_fidelidade_id, venda_id, tipo, quantidade, descricao)
  VALUES (v_id, p_venda_id, p_tipo, p_quantidade, p_descricao);

  RETURN NEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.ajustar_pontos_fidelidade(uuid, integer, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ajustar_pontos_fidelidade(uuid, integer, text, uuid, text) TO authenticated;
