import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, MessageCircle, Loader2 } from 'lucide-react';

interface MaletaVencida {
  id: string;
  nome: string;
  numero_sequencial: number | null;
  revendedora_id: string | null;
  revendedora_nome: string | null;
  prazo_devolucao: string | null;
  dias_aberta: number;
  dias_vencida: number;
  status: string;
}

interface Props {
  diasParada?: number;
  onSelectMaleta?: (id: string) => void;
}

export function AlertasMaletasWidget({ diasParada = 30, onSelectMaleta }: Props) {
  const { organizationId } = useOrganization();

  const { data = [], isLoading } = useQuery({
    queryKey: ['maletas-vencidas', organizationId, diasParada],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('maletas_vencidas' as any, { p_dias_parada: diasParada });
      if (error) throw error;
      return (data ?? []) as unknown as MaletaVencida[];
    },
    enabled: !!organizationId,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          ✓ Nenhuma maleta vencida ou parada há mais de {diasParada} dias.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warning/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Alertas de Maletas ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((m) => {
          const vencida = m.dias_vencida > 0;
          return (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {m.numero_sequencial ? `#${String(m.numero_sequencial).padStart(3, '0')} ` : ''}
                    {m.nome}
                  </span>
                  {vencida ? (
                    <Badge variant="destructive" className="text-[10px]">
                      {m.dias_vencida}d vencida
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      <Clock className="w-3 h-3 mr-1" />
                      {m.dias_aberta}d parada
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {m.revendedora_nome ?? 'Sem revendedora'}
                </p>
              </div>
              {onSelectMaleta && (
                <Button size="sm" variant="outline" onClick={() => onSelectMaleta(m.id)}>
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                  Ver
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
