import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, RotateCcw, ArrowLeftRight, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoMaletaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maletaId: string;
  maletaNome: string;
}

interface Row {
  id: string;
  tipo: 'conferencia' | 'devolucao' | 'transferencia' | 'reabertura';
  data: string;
  titulo: string;
  descricao: string;
}

export function HistoricoMaletaDialog({ open, onOpenChange, maletaId, maletaNome }: HistoricoMaletaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [confs, devs, transfs, reabs] = await Promise.all([
          supabase.from('maleta_conferencias' as any).select('*').eq('maleta_id', maletaId).order('created_at', { ascending: false }),
          supabase.from('maleta_devolucoes' as any).select('*, pecas(nome, codigo)').eq('maleta_id', maletaId).order('created_at', { ascending: false }),
          supabase.from('maleta_transferencias' as any).select('*, pecas(nome, codigo), origem:maletas!maleta_origem_id(nome, numero_sequencial), destino:maletas!maleta_destino_id(nome, numero_sequencial)').or(`maleta_origem_id.eq.${maletaId},maleta_destino_id.eq.${maletaId}`).order('created_at', { ascending: false }),
          supabase.from('maleta_reaberturas' as any).select('*').eq('maleta_id', maletaId).order('created_at', { ascending: false }),
        ]);

        const all: Row[] = [];
        (confs.data || []).forEach((c: any) => all.push({
          id: c.id, tipo: 'conferencia', data: c.created_at,
          titulo: 'Conferência realizada',
          descricao: `${(c.items_conferidos || []).length} item(ns) conferido(s). ${c.modo === 'manual' ? 'Manual' : 'Automática'}.`,
        }));
        (devs.data || []).forEach((d: any) => all.push({
          id: d.id, tipo: 'devolucao', data: d.created_at,
          titulo: `Devolução: ${d.pecas?.nome || 'Peça'}`,
          descricao: `${d.quantidade}x ${d.pecas?.codigo || ''}${d.motivo ? ` • Motivo: ${d.motivo}` : ''}`,
        }));
        (transfs.data || []).forEach((t: any) => {
          const sentido = t.maleta_origem_id === maletaId ? '→' : '←';
          const outra = t.maleta_origem_id === maletaId ? t.destino : t.origem;
          all.push({
            id: t.id, tipo: 'transferencia', data: t.created_at,
            titulo: `Transferência ${sentido} ${outra?.nome || 'maleta'}${outra?.numero_sequencial ? ` #${String(outra.numero_sequencial).padStart(3,'0')}` : ''}`,
            descricao: `${t.quantidade}x ${t.pecas?.nome || ''} (${t.pecas?.codigo || ''})${t.observacao ? ` • ${t.observacao}` : ''}`,
          });
        });
        (reabs.data || []).forEach((r: any) => all.push({
          id: r.id, tipo: 'reabertura', data: r.created_at,
          titulo: 'Maleta reaberta',
          descricao: r.motivo || 'Sem motivo informado',
        }));

        all.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        if (!cancelled) setRows(all);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, maletaId]);

  const filter = (tipos: Row['tipo'][]) => rows.filter(r => tipos.includes(r.tipo));

  const ICONS: Record<Row['tipo'], any> = {
    conferencia: CheckCircle2,
    devolucao: RotateCcw,
    transferencia: ArrowLeftRight,
    reabertura: Unlock,
  };
  const COLORS: Record<Row['tipo'], string> = {
    conferencia: 'text-green-600',
    devolucao: 'text-amber-600',
    transferencia: 'text-blue-600',
    reabertura: 'text-purple-600',
  };

  const renderList = (list: Row[]) => (
    <ScrollArea className="h-[400px] pr-4">
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : list.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">Nenhum registro</p>
      ) : (
        <div className="space-y-2">
          {list.map(r => {
            const Icon = ICONS[r.tipo];
            return (
              <div key={`${r.tipo}-${r.id}`} className="flex gap-3 p-3 rounded-lg border bg-card">
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${COLORS[r.tipo]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{r.titulo}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(r.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{r.descricao}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico — {maletaNome}</DialogTitle>
          <DialogDescription>Linha do tempo de conferências, devoluções, transferências e reaberturas.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="todos">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="todos">Todos <Badge variant="secondary" className="ml-1">{rows.length}</Badge></TabsTrigger>
            <TabsTrigger value="conferencias">Conferências</TabsTrigger>
            <TabsTrigger value="devolucoes">Devoluções</TabsTrigger>
            <TabsTrigger value="transferencias">Transfers</TabsTrigger>
            <TabsTrigger value="reaberturas">Reaberturas</TabsTrigger>
          </TabsList>
          <TabsContent value="todos" className="mt-3">{renderList(rows)}</TabsContent>
          <TabsContent value="conferencias" className="mt-3">{renderList(filter(['conferencia']))}</TabsContent>
          <TabsContent value="devolucoes" className="mt-3">{renderList(filter(['devolucao']))}</TabsContent>
          <TabsContent value="transferencias" className="mt-3">{renderList(filter(['transferencia']))}</TabsContent>
          <TabsContent value="reaberturas" className="mt-3">{renderList(filter(['reabertura']))}</TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
