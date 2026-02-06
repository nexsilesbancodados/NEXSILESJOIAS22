import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Clock, Phone, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFilaHumana, useAtenderFila } from '@/hooks/useFilaHumana';

export function FilaHumanaPanel() {
  const { data: fila = [], isLoading } = useFilaHumana();
  const atenderFila = useAtenderFila();

  const handleAtender = (filaId: string) => {
    atenderFila.mutate(filaId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fila de Atendimento
            {fila.length > 0 && (
              <Badge variant="destructive">{fila.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : fila.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Nenhum atendimento pendente</p>
                <p className="text-sm">A fila está vazia no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fila.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border bg-card hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {item.conversa?.cliente_nome || 'Cliente Anônimo'}
                          </span>
                        </div>
                        {item.conversa?.cliente_telefone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {item.conversa.cliente_telefone}
                          </div>
                        )}
                      </div>
                      <Badge 
                        variant={item.prioridade && item.prioridade > 0 ? 'destructive' : 'secondary'}
                      >
                        {item.prioridade && item.prioridade > 0 ? 'Prioridade Alta' : 'Normal'}
                      </Badge>
                    </div>

                    {item.motivo && (
                      <div className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm mb-3">
                        <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>{item.motivo}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Na fila desde: {item.entrou_fila_at && format(new Date(item.entrou_fila_at), "HH:mm", { locale: ptBR })}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAtender(item.id)}
                        disabled={atenderFila.isPending}
                      >
                        Atender
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Cliente solicita atendimento</p>
                <p className="text-sm text-muted-foreground">
                  Quando o cliente pede para falar com um humano, ele entra na fila automaticamente
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Atendente assume</p>
                <p className="text-sm text-muted-foreground">
                  Clique em "Atender" para assumir a conversa e continuar o atendimento
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Histórico completo</p>
                <p className="text-sm text-muted-foreground">
                  Você terá acesso a toda a conversa anterior para dar continuidade
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">💡 Dica</p>
            <p className="text-sm text-muted-foreground">
              Configure notificações push para ser alertado quando novos atendimentos entrarem na fila.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
