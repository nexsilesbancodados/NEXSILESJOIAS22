-- Create table for custom WhatsApp templates
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  mensagem TEXT NOT NULL,
  categoria VARCHAR(50) DEFAULT 'personalizado',
  variaveis JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization templates"
  ON public.whatsapp_templates FOR SELECT
  USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Users can create templates for their organization"
  ON public.whatsapp_templates FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Users can update their organization templates"
  ON public.whatsapp_templates FOR UPDATE
  USING (organization_id IN (SELECT public.get_user_organization_ids()));

CREATE POLICY "Users can delete their organization templates"
  ON public.whatsapp_templates FOR DELETE
  USING (organization_id IN (SELECT public.get_user_organization_ids()));

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_whatsapp_templates_org ON public.whatsapp_templates(organization_id);
CREATE INDEX idx_whatsapp_templates_ativo ON public.whatsapp_templates(ativo) WHERE ativo = true;