import { useMemo } from 'react';
import { useHistoricoAlteracoes } from '@/hooks/useHistoricoAlteracoes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Plus, Pencil, Trash2, Activity, Clock,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineAtividadesProps {
  tabela?: string;
  registroId?: string;
  limit?: number;
  title?: string;
  height?: number | string;
  className?: string;
}

const acaoMeta: Record<string, { label: string; icon: any; color: string; ring: string }> = {
  criacao:      { label: 'Criado',    icon: Plus,   color: 'text-emerald-600 bg-emerald-500/10', ring: 'ring-emerald-500/30' },
  atualizacao:  { label: 'Atualizado', icon: Pencil, color: 'text-amber-600 bg-amber-500/10',    ring: 'ring-amber-500/30' },
  exclusao:     { label: 'Excluído',  icon: Trash2, color: 'text-rose-600 bg-rose-500/10',       ring: 'ring-rose-500/30' },
};

const tabelaLabels: Record<string, string> = {
  pecas: 'Peça', vendas: 'Venda', clientes: 'Cliente', revendedoras: 'Revendedora',
  maletas: 'Maleta', romaneios: 'Romaneio', catalogos: 'Catálogo',
  pedidos_catalogo: 'Pedido', caixa_sessoes: 'Caixa', profiles: 'Perfil',
  campanhas: 'Campanha', fornecedores: 'Fornecedor',
};

export function TimelineAtividades({
  tabela,
  registroId,
  limit = 40,
  title = 'Linha do tempo',
  height = 420,
  className,
}: TimelineAtividadesProps) {
  const { data: atividades = [], isLoading } = useHistoricoAlteracoes({ tabela, registroId, limit });

  const grupos = useMemo(() => {
    const map = new Map<string, any[]>();
    (atividades as any[]).forEach((a) => {
      if (!a?.created_at) return;
      const key = format(new Date(a.created_at), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [atividades]);

  return (
    <Card className={cn('border border-border/60 rounded-2xl', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          {title}
          {atividades.length > 0 && (
            <Badge variant="outline" className="ml-1 text-[10px]">{atividades.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : atividades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <Clock className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Sem atividades registradas</p>
          </div>
        ) : (
          <ScrollArea style={{ height }} className="pr-2">
            <div className="relative pl-6">
              <div className="absolute left-[14px] top-2 bottom-2 w-px bg-border" />
              {grupos.map(([dia, itens]) => (
                <div key={dia} className="mb-4 last:mb-0">
                  <div className="sticky top-0 z-10 -ml-6 pl-6 pb-2 bg-card/95 backdrop-blur">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {format(new Date(dia), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  {itens.map((a: any) => {
                    const meta = acaoMeta[a.tipo] || acaoMeta.atualizacao;
                    const Icon = meta.icon;
                    const entidade = tabelaLabels[a.entidade] || a.entidade;
                    return (
                      <div key={a.id} className="relative pb-3 last:pb-0 group">
                        <div className={cn(
                          'absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-background',
                          meta.color, meta.ring,
                        )}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="ml-3 rounded-lg border border-border/50 bg-card/40 hover:bg-muted/40 transition-colors p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{meta.label}</span>
                            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{entidade}</Badge>
                            <span className="text-[11px] text-muted-foreground ml-auto">
                              {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          {a.descricao && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.descricao}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
