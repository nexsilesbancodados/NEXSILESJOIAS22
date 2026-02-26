
-- Add UPDATE/DELETE policies for agente_conversas
CREATE POLICY "Members can update their org conversations"
ON public.agente_conversas
FOR UPDATE
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Members can delete their org conversations"
ON public.agente_conversas
FOR DELETE
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

-- Add UPDATE/DELETE policies for agente_mensagens
CREATE POLICY "Members can update conversation messages"
ON public.agente_mensagens
FOR UPDATE
USING (conversa_id IN (
  SELECT ac.id FROM agente_conversas ac
  WHERE ac.organization_id IN (
    SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
  )
));

CREATE POLICY "Members can delete conversation messages"
ON public.agente_mensagens
FOR DELETE
USING (conversa_id IN (
  SELECT ac.id FROM agente_conversas ac
  WHERE ac.organization_id IN (
    SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
  )
));

-- Add UPDATE/DELETE policies for email_logs
CREATE POLICY "Members can update email logs"
ON public.email_logs
FOR UPDATE
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));

CREATE POLICY "Members can delete email logs"
ON public.email_logs
FOR DELETE
USING (organization_id IN (
  SELECT memberships.organization_id FROM memberships WHERE memberships.user_id = auth.uid()
));
