
# Plano: Excluir Usuário com Limpeza Total de Dados

## Situação Atual

O banco de dados tem **22 tabelas** vinculadas a `auth.users`. Atualmente:

| Comportamento | Tabelas |
|--------------|---------|
| **CASCADE** (já excluem dados) | `profiles`, `user_roles`, `notificacoes`, `user_preferences`, `modelos_etiquetas`, `assinaturas`, `notificacoes_assinatura`, `memberships` |
| **SET NULL** (apenas limpa referência) | `organizations` |
| **NO ACTION** (bloqueia exclusão) | `revendedoras`, `vendas`, `historico_atividades`, `funcionarios`, `historico_precos`, `caixa_sessoes`, `movimentos_caixa` |

## Solução

Alterar as 7 tabelas com "NO ACTION" para usar **ON DELETE CASCADE**, fazendo com que todos os dados do usuário sejam automaticamente excluídos quando ele for removido.

### Tabelas que serão alteradas:

| Tabela | Coluna | Dados que serão excluídos |
|--------|--------|---------------------------|
| `revendedoras` | `user_id` | Revendedoras vinculadas ao usuário |
| `vendas` | `vendedor_id` | Vendas feitas pelo vendedor |
| `historico_atividades` | `user_id` | Logs de atividade do usuário |
| `funcionarios` | `user_id` | Funcionários vinculados |
| `historico_precos` | `user_id` | Histórico de alterações de preços |
| `caixa_sessoes` | `operador_id` | Sessões de caixa do operador |
| `movimentos_caixa` | `operador_id` | Movimentações de caixa |

### Efeito Cascata Adicional

Ao excluir uma **revendedora**, também serão excluídos:
- Todas as **maletas** da revendedora
- Todos os **itens** das maletas (`maletas_pecas`)
- Todas as **metas** da revendedora
- Todos os **romaneios** da revendedora
- Todos os **interesses** nas maletas

Ao excluir uma **sessão de caixa**, serão excluídos:
- Todos os **movimentos de caixa** daquela sessão

---

## Implementação Técnica

### Migração SQL

```sql
-- 1. Alterar revendedoras (CASCADE para excluir tudo)
ALTER TABLE revendedoras 
  DROP CONSTRAINT revendedoras_user_id_fkey;
ALTER TABLE revendedoras 
  ADD CONSTRAINT revendedoras_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Alterar vendas
ALTER TABLE vendas 
  DROP CONSTRAINT vendas_vendedor_id_fkey;
ALTER TABLE vendas 
  ADD CONSTRAINT vendas_vendedor_id_fkey 
  FOREIGN KEY (vendedor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Alterar historico_atividades
ALTER TABLE historico_atividades 
  DROP CONSTRAINT historico_atividades_user_id_fkey;
ALTER TABLE historico_atividades 
  ADD CONSTRAINT historico_atividades_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Alterar funcionarios
ALTER TABLE funcionarios 
  DROP CONSTRAINT funcionarios_user_id_fkey;
ALTER TABLE funcionarios 
  ADD CONSTRAINT funcionarios_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Alterar historico_precos
ALTER TABLE historico_precos 
  DROP CONSTRAINT historico_precos_user_id_fkey;
ALTER TABLE historico_precos 
  ADD CONSTRAINT historico_precos_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Alterar caixa_sessoes
ALTER TABLE caixa_sessoes 
  DROP CONSTRAINT caixa_sessoes_operador_id_fkey;
ALTER TABLE caixa_sessoes 
  ADD CONSTRAINT caixa_sessoes_operador_id_fkey 
  FOREIGN KEY (operador_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Alterar movimentos_caixa
ALTER TABLE movimentos_caixa 
  DROP CONSTRAINT movimentos_caixa_operador_id_fkey;
ALTER TABLE movimentos_caixa 
  ADD CONSTRAINT movimentos_caixa_operador_id_fkey 
  FOREIGN KEY (operador_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

## Aviso Importante

Esta ação é **irreversível**. Ao excluir um usuário:

- Todo o histórico de vendas será **permanentemente excluído**
- Todas as revendedoras vinculadas serão **removidas** junto com suas maletas
- Todo o histórico de atividades será **perdido**
- Todas as sessões de caixa e movimentações serão **apagadas**

Se você precisar manter dados históricos (para relatórios, auditoria, etc.), recomendo usar **SET NULL** em vez de CASCADE nas tabelas de histórico (`historico_atividades`, `historico_precos`, `vendas`).
