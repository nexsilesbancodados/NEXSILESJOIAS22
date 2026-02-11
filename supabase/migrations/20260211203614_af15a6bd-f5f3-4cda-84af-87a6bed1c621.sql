
-- Give the existing "teste" employee all permissions so they can test
INSERT INTO funcionario_permissoes (funcionario_id, modulo, pode_ver, pode_criar, pode_editar, pode_excluir)
SELECT '85550465-e3d0-40c8-82be-d84120b6cf9c', m, true, true, true, true
FROM unnest(ARRAY['dashboard','pecas','clientes','vendas','revendedoras','romaneios','catalogos','fornecedores','banhos','relatorios','configuracoes','campanhas','atendimento','etiquetas','historico']) AS m
ON CONFLICT DO NOTHING;
