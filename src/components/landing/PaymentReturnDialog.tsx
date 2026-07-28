import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, XCircle, Mail, LogIn, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Status = 'sucesso' | 'pendente' | 'erro';

export function PaymentReturnDialog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('pagamento') as Status | null;
  const email = searchParams.get('email') || '';
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (status === 'sucesso' || status === 'pendente' || status === 'erro') {
      setOpen(true);
    }
  }, [status]);

  // Poll for access code after successful payment
  useEffect(() => {
    if (status !== 'sucesso' || !email) return;
    let cancelled = false;
    let attempts = 0;
    setPolling(true);

    const tick = async () => {
      if (cancelled) return;
      attempts++;
      try {
        const { data } = await supabase.rpc('get_pending_access_code', { p_email: email.toLowerCase() });
        const row = Array.isArray(data) ? data[0] : data;
        if (row?.codigo && !cancelled) {
          setCodigo(row.codigo);
          setPolling(false);
          return;
        }
      } catch (err) {
        console.warn('poll error', err);
      }
      if (attempts < 30 && !cancelled) {
        setTimeout(tick, 3000);
      } else {
        setPolling(false);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [status, email]);

  const close = () => {
    setOpen(false);
    const p = new URLSearchParams(searchParams);
    p.delete('pagamento');
    p.delete('email');
    setSearchParams(p, { replace: true });
  };

  const goCriarConta = () => {
    close();
    const params = new URLSearchParams();
    if (codigo) params.set('codigo', codigo);
    if (email) params.set('email', email);
    navigate(`/auth?${params.toString()}`);
  };

  if (!status) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="max-w-md">
        {status === 'sucesso' && (
          <>
            <DialogHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <DialogTitle className="text-center text-2xl">Pagamento aprovado!</DialogTitle>
              <DialogDescription className="text-center">
                Sua assinatura do <b>Nexsiles Prime</b> foi ativada.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Mail className="w-4 h-4" />
                  <span>Enviamos os detalhes para:</span>
                </div>
                <div className="font-mono text-foreground break-all">{email || 'seu e-mail'}</div>
              </div>

              {codigo ? (
                <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 text-center">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                    Seu código de acesso
                  </div>
                  <div className="text-2xl font-mono font-bold tracking-widest text-primary">
                    {codigo}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Use este código para criar sua conta.
                  </div>
                </div>
              ) : polling ? (
                <div className="rounded-xl border bg-muted/40 p-4 flex items-center gap-3 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <div>
                    <div className="font-medium">Gerando seu código de acesso...</div>
                    <div className="text-xs text-muted-foreground">
                      Isso leva alguns segundos após a confirmação do pagamento.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Não recebeu o código? Verifique sua caixa de entrada e spam. O envio pode levar até 2 minutos.
                </div>
              )}

              <Button className="w-full gap-2" size="lg" onClick={goCriarConta}>
                <LogIn className="w-4 h-4" />
                {codigo ? 'Criar minha conta agora' : 'Ir para criação de conta'}
              </Button>
            </div>
          </>
        )}

        {status === 'pendente' && (
          <>
            <DialogHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <DialogTitle className="text-center text-2xl">Pagamento pendente</DialogTitle>
              <DialogDescription className="text-center">
                Estamos aguardando a confirmação. Assim que aprovado, enviaremos o código de acesso para{' '}
                <b>{email || 'seu e-mail'}</b>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm text-muted-foreground mt-2">
              <p>• PIX: confirmação em segundos após o pagamento.</p>
              <p>• Boleto: pode levar até 2 dias úteis.</p>
              <p>• Cartão: normalmente instantâneo, revisões antifraude podem levar minutos.</p>
            </div>
            <Button className="w-full gap-2 mt-2" onClick={close} variant="outline">
              <RefreshCw className="w-4 h-4" /> Fechar e continuar
            </Button>
          </>
        )}

        {status === 'erro' && (
          <>
            <DialogHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <DialogTitle className="text-center text-2xl">Pagamento não concluído</DialogTitle>
              <DialogDescription className="text-center">
                O pagamento não foi finalizado. Nenhum valor foi cobrado.
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full mt-2" onClick={close}>Tentar novamente</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
