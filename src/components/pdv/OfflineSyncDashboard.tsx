import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Cloud className="w-5 h-5 text-green-500" />
            ) : (
              <CloudOff className="w-5 h-5 text-orange-500" />
            )}
            <CardTitle className="font-display text-lg">Sincronização Offline</CardTitle>
          </div>
          <Badge variant={isOnline ? 'default' : 'secondary'} className="gap-1">
            {isOnline ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Offline
              </>
            )}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          {lastSyncTime && (
            <>
              <Clock className="w-3 h-3" />
              Última sincronização: {format(lastSyncTime, "dd/MM 'às' HH:mm", { locale: ptBR })}
            </>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{pendingVendas.length}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="bg-destructive/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{failedVendas.length}</p>
            <p className="text-xs text-muted-foreground">Com erro</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">
              R$ {vendas.reduce((sum, v) => sum + v.total, 0).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Sync Button */}
        <Button 
          onClick={handleSyncAll} 
          disabled={isSyncing || !isOnline || vendas.length === 0}
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
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                Vendas com erro ({failedVendas.length})
              </h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {failedVendas.map((venda) => (
                    <div 
                      key={venda.id} 
                      className="bg-destructive/10 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            R$ {venda.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(venda.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => handleRetry(venda.id)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(venda.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-destructive bg-destructive/20 rounded px-2 py-1">
                        {venda.syncError}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* Pending Sales */}
        {pendingVendas.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Aguardando sincronização ({pendingVendas.length})
              </h4>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {pendingVendas.map((venda) => (
                    <div 
                      key={venda.id} 
                      className="bg-muted/50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          R$ {venda.total.toFixed(2)} • {venda.itens.length} {venda.itens.length === 1 ? 'item' : 'itens'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {venda.cliente_nome || 'Cliente não informado'} • {format(new Date(venda.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(venda.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* Empty State */}
        {vendas.length === 0 && !loading && (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
            <p className="text-sm">Todas as vendas estão sincronizadas!</p>
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}
