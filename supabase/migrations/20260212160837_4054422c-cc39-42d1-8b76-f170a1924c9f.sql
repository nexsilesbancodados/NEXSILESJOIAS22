
-- Allow organization members to view the owner's subscription
CREATE POLICY "Members can view org owner subscription"
ON public.assinaturas
FOR SELECT
USING (
  user_id IN (
    SELECT o.owner_id 
    FROM organizations o
    JOIN memberships m ON m.organization_id = o.id
    WHERE m.user_id = auth.uid()
  )
);
