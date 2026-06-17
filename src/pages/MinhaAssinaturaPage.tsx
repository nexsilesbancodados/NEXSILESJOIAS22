import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Crown, Calendar, CreditCard, Settings, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/PageHeader';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { useAssinatura } from '@/hooks/useAssinatura';

export default function MinhaAssinaturaPage() {
  const navigate = useNavigate();
  const { assinatura, planoInfo, isLoading, dataVencimentoFormatada } = useAssinatura();

  const dataInicioFormatada = assinatura?.data_inicio
    ? format(new Date(assinatura.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha Assinatura"
        subtitle="Gerencie seu plano, veja datas e atualize sua assinatura"
        icon={Crown}
      />

      {isLoading ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">Carregando...</CardContent></Card>
      ) : !assinatura ? (
        <Card>
          <CardHeader>
            <CardTitle>Sem assinatura ativa</CardTitle>
            <CardDescription>Você ainda não tem um plano. Escolha o Nexsiles Prime para liberar tudo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/planos')} className="btn-gold">
              <Crown className="w-4 h-4 mr-2" /> Assinar agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SubscriptionStatus />

            <Card>
              <CardHeader>
                <CardTitle>Detalhes do plano</CardTitle>
                <CardDescription>Informações da sua assinatura</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Detail icon={Crown} label="Plano" value={planoInfo?.nome ?? '—'} />
                  <Detail
                    icon={CreditCard}
                    label="Valor mensal"
                    value={`R$ ${(assinatura.valor_mensal ?? 129).toFixed(2).replace('.', ',')}`}
                  />
                  <Detail icon={Calendar} label="Data de início" value={dataInicioFormatada} />
                  <Detail icon={Calendar} label="Próximo vencimento" value={dataVencimentoFormatada ?? '—'} />
                  <Detail
                    icon={CheckCircle2}
                    label="Status"
                    value={<Badge variant="outline" className="capitalize">{assinatura.status}</Badge>}
                  />
                  <Detail
                    icon={CreditCard}
                    label="Método de pagamento"
                    value={
                      assinatura.metodo_pagamento
                        ? assinatura.metodo_pagamento === 'cartao'
                          ? 'Cartão de crédito'
                          : assinatura.metodo_pagamento.toUpperCase()
                        : '—'
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {planoInfo?.recursos && (
              <Card>
                <CardHeader>
                  <CardTitle>Recursos inclusos</CardTitle>
                  <CardDescription>Tudo que o {planoInfo.nome} libera</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {planoInfo.recursos.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gerenciar assinatura</CardTitle>
                <CardDescription>Renove, atualize ou troque o método de pagamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full btn-gold" onClick={() => navigate('/planos')}>
                  <ArrowUpRight className="w-4 h-4 mr-2" /> Renovar / Atualizar
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/configuracoes')}>
                  <Settings className="w-4 h-4 mr-2" /> Configurações da conta
                </Button>
                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground">
                  Precisa de ajuda? Fale com o suporte pelo WhatsApp para alterar dados de cobrança ou cancelar.
                </p>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() =>
                    window.open('https://wa.me/5511937687369?text=Olá! Preciso de ajuda com minha assinatura Nexsiles.', '_blank')
                  }
                >
                  Falar com suporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Crown;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
      <Icon className="w-4 h-4 text-muted-foreground mt-1" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
