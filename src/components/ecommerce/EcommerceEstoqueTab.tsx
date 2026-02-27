import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/hooks/useOrganization';
import { db } from '@/lib/supabase-db';
import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, Search, ArrowUpDown, TrendingDown, Archive, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EcommerceEstoqueTab() {
  const { organization } = useOrganization();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'baixo' | 'esgotado' | 'ok'>('todos');
  const [ordenacao, setOrdenacao] = useState<'nome' | 'estoque_asc' | 'estoque_desc'>('estoque_asc');

  const { data: pecas = [] } = useQuery({
    queryKey: ['ecommerce-estoque', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await db.from('pecas')
        .select('id, nome, codigo, categoria, quantidade, quantidade_minima, preco_venda, disponivel_loja, foto_url')
        .eq('organization_id', organization.id)
        .eq('disponivel_loja', true)
        .order('quantidade', { ascending: true });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const filtered = pecas
    .filter((p: any) => {
      if (busca && !p.nome?.toLowerCase().includes(busca.toLowerCase()) && !p.codigo?.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtro === 'esgotado' && (p.quantidade || 0) > 0) return false;
      if (filtro === 'baixo' && ((p.quantidade || 0) > (p.quantidade_minima || 3) || (p.quantidade || 0) === 0)) return false;
      if (filtro === 'ok' && (p.quantidade || 0) <= (p.quantidade_minima || 3)) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      if (ordenacao === 'nome') return (a.nome || '').localeCompare(b.nome || '');
      if (ordenacao === 'estoque_asc') return (a.quantidade || 0) - (b.quantidade || 0);
      return (b.quantidade || 0) - (a.quantidade || 0);
    });

  const esgotados = pecas.filter((p: any) => (p.quantidade || 0) === 0).length;
  const baixoEstoque = pecas.filter((p: any) => (p.quantidade || 0) > 0 && (p.quantidade || 0) <= (p.quantidade_minima || 3)).length;
  const ok = pecas.filter((p: any) => (p.quantidade || 0) > (p.quantidade_minima || 3)).length;

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:ring-2 ring-primary/20 transition-all" onClick={() => setFiltro('esgotado')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
            <div><p className="text-2xl font-bold">{esgotados}</p><p className="text-xs text-muted-foreground">Esgotados</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 ring-primary/20 transition-all" onClick={() => setFiltro('baixo')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><TrendingDown className="h-4 w-4 text-amber-500" /></div>
            <div><p className="text-2xl font-bold">{baixoEstoque}</p><p className="text-xs text-muted-foreground">Estoque baixo</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 ring-primary/20 transition-all" onClick={() => setFiltro('ok')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
            <div><p className="text-2xl font-bold">{ok}</p><p className="text-xs text-muted-foreground">OK</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {(['todos', 'esgotado', 'baixo', 'ok'] as const).map(f => (
            <Button key={f} size="sm" variant={filtro === f ? 'default' : 'outline'} onClick={() => setFiltro(f)} className="text-xs capitalize">
              {f === 'todos' ? 'Todos' : f === 'esgotado' ? 'Esgotados' : f === 'baixo' ? 'Baixo' : 'OK'}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOrdenacao(o => o === 'estoque_asc' ? 'estoque_desc' : o === 'estoque_desc' ? 'nome' : 'estoque_asc')}>
          <ArrowUpDown className="h-4 w-4 mr-1" />
          {ordenacao === 'nome' ? 'Nome' : ordenacao === 'estoque_asc' ? 'Menor estoque' : 'Maior estoque'}
        </Button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((p: any) => {
          const qty = p.quantidade || 0;
          const min = p.quantidade_minima || 3;
          const status = qty === 0 ? 'esgotado' : qty <= min ? 'baixo' : 'ok';
          return (
            <Card key={p.id} className={cn("transition-all", status === 'esgotado' && "border-destructive/30 bg-destructive/5")}>
              <CardContent className="p-3 flex items-center gap-4">
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.nome} className="w-10 h-10 rounded-md object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.nome}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {p.codigo && <span>{p.codigo}</span>}
                    {p.categoria && <Badge variant="outline" className="text-[10px] py-0">{p.categoria}</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-lg font-bold", status === 'esgotado' ? 'text-destructive' : status === 'baixo' ? 'text-amber-500' : 'text-emerald-500')}>
                    {qty}
                  </p>
                  <p className="text-[10px] text-muted-foreground">mín: {min}</p>
                </div>
                <Badge variant={status === 'esgotado' ? 'destructive' : status === 'baixo' ? 'secondary' : 'default'} className="text-xs">
                  {status === 'esgotado' ? 'Esgotado' : status === 'baixo' ? 'Baixo' : 'OK'}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
