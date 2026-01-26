-- Remove a política que causa recursão infinita
DROP POLICY IF EXISTS "Users can view memberships of their orgs" ON public.memberships;

-- A política membership_select_own_policy já existe e permite que usuários vejam seus próprios memberships
-- (user_id = auth.uid()) - isso é suficiente e não causa recursão