
-- Multi-tenant
CREATE INDEX IF NOT EXISTS idx_pecas_org ON public.pecas(organization_id);
CREATE INDEX IF NOT EXISTS idx_pecas_org_codigo ON public.pecas(organization_id, codigo);
CREATE INDEX IF NOT EXISTS idx_pecas_org_categoria ON public.pecas(organization_id, categoria);
CREATE INDEX IF NOT EXISTS idx_clientes_org ON public.clientes(organization_id);
CREATE INDEX IF NOT EXISTS idx_clientes_org_email ON public.clientes(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_vendas_org_data ON public.vendas(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maletas_org ON public.maletas(organization_id);
CREATE INDEX IF NOT EXISTS idx_maletas_revendedora ON public.maletas(revendedora_id);
CREATE INDEX IF NOT EXISTS idx_maletas_pecas_maleta ON public.maletas_pecas(maleta_id);
CREATE INDEX IF NOT EXISTS idx_maletas_pecas_peca ON public.maletas_pecas(peca_id);
CREATE INDEX IF NOT EXISTS idx_revendedoras_org ON public.revendedoras(organization_id);
CREATE INDEX IF NOT EXISTS idx_revendedoras_email ON public.revendedoras(lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalogos_org ON public.catalogos(organization_id);
CREATE INDEX IF NOT EXISTS idx_catalogos_slug ON public.catalogos(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalogos_pecas_catalogo ON public.catalogos_pecas(catalogo_id);
CREATE INDEX IF NOT EXISTS idx_catalogos_pecas_peca ON public.catalogos_pecas(peca_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_catalogo_catalogo ON public.pedidos_catalogo(catalogo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_catalogo_itens_pedido ON public.pedidos_catalogo_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_maleta_interesses_maleta ON public.maleta_interesses(maleta_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maleta_interesse_itens_interesse ON public.maleta_interesse_itens(interesse_id);
CREATE INDEX IF NOT EXISTS idx_romaneios_org ON public.romaneios(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ecommerce_pedidos_org ON public.ecommerce_pedidos(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ecommerce_pedidos_cliente_email ON public.ecommerce_pedidos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_ecommerce_pedido_itens_pedido ON public.ecommerce_pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_lida ON public.notificacoes(user_id, lida, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_atividades_org_data ON public.historico_atividades(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON public.memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_revendedora ON public.comissoes_revendedoras(revendedora_id, status);
CREATE INDEX IF NOT EXISTS idx_fornecedores_org ON public.fornecedores(organization_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_caixa_sessao ON public.movimentos_caixa(sessao_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiado_cliente ON public.fiado(cliente_id, status);
CREATE INDEX IF NOT EXISTS idx_ecommerce_avaliacoes_peca ON public.ecommerce_avaliacoes(peca_id, aprovada);
CREATE INDEX IF NOT EXISTS idx_ecommerce_avaliacoes_org ON public.ecommerce_avaliacoes(organization_id);

ANALYZE;
