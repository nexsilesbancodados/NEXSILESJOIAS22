import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Tag, Trash2, Percent, DollarSign } from 'lucide-react';

interface Cupom {
  id: string;
  codigo: string;
  tipo: string;
  valor: number;
  valor_minimo_pedido: number;
  uso_maximo: number | null;
  uso_atual: number;
  ativo: boolean;
  valido_ate: string | null;
}

export function CuponsManager() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    codigo: '', tipo: 'percentual', valor: '', valor_minimo_pedido: '',
    uso_maximo: '', ativo: true, valido_ate: '',
  });

  const { data: cupons = [], isLoading } = useQuery({
    queryKey: ['cupons', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Cupom[];
    },
    enabled: !!organizationId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !form.codigo.trim() || !form.valor) throw new Error('Preencha os campos obrigatórios');
      const { error } = await supabase.from('cupons').insert({
        organization_id: organizationId,
        codigo: form.codigo.toUpperCase().trim(),
        tipo: form.tipo,
        valor: parseFloat(form.valor),
        valor_minimo_pedido: form.valor_minimo_pedido ? parseFloat(form.valor_minimo_pedido) : 0,
        uso_maximo: form.uso_maximo ? parseInt(form.uso_maximo) : null,
        ativo: form.ativo,
        valido_ate: form.valido_ate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupons'] });
      setDialogOpen(false);
      setForm({ codigo: '', tipo: 'percentual', valor: '', valor_minimo_pedido: '', uso_maximo: '', ativo: true, valido_ate: '' });
      toast.success('Cupom criado!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao criar cupom'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('cupons').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cupons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupons'] });
      toast.success('Cupom excluído');
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Cupons de Desconto</h3>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo Cupom
        </Button>
      </div>

      {cupons.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Tag className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">Nenhum cupom criado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {cupons.map(cupom => (
            <Card key={cupom.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {cupom.tipo === 'percentual' ? <Percent className="w-5 h-5 text-primary" /> : <DollarSign className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">{cupom.codigo}</span>
                    <Badge variant={cupom.ativo ? 'default' : 'secondary'} className="text-[10px]">
                      {cupom.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cupom.tipo === 'percentual' ? `${cupom.valor}% de desconto` : `R$ ${cupom.valor.toFixed(2)} de desconto`}
                    {cupom.valor_minimo_pedido > 0 && ` • Mín: R$ ${cupom.valor_minimo_pedido.toFixed(2)}`}
                    {cupom.uso_maximo && ` • ${cupom.uso_atual}/${cupom.uso_maximo} usos`}
                    {cupom.valido_ate && ` • Até ${new Date(cupom.valido_ate).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <Switch
                  checked={cupom.ativo}
                  onCheckedChange={v => toggleMutation.mutate({ id: cupom.id, ativo: v })}
                />
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(cupom.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cupom</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value.toUpperCase() }))} placeholder="EX: DESCONTO10" className="font-mono uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentual">Percentual (%)</SelectItem>
                    <SelectItem value="valor_fixo">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input type="number" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} placeholder={form.tipo === 'percentual' ? '10' : '25.00'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Pedido mínimo (R$)</Label>
                <Input type="number" value={form.valor_minimo_pedido} onChange={e => setForm(p => ({ ...p, valor_minimo_pedido: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Limite de usos</Label>
                <Input type="number" value={form.uso_maximo} onChange={e => setForm(p => ({ ...p, uso_maximo: e.target.value }))} placeholder="Ilimitado" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Válido até</Label>
              <Input type="date" value={form.valido_ate} onChange={e => setForm(p => ({ ...p, valido_ate: e.target.value }))} />
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</> : 'Criar Cupom'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
