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
  // O Mercado Pago anexa estes à back_url no retorno. Servem de prova de que
  // quem está na tela é mesmo o comprador — sem isso a Edge Function não
  // devolve o código (ver consultar-codigo-pendente).
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id') || '';
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [soPorEmail, setSoPorEmail] = useState(false);

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
        // O código só vem de volta com o payment_id do retorno do Mercado Pago.
        // Só o e-mail não basta: era possível varrer e-mails e capturar o
        // código de quem tinha acabado de comprar.
        const { data } = await supabase.functions.invoke('consultar-codigo-pendente', {
          body: { email: email.toLowerCase(), payment_id: paymentId || undefined },
        });
        if (cancelled) return;
        if (data?.codigo) {
          setCodigo(data.codigo);
          setPolling(false);
          return;
        }
        if (data?.enviado_por_email) {
          // O código existe, mas esta sessão não provou ser a do comprador.
          // Nada a esperar — o e-mail já saiu.
          setSoPorEmail(true);
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
  }, [status, email, paymentId]);

  const close = () => {
    setOpen(false);
    const p = new URLSearchParams(searchParams);
    p.delete('pagamento');
    p.delete('email');
    // Tira os identificadores do pagamento da barra de endereço para o link
    // não circular já servindo de prova de posse.
    p.delete('payment_id');
    p.delete('collection_id');
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
              ) : soPorEmail ? (
                <div className="rounded-xl border bg-muted/40 p-4 flex items-start gap-3 text-sm">
                  <Mail className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Seu código está no e-mail</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Por segurança, o código só aparece nesta tela quando você chega direto do
                      pagamento. Abra o e-mail que enviamos para {email || 'seu endereço'} e use
                      o código de lá.
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
