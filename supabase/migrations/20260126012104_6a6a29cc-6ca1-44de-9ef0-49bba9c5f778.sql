-- Atualizar a função para NÃO inserir dados de exemplo nas configurações da loja
-- Deixar tudo em branco para o usuário preencher

-- Primeiro, limpar configurações existentes que têm valores de exemplo
UPDATE public.configuracoes 
SET valor = '' 
WHERE chave IN ('nome_loja', 'telefone_loja', 'endereco_loja')
AND valor IN ('Minha Joalheria', '(11) 99999-0000', 'Rua das Joias, 123 - Centro');

-- Recriar a função criar_dados_exemplo SEM as configurações da loja
CREATE OR REPLACE FUNCTION public.criar_dados_exemplo(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Esta função agora está vazia - não cria mais dados de exemplo
  -- O usuário deve preencher seus próprios dados
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comentário: A função foi esvaziada propositalmente
-- Os dados da loja agora devem ser preenchidos manualmente pelo usuário