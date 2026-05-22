import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { MaletaItem } from '@/hooks/useSupabaseData';

interface TransferirPecaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maletaOrigemId: string;
  organizationId?: string;
  items: MaletaItem[];
}

interface MaletaOpcao {
  id: string;
  nome: string;
  numero_sequencial: number | null;
  revendedora_nome?: string | null;
}

export function TransferirPecaDialog({ open, onOpenChange, maletaOrigemId, items }: TransferirPecaDialogProps) {
  const queryClient = useQueryClient();
  const [maletas, setMaletas] = useState<MaletaOpcao[]>([]);
  const [maletaDestinoId, setMaletaDestinoId] = useState('');
  const [pecaId, setPecaId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('maletas')
        .select('id, nome, numero_sequencial, revendedoras(nome)')
        .neq('id', maletaOrigemId)
        .eq('status', 'aberta')
        .order('numero_sequencial', { ascending: false });
      setMaletas((data || []).map((m: any) => ({
        id: m.id, nome: m.nome, numero_sequencial: m.numero_sequencial,
        revendedora_nome: m.revendedoras?.nome,
      })));
      setLoading(false);
    })();
  }, [open, maletaOrigemId]);

  const itemSelecionado = items.find(i => i.peca_id === pecaId);
  const qtdDisponivel = itemSelecionado?.quantidade || 0;

  const handleTransferir = async () => {
    if (!maletaDestinoId || !pecaId || quantidade < 1) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (quantidade > qtdDisponivel) {
      toast.error(`Quantidade indisponível (máx ${qtdDisponivel})`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc('transferir_peca_entre_maletas' as any, {
      p_maleta_origem_id: maletaOrigemId,
      p_maleta_destino_id: maletaDestinoId,
      p_peca_id: pecaId,
      p_quantidade: quantidade,
      p_observacao: observacao || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error('Erro ao transferir: ' + error.message);
      return;
    }
    toast.success('Peça transferida com sucesso');
    queryClient.invalidateQueries({ queryKey: ['maleta-items'] });
    queryClient.invalidateQueries({ queryKey: ['maletas'] });
    onOpenChange(false);
    setPecaId(''); setMaletaDestinoId(''); setQuantidade(1); setObservacao('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Transferir peça entre maletas
          </DialogTitle>
          <DialogDescription>
            Move peças desta maleta para outra maleta aberta sem precisar passar pelo estoque.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Peça</Label>
            <Select value={pecaId} onValueChange={(v) => { setPecaId(v); setQuantidade(1); }}>
              <SelectTrigger><SelectValue placeholder="Selecione uma peça" /></SelectTrigger>
              <SelectContent>
                {items.filter(i => i.quantidade > 0).map(i => {
                  const peca = i.peca || {};
                  return (
                    <SelectItem key={i.peca_id} value={i.peca_id}>
                      {peca.nome || 'Peça'} ({peca.codigo || '-'}) • {i.quantidade} disp.
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Maleta de destino</Label>
            <Select value={maletaDestinoId} onValueChange={setMaletaDestinoId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Carregando...' : 'Selecione a maleta destino'} />
              </SelectTrigger>
              <SelectContent>
                {maletas.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">Nenhuma outra maleta aberta</div>
                ) : maletas.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.numero_sequencial ? `#${String(m.numero_sequencial).padStart(3, '0')} • ` : ''}{m.nome}{m.revendedora_nome ? ` — ${m.revendedora_nome}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantidade {qtdDisponivel > 0 && <span className="text-xs text-muted-foreground">(máx {qtdDisponivel})</span>}</Label>
            <Input
              type="number"
              min={1}
              max={qtdDisponivel || undefined}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex: ajuste de demanda na revendedora X" rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleTransferir} disabled={submitting || !pecaId || !maletaDestinoId}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowLeftRight className="w-4 h-4 mr-2" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
