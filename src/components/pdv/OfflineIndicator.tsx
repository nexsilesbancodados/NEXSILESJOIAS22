import { useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, lastSyncTime, syncNow } = useOfflineSync();
  const [isOpen, setIsOpen] = useState(false);

  const handleSync = async () => {
    await syncNow();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-2 relative',
            isOnline ? 'text-green-600' : 'text-orange-500'
          )}
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isOnline ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'
            )}>
              {isOnline ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium">
                {isOnline ? 'Conectado' : 'Modo Offline'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isOnline 
                  ? 'Sincronização ativa' 
                  : 'Vendas serão salvas localmente'
                }
              </p>
            </div>
          </div>

          {/* Pending Sales */}
          {pendingCount > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Vendas Pendentes</p>
                  <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
                </div>
                {isOnline && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="gap-2"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Sincronizar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Last Sync Time */}
          {lastSyncTime && (
            <div className="text-sm text-muted-foreground">
              Última sincronização:{' '}
              <span className="font-medium">
                {format(lastSyncTime, "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}

          {/* Sync Status */}
          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sincronizando vendas...
            </div>
          )}

          {/* Info */}
          {!isOnline && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
              💡 Suas vendas estão sendo salvas localmente e serão sincronizadas 
              automaticamente quando a conexão for restabelecida.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
