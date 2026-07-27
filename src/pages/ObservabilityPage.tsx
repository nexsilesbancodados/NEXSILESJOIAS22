import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, RefreshCw, Activity, Loader2, Search, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

interface EdgeError {
  id: string;
  function_name: string;
  error_message: string;
  error_stack: string | null;
  request_payload: any;
  request_ip: string | null;
  organization_id: string | null;
  status_code: number | null;
  created_at: string;
}

export default function ObservabilityPage() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.is_super_admin === true;
  const [functionFilter, setFunctionFilter] = useState<string>('all');
  const [detail, setDetail] = useState<EdgeError | null>(null);

  const { data: errors = [], isLoading, refetch, isFetching } = useQuery<EdgeError[]>({
    queryKey: ['edge-function-errors', functionFilter],
    queryFn: async () => {
      let query = supabase
        .from('edge_function_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (functionFilter !== 'all') query = query.eq('function_name', functionFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data as EdgeError[]) ?? [];
    },
    enabled: isSuperAdmin,
    refetchInterval: 30000,
  });

  const functionNames = Array.from(new Set(errors.map((e) => e.function_name))).sort();

  const stats = {
    total: errors.length,
    last24h: errors.filter((e) => {
      const diff = Date.now() - new Date(e.created_at).getTime();
      return diff < 24 * 60 * 60 * 1000;
    }).length,
    critical: errors.filter((e) => (e.status_code ?? 500) >= 500).length,
    uniqueFns: functionNames.length,
  };

  const copyDetail = (e: EdgeError) => {
    const txt = JSON.stringify(
      {
        function: e.function_name,
        error: e.error_message,
        status: e.status_code,
        payload: e.request_payload,
        stack: e.error_stack,
        ip: e.request_ip,
        at: e.created_at,
      },
      null,
      2,
    );
    navigator.clipboard.writeText(txt);
    toast.success('Detalhes copiados');
  };

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              Observabilidade
            </h1>
            <p className="text-muted-foreground mt-1">
              Erros de Edge Functions em tempo real (atualiza a cada 30s)
            </p>
          </div>
          <Button onClick={() => refetch()} disabled={isFetching} variant="outline">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Atualizar
          </Button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total (200 últimos)', value: stats.total, color: 'from-primary/20 to-primary/5' },
            { label: 'Últimas 24h', value: stats.last24h, color: 'from-amber-500/20 to-amber-500/5' },
            { label: '5xx críticos', value: stats.critical, color: 'from-red-500/20 to-red-500/5' },
            { label: 'Funções afetadas', value: stats.uniqueFns, color: 'from-blue-500/20 to-blue-500/5' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`bg-gradient-to-br ${s.color} border`}>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</div>
                  <div className="text-3xl font-bold mt-2">{s.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Erros recentes</CardTitle>
            <Select value={functionFilter} onValueChange={setFunctionFilter}>
              <SelectTrigger className="w-[240px]">
                <Search className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                {functionNames.map((fn) => (
                  <SelectItem key={fn} value={fn}>
                    {fn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : errors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum erro registrado. Tudo funcionando! 🎉</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-auto">
                {errors.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setDetail(e)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs">
                            {e.function_name}
                          </Badge>
                          {e.status_code && (
                            <Badge
                              variant={e.status_code >= 500 ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {e.status_code}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <div className="text-sm font-medium truncate">{e.error_message}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono">
                    {detail.function_name}
                  </Badge>
                  {detail.status_code && (
                    <Badge variant={detail.status_code >= 500 ? 'destructive' : 'secondary'}>
                      HTTP {detail.status_code}
                    </Badge>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => copyDetail(detail)} className="ml-auto">
                    <Copy className="h-4 w-4 mr-1" /> Copiar
                  </Button>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1">Data</div>
                  <div>{format(new Date(detail.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1">Mensagem</div>
                  <pre className="bg-muted p-3 rounded whitespace-pre-wrap font-mono text-xs">
                    {detail.error_message}
                  </pre>
                </div>
                {detail.request_payload && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Payload</div>
                    <pre className="bg-muted p-3 rounded whitespace-pre-wrap font-mono text-xs overflow-auto max-h-40">
                      {JSON.stringify(detail.request_payload, null, 2)}
                    </pre>
                  </div>
                )}
                {detail.error_stack && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Stack trace</div>
                    <pre className="bg-muted p-3 rounded whitespace-pre-wrap font-mono text-xs overflow-auto max-h-60">
                      {detail.error_stack}
                    </pre>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="uppercase text-muted-foreground mb-1">IP</div>
                    <div className="font-mono">{detail.request_ip ?? '—'}</div>
                  </div>
                  <div>
                    <div className="uppercase text-muted-foreground mb-1">Organização</div>
                    <div className="font-mono truncate">{detail.organization_id ?? '—'}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
