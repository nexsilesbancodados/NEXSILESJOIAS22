import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ImageUpload';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, GripVertical, Image, Loader2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Banner {
  id: string;
  imagem_url: string;
  titulo: string;
  subtitulo: string;
  cta_texto: string;
  cta_link: string;
  cor_overlay: string;
  opacidade_overlay: number;
  posicao_texto: 'esquerda' | 'centro' | 'direita';
  ativo: boolean;
  ordem: number;
}

const defaultBanner: Banner = {
  id: '', imagem_url: '', titulo: '', subtitulo: '', cta_texto: 'Ver Coleção',
  cta_link: '', cor_overlay: '#000000', opacidade_overlay: 40,
  posicao_texto: 'esquerda', ativo: true, ordem: 0,
};

export function EcommerceBannersTab() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['ecommerce-config-banners', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data } = await supabase.from('ecommerce_config' as any).select('id, banners_carousel').eq('organization_id', organizationId).maybeSingle();
      return data as any;
    },
    enabled: !!organizationId,
  });

  const banners: Banner[] = (config?.banners_carousel || []).sort((a: Banner, b: Banner) => a.ordem - b.ordem);

  const saveMutation = useMutation({
    mutationFn: async (newBanners: Banner[]) => {
      if (!config?.id) throw new Error('Configure a loja primeiro');
      const { error } = await supabase.from('ecommerce_config' as any).update({ banners_carousel: newBanners }).eq('id', config.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ecommerce-config-banners'] }); toast.success('Banners salvos!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSaveBanner = () => {
    if (!editBanner) return;
    let updated: Banner[];
    if (editBanner.id) {
      updated = banners.map(b => b.id === editBanner.id ? editBanner : b);
    } else {
      updated = [...banners, { ...editBanner, id: crypto.randomUUID(), ordem: banners.length }];
    }
    saveMutation.mutate(updated);
    setDialogOpen(false);
    setEditBanner(null);
  };

  const handleDelete = (id: string) => {
    saveMutation.mutate(banners.filter(b => b.id !== id).map((b, i) => ({ ...b, ordem: i })));
  };

  const handleToggle = (id: string) => {
    saveMutation.mutate(banners.map(b => b.id === id ? { ...b, ativo: !b.ativo } : b));
  };

  const handleMove = (id: string, dir: -1 | 1) => {
    const idx = banners.findIndex(b => b.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === banners.length - 1)) return;
    const arr = [...banners];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    saveMutation.mutate(arr.map((b, i) => ({ ...b, ordem: i })));
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Banners do Carrossel</h3>
          <p className="text-sm text-muted-foreground">Gerencie os banners da página inicial da loja</p>
        </div>
        <Button onClick={() => { setEditBanner({ ...defaultBanner }); setDialogOpen(true); }} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Adicionar Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 gap-3">
            <Image className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum banner cadastrado</p>
            <Button variant="outline" size="sm" onClick={() => { setEditBanner({ ...defaultBanner }); setDialogOpen(true); }}>
              <Plus className="w-3 h-3 mr-1" /> Criar primeiro banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {banners.map((banner) => (
              <motion.div key={banner.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className={`transition-opacity ${!banner.ativo ? 'opacity-50' : ''}`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => handleMove(banner.id, -1)} className="p-0.5 hover:bg-muted rounded"><ArrowUp className="w-3 h-3" /></button>
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <button onClick={() => handleMove(banner.id, 1)} className="p-0.5 hover:bg-muted rounded"><ArrowDown className="w-3 h-3" /></button>
                    </div>
                    {banner.imagem_url ? (
                      <img src={banner.imagem_url} alt="" className="w-20 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-20 h-12 rounded bg-muted flex items-center justify-center"><Image className="w-5 h-5 text-muted-foreground/40" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{banner.titulo || 'Sem título'}</p>
                      <p className="text-xs text-muted-foreground truncate">{banner.subtitulo || 'Sem subtítulo'}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch checked={banner.ativo} onCheckedChange={() => handleToggle(banner.id)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditBanner(banner); setDialogOpen(true); }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(banner.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editBanner?.id ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
          </DialogHeader>
          {editBanner && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Imagem do Banner</Label>
                <ImageUpload value={editBanner.imagem_url} onChange={(url) => setEditBanner({ ...editBanner, imagem_url: url })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Título</Label>
                  <Input value={editBanner.titulo} onChange={e => setEditBanner({ ...editBanner, titulo: e.target.value })} placeholder="Ex: Nova Coleção" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Subtítulo</Label>
                  <Input value={editBanner.subtitulo} onChange={e => setEditBanner({ ...editBanner, subtitulo: e.target.value })} placeholder="Ex: Verão 2026" className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Texto do Botão</Label>
                  <Input value={editBanner.cta_texto} onChange={e => setEditBanner({ ...editBanner, cta_texto: e.target.value })} placeholder="Ver Coleção" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Link do Botão</Label>
                  <Input value={editBanner.cta_link} onChange={e => setEditBanner({ ...editBanner, cta_link: e.target.value })} placeholder="#produtos" className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cor do Overlay</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={editBanner.cor_overlay} onChange={e => setEditBanner({ ...editBanner, cor_overlay: e.target.value })} className="w-9 h-9 rounded border cursor-pointer" />
                    <Input value={editBanner.cor_overlay} onChange={e => setEditBanner({ ...editBanner, cor_overlay: e.target.value })} className="h-9 font-mono text-xs flex-1" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Posição do Texto</Label>
                  <Select value={editBanner.posicao_texto} onValueChange={(v: any) => setEditBanner({ ...editBanner, posicao_texto: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="esquerda">Esquerda</SelectItem>
                      <SelectItem value="centro">Centro</SelectItem>
                      <SelectItem value="direita">Direita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Opacidade do Overlay: {editBanner.opacidade_overlay}%</Label>
                <Slider value={[editBanner.opacidade_overlay]} onValueChange={([v]) => setEditBanner({ ...editBanner, opacidade_overlay: v })} min={0} max={80} step={5} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveBanner} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
