import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Shield, Lock, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PlanoKey } from '@/hooks/useAssinatura';

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY || '';

interface MercadoPagoCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano: PlanoKey;
  periodo: 'mensal' | 'anual';
  valor: number;
  planoNome: string;
}

type CheckoutStatus = 'loading' | 'ready' | 'processing' | 'success' | 'error' | 'pending';

export function MercadoPagoCheckout({ 
  open, 
  onOpenChange, 
  plano, 
  periodo, 
  valor, 
  planoNome 
}: MercadoPagoCheckoutProps) {
  const [status, setStatus] = useState<CheckoutStatus>('loading');
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const brickContainerRef = useRef<HTMLDivElement>(null);
  const brickControllerRef = useRef<any>(null);
  const mpInstanceRef = useRef<any>(null);

  const createPreference = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
        body: { plano, periodo },
      });

      if (error) throw error;
      if (!data?.preferenceId) throw new Error('Preference ID not returned');

      setPreferenceId(data.preferenceId);
      return data.preferenceId;
    } catch (err) {
      console.error('Error creating preference:', err);
      toast.error('Erro ao iniciar checkout');
      setStatus('error');
      return null;
    }
  }, [plano, periodo]);

  const loadMercadoPagoScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).MercadoPago) { resolve(); return; }
      const existingScript = document.querySelector('script[src*="sdk.mercadopago.com"]');
      if (existingScript) { existingScript.addEventListener('load', () => resolve()); return; }
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load MercadoPago SDK'));
      document.head.appendChild(script);
    });
  }, []);

  const initializeBrick = useCallback(async (prefId: string) => {
    try {
      await loadMercadoPagoScript();
      const mp = new (window as any).MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
      mpInstanceRef.current = mp;
      const bricksBuilder = mp.bricks();

      if (brickControllerRef.current) {
        await brickControllerRef.current.unmount();
        brickControllerRef.current = null;
      }
      if (brickContainerRef.current) brickContainerRef.current.innerHTML = '';

      const controller = await bricksBuilder.create('payment', 'mp-brick-container', {
        initialization: { amount: valor, preferenceId: prefId },
        customization: {
          visual: {
            style: {
              theme: 'dark',
              customVariables: {
                formBackgroundColor: 'hsl(var(--card))',
                baseColor: 'hsl(var(--primary))',
                borderRadiusLarge: '12px',
                borderRadiusMedium: '8px',
                borderRadiusSmall: '4px',
                borderRadiusFull: '100px',
              },
            },
            hideFormTitle: true,
            hidePaymentButton: false,
          },
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            bankTransfer: 'all',
            ticket: 'all',
            maxInstallments: 12,
          },
        },
        callbacks: {
          onReady: () => setStatus('ready'),
          onSubmit: async ({ selectedPaymentMethod, formData }: any) => {
            setStatus('processing');
            try {
              const response = await fetch(
                `https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/mercadopago-process-payment`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqb2Zud2N2cHpxbGhhZ2VqZ2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjIwMDAsImV4cCI6MjA4NDgzODAwMH0.kCxv9nbZ7eph4T09WYgbUednAQeW0Slutet08G9svXc',
                  },
                  body: JSON.stringify({ ...formData, plano, periodo }),
                }
              );
              const result = await response.json();

              if (result.status === 'approved') {
                setStatus('success');
                toast.success('Pagamento aprovado! 🎉');
                setTimeout(() => { onOpenChange(false); window.location.reload(); }, 3000);
              } else if (result.status === 'pending' || result.status === 'in_process') {
                setStatus('pending');
                toast.info('Pagamento pendente', { description: 'Seu pagamento está sendo processado.' });
              } else {
                setStatus('error');
                toast.error('Pagamento não aprovado', { description: result.status_detail || 'Tente novamente.' });
                setTimeout(() => setStatus('ready'), 3000);
              }
            } catch (err) {
              console.error('Payment error:', err);
              setStatus('error');
              toast.error('Erro ao processar pagamento');
              setTimeout(() => setStatus('ready'), 3000);
            }
          },
          onError: (error: any) => { console.error('Brick error:', error); setStatus('error'); },
        },
      });
      brickControllerRef.current = controller;
    } catch (err) {
      console.error('Error initializing brick:', err);
      setStatus('error');
    }
  }, [valor, plano, periodo, onOpenChange, loadMercadoPagoScript]);

  useEffect(() => {
    if (open) {
      setStatus('loading');
      createPreference().then((prefId) => {
        if (prefId) setTimeout(() => initializeBrick(prefId), 300);
      });
    }
    return () => {
      if (brickControllerRef.current) {
        try { brickControllerRef.current.unmount(); } catch (e) {}
        brickControllerRef.current = null;
      }
    };
  }, [open, createPreference, initializeBrick]);

  const valorFormatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-r from-primary/10 to-warning/10 p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Checkout Seguro
            </DialogTitle>
            <DialogDescription>Finalize sua assinatura de forma rápida e segura</DialogDescription>
          </DialogHeader>
          <Card className="mt-4 border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{planoNome}</p>
                  <p className="text-sm text-muted-foreground">{periodo === 'anual' ? 'Plano Anual' : 'Plano Mensal'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{valorFormatado}</p>
                  <p className="text-xs text-muted-foreground">{periodo === 'anual' ? '/ano' : '/mês'}</p>
                </div>
              </div>
              {periodo === 'anual' && (
                <Badge variant="secondary" className="mt-2 bg-success/10 text-success border-success/20 text-xs">
                  Economia de 20% no plano anual
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="p-6 pt-4">
          <AnimatePresence mode="wait">
            {status === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-12">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Pagamento Aprovado!</h3>
                <p className="text-muted-foreground text-center">Sua assinatura do {planoNome} foi ativada com sucesso.</p>
              </motion.div>
            )}
            {status === 'pending' && (
              <motion.div key="pending" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-12">
                <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-warning" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Pagamento Pendente</h3>
                <p className="text-muted-foreground text-center">Seu pagamento está sendo processado. Você receberá uma confirmação por e-mail.</p>
              </motion.div>
            )}
            {status === 'error' && !brickContainerRef.current?.innerHTML && (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-12">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Erro no Pagamento</h3>
                <p className="text-muted-foreground text-center">Não foi possível processar. Tente novamente.</p>
                <Button onClick={() => { setStatus('loading'); createPreference().then(p => p && initializeBrick(p)); }}>Tentar Novamente</Button>
              </motion.div>
            )}
          </AnimatePresence>

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Preparando checkout seguro...</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50 rounded-lg">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-foreground font-medium">Processando pagamento...</p>
              <p className="text-muted-foreground text-sm">Não feche esta janela</p>
            </div>
          )}

          <div
            id="mp-brick-container"
            ref={brickContainerRef}
            className={cn(
              "min-h-[200px] transition-opacity duration-300",
              (status === 'success' || status === 'pending' || (status === 'error' && !brickContainerRef.current?.innerHTML)) ? 'hidden' : 'block',
              status === 'loading' ? 'opacity-0 h-0' : 'opacity-100'
            )}
          />

          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5" /><span>SSL Seguro</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" /><span>Mercado Pago</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
