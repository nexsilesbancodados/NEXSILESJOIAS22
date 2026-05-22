import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react';

interface Categoria {
  id: string;
  nome: string;
  ordem: number;
  comissao_percentual?: number | null;
}

export function useCategorias() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['categorias-pecas', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('categorias_pecas' as any)
        .select('id, nome, ordem, comissao_percentual')
        .eq('organization_id', organizationId)
        .order('ordem', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Categoria[];
    },
    enabled: !!organizationId,
  });
}

export function CategoriasManager() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const { data: categorias = [], isLoading } = useCategorias();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Categoria | null>(null);
  const [nome, setNome] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categorias-pecas'] });

  const addMutation = useMutation({
    mutationFn: async (nome: string) => {
      if (!organizationId) throw new Error('Sem organização');
      const { error } = await supabase.from('categorias_pecas' as any).insert({
        organization_id: organizationId,
        nome: nome.trim(),
        ordem: categorias.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Categoria adicionada'); },
    onError: (e: any) => toast.error(e.message?.includes('unique') ? 'Categoria já existe' : e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase.from('categorias_pecas' as any).update({ nome: nome.trim() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Categoria atualizada'); },
    onError: (e: any) => toast.error(e.message?.includes('unique') ? 'Categoria já existe' : e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categorias_pecas' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Categoria removida'); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!nome.trim()) return;
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, nome });
    } else {
      addMutation.mutate(nome);
    }
    setDialogOpen(false);
    setEditItem(null);
    setNome('');
  };

  const openAdd = () => { setEditItem(null); setNome(''); setDialogOpen(true); };
  const openEdit = (cat: Categoria) => { setEditItem(cat); setNome(cat.nome); setDialogOpen(true); };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Tag className="w-5 h-5" /> Categorias</h3>
          <p className="text-sm text-muted-foreground">Gerencie as categorias das suas peças</p>
        </div>
        <Button onClick={openAdd} size="sm"><Plus className="w-4 h-4 mr-1" /> Nova</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categorias.map((cat) => (
          <div key={cat.id} className="flex items-center gap-1 px-3 py-1.5 rounded-full border bg-muted/50 text-sm group">
            <span>{cat.nome}</span>
            <button onClick={() => openEdit(cat)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-primary">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => setDeleteId(cat.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {categorias.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Anel" onKeyDown={e => e.key === 'Enter' && handleSave()} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!nome.trim()}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>As peças com essa categoria não serão afetadas, apenas a opção será removida da lista.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
