-- Limpar dados de configuração da loja para teste
DELETE FROM configuracoes 
WHERE chave IN ('nome_loja', 'telefone_loja', 'endereco_loja', 'cnpj_loja');