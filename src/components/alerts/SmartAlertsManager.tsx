import { useState } from 'react';
import { Bell, RefreshCw, Package, Briefcase, Cake, Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-db';

interface AlertResult {
  success: boolean;
  alertsCreated: number;
  details: string[];
  timestamp: string;
  error?: string;
}

export function SmartAlertsManager() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<AlertResult | null>(null);

  const checkAlerts = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('verificar-alertas');

      if (error) {
        throw error;
      }

      setLastResult(data as AlertResult);

      if (data.alertsCreated > 0) {
        toast.success(`${data.alertsCreated} alerta(s) criado(s)!`, {
          description: 'Verifique o sino de notificações',
        });
      } else {
        toast.info('Nenhum alerta novo encontrado', {
          description: 'Tudo está em ordem!',
        });
      }
    } catch (error) {
      console.error('Erro ao verificar alertas:', error);
      toast.error('Erro ao verificar alertas');
      setLastResult({
        success: false,
        alertsCreated: 0,
        details: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const alertTypes = [
    {
      icon: Package,
      label: 'Estoque Baixo',
      description: 'Peças com estoque abaixo do mínimo',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      icon: Briefcase,
      label: 'Maletas Vencendo',
      description: 'Maletas com devolução em até 3 dias',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: Cake,
      label: 'Aniversários',
      description: 'Clientes e revendedoras aniversariando hoje',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle className="font-display">Alertas Inteligentes</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkAlerts}
            disabled={isChecking}
            className="gap-2"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Verificar Agora
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Sistema de notificações automáticas baseado em regras
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alertTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.label}
                className="flex items-start gap-3 p-4 rounded-lg border bg-card"
              >
                <div className={`p-2 rounded-lg ${type.bgColor}`}>
                  <Icon className={`w-5 h-5 ${type.color}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Last result */}
        {lastResult && (
          <div className={`p-4 rounded-lg border ${lastResult.success ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {lastResult.success ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                )}
                <span className="font-medium text-sm">
                  {lastResult.success ? 'Verificação concluída' : 'Erro na verificação'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {new Date(lastResult.timestamp).toLocaleTimeString('pt-BR')}
              </div>
            </div>

            {lastResult.success ? (
              <>
                <Badge variant={lastResult.alertsCreated > 0 ? 'default' : 'secondary'}>
                  {lastResult.alertsCreated} alerta(s) criado(s)
                </Badge>

                {lastResult.details.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {lastResult.details.slice(0, 5).map((detail, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        {detail}
                      </li>
                    ))}
                    {lastResult.details.length > 5 && (
                      <li className="text-xs text-muted-foreground">
                        ... e mais {lastResult.details.length - 5} alerta(s)
                      </li>
                    )}
                  </ul>
                )}
              </>
            ) : (
              <p className="text-sm text-destructive">{lastResult.error}</p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          💡 Os alertas são verificados automaticamente diariamente às 8h. 
          Use o botão acima para verificar manualmente a qualquer momento.
        </p>
      </CardContent>
    </Card>
  );
}
