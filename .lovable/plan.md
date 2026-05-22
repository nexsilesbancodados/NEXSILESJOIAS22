
# Correção integral do fluxo de Maletas (criação → conferência → devolução)

Objetivo: tornar o ciclo de maletas **atômico, auditável e à prova de erros**, eliminando inconsistências de estoque, perda de comissão e ambiguidade entre "vendido / pendente / devolvido / extraviado". Tudo via RPCs `SECURITY DEFINER` (atômicas, com lock e validação de organização) — o frontend deixa de fazer mutações multi-step manuais.

---

## 1. Diagnóstico (problemas atuais encontrados)

1. **Sell sem zerar `quantidade`** — quando se marca venda total sem informar `quantidadeVendida/Total`, o campo `quantidade` permanece > 0. O fechamento devolvia essas unidades ao estoque (já mitigado no último fix, mas a raiz continua).
2. **Múltiplos pontos de mutação de estoque** (hook, RPC portal, transferência, reabertura, fechamento) sem transação — risco de estoque negativo ou duplicado em concorrência.
3. **Sem trilha de devolução** para itens que sumiram / quebraram / foram perdidos. Hoje só existe "vendido" ou "voltou pro estoque".
4. **Conferência de devolução** (a peça que voltou bate com o que saiu?) inexistente como fluxo guiado.
5. **Criação de maleta** não valida estoque disponível atomicamente — duas abas podem alocar a mesma peça.
6. **Sem snapshot** do que saiu na maleta: se a peça mudar de preço/nome depois, o histórico se distorce.

---

## 2. Banco de Dados (migration única)

### Novas colunas em `maletas_pecas`
- `quantidade_inicial` int — registrada no momento da inclusão (snapshot imutável)
- `quantidade_devolvida` int default 0
- `quantidade_perdida` int default 0 (extravio/quebra)
- `preco_unitario_snapshot` numeric(12,2) — congela o preço de saída
- `nome_snapshot`, `codigo_snapshot` text — congela identificação
- CHECK: `quantidade_vendida + quantidade_devolvida + quantidade_perdida + quantidade <= quantidade_inicial`

### Nova tabela `maleta_conferencias_itens` (detalhe da conferência)
- `conferencia_id`, `maleta_peca_id`, `qtd_esperada`, `qtd_conferida_vendida`, `qtd_conferida_devolvida`, `qtd_conferida_perdida`, `observacao`

### RPCs atômicas (todas `SECURITY DEFINER` + `user_belongs_to_org`)

| RPC | Função |
|---|---|
| `maleta_adicionar_peca(maleta_id, peca_id, qtd, preco?)` | Lock em `pecas`, valida estoque, decrementa, insere com snapshot. |
| `maleta_remover_peca(maleta_peca_id, qtd)` | Devolve ao estoque, atualiza/zera linha. |
| `maleta_registrar_venda(maleta_peca_id, qtd, preco?, cliente_id?)` | Incrementa `quantidade_vendida`, decrementa `quantidade`, cria `vendas`/`comissao`. |
| `maleta_desfazer_venda(maleta_peca_id, qtd)` | Estorna venda + comissão. |
| `maleta_marcar_perdida(maleta_peca_id, qtd, motivo)` | Move pendente → perdida (não volta ao estoque). |
| `maleta_conferir(maleta_id, itens jsonb)` | Recebe lista `[{maleta_peca_id, vendida, devolvida, perdida, obs}]`, valida soma, grava conferência + itens, retorna divergências. |
| `maleta_fechar(maleta_id, forcar?)` | **Único caminho de fechamento.** Exige conferência prévia (ou `forcar=true`). Para cada linha: o que restou em `quantidade` volta ao estoque; perdidas/vendidas nunca voltam. Marca status `fechada`, grava devoluções, calcula comissão final. |
| `maleta_reabrir(maleta_id, motivo)` | Já existe — endurecer: só admin, estorna devoluções com lock. |

### Triggers
- `maletas_pecas`: BEFORE INSERT preenche snapshots (`quantidade_inicial`, `preco_unitario_snapshot`, `nome_snapshot`, `codigo_snapshot`) a partir de `pecas`.

---

## 3. Frontend — refator do `MaletaManager` + novos componentes

`MaletaManager.tsx` já passou de 1700 linhas. Quebrar em:

```
src/components/revendedoras/maleta/
  MaletaHeader.tsx           toolbar com ações contextuais
  MaletaItemsTable.tsx       lista com badges Pendente/Vendido/Devolvido/Perdido
  AdicionarPecaDialog.tsx    usa RPC maleta_adicionar_peca
  RegistrarVendaDialog.tsx   RPC maleta_registrar_venda (parcial/total)
  MarcarPerdidaDialog.tsx    novo — motivo obrigatório
  ConferenciaWizard.tsx      passo-a-passo: cada peça → vendida/devolvida/perdida com totais ao vivo
  FechamentoMaletaDialog.tsx mostra resumo da conferência, divergências, comissão prevista, exige confirmação dupla
  ResumoFinanceiroCard.tsx   total saída × total venda × comissão × saldo a receber
```

Hooks dedicados em `src/hooks/maleta/`:
- `useMaletaRPC.ts` — wrappers tipados de todas as RPCs (com toasts, invalidação de cache, optimistic updates).
- `useConferencia.ts` — estado local do wizard.

Remover lógica multi-step duplicada de `useSupabaseData.ts` (manter apenas leitura via React Query).

---

## 4. Ferramentas auxiliares (UX)

1. **Wizard de Conferência** com leitor de código de barras integrado (`BarcodeScanner` já existe) — bipa item e auto-incrementa "devolvida".
2. **Diff visual** entre `quantidade_inicial` e somatório conferido, destacando divergências em vermelho.
3. **Atalho "Devolver tudo restante"** + **"Marcar tudo como vendido"** para fechamentos rápidos.
4. **Exportar comprovante PDF** da conferência (assinatura digital já existe → reaproveitar).
5. **Histórico imutável** por maleta: aba "Linha do tempo" mostrando saída → vendas → conferência → fechamento → reabertura.
6. **Alerta proativo** no widget existente quando conferência diverge do snapshot.

---

## 5. Migração de dados existentes

- Popular `quantidade_inicial = quantidade + COALESCE(quantidade_vendida,0)` para linhas legadas.
- Popular snapshots a partir de `pecas` no momento da migration.
- `quantidade_devolvida = 0`, `quantidade_perdida = 0`.

---

## 6. Detalhes técnicos

- Todas RPCs usam `FOR UPDATE` em `pecas` e `maletas_pecas` para evitar race.
- Erros levantam exceções claras em pt-BR (`RAISE EXCEPTION`) → frontend mostra via `sonner`.
- `organization_id` validado em toda RPC via `user_belongs_to_org`.
- Money sempre `numeric(12,2)`.
- Sem `: any` no TS novo, importação direta de `@/integrations/supabase/client`.
- Nenhuma mudança em rotas, autenticação, Mercado Pago ou e-commerce.

---

## 7. Entregáveis

- 1 migration consolidada (colunas + tabela + 7 RPCs + trigger snapshot + backfill).
- Refator de `MaletaManager` em 8 componentes + 2 hooks.
- Novo wizard de conferência com scanner.
- Documentação rápida no topo do `MaletaManager.tsx` apontando para os novos hooks.

Sem alterações em outros módulos. Quer que eu prossiga?
