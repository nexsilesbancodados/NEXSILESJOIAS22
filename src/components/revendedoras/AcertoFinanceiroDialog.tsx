import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, Trash2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Pagamento {
  id: string;
  forma_pagamento: string;
  valor: number;
  parcelas: number | null;
  observacao: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  maletaId: string;
  revendedoraId: string | null;
  organizationId: string | null;
  valorEsperado: number;
}

const FORMAS = [
  { value: 'dinheiro', label: '💵 Dinheiro' },
  { value: 'pix', label: '📱 PIX' },
  { value: 'transferencia', label: '🏦 Transferência' },
  { value: 'cartao', label: '💳 Cartão' },
  { value: 'parcelado', label: '📅 Parcelado' },
  { value: 'fiado', label: '📝 Fiado (saldo devedor)' },
  { value: 'outro', label: 'Outro' },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

export function AcertoFinanceiroDialog({
  open, onOpenChange, maletaId, revendedoraId, organizationId, valorEsperado,
}: Props) {
  const qc = useQueryClient();
  const [forma, setForma] = useState('dinheiro');
  const [valor, setValor] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: pagamentos = [], isLoading } = useQuery({
    queryKey: ['maleta-acertos', maletaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maleta_acertos' as any).select('*')
        .eq('maleta_id', maletaId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Pagamento[];
    },
    enabled: open,
  });

  const totalPago = pagamentos.reduce((acc, p) => acc + Number(p.valor ?? 0), 0);
  const saldo = valorEsperado - totalPago;

  const adicionar = async () => {
    const v = Number(valor.replace(',', '.'));
    if (!v || v <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    if (!organizationId) return;
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from('maleta_acertos' as any).insert({
        organization_id: organizationId,
        maleta_id: maletaId,
        revendedora_id: revendedoraId,
        forma_pagamento: forma,
        valor: v,
        parcelas: forma === 'parcelado' ? Number(parcelas) || 1 : 1,
        observacao: obs.trim() || null,
        user_id: userRes?.user?.id ?? null,
      });
      if (error) throw error;
      toast.success('Pagamento registrado');
      setValor(''); setObs(''); setParcelas('1');
      qc.invalidateQueries({ queryKey: ['maleta-acertos', maletaId] });
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro');
    } finally {
      setSaving(false);
    }
  };

  const excluir = async (id: string) => {
    const { error } = await supabase.from('maleta_acertos' as any).delete().eq('id', id);
    if (error) { toast.error('Erro'); return; }
    toast.success('Removido');
    qc.invalidateQueries({ queryKey: ['maleta-acertos', maletaId] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Acerto financeiro
          </DialogTitle>
          <DialogDescription>Registre como a revendedora pagou. Múltiplas formas permitidas.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Valor esperado</p>
            <p className="text-lg font-semibold">{formatCurrency(valorEsperado)}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total pago</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPago)}</p>
          </div>
          <div className={`rounded-lg border p-3 ${saldo > 0 ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20' : 'bg-card'}`}>
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-lg font-semibold ${saldo > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-green-600'}`}>
              {formatCurrency(saldo)}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Forma</Label>
              <Select value={forma} onValueChange={setForma}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMAS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valor (R$)</Label>
              <Input type="text" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </div>
            {forma === 'parcelado' && (
              <div>
                <Label className="text-xs">Parcelas</Label>
                <Input type="number" min="1" max="24" value={parcelas} onChange={(e) => setParcelas(e.target.value)} />
              </div>
            )}
          </div>
          <Textarea placeholder="Observação (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
          <Button onClick={adicionar} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Registrar pagamento
          </Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : pagamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento registrado.</p>
          ) : (
            pagamentos.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-card p-2.5">
                <Badge variant="outline">{FORMAS.find((f) => f.value === p.forma_pagamento)?.label ?? p.forma_pagamento}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{formatCurrency(Number(p.valor))}</p>
                  {p.observacao && <p className="text-xs text-muted-foreground truncate">{p.observacao}</p>}
                </div>
                {(p.parcelas ?? 1) > 1 && <Badge variant="secondary">{p.parcelas}x</Badge>}
                <Button size="icon" variant="ghost" onClick={() => excluir(p.id)} className="h-7 w-7">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <Check className="w-4 h-4 mr-2" /> Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
