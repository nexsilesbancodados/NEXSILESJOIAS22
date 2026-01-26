-- Clean up orphaned records (without organization_id)
-- This removes test data from other accounts

-- First delete dependent records to avoid FK violations
DELETE FROM vendas_pecas WHERE venda_id IN (SELECT id FROM vendas WHERE organization_id IS NULL);
DELETE FROM romaneios_pecas WHERE romaneio_id IN (SELECT id FROM romaneios WHERE organization_id IS NULL);
DELETE FROM maletas_pecas WHERE maleta_id IN (SELECT id FROM maletas WHERE organization_id IS NULL);
DELETE FROM catalogos_pecas WHERE catalogo_id IN (SELECT id FROM catalogos WHERE organization_id IS NULL);
DELETE FROM pedidos_catalogo_itens WHERE pedido_id IN (SELECT id FROM pedidos_catalogo WHERE catalogo_id IN (SELECT id FROM catalogos WHERE organization_id IS NULL));
DELETE FROM pedidos_catalogo WHERE catalogo_id IN (SELECT id FROM catalogos WHERE organization_id IS NULL);
DELETE FROM maleta_interesse_itens WHERE interesse_id IN (SELECT id FROM maleta_interesses WHERE maleta_id IN (SELECT id FROM maletas WHERE organization_id IS NULL));
DELETE FROM maleta_interesses WHERE maleta_id IN (SELECT id FROM maletas WHERE organization_id IS NULL);
DELETE FROM fidelidade_transacoes WHERE cliente_id IN (SELECT id FROM clientes WHERE organization_id IS NULL);
DELETE FROM movimentos_caixa WHERE sessao_id IN (SELECT id FROM caixa_sessoes WHERE organization_id IS NULL);

-- Now delete main records
DELETE FROM historico_atividades WHERE organization_id IS NULL;
DELETE FROM vendas WHERE organization_id IS NULL;
DELETE FROM romaneios WHERE organization_id IS NULL;
DELETE FROM maletas WHERE organization_id IS NULL;
DELETE FROM catalogos WHERE organization_id IS NULL;
DELETE FROM clientes WHERE organization_id IS NULL;
DELETE FROM pecas WHERE organization_id IS NULL;
DELETE FROM revendedoras WHERE organization_id IS NULL;
DELETE FROM fornecedores WHERE organization_id IS NULL;
DELETE FROM campanhas WHERE organization_id IS NULL;
DELETE FROM metas WHERE organization_id IS NULL;
DELETE FROM banhos WHERE organization_id IS NULL;
DELETE FROM caixa_sessoes WHERE organization_id IS NULL;