import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';
import { differenceInDays, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { EnvioGalvanica } from '@/hooks/useSupabaseData';

interface Props {
  envios: EnvioGalvanica[];
}

export function GalvanicaAlerts({ envios }: Props) {
  const alerts = useMemo(() => {
    const hoje = new Date();
    
    // Envios que ainda estão em andamento (não retornados)
    const pendentes = envios.filter(e => e.status === 'enviado' || e.status === 'em_processo');
    
    // Atrasados: envios onde data_retorno passou mas status ainda não é 'retornado'
    const atrasados = pendentes.filter(e => {
      if (!e.data_retorno) return false;
      const retorno = parseISO(e.data_retorno);
      return isBefore(retorno, hoje);
    });
    
    // Próximos: retorno previsto nos próximos 7 dias
    const proximos = pendentes.filter(e => {
      if (!e.data_retorno) return false;
      const retorno = parseISO(e.data_retorno);
      const limiteProximo = addDays(hoje, 7);
      return isAfter(retorno, hoje) && isBefore(retorno, limiteProximo);
    });

    return {
      atrasados,
      proximos,
      total: pendentes.length,
    };
  }, [envios]);

  if (alerts.atrasados.length === 0 && alerts.proximos.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card border-warning/30 bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Alertas de Galvânica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Atrasados */}
        {alerts.atrasados.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <Clock className="w-4 h-4" />
              {alerts.atrasados.length} envio(s) atrasado(s)
            </div>
            {alerts.atrasados.map((envio) => {
              const diasAtraso = differenceInDays(
                new Date(),
                parseISO(envio.data_retorno!)
              );
              return (
                <div
                  key={envio.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-destructive/10 text-sm"
                >
                  <div>
                    <span className="font-medium">{envio.banho?.nome || 'Banho'}</span>
                    {envio.peso_total && (
                      <span className="text-muted-foreground ml-2">({envio.peso_total}g)</span>
                    )}
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {diasAtraso} dia(s) de atraso
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* Próximos a vencer */}
        {alerts.proximos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-warning">
              <Clock className="w-4 h-4" />
              {alerts.proximos.length} envio(s) próximo(s) do prazo
            </div>
            {alerts.proximos.map((envio) => {
              const diasRestantes = differenceInDays(
                parseISO(envio.data_retorno!),
                new Date()
              );
              return (
                <div
                  key={envio.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-warning/10 text-sm"
                >
                  <div>
                    <span className="font-medium">{envio.banho?.nome || 'Banho'}</span>
                    {envio.peso_total && (
                      <span className="text-muted-foreground ml-2">({envio.peso_total}g)</span>
                    )}
                  </div>
                  <Badge className="bg-warning/20 text-warning-foreground text-xs">
                    {diasRestantes} dia(s) restante(s)
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
