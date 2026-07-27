import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const emailSchema = z.string().trim().email('E-mail inválido').max(255);

export function PublicCheckoutDialog({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState('');
  const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valor = periodo === 'anual' ? 1290 : 129;
  const valorFmt = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('mercadopago-checkout-public', {
        body: { email: parsed.data, plano: 'nexsiles', periodo },
      });
      if (fnError) throw fnError;
      const url = data?.checkoutUrl || data?.initPoint || data?.sandboxInitPoint;
      if (!url) throw new Error('Não foi possível iniciar o checkout.');
      // Redireciona na mesma aba — padrão do Checkout Pro para melhor conversão mobile
      window.location.assign(url);
    } catch (err: any) {
      console.error('checkout error', err);
      setError(err.message || 'Erro ao iniciar checkout. Tente novamente.');
      toast.error('Erro ao iniciar checkout');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-primary" /> Assinar Nexsiles Prime
            </DialogTitle>
            <DialogDescription>
              Tudo incluso. Sem fidelidade. Cancele quando quiser.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {(['mensal', 'anual'] as const).map((p) => {
              const active = periodo === p;
              const label = p === 'mensal' ? 'Mensal · R$ 129' : 'Anual · R$ 1.290';
              const badge = p === 'anual' ? '-17%' : null;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodo(p)}
                  className={`relative rounded-xl border p-3 text-left text-sm transition ${
                    active
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <div className="font-semibold">{label}</div>
                  <div className="text-xs opacity-70">
                    {p === 'mensal' ? 'Cobrança recorrente' : 'Economize com pagamento anual'}
                  </div>
                  {badge && (
                    <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout-email">E-mail para receber o código de acesso</Label>
            <Input
              id="checkout-email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enviaremos o código de acesso e a confirmação da compra para este e-mail.
            </p>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-semibold">Nexsiles Prime</div>
              <div className="text-xs text-muted-foreground">
                {periodo === 'anual' ? 'Plano Anual' : 'Plano Mensal'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{valorFmt}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {periodo === 'anual' ? '/ano' : '/mês'}
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Redirecionando...</>
            ) : (
              <><CreditCard className="w-4 h-4" /> Ir para pagamento seguro</>
            )}
          </Button>

          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SSL</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Mercado Pago</span>
            <span>PIX · Cartão · Boleto</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
