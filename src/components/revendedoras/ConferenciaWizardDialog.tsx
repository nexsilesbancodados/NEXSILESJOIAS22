/**
 * Wizard de Conferência + Fechamento de Maleta.
 * Substitui o fluxo manual antigo: lista todos os itens com snapshot original
 * e permite distribuir cada peça entre Vendida / Devolvida / Perdida com
 * totais ao vivo. Integra o scanner para incrementar devolução por bipe.
 */
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle2, Loader2, PackageCheck, RotateCcw, ScanBarcode, Sparkles, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMaletaRPC, type ConferenciaItemInput } from '@/hooks/maleta/useMaletaRPC';
import { BarcodeScannerDialog } from './BarcodeScannerDialog';
import { cn } from '@/lib/utils';

interface Row {
  id: string;
  peca_id: string;
  nome: string;
  codigo: string | null;
  quantidade_inicial: number;
  quantidade_vendida: number;
  quantidade_perdida: number;
  quantidade_devolvida: number;
  preco: number;
  vendida: number;
  devolvida: number;
  perdida: number;
  observacao: string;
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ConferenciaWizardDialog({
  open,
  onOpenChange,
  maletaId,
  maletaNome,
  comissaoPercentual,
  onFechado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maletaId: string;
  maletaNome: string;
  comissaoPercentual: number;
  onFechado?: () => void;
}) {
  const [tab, setTab] = useState<'conferir' | 'resumo'>('conferir');
  const [rows, setRows] = useState<Row[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [conferiu, setConferiu] = useState(false);
  const { conferir, fechar } = useMaletaRPC();

  const { data, isLoading } = useQuery({
    queryKey: ['maleta-pecas-snapshot', maletaId, open],
    enabled: open && !!maletaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maletas_pecas')
        .select('id, peca_id, quantidade, quantidade_vendida, quantidade_devolvida, quantidade_perdida, quantidade_inicial, preco_unitario, preco_unitario_snapshot, nome_snapshot, codigo_snapshot, pecas:peca_id(nome, codigo, preco_venda)')
        .eq('maleta_id', maletaId);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!data) return;
    setRows(
      data.map((d) => {
        const inicial = d.quantidade_inicial ?? ((d.quantidade ?? 0) + (d.quantidade_vendida ?? 0));
        const vendida = d.quantidade_vendida ?? 0;
        const perdida = d.quantidade_perdida ?? 0;
        const devolvida = Math.max(0, inicial - vendida - perdida);
        const peca = (d as { pecas?: { nome?: string; codigo?: string; preco_venda?: number } }).pecas;
        return {
          id: d.id,
          peca_id: d.peca_id,
          nome: d.nome_snapshot || peca?.nome || 'Peça',
          codigo: d.codigo_snapshot || peca?.codigo || null,
          quantidade_inicial: inicial,
          quantidade_vendida: vendida,
          quantidade_perdida: perdida,
          quantidade_devolvida: d.quantidade_devolvida ?? 0,
          preco: Number(d.preco_unitario ?? d.preco_unitario_snapshot ?? peca?.preco_venda ?? 0),
          vendida,
          devolvida,
          perdida,
          observacao: '',
        };
      })
    );
    setConferiu(false);
  }, [data]);

  const totals = useMemo(() => {
    let esperado = 0, vendida = 0, devolvida = 0, perdida = 0, valorVendido = 0, valorPerdido = 0, divergencias = 0;
    rows.forEach((r) => {
      esperado += r.quantidade_inicial;
      vendida += r.vendida;
      devolvida += r.devolvida;
      perdida += r.perdida;
      valorVendido += r.vendida * r.preco;
      valorPerdido += r.perdida * r.preco;
      if (r.vendida + r.devolvida + r.perdida !== r.quantidade_inicial) divergencias++;
    });
    const comissao = (valorVendido * comissaoPercentual) / 100;
    return { esperado, vendida, devolvida, perdida, valorVendido, valorPerdido, divergencias, comissao };
  }, [rows, comissaoPercentual]);

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setConferiu(false);
  };

  const distribuir = (r: Row, campo: 'vendida' | 'devolvida' | 'perdida', val: number) => {
    const v = Math.max(0, Math.min(r.quantidade_inicial, isNaN(val) ? 0 : val));
    const restante = r.quantidade_inicial - v;
    const others: Array<'vendida' | 'devolvida' | 'perdida'> = ['vendida', 'devolvida', 'perdida'];
    const left = others.filter((k) => k !== campo);
    const patch: Partial<Row> = { [campo]: v };
    // Mantém os outros como estão, mas garante que o total não estoure
    const soma = v + (campo === 'vendida' ? r.devolvida : r[left[0]]) + (campo === 'vendida' ? r.perdida : r[left[1]]);
    if (soma > r.quantidade_inicial) {
      // ajusta devolvida para fechar
      patch.devolvida = Math.max(0, restante - r.perdida);
      if (campo !== 'vendida') patch.devolvida = Math.max(0, r.quantidade_inicial - v - r.vendida - (campo === 'perdida' ? 0 : r.perdida));
    }
    updateRow(r.id, patch);
  };

  const aplicarDevolverTudo = () => {
    setRows((prev) => prev.map((r) => ({
      ...r,
      devolvida: r.quantidade_inicial - r.vendida - r.perdida,
    })));
  };

  const handleBarcode = (code: string) => {
    const norm = code.trim().toLowerCase();
    const found = rows.find((r) => (r.codigo || '').toLowerCase() === norm);
    if (!found) { toast.error(`Código "${code}" não encontrado nesta maleta`); return; }
    if (found.devolvida >= found.quantidade_inicial - found.vendida - found.perdida) {
      toast.warning(`"${found.nome}" já está com devolução completa`);
      return;
    }
    updateRow(found.id, { devolvida: Math.min(found.quantidade_inicial - found.vendida - found.perdida, found.devolvida + 1) });
    toast.success(`+1 devolução: ${found.nome}`);
  };

  const handleConferir = async () => {
    const itens: ConferenciaItemInput[] = rows.map((r) => ({
      maleta_peca_id: r.id,
      vendida: r.vendida,
      devolvida: r.devolvida,
      perdida: r.perdida,
      observacao: r.observacao || undefined,
    }));
    const res = await conferir.mutateAsync({ maletaId, itens, observacoes });
    setConferiu(true);
    if (res.divergencias.length === 0) setTab('resumo');
  };

  const handleFechar = async (forcar = false) => {
    await fechar.mutateAsync({ maletaId, forcar });
    onFechado?.();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-primary" />
              Conferência &amp; Fechamento — {maletaNome}
            </DialogTitle>
            <DialogDescription>
              Distribua cada peça entre <b>Vendida</b>, <b>Devolvida</b> e <b>Perdida</b>. O sistema valida divergências antes de fechar a maleta.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'conferir' | 'resumo')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="conferir">1. Conferir itens</TabsTrigger>
              <TabsTrigger value="resumo" disabled={!conferiu}>2. Resumo &amp; Fechar</TabsTrigger>
            </TabsList>

            <TabsContent value="conferir" className="flex-1 overflow-hidden flex flex-col gap-3 mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setScannerOpen(true)}>
                  <ScanBarcode className="h-4 w-4 mr-1" /> Bipar para devolver
                </Button>
                <Button size="sm" variant="outline" onClick={aplicarDevolverTudo}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Devolver tudo restante
                </Button>
                <div className="ml-auto flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Esperado: <b className="text-foreground">{totals.esperado}</b></span>
                  <span className="text-emerald-600">Vendidas: <b>{totals.vendida}</b></span>
                  <span className="text-blue-600">Devolvidas: <b>{totals.devolvida}</b></span>
                  <span className="text-rose-600">Perdidas: <b>{totals.perdida}</b></span>
                  {totals.divergencias > 0 && (
                    <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> {totals.divergencias} divergência(s)</Badge>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 border rounded-md">
                {isLoading ? (
                  <div className="flex items-center justify-center p-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : rows.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground">Nenhuma peça nesta maleta.</div>
                ) : (
                  <div className="divide-y">
                    {rows.map((r) => {
                      const soma = r.vendida + r.devolvida + r.perdida;
                      const ok = soma === r.quantidade_inicial;
                      return (
                        <div key={r.id} className={cn('p-3 grid grid-cols-12 gap-2 items-center', !ok && 'bg-destructive/5')}>
                          <div className="col-span-4">
                            <p className="font-medium text-sm leading-tight">{r.nome}</p>
                            <p className="text-xs text-muted-foreground">{r.codigo || '—'} · {brl(r.preco)} · saída: <b>{r.quantidade_inicial}</b></p>
                          </div>
                          <NumField label="Vendida" value={r.vendida} max={r.quantidade_inicial} onChange={(v) => distribuir(r, 'vendida', v)} color="text-emerald-600" />
                          <NumField label="Devolvida" value={r.devolvida} max={r.quantidade_inicial} onChange={(v) => distribuir(r, 'devolvida', v)} color="text-blue-600" />
                          <NumField label="Perdida" value={r.perdida} max={r.quantidade_inicial} onChange={(v) => distribuir(r, 'perdida', v)} color="text-rose-600" />
                          <div className="col-span-3">
                            <Input
                              placeholder="Observação (opcional)"
                              value={r.observacao}
                              onChange={(e) => updateRow(r.id, { observacao: e.target.value })}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="col-span-12 -mt-1 flex items-center justify-between text-xs">
                            <span className={cn('font-medium', ok ? 'text-emerald-600' : 'text-destructive')}>
                              {ok ? <><CheckCircle2 className="inline h-3 w-3 mr-1" /> Soma OK ({soma}/{r.quantidade_inicial})</> : <><XCircle className="inline h-3 w-3 mr-1" /> {soma}/{r.quantidade_inicial}</>}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <Textarea
                placeholder="Observações gerais da conferência (opcional)"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
              />
            </TabsContent>

            <TabsContent value="resumo" className="flex-1 overflow-auto mt-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total esperado" value={totals.esperado.toString()} />
                <StatCard label="Vendidas" value={totals.vendida.toString()} accent="text-emerald-600" />
                <StatCard label="Devolvidas" value={totals.devolvida.toString()} accent="text-blue-600" />
                <StatCard label="Perdidas" value={totals.perdida.toString()} accent="text-rose-600" />
                <StatCard label="Faturamento" value={brl(totals.valorVendido)} accent="text-emerald-600" />
                <StatCard label="Comissão prevista" value={brl(totals.comissao)} accent="text-primary" />
                <StatCard label="Perda em R$" value={brl(totals.valorPerdido)} accent="text-rose-600" />
                <StatCard label="Divergências" value={totals.divergencias.toString()} accent={totals.divergencias > 0 ? 'text-destructive' : 'text-emerald-600'} />
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">
                Ao fechar, as peças marcadas como <b>devolvidas</b> retornam automaticamente ao estoque. <b>Vendidas</b> e <b>perdidas</b> permanecem fora do estoque para preservar o histórico.
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t pt-3">
            {tab === 'conferir' ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button onClick={handleConferir} disabled={conferir.isPending || rows.length === 0}>
                  {conferir.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar conferência
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setTab('conferir')}>Voltar</Button>
                {totals.divergencias > 0 && (
                  <Button variant="destructive" onClick={() => handleFechar(true)} disabled={fechar.isPending}>
                    <AlertTriangle className="h-4 w-4 mr-1" /> Fechar mesmo com divergências
                  </Button>
                )}
                <Button onClick={() => handleFechar(false)} disabled={fechar.isPending || totals.divergencias > 0}>
                  {fechar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Sparkles className="h-4 w-4 mr-1" /> Confirmar fechamento
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={handleBarcode}
      />
    </>
  );
}

function NumField({ label, value, max, onChange, color }: { label: string; value: number; max: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="col-span-1 flex flex-col items-center">
      <span className={cn('text-[10px] uppercase tracking-wide', color)}>{label}</span>
      <Input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || '0', 10))}
        className="h-8 w-16 text-center text-sm"
      />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="border rounded-lg p-3 bg-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-bold mt-1', accent || 'text-foreground')}>{value}</p>
    </div>
  );
}
