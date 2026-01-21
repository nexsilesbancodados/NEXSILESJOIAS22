-- 1. Adicionar coluna caixa_sessao_id na tabela vendas
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS caixa_sessao_id UUID REFERENCES caixa_sessoes(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_vendas_caixa_sessao ON vendas(caixa_sessao_id);

-- 2. Garantir que movimentos_caixa tem a estrutura correta com RLS
-- A tabela já existe, mas vamos garantir as políticas

-- Política para visualizar próprios movimentos
DROP POLICY IF EXISTS "Users can view own movimentos" ON movimentos_caixa;
CREATE POLICY "Users can view own movimentos" ON movimentos_caixa 
  FOR SELECT USING (auth.uid() = user_id);

-- Política para inserir próprios movimentos
DROP POLICY IF EXISTS "Users can insert own movimentos" ON movimentos_caixa;
CREATE POLICY "Users can insert own movimentos" ON movimentos_caixa 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para deletar próprios movimentos
DROP POLICY IF EXISTS "Users can delete own movimentos" ON movimentos_caixa;
CREATE POLICY "Users can delete own movimentos" ON movimentos_caixa 
  FOR DELETE USING (auth.uid() = user_id);