import { useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationSettings() {
  const { isSupported, permission, requestPermission, isEnabled } = usePushNotifications({ enabled: true });
  const [settings, setSettings] = useState({
    onNewConversation: true,
    onHumanRequest: true,
    onNewOrder: true,
  });

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <BellOff className="h-5 w-5" />
            <p>Seu navegador não suporta notificações push.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <BellOff className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-medium">Status das Notificações</p>
              <p className="text-sm text-muted-foreground">
                {permission === 'granted' && 'Ativadas'}
                {permission === 'denied' && 'Bloqueadas pelo navegador'}
                {permission === 'default' && 'Não configuradas'}
              </p>
            </div>
          </div>
          {!isEnabled && permission !== 'denied' && (
            <Button onClick={requestPermission}>
              <Bell className="h-4 w-4 mr-2" />
              Ativar
            </Button>
          )}
          {permission === 'denied' && (
            <Badge variant="destructive">Bloqueado</Badge>
          )}
        </div>

        {/* Notification Types */}
        {isEnabled && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha quais notificações você deseja receber:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="new-conversation">Novas conversas</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando um cliente iniciar uma nova conversa
                  </p>
                </div>
                <Switch
                  id="new-conversation"
                  checked={settings.onNewConversation}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, onNewConversation: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="human-request">Atendimento humano</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando um cliente solicitar atendente humano
                  </p>
                </div>
                <Switch
                  id="human-request"
                  checked={settings.onHumanRequest}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, onHumanRequest: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="new-order">Novos pedidos</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando um pedido for criado via catálogo
                  </p>
                </div>
                <Switch
                  id="new-order"
                  checked={settings.onNewOrder}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, onNewOrder: checked })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Instructions for denied */}
        {permission === 'denied' && (
          <div className="p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm">
              As notificações foram bloqueadas. Para reativá-las:
            </p>
            <ol className="text-sm mt-2 list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Clique no ícone de cadeado/informação na barra de endereço</li>
              <li>Procure "Notificações" nas configurações do site</li>
              <li>Mude para "Permitir"</li>
              <li>Recarregue a página</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
