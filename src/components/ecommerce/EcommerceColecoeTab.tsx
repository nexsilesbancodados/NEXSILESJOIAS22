import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ImageUpload';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Loader2, FolderOpen, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Colecao {
  id: string;
  titulo: string;
  imagem_url: string;
  categoria_filtro: string;
  ordem: number;
  ativo: boolean;
}

const defaultColecao: Colecao = { id: '', titulo: '', imagem_url: '', categoria_filtro: '', ordem: 0, ativo: true };

export function EcommerceColecoeTab() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const [editItem, setEditItem] = useState<Colecao | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['ecommerce-config-colecoes', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data } = await supabase.from('ecommerce_config' as any).select('id, colecoes_destaque').eq('organization_id', organizationId).maybeSingle();
      return data as any;
    },
    enabled: !!organizationId,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['pecas-categorias', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase.from('pecas' as any).select('categoria').eq('organization_id', organizationId).not('categoria', 'is', null);
      const unique = [...new Set((data || []).map((p: any) => p.categoria).filter(Boolean))];
      return unique as string[];
    },
    enabled: !!organizationId,
  });

  const colecoes: Colecao[] = (config?.colecoes_destaque || []).sort((a: Colecao, b: Colecao) => a.ordem - b.ordem);

  const saveMutation = useMutation({
    mutationFn: async (newColecoes: Colecao[]) => {
      if (!config?.id) throw new Error('Configure a loja primeiro');
      const { error } = await supabase.from('ecommerce_config' as any).update({ colecoes_destaque: newColecoes }).eq('id', config.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ecommerce-config-colecoes'] }); toast.success('Coleções salvas!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!editItem) return;
    let updated: Colecao[];
    if (editItem.id) {
      updated = colecoes.map(c => c.id === editItem.id ? editItem : c);
    } else {
      updated = [...colecoes, { ...editItem, id: crypto.randomUUID(), ordem: colecoes.length }];
    }
    saveMutation.mutate(updated);
    setDialogOpen(false);
    setEditItem(null);
  };

  const handleDelete = (id: string) => saveMutation.mutate(colecoes.filter(c => c.id !== id).map((c, i) => ({ ...c, ordem: i })));
  const handleToggle = (id: string) => saveMutation.mutate(colecoes.map(c => c.id === id ? { ...c, ativo: !c.ativo } : c));
  const handleMove = (id: string, dir: -1 | 1) => {
    const idx = colecoes.findIndex(c => c.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === colecoes.length - 1)) return;
    const arr = [...colecoes]; [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    saveMutation.mutate(arr.map((c, i) => ({ ...c, ordem: i })));
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Coleções em Destaque</h3>
          <p className="text-sm text-muted-foreground">Blocos de categorias com imagem na página inicial</p>
        </div>
        <Button onClick={() => { setEditItem({ ...defaultColecao }); setDialogOpen(true); }} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nova Coleção
        </Button>
      </div>

      {colecoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 gap-3">
            <FolderOpen className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma coleção cadastrada</p>
            <p className="text-xs text-muted-foreground">As categorias dos produtos serão usadas automaticamente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {colecoes.map((col) => (
              <motion.div key={col.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className={`overflow-hidden transition-opacity ${!col.ativo ? 'opacity-50' : ''}`}>
                  {col.imagem_url && (
                    <div className="h-28 overflow-hidden">
                      <img src={col.imagem_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{col.titulo || 'Sem título'}</p>
                      <p className="text-xs text-muted-foreground">Filtro: {col.categoria_filtro || 'nenhum'}</p>
                    </div>
                    <Switch checked={col.ativo} onCheckedChange={() => handleToggle(col.id)} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(col); setDialogOpen(true); }}><Edit2 className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(col.id)}><Trash2 className="w-3 h-3" /></Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem?.id ? 'Editar Coleção' : 'Nova Coleção'}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Imagem da Coleção</Label>
                <ImageUpload value={editItem.imagem_url} onChange={(url) => setEditItem({ ...editItem, imagem_url: url })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Título</Label>
                <Input value={editItem.titulo} onChange={e => setEditItem({ ...editItem, titulo: e.target.value })} placeholder="Ex: Anéis" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria para filtrar</Label>
                <div className="flex flex-wrap gap-1.5">
                  {categorias.map((cat) => (
                    <button key={cat} onClick={() => setEditItem({ ...editItem, categoria_filtro: cat })}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${editItem.categoria_filtro === cat ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <Input value={editItem.categoria_filtro} onChange={e => setEditItem({ ...editItem, categoria_filtro: e.target.value })} placeholder="Ou digite manualmente" className="h-8 text-xs mt-1" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
