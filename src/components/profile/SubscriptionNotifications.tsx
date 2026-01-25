import { useAssinatura } from '@/hooks/useAssinatura';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  XCircle,
  CheckCircle,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function SubscriptionNotifications() {
  const { notificacoes, notificacoesNaoLidas, marcarNotificacaoLida } = useAssinatura();

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'aviso_3dias':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'aviso_vencimento':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'expirado':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationStyle = (tipo: string) => {
    switch (tipo) {
      case 'aviso_3dias':
        return 'border-l-warning bg-warning/5';
      case 'aviso_vencimento':
        return 'border-l-warning bg-warning/5';
      case 'expirado':
        return 'border-l-destructive bg-destructive/5';
      default:
        return 'border-l-muted';
    }
  };

  if (notificacoes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5" />
            Notificações de Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhuma notificação</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5" />
            Notificações de Assinatura
          </CardTitle>
          {notificacoesNaoLidas.length > 0 && (
            <Badge variant="destructive">
              {notificacoesNaoLidas.length} nova{notificacoesNaoLidas.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="divide-y">
            {notificacoes.map((notificacao) => (
              <div
                key={notificacao.id}
                className={cn(
                  "p-4 border-l-4 transition-colors",
                  getNotificationStyle(notificacao.tipo),
                  !notificacao.lida && "bg-accent/50"
                )}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notificacao.tipo)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn(
                        "font-medium text-sm",
                        !notificacao.lida && "font-semibold"
                      )}>
                        {notificacao.titulo}
                      </h4>
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => marcarNotificacaoLida(notificacao.id)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Marcar lida
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notificacao.mensagem}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(notificacao.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {notificacao.email_enviado && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Email enviado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
