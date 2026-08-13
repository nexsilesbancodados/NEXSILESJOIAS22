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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  /** Total vendido da maleta, a preço de venda. */
  valorVendido: number;
  /** Comissão da revendedora sobre o valor vendido. */
  comissao: number;
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

/** Formas que representam dinheiro efetivamente recebido. */
const FORMAS_EM_DINHEIRO = FORMAS.map((f) => f.value).filter((v) => v !== 'fiado');

export function AcertoFinanceiroDialog({
  open, onOpenChange, maletaId, revendedoraId, organizationId, valorVendido, comissao,
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

  // A revendedora repassa o líquido: fica com a comissão e entrega o resto.
  // Antes o diálogo pedia o valor bruto vendido, contradizendo a tela de
  // fechamento — que mostra "Comissão a pagar" sobre o mesmo valor. Quem
  // pagasse o líquido corretamente ficava com saldo devedor eterno.
  const valorEsperado = Math.max(0, valorVendido - comissao);

  // Fiado é dívida, não dinheiro recebido. Somá-lo ao total pago zerava o
  // saldo e fazia a maleta parecer quitada sem nada ter entrado no caixa.
  const totalPago = pagamentos
    .filter((p) => FORMAS_EM_DINHEIRO.includes(p.forma_pagamento))
    .reduce((acc, p) => acc + Number(p.valor ?? 0), 0);
  const totalFiado = pagamentos
    .filter((p) => p.forma_pagamento === 'fiado')
    .reduce((acc, p) => acc + Number(p.valor ?? 0), 0);
  const saldo = valorEsperado - totalPago;

  const adicionar = async () => {
    // Aceita o formato que a pessoa realmente digita: "1.500,00", "1500,00" e
    // "1500.00". Antes era só `replace(',', '.')`, então digitar o separador de
    // milhar virava "1.500.00" → NaN → "informe um valor válido", sem explicar
    // o que estava errado.
    const v = Number(valor.trim().replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) {
      toast.error('Informe um valor válido', { description: 'Exemplo: 1.500,00' });
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

  // Registro financeiro não some com um clique: a lixeira ficava ao lado do
  // valor e apagava a prova de que a revendedora pagou, sem perguntar nada.
  const [aExcluir, setAExcluir] = useState<Pagamento | null>(null);

  const confirmarExclusao = async () => {
    if (!aExcluir) return;
    const { error } = await supabase.from('maleta_acertos' as any).delete().eq('id', aExcluir.id);
    setAExcluir(null);
    if (error) { toast.error('Não foi possível remover o pagamento'); return; }
    toast.success('Pagamento removido');
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

        {/* Como se chega ao valor esperado — sem isso, a pessoa no balcão não
            sabe se o número já desconta a comissão. */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vendido na maleta</span>
            <span className="font-medium">{formatCurrency(valorVendido)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">− Comissão da revendedora</span>
            <span className="font-medium text-primary">{formatCurrency(comissao)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 mt-1">
            <span className="font-medium">A repassar para a loja</span>
            <span className="font-semibold">{formatCurrency(valorEsperado)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">A repassar</p>
            <p className="text-lg font-semibold">{formatCurrency(valorEsperado)}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPago)}</p>
            {totalFiado > 0 && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                + {formatCurrency(totalFiado)} em fiado (não entrou)
              </p>
            )}
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
                <Button size="icon" variant="ghost" onClick={() => setAExcluir(p)} className="h-7 w-7">
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

        <AlertDialog open={!!aExcluir} onOpenChange={(v) => !v && setAExcluir(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover este pagamento?</AlertDialogTitle>
              <AlertDialogDescription>
                {aExcluir && (
                  <>
                    {formatCurrency(Number(aExcluir.valor))} em{' '}
                    {FORMAS.find((f) => f.value === aExcluir.forma_pagamento)?.label ?? aExcluir.forma_pagamento}.
                    {' '}O saldo da maleta volta a subir esse valor. Não dá para desfazer.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmarExclusao}>Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
