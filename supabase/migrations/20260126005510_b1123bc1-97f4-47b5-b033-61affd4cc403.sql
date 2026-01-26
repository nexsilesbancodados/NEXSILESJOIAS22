-- Drop ALL existing policies on organizations and memberships first
DROP POLICY IF EXISTS "Orgs visible to members" ON public.organizations;
DROP POLICY IF EXISTS "Owner can update org" ON public.organizations;
DROP POLICY IF EXISTS "Users can insert their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can delete their organizations" ON public.organizations;

DROP POLICY IF EXISTS "Members can view their membership" ON public.memberships;
DROP POLICY IF EXISTS "Owners can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can view their memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can create their own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can view memberships of their org" ON public.memberships;

DROP POLICY IF EXISTS "Users can view their roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Re-create policies for organizations
CREATE POLICY "org_insert_policy"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "org_select_policy"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
  OR owner_id = auth.uid()
);

CREATE POLICY "org_update_policy"
ON public.organizations
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "org_delete_policy"
ON public.organizations
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Re-create policies for memberships
CREATE POLICY "membership_insert_policy"
ON public.memberships
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "membership_select_own_policy"
ON public.memberships
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "membership_owner_manage_policy"
ON public.memberships
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
);

-- Policies for user_roles
CREATE POLICY "roles_select_own_policy"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "roles_insert_own_policy"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "roles_admin_manage_policy"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));