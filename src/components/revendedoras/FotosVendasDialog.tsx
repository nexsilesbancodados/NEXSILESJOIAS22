import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, Trash2, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useRef, useState } from 'react';

interface Foto {
  id: string;
  foto_url: string;
  observacao: string | null;
  peca_id: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  maletaId: string;
  maletaNome: string;
  organizationId: string | null;
}

export function FotosVendasDialog({ open, onOpenChange, maletaId, maletaNome, organizationId }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['maleta-fotos', maletaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maleta_venda_fotos' as any)
        .select('*')
        .eq('maleta_id', maletaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Foto[];
    },
    enabled: open,
  });

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !organizationId) return;
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      for (const file of Array.from(files)) {
        const path = `${organizationId}/${maletaId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from('maleta-vendas-fotos')
          .upload(path, file, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('maleta-vendas-fotos').getPublicUrl(path);
        const { error: dbErr } = await supabase.from('maleta_venda_fotos' as any).insert({
          organization_id: organizationId,
          maleta_id: maletaId,
          foto_url: pub.publicUrl,
          user_id: userRes?.user?.id ?? null,
        });
        if (dbErr) throw dbErr;
      }
      toast.success('Fotos enviadas');
      qc.invalidateQueries({ queryKey: ['maleta-fotos', maletaId] });
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao enviar');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('maleta_venda_fotos' as any).delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir');
      return;
    }
    toast.success('Foto excluída');
    qc.invalidateQueries({ queryKey: ['maleta-fotos', maletaId] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Fotos das vendas
          </DialogTitle>
          <DialogDescription>Galeria de evidências da maleta "{maletaNome}".</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
            Adicionar fotos
          </Button>
          <span className="text-xs text-muted-foreground">{data.length} foto(s)</span>
        </div>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma foto adicionada.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.map((f) => (
                <div key={f.id} className="relative group rounded-lg overflow-hidden border bg-card">
                  <img src={f.foto_url} alt="" className="w-full h-40 object-cover" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(f.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <p className="text-[10px] text-muted-foreground p-2">
                    {new Date(f.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
