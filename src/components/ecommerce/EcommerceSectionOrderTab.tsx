import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, GripVertical, Loader2, Save, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Section {
  id: string;
  tipo: string;
  titulo: string;
  visivel: boolean;
  ordem: number;
}

const DEFAULT_SECTIONS: Section[] = [
  { id: '1', tipo: 'hero', titulo: 'Hero / Banners', visivel: true, ordem: 0 },
  { id: '2', tipo: 'banner_corredor', titulo: 'Banner Corredor', visivel: true, ordem: 1 },
  { id: '3', tipo: 'colecoes', titulo: 'Coleções em Destaque', visivel: true, ordem: 2 },
  { id: '4', tipo: 'produtos_destaque', titulo: 'Produtos em Destaque', visivel: true, ordem: 3 },
  { id: '5', tipo: 'novidades', titulo: 'Novidades', visivel: true, ordem: 4 },
  { id: '6', tipo: 'mais_vendidos', titulo: 'Mais Vendidos', visivel: true, ordem: 5 },
  { id: '7', tipo: 'countdown', titulo: 'Countdown Promoção', visivel: false, ordem: 6 },
  { id: '8', tipo: 'lookbook', titulo: 'Lookbook', visivel: false, ordem: 7 },
  { id: '9', tipo: 'newsletter', titulo: 'Newsletter', visivel: true, ordem: 8 },
  { id: '10', tipo: 'sobre_marca', titulo: 'Sobre a Marca', visivel: false, ordem: 9 },
  { id: '11', tipo: 'instagram_cta', titulo: 'CTA Instagram', visivel: false, ordem: 10 },
];

const SECTION_ICONS: Record<string, string> = {
  hero: '🎠', banner_corredor: '📢', colecoes: '📂', produtos_destaque: '⭐',
  novidades: '🆕', mais_vendidos: '🔥', countdown: '⏱️', lookbook: '📷',
  newsletter: '📧', sobre_marca: '💎', instagram_cta: '📸', depoimentos: '💬',
};

export function EcommerceSectionOrderTab() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);

  const { data: config, isLoading } = useQuery({
    queryKey: ['ecommerce-config-sections', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data } = await supabase.from('ecommerce_config' as any).select('id, secoes_homepage').eq('organization_id', organizationId).maybeSingle();
      return data as any;
    },
    enabled: !!organizationId,
  });

  useEffect(() => {
    if (config?.secoes_homepage && Array.isArray(config.secoes_homepage) && config.secoes_homepage.length > 0) {
      setSections(config.secoes_homepage);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!config?.id) throw new Error('Configure a loja primeiro');
      const { error } = await supabase.from('ecommerce_config' as any).update({ secoes_homepage: sections }).eq('id', config.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ecommerce-config-sections'] }); toast.success('Ordem das seções salva!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleMove = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const arr = [...sections];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setSections(arr.map((s, i) => ({ ...s, ordem: i })));
  };

  const handleToggle = (idx: number) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, visivel: !s.visivel } : s));
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Ordem das Seções</h3>
          <p className="text-sm text-muted-foreground">Arraste para reordenar e ative/desative seções da página inicial</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSections(DEFAULT_SECTIONS)}>
            <RotateCcw className="w-3 h-3 mr-1" /> Padrão
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <AnimatePresence>
          {sections.map((section, idx) => (
            <motion.div key={section.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className={`transition-opacity ${!section.visivel ? 'opacity-50' : ''}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMove(idx, -1)} className="p-0.5 hover:bg-muted rounded disabled:opacity-30" disabled={idx === 0}><ArrowUp className="w-3 h-3" /></button>
                    <GripVertical className="w-4 h-4 text-muted-foreground mx-auto" />
                    <button onClick={() => handleMove(idx, 1)} className="p-0.5 hover:bg-muted rounded disabled:opacity-30" disabled={idx === sections.length - 1}><ArrowDown className="w-3 h-3" /></button>
                  </div>
                  <span className="text-lg">{SECTION_ICONS[section.tipo] || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{section.titulo}</p>
                    <p className="text-xs text-muted-foreground">{section.tipo}</p>
                  </div>
                  <Switch checked={section.visivel} onCheckedChange={() => handleToggle(idx)} />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
