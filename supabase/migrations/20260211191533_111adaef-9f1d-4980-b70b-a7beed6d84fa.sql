-- Allow org members to insert email logs (needed by edge function with service role, but also for future direct use)
CREATE POLICY "Members can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (organization_id IN (
  SELECT memberships.organization_id
  FROM memberships
  WHERE memberships.user_id = auth.uid()
));
