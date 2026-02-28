import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Check, Loader2, Inbox } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { db } from '@/lib/supabase-db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function ComissoesManager() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  const { data: comissoes = [], isLoading } = useQuery({
    queryKey: ['comissoes-revendedoras', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await db.from('comissoes_revendedoras')
        .select('*, revendedoras(nome)')
        .eq('organization_id', organization.id)
        .order('mes_referencia', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const marcarPago = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('comissoes_revendedoras')
        .update({ status: 'pago', data_pagamento: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes-revendedoras'] });
      toast.success('Comissão marcada como paga!');
    },
    onError: () => toast.error('Erro ao atualizar comissão'),
  });

  const filtered = filtroStatus === 'todos'
    ? comissoes
    : comissoes.filter((c: any) => c.status === filtroStatus);

  const totalPendente = comissoes
    .filter((c: any) => c.status === 'pendente')
    .reduce((s: number, c: any) => s + (c.valor_comissao || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Comissões
          </h3>
          {totalPendente > 0 && (
            <p className="text-sm text-muted-foreground">
              Total pendente: <span className="font-bold text-foreground">R$ {totalPendente.toFixed(2)}</span>
            </p>
          )}
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma comissão encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c: any) => (
            <Card key={c.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="py-3 px-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {c.revendedoras?.nome || 'Revendedora'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ref: {c.mes_referencia} • Vendas: R$ {(c.valor_vendas || 0).toFixed(2)} • {c.percentual_comissao || 0}%
                  </p>
                </div>
                <p className="font-bold text-sm whitespace-nowrap">
                  R$ {(c.valor_comissao || 0).toFixed(2)}
                </p>
                {c.status === 'pendente' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => marcarPago.mutate(c.id)}
                    disabled={marcarPago.isPending}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Pagar
                  </Button>
                ) : (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                    Pago
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
