import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Trash2, 
  RotateCcw, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  WifiOff
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { 
  getAllPendingVendas, 
  deletePendingVenda, 
  retryPendingVenda,
  type OfflineVenda 
} from '@/lib/indexeddb';
import { toast } from 'sonner';

export function OfflineSyncDashboard() {
  const { isOnline, pendingCount, isSyncing, lastSyncTime, syncNow } = useOfflineSync();
  const [vendas, setVendas] = useState<OfflineVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const loadVendas = async () => {
    try {
      const data = await getAllPendingVendas();
      setVendas(data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading pending sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendas();
  }, [pendingCount]);

  const handleRetry = async (id: string) => {
    try {
      await retryPendingVenda(id);
      await loadVendas();
      if (isOnline) {
        syncNow();
      }
      toast.success('Venda marcada para nova tentativa');
    } catch (error) {
      toast.error('Erro ao tentar novamente');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deletePendingVenda(deleteId);
      await loadVendas();
      toast.success('Venda removida');
    } catch (error) {
      toast.error('Erro ao remover venda');
    } finally {
      setDeleteId(null);
    }
  };

  const handleSyncAll = async () => {
    if (!isOnline) {
      toast.error('Você está offline. Conecte-se à internet para sincronizar.');
      return;
    }
    await syncNow();
    await loadVendas();
  };

  const failedVendas = vendas.filter(v => v.syncError);
  const pendingVendas = vendas.filter(v => !v.syncError);
  const totalValue = vendas.reduce((sum, v) => sum + v.total, 0);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 gap-1.5 px-2"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : isOnline ? (
              <Cloud className="w-4 h-4 text-success" />
            ) : (
              <CloudOff className="w-4 h-4 text-warning" />
            )}
            {pendingCount > 0 && (
              <Badge 
                variant="secondary" 
                className="h-5 px-1.5 text-xs font-medium"
              >
                {pendingCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent align="end" className="w-80 p-0">
          {/* Header */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Cloud className="w-4 h-4 text-success" />
                ) : (
                  <CloudOff className="w-4 h-4 text-warning" />
                )}
                <span className="font-medium text-sm">Sincronização</span>
              </div>
              <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            {lastSyncTime && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Última: {format(lastSyncTime, "dd/MM 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 p-3 border-b border-border">
            <div className="text-center">
              <p className="text-lg font-bold">{pendingVendas.length}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-destructive">{failedVendas.length}</p>
              <p className="text-xs text-muted-foreground">Com erro</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">R$ {totalValue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 space-y-3">
            {/* Sync Button */}
            <Button 
              onClick={handleSyncAll} 
              disabled={isSyncing || !isOnline || vendas.length === 0}
              size="sm"
              className="w-full gap-2"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sincronizar Agora
                </>
              )}
            </Button>

            {/* Failed Sales */}
            {failedVendas.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium flex items-center gap-1 text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  Com erro ({failedVendas.length})
                </h4>
                <ScrollArea className="max-h-32">
                  <div className="space-y-1.5">
                    {failedVendas.map((venda) => (
                      <div 
                        key={venda.id} 
                        className="bg-destructive/10 rounded-lg p-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">R$ {venda.total.toFixed(2)}</p>
                            <p className="text-muted-foreground">
                              {format(new Date(venda.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex gap-0.5">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => handleRetry(venda.id)}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(venda.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Pending Sales */}
            {pendingVendas.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Aguardando ({pendingVendas.length})
                </h4>
                <ScrollArea className="max-h-24">
                  <div className="space-y-1.5">
                    {pendingVendas.map((venda) => (
                      <div 
                        key={venda.id} 
                        className="bg-muted/50 rounded-lg p-2 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-medium">R$ {venda.total.toFixed(2)}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(venda.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(venda.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Empty State */}
            {vendas.length === 0 && !loading && (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-success opacity-60" />
                <p className="text-xs">Tudo sincronizado!</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover venda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A venda será removida permanentemente 
              e não será sincronizada com o servidor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
