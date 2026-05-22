import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Plus, Package } from 'lucide-react';
import { useAddMaletaItem } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import { useState } from 'react';

interface Sugestao {
  peca_id: string;
  nome: string;
  codigo: string | null;
  imagem_url: string | null;
  preco_venda: number | null;
  total_vendido: number;
  estoque_atual: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  revendedoraId: string | null;
  maletaId: string;
  onAdded?: () => void;
}

const formatCurrency = (v: number | null) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

export function SugerirReposicaoDialog({ open, onOpenChange, revendedoraId, maletaId, onAdded }: Props) {
  const addItem = useAddMaletaItem();
  const [adding, setAdding] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['sugestao-reposicao', revendedoraId],
    queryFn: async () => {
      if (!revendedoraId) return [];
      const { data, error } = await supabase.rpc('sugerir_reposicao_revendedora' as any, {
        p_revendedora_id: revendedoraId,
        p_limite: 15,
      });
      if (error) throw error;
      return (data ?? []) as unknown as Sugestao[];
    },
    enabled: open && !!revendedoraId,
  });

  const handleAdd = async (s: Sugestao) => {
    if (s.estoque_atual <= 0) {
      toast.error('Sem estoque disponível');
      return;
    }
    setAdding(s.peca_id);
    try {
      await addItem.mutateAsync({
        maletaId,
        pecaId: s.peca_id,
        quantidade: 1,
      } as any);
      toast.success(`${s.nome} adicionada`);
      onAdded?.();
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao adicionar');
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Reposição inteligente
          </DialogTitle>
          <DialogDescription>
            Peças mais vendidas por esta revendedora — boas candidatas para a próxima montagem.
          </DialogDescription>
        </DialogHeader>

        {!revendedoraId ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Esta maleta não tem revendedora associada.
          </p>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Sem histórico de vendas para sugerir.
          </p>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-3">
            <div className="space-y-2">
              {data.map((s) => (
                <div key={s.peca_id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {s.imagem_url ? (
                      <img src={s.imagem_url} alt={s.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{s.nome}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.total_vendido} vendida(s)
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.codigo ?? '—'} · {formatCurrency(s.preco_venda)} · Estoque: {s.estoque_atual}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAdd(s)}
                    disabled={adding === s.peca_id || s.estoque_atual <= 0}
                  >
                    {adding === s.peca_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
