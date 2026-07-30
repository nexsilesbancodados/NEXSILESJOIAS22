# Testes da migration de hardening

Estes scripts sobem um **Postgres real** (PGlite, WebAssembly — não precisa de
Docker nem de servidor), montam um banco parecido com o de produção, aplicam a
migration `20260730120000_hardening_sessoes_publicas_rls_privilegios.sql` e
testam a segurança de verdade: login do portal, isolamento entre revendedoras e
entre tenants, escalada de privilégio, ativação de código de acesso e estoque
atômico.

Foi assim que dois bugs da própria correção apareceram antes de ir para o ar:

1. Policies que consultavam `memberships` por dentro não funcionavam — subconsulta
   dentro de policy também passa por RLS, e `memberships` só expõe a própria
   linha. Isso teria derrubado as telas de equipe. Corrigido com a função
   `usuarios_mesma_organizacao()` (SECURITY DEFINER).
2. `REVOKE ... FROM anon` não tirava o acesso: o `EXECUTE` default é concedido a
   `PUBLIC`, e `anon` herda dele. Era preciso revogar de `PUBLIC` e devolver o
   `GRANT` só para quem deve ter.

## Como rodar

```sh
npm i -D @electric-sql/pglite      # ~30 MB, só para os testes
cd supabase/tests
node gen-schema.mjs                # gera o schema sintético a partir de types.ts
node run.mjs                       # aplica a migration + 69 testes de segurança
node cobertura.mjs                 # toda operação do app tem policy que a cobre?
node rpcs.mjs                      # toda RPC chamada existe e está no alcance?
```

## O que cada arquivo faz

| Arquivo | Papel |
|---|---|
| `gen-schema.mjs` | Deriva `CREATE TABLE` de todas as 87 tabelas a partir de `src/integrations/supabase/types.ts` (gerado pelo Supabase, logo fiel ao banco). Saída: `schema-sintetico.sql`. |
| `base.sql` | O que o Supabase fornece: roles `anon`/`authenticated`/`service_role`, schema `auth` com `uid()`/`jwt()`, e stubs de pgcrypto (PGlite não tem a extensão). |
| `preexistente.sql` | Funções e policies que **já existem** em produção — inclusive as permissivas que a migration derruba, para o teste provar que elas somem. |
| `run.mjs` | Aplica a migration e roda os testes (T1…T19). Também confirma que rodar a migration duas vezes não dá erro. |
| `cobertura.mjs` | Cruza as 216 operações de tabela do app com o conjunto final de policies, procurando tela que ficou sem acesso. |
| `rpcs.mjs` | Confere que as 32 RPCs chamadas pelo app/edge functions existem e não caíram num `REVOKE`. |

## Limites

- PGlite é Postgres 18; produção é a versão do Supabase. Para DDL, plpgsql e RLS
  o comportamento é o mesmo, mas não é o banco real.
- O schema é sintético: tipos vêm de heurística sobre `types.ts` (uuid para
  `*_id`, timestamptz para `*_at`, etc.). Serve para validar a migration, não
  para reproduzir dados.
- pgcrypto é stubado: `crypt`/`gen_salt` imitam o contrato (o hash guardado
  reproduz a verificação), não o bcrypt de verdade.
- `cobertura.mjs` pode dar falso positivo quando duas queries ficam próximas no
  mesmo arquivo (ele olha uma janela de texto após o `.from()`).
