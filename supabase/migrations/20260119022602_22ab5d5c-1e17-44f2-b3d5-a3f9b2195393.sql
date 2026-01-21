-- =============================================
-- FUNÇÃO PARA CRIAR DADOS DE EXEMPLO
-- =============================================

CREATE OR REPLACE FUNCTION public.criar_dados_exemplo(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_fornecedor1_id UUID;
  v_fornecedor2_id UUID;
  v_fornecedor3_id UUID;
  v_cliente1_id UUID;
  v_cliente2_id UUID;
  v_cliente3_id UUID;
  v_peca1_id UUID;
  v_peca2_id UUID;
  v_peca3_id UUID;
  v_peca4_id UUID;
  v_peca5_id UUID;
  v_catalogo_id UUID;
BEGIN
  -- Verificar se já existem dados para este usuário
  IF EXISTS (SELECT 1 FROM public.fornecedores WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN;
  END IF;

  -- Criar Fornecedores
  INSERT INTO public.fornecedores (nome, cnpj, telefone, email, cidade, estado, user_id)
  VALUES ('Ouro & Prata Atacado', '12.345.678/0001-90', '(11) 99999-1111', 'contato@ouroprata.com', 'São Paulo', 'SP', p_user_id)
  RETURNING id INTO v_fornecedor1_id;

  INSERT INTO public.fornecedores (nome, cnpj, telefone, email, cidade, estado, user_id)
  VALUES ('Brilhantes Brasil', '98.765.432/0001-10', '(21) 98888-2222', 'vendas@brilhantes.com', 'Rio de Janeiro', 'RJ', p_user_id)
  RETURNING id INTO v_fornecedor2_id;

  INSERT INTO public.fornecedores (nome, cnpj, telefone, email, cidade, estado, user_id)
  VALUES ('Semijoias Premium', '45.678.901/0001-23', '(31) 97777-3333', 'comercial@premium.com', 'Belo Horizonte', 'MG', p_user_id)
  RETURNING id INTO v_fornecedor3_id;

  -- Criar Clientes
  INSERT INTO public.clientes (nome, cpf, telefone, email, cidade, estado, data_nascimento, user_id)
  VALUES ('Maria Silva', '123.456.789-00', '(11) 98765-4321', 'maria@email.com', 'São Paulo', 'SP', '1985-03-15', p_user_id)
  RETURNING id INTO v_cliente1_id;

  INSERT INTO public.clientes (nome, cpf, telefone, email, cidade, estado, data_nascimento, user_id)
  VALUES ('Ana Santos', '987.654.321-00', '(21) 91234-5678', 'ana@email.com', 'Rio de Janeiro', 'RJ', '1990-07-22', p_user_id)
  RETURNING id INTO v_cliente2_id;

  INSERT INTO public.clientes (nome, cpf, telefone, email, cidade, estado, data_nascimento, user_id)
  VALUES ('Carla Oliveira', '456.789.123-00', '(31) 99876-5432', 'carla@email.com', 'Belo Horizonte', 'MG', '1988-11-08', p_user_id)
  RETURNING id INTO v_cliente3_id;

  -- Criar Peças
  INSERT INTO public.pecas (codigo, nome, descricao, categoria, material, peso, preco_custo, preco_venda, estoque, estoque_minimo, fornecedor_id, user_id)
  VALUES ('AN001', 'Anel Solitário Zircônia', 'Anel solitário com pedra de zircônia cravejada', 'Anéis', 'Prata 925', 3.5, 45.00, 129.90, 25, 5, v_fornecedor1_id, p_user_id)
  RETURNING id INTO v_peca1_id;

  INSERT INTO public.pecas (codigo, nome, descricao, categoria, material, peso, preco_custo, preco_venda, estoque, estoque_minimo, fornecedor_id, user_id)
  VALUES ('CO001', 'Colar Coração Cristal', 'Colar com pingente de coração em cristal', 'Colares', 'Aço Inox', 8.2, 35.00, 89.90, 30, 10, v_fornecedor2_id, p_user_id)
  RETURNING id INTO v_peca2_id;

  INSERT INTO public.pecas (codigo, nome, descricao, categoria, material, peso, preco_custo, preco_venda, estoque, estoque_minimo, fornecedor_id, user_id)
  VALUES ('BR001', 'Brinco Argola Dourada', 'Brinco argola grande banhado a ouro', 'Brincos', 'Banho Ouro 18k', 4.0, 28.00, 69.90, 40, 8, v_fornecedor1_id, p_user_id)
  RETURNING id INTO v_peca3_id;

  INSERT INTO public.pecas (codigo, nome, descricao, categoria, material, peso, preco_custo, preco_venda, estoque, estoque_minimo, fornecedor_id, user_id)
  VALUES ('PU001', 'Pulseira Riviera', 'Pulseira riviera com pedras coloridas', 'Pulseiras', 'Prata 925', 12.5, 85.00, 199.90, 15, 3, v_fornecedor3_id, p_user_id)
  RETURNING id INTO v_peca4_id;

  INSERT INTO public.pecas (codigo, nome, descricao, categoria, material, peso, preco_custo, preco_venda, estoque, estoque_minimo, fornecedor_id, user_id)
  VALUES ('TO001', 'Tornozeleira Estrelas', 'Tornozeleira delicada com pingentes de estrela', 'Tornozeleiras', 'Aço Inox', 5.8, 22.00, 59.90, 50, 10, v_fornecedor2_id, p_user_id)
  RETURNING id INTO v_peca5_id;

  -- Mais peças variadas
  INSERT INTO public.pecas (codigo, nome, descricao, categoria, material, peso, preco_custo, preco_venda, estoque, estoque_minimo, fornecedor_id, user_id) VALUES
  ('AN002', 'Anel Aliança Clássica', 'Aliança clássica para noivado', 'Anéis', 'Prata 925', 4.2, 55.00, 149.90, 20, 5, v_fornecedor1_id, p_user_id),
  ('CO002', 'Colar Ponto de Luz', 'Colar minimalista ponto de luz', 'Colares', 'Banho Ouro 18k', 2.1, 40.00, 99.90, 35, 8, v_fornecedor3_id, p_user_id),
  ('BR002', 'Brinco Gota Pérola', 'Brinco elegante com pérola sintética', 'Brincos', 'Prata 925', 3.8, 48.00, 119.90, 22, 5, v_fornecedor2_id, p_user_id),
  ('PU002', 'Pulseira Berloques', 'Pulseira estilo pandora com berloques', 'Pulseiras', 'Aço Inox', 18.0, 65.00, 159.90, 18, 4, v_fornecedor1_id, p_user_id),
  ('AN003', 'Anel Infinito', 'Anel símbolo do infinito com zircônias', 'Anéis', 'Banho Ródio', 2.8, 32.00, 79.90, 45, 10, v_fornecedor3_id, p_user_id);

  -- Criar Banhos (Galvânica)
  INSERT INTO public.banhos (nome, tipo, cor, preco_por_grama, user_id) VALUES
  ('Ouro 18k', 'Galvanoplastia', 'Dourado', 2.50, p_user_id),
  ('Ródio', 'Galvanoplastia', 'Prata', 1.80, p_user_id),
  ('Ouro Rosé', 'Galvanoplastia', 'Rosé', 2.80, p_user_id),
  ('Ródio Negro', 'Galvanoplastia', 'Preto', 2.20, p_user_id);

  -- Criar Catálogo de Exemplo
  INSERT INTO public.catalogos (nome, descricao, slug, ativo, publico, user_id)
  VALUES ('Coleção Verão 2025', 'Nossa coleção especial de verão com as últimas tendências', 'colecao-verao-2025', true, true, p_user_id)
  RETURNING id INTO v_catalogo_id;

  -- Adicionar peças ao catálogo
  INSERT INTO public.catalogo_pecas (catalogo_id, peca_id, ordem, destaque) VALUES
  (v_catalogo_id, v_peca1_id, 1, true),
  (v_catalogo_id, v_peca2_id, 2, true),
  (v_catalogo_id, v_peca3_id, 3, false),
  (v_catalogo_id, v_peca4_id, 4, true),
  (v_catalogo_id, v_peca5_id, 5, false);

  -- Criar Meta do Mês
  INSERT INTO public.metas (tipo, valor, mes, ano, user_id)
  VALUES ('faturamento', 15000.00, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, p_user_id);

  -- Criar Configurações Padrão
  INSERT INTO public.configuracoes (chave, valor, tipo, user_id) VALUES
  ('nome_loja', 'Minha Joalheria', 'string', p_user_id),
  ('telefone_loja', '(11) 99999-0000', 'string', p_user_id),
  ('endereco_loja', 'Rua das Joias, 123 - Centro', 'string', p_user_id),
  ('comissao_padrao', '10', 'number', p_user_id),
  ('prazo_maleta_dias', '30', 'number', p_user_id);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;