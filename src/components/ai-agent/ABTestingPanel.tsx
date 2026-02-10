import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  FlaskConical, 
  Plus, 
  Trash2, 
  Trophy,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ABTest {
  id: string;
  nome: string;
  descricao: string | null;
  variante_a_prompt: string;
  variante_b_prompt: string;
  variante_a_conversas: number;
  variante_b_conversas: number;
  variante_a_nps_total: number;
  variante_b_nps_total: number;
  variante_a_resolucoes: number;
  variante_b_resolucoes: number;
  ativo: boolean;
  created_at: string;
}

export function ABTestingPanel() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [varianteA, setVarianteA] = useState('');
  const [varianteB, setVarianteB] = useState('');

  const { data: testes = [], isLoading } = useQuery({
    queryKey: ['ab-testes', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await (supabase as any)
        .from('ab_testes')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ABTest[];
    },
    enabled: !!organizationId,
  });

  const createTest = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('ab_testes')
        .insert({
          organization_id: organizationId,
          nome,
          descricao: descricao || null,
          variante_a_prompt: varianteA,
          variante_b_prompt: varianteB,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-testes'] });
      toast.success('Teste A/B criado!');
      setDialogOpen(false);
      setNome('');
      setDescricao('');
      setVarianteA('');
      setVarianteB('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleTest = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      // If activating, deactivate others first
      if (ativo) {
        await (supabase as any)
          .from('ab_testes')
          .update({ ativo: false })
          .eq('organization_id', organizationId);
      }
      const { error } = await (supabase as any)
        .from('ab_testes')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-testes'] });
    },
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('ab_testes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-testes'] });
      toast.success('Teste removido');
    },
  });

  const getWinner = (test: ABTest) => {
    const avgA = test.variante_a_conversas > 0 
      ? test.variante_a_nps_total / test.variante_a_conversas 
      : 0;
    const avgB = test.variante_b_conversas > 0 
      ? test.variante_b_nps_total / test.variante_b_conversas 
      : 0;
    
    if (test.variante_a_conversas < 5 && test.variante_b_conversas < 5) return null;
    if (avgA > avgB) return 'A';
    if (avgB > avgA) return 'B';
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            A/B Testing de Respostas
          </h3>
          <p className="text-sm text-muted-foreground">
            Teste variações de prompts e compare performance
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Teste
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Teste A/B</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Teste</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Tom formal vs casual" />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que você está testando?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Badge variant="outline">Variante A</Badge>
                  </Label>
                  <Textarea
                    value={varianteA}
                    onChange={(e) => setVarianteA(e.target.value)}
                    placeholder="Prompt da variante A..."
                    rows={6}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Badge variant="outline">Variante B</Badge>
                  </Label>
                  <Textarea
                    value={varianteB}
                    onChange={(e) => setVarianteB(e.target.value)}
                    placeholder="Prompt da variante B..."
                    rows={6}
                  />
                </div>
              </div>
              <Button 
                onClick={() => createTest.mutate()} 
                disabled={!nome || !varianteA || !varianteB || createTest.isPending}
                className="w-full"
              >
                {createTest.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar Teste A/B
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : testes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum teste A/B criado ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie testes para comparar variações de prompts e encontrar o melhor
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {testes.map((test) => {
            const winner = getWinner(test);
            const avgA = test.variante_a_conversas > 0 
              ? (test.variante_a_nps_total / test.variante_a_conversas).toFixed(1) 
              : '-';
            const avgB = test.variante_b_conversas > 0 
              ? (test.variante_b_nps_total / test.variante_b_conversas).toFixed(1) 
              : '-';

            return (
              <Card key={test.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{test.nome}</CardTitle>
                      {test.ativo && <Badge className="bg-green-500">Ativo</Badge>}
                      {winner && (
                        <Badge variant="outline" className="gap-1">
                          <Trophy className="h-3 w-3" />
                          Variante {winner} vencendo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={test.ativo}
                        onCheckedChange={(checked) => toggleTest.mutate({ id: test.id, ativo: checked })}
                      />
                      <Button variant="ghost" size="icon" onClick={() => deleteTest.mutate(test.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {test.descricao && (
                    <p className="text-sm text-muted-foreground">{test.descricao}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border ${winner === 'A' ? 'border-green-500 bg-green-500/5' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Variante A</Badge>
                        {winner === 'A' && <Trophy className="h-4 w-4 text-green-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{test.variante_a_prompt}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold">{test.variante_a_conversas}</p>
                          <p className="text-xs text-muted-foreground">Conversas</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{avgA}</p>
                          <p className="text-xs text-muted-foreground">NPS Médio</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{test.variante_a_resolucoes}</p>
                          <p className="text-xs text-muted-foreground">Resoluções</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${winner === 'B' ? 'border-green-500 bg-green-500/5' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Variante B</Badge>
                        {winner === 'B' && <Trophy className="h-4 w-4 text-green-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{test.variante_b_prompt}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold">{test.variante_b_conversas}</p>
                          <p className="text-xs text-muted-foreground">Conversas</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{avgB}</p>
                          <p className="text-xs text-muted-foreground">NPS Médio</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{test.variante_b_resolucoes}</p>
                          <p className="text-xs text-muted-foreground">Resoluções</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
