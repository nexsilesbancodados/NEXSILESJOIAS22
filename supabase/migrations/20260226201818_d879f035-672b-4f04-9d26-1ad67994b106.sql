
-- Newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique email per org
CREATE UNIQUE INDEX idx_newsletter_unique_email_org ON public.newsletter_subscribers (email, organization_id);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (public store)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Org members can view subscribers
CREATE POLICY "Org members can view newsletter subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.user_belongs_to_org(organization_id));

-- Org members can manage subscribers
CREATE POLICY "Org members can manage newsletter subscribers"
  ON public.newsletter_subscribers FOR UPDATE
  USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can delete newsletter subscribers"
  ON public.newsletter_subscribers FOR DELETE
  USING (public.user_belongs_to_org(organization_id));
