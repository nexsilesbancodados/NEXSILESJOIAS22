import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/ImageUpload';
import { toast } from 'sonner';
import { Loader2, Save, Timer, Gift, Camera } from 'lucide-react';

export function EcommercePromocoesTab() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  const { data: config, isLoading } = useQuery({
    queryKey: ['ecommerce-config-promos', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data } = await supabase.from('ecommerce_config' as any)
        .select('id, countdown_ativo, countdown_titulo, countdown_subtitulo, countdown_data_fim, popup_ativo, popup_titulo, popup_texto, popup_imagem_url, popup_cupom, popup_delay_segundos, lookbook_ativo, lookbook_titulo, lookbook_imagens')
        .eq('organization_id', organizationId).maybeSingle();
      return data as any;
    },
    enabled: !!organizationId,
  });

  const [form, setForm] = useState({
    countdown_ativo: false, countdown_titulo: '', countdown_subtitulo: '', countdown_data_fim: '',
    popup_ativo: false, popup_titulo: '', popup_texto: '', popup_imagem_url: '', popup_cupom: '', popup_delay_segundos: '5',
    lookbook_ativo: false, lookbook_titulo: 'Lookbook', lookbook_imagens: [] as any[],
  });

  useEffect(() => {
    if (config) {
      setForm({
        countdown_ativo: config.countdown_ativo || false,
        countdown_titulo: config.countdown_titulo || '',
        countdown_subtitulo: config.countdown_subtitulo || '',
        countdown_data_fim: config.countdown_data_fim ? new Date(config.countdown_data_fim).toISOString().slice(0, 16) : '',
        popup_ativo: config.popup_ativo || false,
        popup_titulo: config.popup_titulo || '',
        popup_texto: config.popup_texto || '',
        popup_imagem_url: config.popup_imagem_url || '',
        popup_cupom: config.popup_cupom || '',
        popup_delay_segundos: config.popup_delay_segundos?.toString() || '5',
        lookbook_ativo: config.lookbook_ativo || false,
        lookbook_titulo: config.lookbook_titulo || 'Lookbook',
        lookbook_imagens: config.lookbook_imagens || [],
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!config?.id) throw new Error('Configure a loja primeiro');
      const payload: any = {
        countdown_ativo: form.countdown_ativo,
        countdown_titulo: form.countdown_titulo || null,
        countdown_subtitulo: form.countdown_subtitulo || null,
        countdown_data_fim: form.countdown_data_fim ? new Date(form.countdown_data_fim).toISOString() : null,
        popup_ativo: form.popup_ativo,
        popup_titulo: form.popup_titulo || null,
        popup_texto: form.popup_texto || null,
        popup_imagem_url: form.popup_imagem_url || null,
        popup_cupom: form.popup_cupom || null,
        popup_delay_segundos: parseInt(form.popup_delay_segundos) || 5,
        lookbook_ativo: form.lookbook_ativo,
        lookbook_titulo: form.lookbook_titulo || null,
        lookbook_imagens: form.lookbook_imagens,
      };
      const { error } = await supabase.from('ecommerce_config' as any).update(payload).eq('id', config.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ecommerce-config-promos'] }); toast.success('Promoções salvas!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const addLookbookImage = (url: string) => {
    setForm(p => ({ ...p, lookbook_imagens: [...p.lookbook_imagens, { id: crypto.randomUUID(), imagem_url: url, produtos_tagueados: [] }] }));
  };

  const removeLookbookImage = (id: string) => {
    setForm(p => ({ ...p, lookbook_imagens: p.lookbook_imagens.filter((img: any) => img.id !== id) }));
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Promoções & Marketing</h3>
          <p className="text-sm text-muted-foreground">Countdown, popup de leads e lookbook</p>
        </div>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
          Salvar Tudo
        </Button>
      </div>

      <Tabs defaultValue="countdown">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="countdown" className="text-xs gap-1"><Timer className="w-3 h-3" /> Countdown</TabsTrigger>
          <TabsTrigger value="popup" className="text-xs gap-1"><Gift className="w-3 h-3" /> Popup</TabsTrigger>
          <TabsTrigger value="lookbook" className="text-xs gap-1"><Camera className="w-3 h-3" /> Lookbook</TabsTrigger>
        </TabsList>

        {/* COUNTDOWN */}
        <TabsContent value="countdown" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Contador Regressivo</CardTitle>
                  <CardDescription className="text-xs">Crie urgência com um timer de promoção</CardDescription>
                </div>
                <Switch checked={form.countdown_ativo} onCheckedChange={v => setForm(p => ({ ...p, countdown_ativo: v }))} />
              </div>
            </CardHeader>
            {form.countdown_ativo && (
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Título</Label>
                    <Input value={form.countdown_titulo} onChange={e => setForm(p => ({ ...p, countdown_titulo: e.target.value }))} placeholder="Ex: Black Friday" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Subtítulo</Label>
                    <Input value={form.countdown_subtitulo} onChange={e => setForm(p => ({ ...p, countdown_subtitulo: e.target.value }))} placeholder="Ex: Até 50% OFF" className="h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data e hora de término</Label>
                  <Input type="datetime-local" value={form.countdown_data_fim} onChange={e => setForm(p => ({ ...p, countdown_data_fim: e.target.value }))} className="h-9" />
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* POPUP */}
        <TabsContent value="popup" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Popup de Boas-Vindas</CardTitle>
                  <CardDescription className="text-xs">Capture leads com desconto na primeira visita</CardDescription>
                </div>
                <Switch checked={form.popup_ativo} onCheckedChange={v => setForm(p => ({ ...p, popup_ativo: v }))} />
              </div>
            </CardHeader>
            {form.popup_ativo && (
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Imagem (opcional)</Label>
                  <ImageUpload value={form.popup_imagem_url} onChange={(url) => setForm(p => ({ ...p, popup_imagem_url: url }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Título</Label>
                    <Input value={form.popup_titulo} onChange={e => setForm(p => ({ ...p, popup_titulo: e.target.value }))} placeholder="Ganhe 10% OFF!" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cupom a revelar</Label>
                    <Input value={form.popup_cupom} onChange={e => setForm(p => ({ ...p, popup_cupom: e.target.value }))} placeholder="BEMVINDO10" className="h-9 font-mono" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Texto</Label>
                  <Textarea value={form.popup_texto} onChange={e => setForm(p => ({ ...p, popup_texto: e.target.value }))} placeholder="Cadastre-se e receba..." rows={2} className="text-sm resize-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Delay para exibir: {form.popup_delay_segundos}s</Label>
                  <Slider value={[parseInt(form.popup_delay_segundos) || 5]} onValueChange={([v]) => setForm(p => ({ ...p, popup_delay_segundos: String(v) }))} min={0} max={30} step={1} />
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* LOOKBOOK */}
        <TabsContent value="lookbook" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Lookbook</CardTitle>
                  <CardDescription className="text-xs">Grid de fotos editoriais com produtos tagueados</CardDescription>
                </div>
                <Switch checked={form.lookbook_ativo} onCheckedChange={v => setForm(p => ({ ...p, lookbook_ativo: v }))} />
              </div>
            </CardHeader>
            {form.lookbook_ativo && (
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Título da seção</Label>
                  <Input value={form.lookbook_titulo} onChange={e => setForm(p => ({ ...p, lookbook_titulo: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Adicionar foto</Label>
                  <ImageUpload value="" onChange={addLookbookImage} />
                </div>
                {form.lookbook_imagens.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {form.lookbook_imagens.map((img: any) => (
                      <div key={img.id} className="relative group rounded overflow-hidden">
                        <img src={img.imagem_url} alt="" className="w-full h-24 object-cover" />
                        <button onClick={() => removeLookbookImage(img.id)}
                          className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
