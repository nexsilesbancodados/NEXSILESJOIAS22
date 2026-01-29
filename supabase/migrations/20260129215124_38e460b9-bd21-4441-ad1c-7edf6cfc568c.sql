-- 1. Alterar revendedoras (CASCADE para excluir tudo)
ALTER TABLE revendedoras 
  DROP CONSTRAINT IF EXISTS revendedoras_user_id_fkey;
ALTER TABLE revendedoras 
  ADD CONSTRAINT revendedoras_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Alterar vendas
ALTER TABLE vendas 
  DROP CONSTRAINT IF EXISTS vendas_vendedor_id_fkey;
ALTER TABLE vendas 
  ADD CONSTRAINT vendas_vendedor_id_fkey 
  FOREIGN KEY (vendedor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Alterar historico_atividades
ALTER TABLE historico_atividades 
  DROP CONSTRAINT IF EXISTS historico_atividades_user_id_fkey;
ALTER TABLE historico_atividades 
  ADD CONSTRAINT historico_atividades_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Alterar funcionarios
ALTER TABLE funcionarios 
  DROP CONSTRAINT IF EXISTS funcionarios_user_id_fkey;
ALTER TABLE funcionarios 
  ADD CONSTRAINT funcionarios_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Alterar historico_precos
ALTER TABLE historico_precos 
  DROP CONSTRAINT IF EXISTS historico_precos_user_id_fkey;
ALTER TABLE historico_precos 
  ADD CONSTRAINT historico_precos_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Alterar caixa_sessoes
ALTER TABLE caixa_sessoes 
  DROP CONSTRAINT IF EXISTS caixa_sessoes_operador_id_fkey;
ALTER TABLE caixa_sessoes 
  ADD CONSTRAINT caixa_sessoes_operador_id_fkey 
  FOREIGN KEY (operador_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Alterar movimentos_caixa
ALTER TABLE movimentos_caixa 
  DROP CONSTRAINT IF EXISTS movimentos_caixa_operador_id_fkey;
ALTER TABLE movimentos_caixa 
  ADD CONSTRAINT movimentos_caixa_operador_id_fkey 
  FOREIGN KEY (operador_id) REFERENCES auth.users(id) ON DELETE CASCADE;