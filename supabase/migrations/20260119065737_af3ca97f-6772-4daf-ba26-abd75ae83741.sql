-- ============================================
-- LIMPEZA DE DADOS FICTÍCIOS E DE TESTE
-- ============================================

-- Primeiro, deletar dados das tabelas que têm foreign keys
DELETE FROM public.catalogo_pecas;
DELETE FROM public.pedidos_catalogo_itens;
DELETE FROM public.pedidos_catalogo;
DELETE FROM public.maleta_itens;
DELETE FROM public.maletas;
DELETE FROM public.romaneio_itens;
DELETE FROM public.romaneios;
DELETE FROM public.venda_itens;
DELETE FROM public.pagamentos;
DELETE FROM public.vendas;
DELETE FROM public.movimentos_caixa;
DELETE FROM public.caixa_sessoes;
DELETE FROM public.envios_galvanica;

-- Deletar dados das tabelas principais
DELETE FROM public.pecas;
DELETE FROM public.clientes;
DELETE FROM public.fornecedores;
DELETE FROM public.banhos;
DELETE FROM public.catalogos;
DELETE FROM public.metas;
DELETE FROM public.configuracoes;
DELETE FROM public.modelos_etiquetas;
DELETE FROM public.notificacoes;
DELETE FROM public.historico_atividades;

-- NÃO deletar profiles pois são criados pelo trigger de autenticação
-- Os profiles são necessários para o funcionamento do sistema

-- ============================================
-- REMOVER FUNÇÃO DE DADOS DE EXEMPLO
-- ============================================
-- Isso evita que dados fictícios sejam criados no futuro
DROP FUNCTION IF EXISTS public.criar_dados_exemplo(uuid);