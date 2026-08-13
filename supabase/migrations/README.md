# Esta pasta é histórico, não é backup

As 218 migrations registram como o projeto chegou ao esquema atual. Elas **não**
reconstroem o banco em uma instalação nova.

O esquema completo foi escrito quatro vezes, em versões incompatíveis entre si — a
`public.profiles`, por exemplo, tem quatro definições diferentes e só a de
`20260119161705…` corresponde ao que está no ar. Rodar a pasta em um banco vazio para no
segundo `CREATE TABLE public.profiles`.

Não adicione `IF NOT EXISTS` para "consertar" isso: o replay passaria a criar a versão
errada da tabela e pular a certa em silêncio, o que é pior que a falha atual.

**Para recuperação, use `supabase/baseline/`** — gerado a partir do banco real por
`scripts/baseline-schema.ps1` (ou `.sh`). Ver `docs/RECUPERACAO-desastre.md`.

Migrations novas continuam sendo o caminho normal para alterar o esquema daqui em diante.
