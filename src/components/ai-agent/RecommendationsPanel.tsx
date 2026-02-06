import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Heart,
  RefreshCw,
  Search,
  Package,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientePreferencia {
  id: string;
  cliente_telefone: string;
  categorias_favoritas: string[] | null;
  faixa_preco_min: number | null;
  faixa_preco_max: number | null;
  materiais_preferidos: string[] | null;
  ultima_compra_at: string | null;
  total_compras: number;
  valor_total_compras: number;
  produtos_comprados: string[] | null;
}

interface ProdutoAssociacao {
  id: string;
  peca_origem_id: string;
  peca_associada_id: string;
  score: number;
  peca_origem?: { nome: string; codigo: string };
  peca_associada?: { nome: string; codigo: string; preco_venda: number };
}

export function RecommendationsPanel() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [telefoneSearch, setTelefoneSearch] = useState('');

  // Fetch cliente preferências
  const { data: preferencias = [], isLoading: loadingPrefs } = useQuery({
    queryKey: ['cliente-preferencias', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cliente_preferencias')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('valor_total_compras', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as ClientePreferencia[];
    },
    enabled: !!organizationId
  });

  // Fetch top associations
  const { data: associacoes = [], isLoading: loadingAssoc } = useQuery({
    queryKey: ['produto-associacoes', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produto_associacoes')
        .select(`
          id, score, peca_origem_id, peca_associada_id,
          peca_origem:pecas!produto_associacoes_peca_origem_id_fkey(nome, codigo),
          peca_associada:pecas!produto_associacoes_peca_associada_id_fkey(nome, codigo, preco_venda)
        `)
        .eq('organization_id', organizationId!)
        .order('score', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as ProdutoAssociacao[];
    },
    enabled: !!organizationId
  });

  // Build associations from sales data
  const buildAssociationsMutation = useMutation({
    mutationFn: async () => {
      // Get all sales with items
      const { data: vendas, error } = await supabase
        .from('vendas')
        .select(`
          id,
          vendas_pecas(peca_id)
        `)
        .eq('organization_id', organizationId!);

      if (error) throw error;

      // Build co-purchase map
      const coCompras = new Map<string, number>();

      for (const venda of vendas || []) {
        const pecas = (venda.vendas_pecas as Array<{ peca_id: string }>)?.map(vp => vp.peca_id) || [];
        
        // Create pairs
        for (let i = 0; i < pecas.length; i++) {
          for (let j = i + 1; j < pecas.length; j++) {
            const key1 = `${pecas[i]}:${pecas[j]}`;
            const key2 = `${pecas[j]}:${pecas[i]}`;
            coCompras.set(key1, (coCompras.get(key1) || 0) + 1);
            coCompras.set(key2, (coCompras.get(key2) || 0) + 1);
          }
        }
      }

      // Upsert associations
      const upserts = Array.from(coCompras.entries()).map(([key, score]) => {
        const [origem, associada] = key.split(':');
        return {
          organization_id: organizationId!,
          peca_origem_id: origem,
          peca_associada_id: associada,
          score
        };
      });

      if (upserts.length > 0) {
        // Delete old and insert new
        await supabase
          .from('produto_associacoes')
          .delete()
          .eq('organization_id', organizationId!);

        const { error: insertError } = await supabase
          .from('produto_associacoes')
          .insert(upserts);

        if (insertError) throw insertError;
      }

      return upserts.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} associações atualizadas!`);
      queryClient.invalidateQueries({ queryKey: ['produto-associacoes'] });
    },
    onError: (error) => {
      console.error('Error building associations:', error);
      toast.error('Erro ao atualizar associações');
    }
  });

  // Get recommendations for a phone number
  const { data: recomendacoes, refetch: fetchRecomendacoes, isFetching } = useQuery({
    queryKey: ['recomendacoes', organizationId, telefoneSearch],
    queryFn: async () => {
      if (!telefoneSearch) return null;

      // Get cliente preferences
      const { data: pref } = await supabase
        .from('cliente_preferencias')
        .select('*')
        .eq('organization_id', organizationId!)
        .eq('cliente_telefone', telefoneSearch)
        .maybeSingle();

      if (!pref) return { tipo: 'not_found' };

      // Get recommendations based on preferences
      let query = supabase
        .from('pecas')
        .select('id, nome, codigo, preco_venda, categoria, imagem_url')
        .eq('organization_id', organizationId!)
        .eq('ativo', true)
        .gt('estoque', 0);

      if (pref.categorias_favoritas?.length) {
        query = query.in('categoria', pref.categorias_favoritas);
      }

      if (pref.faixa_preco_max) {
        query = query.lte('preco_venda', pref.faixa_preco_max * 1.2);
      }

      // Exclude already purchased
      if (pref.produtos_comprados?.length) {
        query = query.not('id', 'in', `(${pref.produtos_comprados.join(',')})`);
      }

      const { data: produtos } = await query.limit(10);

      // Get "also bought" recommendations
      const alsoBought: Array<{ nome: string; codigo: string; preco_venda: number }> = [];
      if (pref.produtos_comprados?.length) {
        const { data: assocs } = await supabase
          .from('produto_associacoes')
          .select(`
            peca_associada:pecas!produto_associacoes_peca_associada_id_fkey(nome, codigo, preco_venda)
          `)
          .eq('organization_id', organizationId!)
          .in('peca_origem_id', pref.produtos_comprados.slice(0, 5))
          .order('score', { ascending: false })
          .limit(5);

        if (assocs) {
          for (const a of assocs) {
            if (a.peca_associada) {
              alsoBought.push(a.peca_associada as { nome: string; codigo: string; preco_venda: number });
            }
          }
        }
      }

      return {
        tipo: 'found',
        preferencias: pref,
        produtos: produtos || [],
        alsoBought
      };
    },
    enabled: false
  });

  const filteredPrefs = preferencias.filter(p =>
    p.cliente_telefone.includes(telefoneSearch)
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="clientes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clientes" className="gap-2">
            <Heart className="h-4 w-4" />
            Preferências
          </TabsTrigger>
          <TabsTrigger value="associacoes" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            "Também Compram"
          </TabsTrigger>
          <TabsTrigger value="buscar" className="gap-2">
            <Search className="h-4 w-4" />
            Buscar Cliente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Clientes por Preferências
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPrefs ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : filteredPrefs.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhuma preferência de cliente registrada ainda.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    As preferências são detectadas automaticamente conforme os clientes interagem e compram.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredPrefs.map((pref) => (
                      <div key={pref.id} className="p-4 rounded-lg border hover:bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{pref.cliente_telefone}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {pref.categorias_favoritas?.map((cat) => (
                                <Badge key={cat} variant="secondary" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                            {pref.faixa_preco_min || pref.faixa_preco_max ? (
                              <p className="text-xs text-muted-foreground mt-2">
                                Faixa: R$ {pref.faixa_preco_min?.toFixed(0) || '0'} - R$ {pref.faixa_preco_max?.toFixed(0) || '∞'}
                              </p>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              R$ {pref.valor_total_compras.toFixed(0)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pref.total_compras} compra(s)
                            </p>
                            {pref.ultima_compra_at && (
                              <p className="text-xs text-muted-foreground">
                                Última: {format(new Date(pref.ultima_compra_at), 'dd/MM/yy', { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="associacoes" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Produtos Frequentemente Comprados Juntos
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => buildAssociationsMutation.mutate()}
                  disabled={buildAssociationsMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${buildAssociationsMutation.isPending ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAssoc ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : associacoes.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhuma associação de produtos encontrada.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => buildAssociationsMutation.mutate()}
                  >
                    Analisar histórico de vendas
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {associacoes.map((assoc) => (
                      <div key={assoc.id} className="p-4 rounded-lg border hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {(assoc.peca_origem as any)?.nome || 'Produto'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(assoc.peca_origem as any)?.codigo}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">→</span>
                            <Badge variant="secondary">{assoc.score}x</Badge>
                            <span className="text-muted-foreground">→</span>
                          </div>
                          <div className="flex-1 text-right">
                            <p className="font-medium text-sm">
                              {(assoc.peca_associada as any)?.nome || 'Produto'}
                            </p>
                            <p className="text-xs text-primary">
                              R$ {((assoc.peca_associada as any)?.preco_venda || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buscar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Recomendações por Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Digite o telefone do cliente..."
                  value={telefoneSearch}
                  onChange={(e) => setTelefoneSearch(e.target.value)}
                />
                <Button onClick={() => fetchRecomendacoes()} disabled={isFetching || !telefoneSearch}>
                  {isFetching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {recomendacoes?.tipo === 'not_found' && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Cliente não encontrado ou sem histórico de preferências.</p>
                </div>
              )}

              {recomendacoes?.tipo === 'found' && (
                <div className="space-y-6">
                  {/* Preferências do cliente */}
                  <div>
                    <h4 className="font-medium mb-2">Perfil do Cliente</h4>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {recomendacoes.preferencias.categorias_favoritas?.map((cat: string) => (
                          <Badge key={cat}>{cat}</Badge>
                        ))}
                      </div>
                      <p className="text-sm">
                        Total: {recomendacoes.preferencias.total_compras} compras - R$ {recomendacoes.preferencias.valor_total_compras.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Produtos recomendados */}
                  {recomendacoes.produtos?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Produtos Recomendados</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {recomendacoes.produtos.map((p: any) => (
                          <div key={p.id} className="p-3 rounded-lg border text-center">
                            <p className="font-medium text-sm truncate">{p.nome}</p>
                            <p className="text-xs text-muted-foreground">{p.codigo}</p>
                            <p className="text-primary font-bold mt-1">R$ {p.preco_venda?.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Also bought */}
                  {recomendacoes.alsoBought?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Clientes como este também compraram
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {recomendacoes.alsoBought.map((p: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg border bg-primary/5 text-center">
                            <p className="font-medium text-sm truncate">{p.nome}</p>
                            <p className="text-xs text-muted-foreground">{p.codigo}</p>
                            <p className="text-primary font-bold mt-1">R$ {p.preco_venda?.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
