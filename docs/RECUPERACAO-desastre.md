# Se o banco for perdido, hoje não há de onde voltar

Duas coisas precisam ser verdade para conseguir reconstruir o sistema: ter um backup,
e ter como recriar o esquema. Hoje nenhuma das duas é.

Este documento resolve as duas. O passo 1 é de painel e leva dois minutos. O passo 2 é
um comando.

---

## 1. Ligar o backup automático (faça isto primeiro)

O painel do Supabase mostra **"No backups"**. Enquanto isso for verdade, qualquer perda
de dados é definitiva — 19 lojas sem retorno.

1. Painel do Supabase → **Settings → Billing**
2. Mudar para o plano **Pro**
3. Conferir em **Database → Backups** que passou a listar backup diário

No Pro o Supabase passa a fazer backup diário automático com 7 dias de retenção. É a
única opção que não depende de alguém lembrar de rodar alguma coisa.

> Fazer exportação manual por CSV também funciona, mas depende de disciplina semanal e
> não captura funções, políticas RLS nem triggers — que é justamente a parte difícil de
> reconstruir.

---

## 2. Gerar a linha de base do esquema

### Por que a pasta `supabase/migrations/` NÃO serve para isso

É intuitivo achar que 218 migrations reconstroem o banco. Não reconstroem, e é importante
entender o motivo antes de confiar nelas.

O esquema completo foi escrito quatro vezes, em versões **incompatíveis entre si**:

| Migration | Como define `public.profiles` |
|---|---|
| `20260114224859…` | `id` é PK e referencia `auth.users`; tem coluna `role` |
| `20260119021859…` | outra estrutura |
| `20260119161705…` | `id` é `gen_random_uuid()` e `user_id` é a referência ← **é esta que está no ar** |
| `20260124161617…` | outra ainda, com enum `app_role` |

Rodar a pasta inteira em um banco vazio para no segundo `CREATE TABLE public.profiles`
com `relation "profiles" already exists`.

E a correção que parece óbvia — colocar `IF NOT EXISTS` em tudo — **deixa o problema pior**.
O replay passaria a "funcionar", criando a `profiles` da *primeira* migration e pulando
silenciosamente a terceira, que é a correta. O sistema subiria com um esquema errado e
sem nenhuma mensagem de erro. É mais difícil de diagnosticar do que a falha atual.

O mesmo vale para o resto: 123 `CREATE TABLE`, 936 `CREATE POLICY` e 115 `CREATE TRIGGER`
sem guarda de idempotência. `CREATE POLICY` nem aceita `IF NOT EXISTS` no PostgreSQL.

**Conclusão:** a pasta de migrations é o histórico de como o projeto chegou aqui. Não é,
e não vai virar, um mecanismo de recuperação. A linha de base tem que sair do banco que
está rodando.

### Como gerar

Precisa da [CLI do Supabase](https://supabase.com/docs/guides/cli) e da senha do banco
(painel → **Settings → Database → Database password**).

No Windows:

```powershell
.\scripts\baseline-schema.ps1
```

No Linux/macOS:

```sh
./scripts/baseline-schema.sh
```

O script grava em `supabase/baseline/`:

- `schema.sql` — tabelas, colunas, índices, políticas RLS, funções e triggers
- `roles.sql` — papéis do banco
- `data.sql` — conteúdo das tabelas

Commite os três. A partir daí existe um ponto de restauração versionado, e
`psql < schema.sql` em um banco vazio reproduz a estrutura real.

### Com que frequência

Sempre que o esquema mudar de forma relevante — tabela nova, política nova, mudança de
coluna. Na prática: rode antes de qualquer alteração grande e depois que ela estabilizar.

---

## 3. Testar a restauração

Backup que nunca foi restaurado não é backup, é esperança. Uma vez, depois de gerar a
linha de base:

1. Crie um projeto Supabase novo e vazio (o plano gratuito serve para o teste)
2. `psql "<connection string do projeto novo>" -f supabase/baseline/schema.sql`
3. Confira que as tabelas principais existem: `profiles`, `organizations`, `memberships`,
   `pecas`, `vendas`, `maletas`
4. Apague o projeto de teste

Se o passo 2 der erro, é melhor descobrir agora do que no dia em que precisar.
