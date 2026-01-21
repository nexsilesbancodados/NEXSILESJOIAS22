import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  ShoppingBag, 
  Users,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useHistoricoRecente, HistoricoAlteracao } from '@/hooks/useHistoricoAlteracoes';

const TIPO_ICONS: Record<string, React.ElementType> = {
  criacao: Plus,
  atualizacao: Pencil,
  exclusao: Trash2,
};

const TIPO_COLORS: Record<string, string> = {
  criacao: 'bg-success/20 text-success',
  atualizacao: 'bg-warning/20 text-warning',
  exclusao: 'bg-destructive/20 text-destructive',
};

const ENTIDADE_ICONS: Record<string, React.ElementType> = {
  pecas: Package,
  vendas: ShoppingBag,
  revendedoras: Users,
  romaneios: Package,
};

interface Props {
  limit?: number;
  entidade?: string;
  showTitle?: boolean;
}

export function HistoricoAlteracoesPanel({ limit = 10, entidade, showTitle = true }: Props) {
  const { data: historico = [], isLoading } = useHistoricoRecente(limit);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredHistorico = entidade 
    ? historico.filter(h => h.entidade === entidade)
    : historico;

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Clock className="w-6 h-6 animate-pulse text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredHistorico.length === 0) {
    return (
      <Card className="glass-card">
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Histórico de Alterações
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma alteração registrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {filteredHistorico.map((item) => {
              const TipoIcon = TIPO_ICONS[item.tipo] || Pencil;
              const EntidadeIcon = ENTIDADE_ICONS[item.entidade] || Package;
              const isExpanded = expandedItems.has(item.id);
              const hasDetails = item.dados_anteriores || item.dados_novos;

              return (
                <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', TIPO_COLORS[item.tipo])}>
                      <TipoIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{item.descricao}</span>
                        <Badge variant="secondary" className="text-xs gap-1">
                          <EntidadeIcon className="w-3 h-3" />
                          {item.entidade}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        {item.usuario_nome && (
                          <>
                            <span>•</span>
                            <span>{item.usuario_nome}</span>
                          </>
                        )}
                        {item.valor && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-medium">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Details */}
                      {hasDetails && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(item.id)}
                            className="mt-2 h-6 text-xs"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                Ocultar detalhes
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                Ver detalhes
                              </>
                            )}
                          </Button>
                          {isExpanded && (
                            <div className="mt-2 p-2 rounded-lg bg-muted/50 text-xs space-y-1">
                              {item.dados_anteriores && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Antes:</span>
                                  <pre className="text-xs overflow-auto">
                                    {JSON.stringify(item.dados_anteriores, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {item.dados_novos && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Depois:</span>
                                  <pre className="text-xs overflow-auto">
                                    {JSON.stringify(item.dados_novos, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
