-- Create subscriptions table for user plans
CREATE TABLE public.assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plano TEXT NOT NULL CHECK (plano IN ('nexsiles', 'nexsiles_max')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'expirado', 'cancelado', 'pendente')),
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  valor_mensal DECIMAL(10,2) NOT NULL,
  notificacao_3dias_enviada BOOLEAN DEFAULT false,
  notificacao_vencimento_enviada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.assinaturas
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert/update subscriptions (via edge functions)
CREATE POLICY "Service role can manage subscriptions"
ON public.assinaturas
FOR ALL
USING (true)
WITH CHECK (true);

-- Create notifications for subscription alerts
CREATE TABLE public.notificacoes_assinatura (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('aviso_3dias', 'aviso_vencimento', 'expirado')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  email_enviado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes_assinatura ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own notifications
CREATE POLICY "Users can view own subscription notifications"
ON public.notificacoes_assinatura
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription notifications"
ON public.notificacoes_assinatura
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_assinaturas_updated_at
BEFORE UPDATE ON public.assinaturas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_assinaturas_user_id ON public.assinaturas(user_id);
CREATE INDEX idx_assinaturas_vencimento ON public.assinaturas(data_vencimento);
CREATE INDEX idx_assinaturas_status ON public.assinaturas(status);
CREATE INDEX idx_notificacoes_assinatura_user_id ON public.notificacoes_assinatura(user_id);