-- A tela de Observability só abre para um e-mail escrito dentro da política:
--
--   AND u.email = 'beneloahsemijoias@gmail.com'
--
-- Duas consequências. Quem não é essa conta abre a tela e vê vazio, mesmo
-- havendo erro gravado — parece que não há erro nenhum, quando na verdade é
-- falta de permissão. E o dia em que esse endereço mudar, ou a pessoa sair,
-- ninguém mais enxerga os erros até alguém rodar uma migration.
--
-- O projeto já tem o conceito certo: `profiles.is_super_admin`, usado em 20
-- migrations e na tela de SuperAdmin. A política passa a usar ele.

drop policy if exists "Root admin can view all errors" on public.edge_function_errors;

create policy "Super admin vê os erros das funções"
on public.edge_function_errors
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
     where p.id = auth.uid()
       and p.is_super_admin = true
  )
);

comment on table public.edge_function_errors is
  'Erros das Edge Functions. Leitura restrita a profiles.is_super_admin. Escrita apenas pelo service_role, via captureError() em _shared/logger.ts.';
