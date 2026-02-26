import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Search, Loader2, Package, Store, ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Peca {
  id: string;
  nome: string;
  codigo: string;
  categoria: string | null;
  preco_venda: number;
  estoque: number;
  imagem_url: string | null;
  disponivel_loja: boolean;
}

export function EcommerceProdutosTab() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const { data: pecas = [], isLoading } = useQuery({
    queryKey: ['pecas-loja-manager', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('pecas')
        .select('id, nome, codigo, categoria, preco_venda, estoque, imagem_url, disponivel_loja')
        .eq('organization_id', organizationId)
        .order('categoria')
        .order('nome');
      if (error) throw error;
      return (data || []) as Peca[];
    },
    enabled: !!organizationId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ ids, disponivel }: { ids: string[]; disponivel: boolean }) => {
      const { error } = await supabase
        .from('pecas')
        .update({ disponivel_loja: disponivel })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pecas-loja-manager'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
    },
    onError: () => toast.error('Erro ao atualizar produtos'),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return pecas;
    const s = search.toLowerCase();
    return pecas.filter(p => 
      p.nome.toLowerCase().includes(s) || 
      p.codigo?.toLowerCase().includes(s) ||
      p.categoria?.toLowerCase().includes(s)
    );
  }, [pecas, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Peca[]>();
    filtered.forEach(p => {
      const cat = p.categoria || 'Sem Categoria';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const stats = useMemo(() => {
    const total = pecas.length;
    const naLoja = pecas.filter(p => p.disponivel_loja).length;
    return { total, naLoja };
  }, [pecas]);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleAllInCategory = (categoryPecas: Peca[], enable: boolean) => {
    const ids = categoryPecas.map(p => p.id);
    updateMutation.mutate({ ids, disponivel: enable });
    toast.success(enable ? 'Categoria adicionada à loja!' : 'Categoria removida da loja');
  };

  const togglePeca = (id: string, disponivel: boolean) => {
    updateMutation.mutate({ ids: [id], disponivel });
  };

  const categoryAllEnabled = (categoryPecas: Peca[]) => categoryPecas.every(p => p.disponivel_loja);
  const categorySomeEnabled = (categoryPecas: Peca[]) => categoryPecas.some(p => p.disponivel_loja) && !categoryAllEnabled(categoryPecas);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total no estoque</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.naLoja}</p>
              <p className="text-xs text-muted-foreground">Na loja virtual</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, código ou categoria..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Groups */}
      <div className="space-y-3">
        {grouped.map(([cat, items]) => {
          const isOpen = openCategories.has(cat);
          const allEnabled = categoryAllEnabled(items);
          const someEnabled = categorySomeEnabled(items);
          const enabledCount = items.filter(p => p.disponivel_loja).length;

          return (
            <Card key={cat} className="overflow-hidden">
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleCategory(cat)}>
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{cat}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {items.length} {items.length === 1 ? 'peça' : 'peças'}
                    </Badge>
                    {enabledCount > 0 && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-200">
                        {enabledCount} na loja
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {allEnabled ? 'Toda na loja' : someEnabled ? 'Parcial' : 'Fora da loja'}
                  </span>
                  <Checkbox
                    checked={allEnabled ? true : someEnabled ? 'indeterminate' : false}
                    onCheckedChange={(checked) => {
                      toggleAllInCategory(items, !!checked);
                    }}
                  />
                </div>
              </div>

              {isOpen && (
                <div className="border-t">
                  <div className="divide-y">
                    {items.map(peca => (
                      <div key={peca.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {peca.imagem_url ? (
                            <img src={peca.imagem_url} alt={peca.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{peca.nome}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{peca.codigo}</span>
                            <span>•</span>
                            <span>R$ {peca.preco_venda?.toFixed(2)}</span>
                            <span>•</span>
                            <span>Estoque: {peca.estoque ?? 0}</span>
                          </div>
                        </div>
                        <Switch
                          checked={peca.disponivel_loja}
                          onCheckedChange={(v) => togglePeca(peca.id, v)}
                          disabled={updateMutation.isPending}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {grouped.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhuma peça encontrada</p>
            <p className="text-sm">Cadastre peças no estoque para disponibilizá-las na loja</p>
          </div>
        )}
      </div>
    </div>
  );
}
