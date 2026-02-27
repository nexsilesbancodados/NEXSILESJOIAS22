import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOrganization } from '@/hooks/useOrganization';
import { db } from '@/lib/supabase-db';
import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, Search, ArrowUpDown, TrendingDown, Archive, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  const total = pecas.length;
  const healthPercent = total > 0 ? (ok / total) * 100 : 100;

  return (
    <div className="space-y-5">
      {/* Health bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Saúde do Estoque</p>
            <span className={cn("text-xs font-bold", healthPercent >= 80 ? 'text-emerald-500' : healthPercent >= 50 ? 'text-amber-500' : 'text-destructive')}>
              {healthPercent.toFixed(0)}%
            </span>
          </div>
          <Progress value={healthPercent} className="h-2" />
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{ok} OK</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{baixoEstoque} Baixo</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />{esgotados} Esgotado</span>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={cn("cursor-pointer transition-all border-0 shadow-sm", filtro === 'esgotado' && "ring-2 ring-destructive/30")} onClick={() => setFiltro(f => f === 'esgotado' ? 'todos' : 'esgotado')}>
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/10"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
            <div><p className="text-xl md:text-2xl font-bold">{esgotados}</p><p className="text-[10px] text-muted-foreground">Esgotados</p></div>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all border-0 shadow-sm", filtro === 'baixo' && "ring-2 ring-amber-300/50")} onClick={() => setFiltro(f => f === 'baixo' ? 'todos' : 'baixo')}>
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10"><TrendingDown className="h-4 w-4 text-amber-500" /></div>
            <div><p className="text-xl md:text-2xl font-bold">{baixoEstoque}</p><p className="text-[10px] text-muted-foreground">Estoque baixo</p></div>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all border-0 shadow-sm", filtro === 'ok' && "ring-2 ring-emerald-300/50")} onClick={() => setFiltro(f => f === 'ok' ? 'todos' : 'ok')}>
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
            <div><p className="text-xl md:text-2xl font-bold">{ok}</p><p className="text-[10px] text-muted-foreground">Disponível</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOrdenacao(o => o === 'estoque_asc' ? 'estoque_desc' : o === 'estoque_desc' ? 'nome' : 'estoque_asc')} className="text-xs gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5" />
          {ordenacao === 'nome' ? 'Nome' : ordenacao === 'estoque_asc' ? '↑ Menor' : '↓ Maior'}
        </Button>
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {filtered.map((p: any, i: number) => {
          const qty = p.quantidade || 0;
          const min = p.quantidade_minima || 3;
          const status = qty === 0 ? 'esgotado' : qty <= min ? 'baixo' : 'ok';
          const fillPercent = min > 0 ? Math.min((qty / (min * 3)) * 100, 100) : 100;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}>
              <Card className={cn("border-0 shadow-sm transition-all", status === 'esgotado' && "bg-destructive/3 ring-1 ring-destructive/10")}>
                <CardContent className="p-3 flex items-center gap-3">
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Package className="h-4 w-4 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.nome}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      {p.codigo && <span>{p.codigo}</span>}
                      {p.categoria && <Badge variant="outline" className="text-[9px] py-0 h-4">{p.categoria}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-16 hidden sm:block">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", status === 'ok' ? 'bg-emerald-500' : status === 'baixo' ? 'bg-amber-500' : 'bg-destructive')} style={{ width: `${fillPercent}%` }} />
                      </div>
                    </div>
                    <div className="text-right min-w-[40px]">
                      <p className={cn("text-base font-bold", status === 'esgotado' ? 'text-destructive' : status === 'baixo' ? 'text-amber-500' : 'text-emerald-500')}>
                        {qty}
                      </p>
                      <p className="text-[9px] text-muted-foreground">mín {min}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Archive className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
