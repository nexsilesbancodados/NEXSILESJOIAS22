import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Star, Loader2, MessageCircle, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function EcommerceAvaliacoesTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

  const { data: avaliacoes = [], isLoading } = useQuery({
    queryKey: ['ecommerce-avaliacoes-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ecommerce_avaliacoes' as any)
        .select('*, pecas:peca_id(nome, codigo, imagem_url)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ id, aprovada }: { id: string; aprovada: boolean }) => {
      const { error } = await supabase
        .from('ecommerce_avaliacoes' as any)
        .update({ aprovada })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-avaliacoes-admin'] });
      toast.success('Avaliação atualizada');
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ecommerce_avaliacoes' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-avaliacoes-admin'] });
      toast.success('Avaliação removida');
    },
  });

  const filtered = avaliacoes.filter((a: any) => {
    if (filter === 'approved') return a.aprovada;
    if (filter === 'pending') return !a.aprovada;
    return true;
  });

  const avgRating = avaliacoes.length > 0 ? avaliacoes.reduce((s: number, a: any) => s + a.nota, 0) / avaliacoes.length : 0;
  const ratingDist = [5, 4, 3, 2, 1].map(n => ({
    stars: n,
    count: avaliacoes.filter((a: any) => a.nota === n).length,
    pct: avaliacoes.length > 0 ? (avaliacoes.filter((a: any) => a.nota === n).length / avaliacoes.length) * 100 : 0,
  }));

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} className="w-5 h-5" fill={n <= Math.round(avgRating) ? '#F59E0B' : 'none'} stroke={n <= Math.round(avgRating) ? '#F59E0B' : '#D1D5DB'} />
              ))}
            </div>
            <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">{avaliacoes.length} avaliações no total</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm md:col-span-2">
          <CardContent className="pt-5 pb-4">
            <div className="space-y-1.5">
              {ratingDist.map(r => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="text-xs w-8 text-right text-muted-foreground">{r.stars}★</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${r.pct}%` }} />
                  </div>
                  <span className="text-xs w-8 text-muted-foreground">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'approved', 'pending'] as const).map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todas' : f === 'approved' ? 'Aprovadas' : 'Pendentes'}
            <Badge variant="secondary" className="ml-1.5 text-[10px]">
              {f === 'all' ? avaliacoes.length : f === 'approved' ? avaliacoes.filter((a: any) => a.aprovada).length : avaliacoes.filter((a: any) => !a.aprovada).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Reviews list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhuma avaliação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <Card key={a.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Product image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {a.pecas?.imagem_url ? (
                      <img src={a.pecas.imagem_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Star className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{a.cliente_nome}</span>
                      {!a.aprovada && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Pendente</Badge>}
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className="w-3 h-3" fill={n <= a.nota ? '#F59E0B' : 'none'} stroke={n <= a.nota ? '#F59E0B' : '#D1D5DB'} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">
                        {a.pecas?.nome || 'Produto'} ({a.pecas?.codigo || '-'})
                      </span>
                    </div>
                    {a.comentario && <p className="text-sm text-muted-foreground">{a.comentario}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleApproval.mutate({ id: a.id, aprovada: !a.aprovada })}
                      title={a.aprovada ? 'Desaprovar' : 'Aprovar'}
                    >
                      {a.aprovada ? <ThumbsDown className="w-4 h-4 text-muted-foreground" /> : <ThumbsUp className="w-4 h-4 text-emerald-500" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm('Remover esta avaliação?')) deleteReview.mutate(a.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
