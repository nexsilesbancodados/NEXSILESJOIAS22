import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Loader2, ExternalLink, Copy, Palette, Truck, 
  MessageCircle, Image, Eye, EyeOff, CheckCircle2, AlertCircle,
  Instagram, Phone, Link2, Settings2, Sparkles, ShieldCheck,
  QrCode, Search, ShoppingBag, Heart, Share2, BarChart3,
  Package, Users, TrendingUp, Monitor, Smartphone, Globe
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { QRCodeSVG } from 'qrcode.react';

const COLOR_PRESETS = [
  { name: 'Rose Gold', primary: '#B76E79', secondary: '#8B4F57' },
  { name: 'Midnight', primary: '#1a1a2e', secondary: '#16213e' },
  { name: 'Ocean', primary: '#0077b6', secondary: '#023e8a' },
  { name: 'Forest', primary: '#2d6a4f', secondary: '#1b4332' },
  { name: 'Sunset', primary: '#e76f51', secondary: '#c1121f' },
  { name: 'Lavender', primary: '#7b2cbf', secondary: '#5a189a' },
  { name: 'Gold', primary: '#b8860b', secondary: '#8b6914' },
  { name: 'Coral', primary: '#ff6b6b', secondary: '#ee5a24' },
];

export function EcommerceConfigTab() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('mobile');
  const [showQR, setShowQR] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['ecommerce-config', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data } = await supabase
        .from('ecommerce_config' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      return data as any;
    },
    enabled: !!organizationId,
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['ecommerce-stats', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const [prodRes, pedRes] = await Promise.all([
        supabase.from('pecas' as any).select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
        supabase.from('ecommerce_pedidos' as any).select('id, valor_total', { count: 'exact' }).eq('organization_id', organizationId),
      ]);
      const totalProd = prodRes.count || 0;
      const totalPed = pedRes.count || 0;
      const totalVendas = (pedRes.data as any[])?.reduce((s: number, p: any) => s + (p.valor_total || 0), 0) || 0;
      return { totalProd, totalPed, totalVendas };
    },
    enabled: !!organizationId,
  });

  const [form, setForm] = useState({
    slug: '',
    nome_loja: '',
    logo_url: '',
    cor_primaria: '#B76E79',
    cor_secundaria: '#8B4F57',
    descricao: '',
    ativo: false,
    apenas_com_foto: false,
    frete_gratis_acima: '',
    taxa_entrega: '0',
    whatsapp: '',
    instagram: '',
  });

  useEffect(() => {
    if (config) {
      setForm({
        slug: config.slug || '',
        nome_loja: config.nome_loja || '',
        logo_url: config.logo_url || '',
        cor_primaria: config.cor_primaria || '#B76E79',
        cor_secundaria: config.cor_secundaria || '#8B4F57',
        descricao: config.descricao || '',
        ativo: config.ativo || false,
        apenas_com_foto: config.apenas_com_foto || false,
        frete_gratis_acima: config.frete_gratis_acima?.toString() || '',
        taxa_entrega: config.taxa_entrega?.toString() || '0',
        whatsapp: config.whatsapp || '',
        instagram: config.instagram || '',
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('Organização não encontrada');
      if (!form.slug.trim()) throw new Error('Slug obrigatório');
      if (!form.nome_loja.trim()) throw new Error('Nome da loja obrigatório');

      const slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      
      const payload = {
        organization_id: organizationId,
        slug,
        nome_loja: form.nome_loja,
        logo_url: form.logo_url || null,
        cor_primaria: form.cor_primaria,
        cor_secundaria: form.cor_secundaria,
        descricao: form.descricao || null,
        ativo: form.ativo,
        apenas_com_foto: form.apenas_com_foto,
        frete_gratis_acima: form.frete_gratis_acima ? parseFloat(form.frete_gratis_acima) : null,
        taxa_entrega: parseFloat(form.taxa_entrega) || 0,
        whatsapp: form.whatsapp || null,
        instagram: form.instagram || null,
      };

      if (config?.id) {
        const { error } = await supabase
          .from('ecommerce_config' as any)
          .update(payload)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ecommerce_config' as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-config'] });
      toast.success('Configurações salvas!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao salvar'),
  });

  const lojaUrl = form.slug ? `${window.location.origin}/loja/${form.slug}` : '';

  const hasChanges = useMemo(() => {
    if (!config) return false;
    return (
      form.slug !== (config.slug || '') ||
      form.nome_loja !== (config.nome_loja || '') ||
      form.logo_url !== (config.logo_url || '') ||
      form.cor_primaria !== (config.cor_primaria || '#B76E79') ||
      form.cor_secundaria !== (config.cor_secundaria || '#8B4F57') ||
      form.descricao !== (config.descricao || '') ||
      form.ativo !== (config.ativo || false) ||
      form.apenas_com_foto !== (config.apenas_com_foto || false) ||
      form.frete_gratis_acima !== (config.frete_gratis_acima?.toString() || '') ||
      form.taxa_entrega !== (config.taxa_entrega?.toString() || '0') ||
      form.whatsapp !== (config.whatsapp || '') ||
      form.instagram !== (config.instagram || '')
    );
  }, [form, config]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando configurações...</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Produtos', value: stats.totalProd, icon: Package, color: 'text-blue-500' },
            { label: 'Pedidos', value: stats.totalPed, icon: ShoppingBag, color: 'text-emerald-500' },
            { label: 'Faturamento', value: `R$ ${stats.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-amber-500' },
          ].map((stat) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl border bg-card"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Status Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${form.ativo ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'}`}
      >
        {form.ativo ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Loja ativa e acessível</p>
              {lojaUrl && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">{lojaUrl}</p>}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { navigator.clipboard.writeText(lojaUrl); toast.success('Link copiado!'); }}>
                <Copy className="w-3 h-3 mr-1" /> Copiar
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowQR(!showQR)}>
                <QrCode className="w-3 h-3 mr-1" /> QR
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(lojaUrl, '_blank')}>
                <ExternalLink className="w-3 h-3 mr-1" /> Abrir
              </Button>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Loja desativada</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Ative para que clientes possam acessar</p>
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={() => setForm(p => ({ ...p, ativo: true }))}>
              Ativar Agora
            </Button>
          </>
        )}
      </motion.div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && lojaUrl && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-dashed">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <p className="text-sm font-medium text-foreground">QR Code da Loja</p>
                <div className="p-4 bg-white rounded-xl shadow-sm">
                  <QRCodeSVG value={lojaUrl} size={180} fgColor={form.cor_primaria} />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Imprima ou compartilhe este QR Code para seus clientes acessarem a loja diretamente
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowQR(false)}>Fechar</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Forms */}
        <div className="lg:col-span-3 space-y-5">
          {/* General */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Informações Gerais</CardTitle>
                  <CardDescription className="text-xs">Nome, descrição e endereço</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {form.ativo ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">Ativar Loja</p>
                    <p className="text-xs text-muted-foreground">Visível ao público</p>
                  </div>
                </div>
                <Switch checked={form.ativo} onCheckedChange={v => setForm(p => ({ ...p, ativo: v }))} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nome da Loja <span className="text-destructive">*</span></Label>
                  <Input value={form.nome_loja} onChange={e => setForm(p => ({ ...p, nome_loja: e.target.value }))} placeholder="Ex: Joias Elegance" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> Slug <span className="text-destructive">*</span>
                  </Label>
                  <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="joias-elegance" className="h-9 font-mono text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Descrição</Label>
                <Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Sobre sua loja..." rows={2} className="text-sm resize-none" />
                <p className="text-[10px] text-muted-foreground">{form.descricao.length}/300 · Aparece no Google (SEO)</p>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Aparência</CardTitle>
                  <CardDescription className="text-xs">Logo, cores e identidade visual</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1"><Image className="w-3 h-3" /> URL do Logo</Label>
                <Input value={form.logo_url} onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://..." className="h-9 text-sm" />
                {form.logo_url && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <img src={form.logo_url} alt="Logo" className="w-10 h-10 rounded-md object-contain bg-white border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <p className="text-[10px] text-muted-foreground">Preview</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Color Presets */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Temas Prontos</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setForm(p => ({ ...p, cor_primaria: preset.primary, cor_secundaria: preset.secondary }))}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-medium transition-all hover:scale-105 ${form.cor_primaria === preset.primary ? 'ring-2 ring-primary ring-offset-1' : 'hover:border-primary/50'}`}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }} />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.cor_primaria} onChange={e => setForm(p => ({ ...p, cor_primaria: e.target.value }))} className="w-9 h-9 rounded-lg cursor-pointer border-2 border-border" />
                    <Input value={form.cor_primaria} onChange={e => setForm(p => ({ ...p, cor_primaria: e.target.value }))} className="h-9 font-mono text-[10px] flex-1" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.cor_secundaria} onChange={e => setForm(p => ({ ...p, cor_secundaria: e.target.value }))} className="w-9 h-9 rounded-lg cursor-pointer border-2 border-border" />
                    <Input value={form.cor_secundaria} onChange={e => setForm(p => ({ ...p, cor_secundaria: e.target.value }))} className="h-9 font-mono text-[10px] flex-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Catalog */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Catálogo</CardTitle>
                  <CardDescription className="text-xs">Controle a vitrine</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Image className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Apenas com foto</p>
                    <p className="text-xs text-muted-foreground">Oculta produtos sem imagem</p>
                  </div>
                </div>
                <Switch checked={form.apenas_com_foto} onCheckedChange={v => setForm(p => ({ ...p, apenas_com_foto: v }))} />
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Entrega & Frete</CardTitle>
                  <CardDescription className="text-xs">Valores e promoções</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Taxa Padrão</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                    <Input type="number" value={form.taxa_entrega} onChange={e => setForm(p => ({ ...p, taxa_entrega: e.target.value }))} className="h-9 pl-9 text-sm" min="0" step="0.01" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Grátis acima de
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                    <Input type="number" value={form.frete_gratis_acima} onChange={e => setForm(p => ({ ...p, frete_gratis_acima: e.target.value }))} placeholder="—" className="h-9 pl-9 text-sm" min="0" step="0.01" />
                  </div>
                </div>
              </div>
              {form.frete_gratis_acima && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <Truck className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">Frete grátis acima de <strong>R$ {parseFloat(form.frete_gratis_acima).toFixed(2)}</strong></p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Contato & Redes</CardTitle>
                  <CardDescription className="text-xs">Canais de comunicação</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-500" /> WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1"><Instagram className="w-3 h-3 text-pink-500" /> Instagram</Label>
                  <Input value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@sualoja" className="h-9 text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Preview Google</CardTitle>
                  <CardDescription className="text-xs">Como sua loja aparece na busca</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-white dark:bg-muted/30 border space-y-1">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono truncate">
                  {lojaUrl || 'seusite.com/loja/slug'}
                </p>
                <p className="text-base text-blue-700 dark:text-blue-400 font-medium hover:underline cursor-pointer truncate">
                  {form.nome_loja || 'Nome da Loja'} — Loja Online
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {form.descricao || 'Adicione uma descrição para melhorar seu posicionamento nos resultados de busca do Google.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-4 space-y-3">
            {/* Device Toggle */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Preview ao Vivo</p>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted">
                <button 
                  onClick={() => setPreviewDevice('mobile')} 
                  className={`p-1.5 rounded-md transition-colors ${previewDevice === 'mobile' ? 'bg-card shadow-sm' : 'hover:bg-card/50'}`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-foreground" />
                </button>
                <button 
                  onClick={() => setPreviewDevice('desktop')} 
                  className={`p-1.5 rounded-md transition-colors ${previewDevice === 'desktop' ? 'bg-card shadow-sm' : 'hover:bg-card/50'}`}
                >
                  <Monitor className="w-3.5 h-3.5 text-foreground" />
                </button>
              </div>
            </div>

            {/* Phone Mockup */}
            <motion.div
              layout
              className={`mx-auto rounded-[2rem] border-[6px] border-gray-800 dark:border-gray-600 bg-white overflow-hidden shadow-2xl transition-all duration-300 ${previewDevice === 'mobile' ? 'w-[280px]' : 'w-full max-w-[400px]'}`}
              style={{ height: previewDevice === 'mobile' ? 520 : 440 }}
            >
              {/* Status Bar */}
              <div className="h-6 flex items-center justify-between px-4 bg-gray-800 dark:bg-gray-600">
                <span className="text-[8px] text-white/70">9:41</span>
                <div className="flex gap-1">
                  <div className="w-3 h-1.5 rounded-sm bg-white/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                </div>
              </div>

              {/* Header */}
              <div className="px-3 py-2.5 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${form.cor_primaria}15, ${form.cor_secundaria}10)` }}>
                <div className="flex items-center gap-2">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="" className="w-6 h-6 rounded object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: form.cor_primaria + '20' }}>
                      <Store className="w-3 h-3" style={{ color: form.cor_primaria }} />
                    </div>
                  )}
                  <span className="text-[11px] font-semibold tracking-wide" style={{ color: '#1a1a1a' }}>
                    {form.nome_loja?.toUpperCase() || 'SUA LOJA'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Search className="w-3.5 h-3.5" style={{ color: '#666' }} />
                  <Heart className="w-3.5 h-3.5" style={{ color: '#666' }} />
                  <ShoppingBag className="w-3.5 h-3.5" style={{ color: '#666' }} />
                </div>
              </div>

              {/* Hero Banner */}
              <div className="h-24 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${form.cor_primaria}, ${form.cor_secundaria})` }}>
                <div className="text-center">
                  <p className="text-white text-[10px] uppercase tracking-[0.15em] opacity-80">Nova Coleção</p>
                  <p className="text-white text-sm font-bold tracking-wide mt-0.5">{form.nome_loja || 'Sua Loja'}</p>
                  <div className="mt-1.5 px-3 py-0.5 bg-white/20 rounded-full">
                    <span className="text-white text-[8px] uppercase tracking-wider">Ver Coleção</span>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="flex gap-2 px-3 py-2 overflow-hidden">
                {['Todos', 'Anéis', 'Brincos', 'Colares'].map((cat, i) => (
                  <div 
                    key={cat}
                    className="px-2.5 py-0.5 rounded-full text-[8px] font-medium whitespace-nowrap border"
                    style={i === 0 ? { backgroundColor: form.cor_primaria, color: 'white', borderColor: form.cor_primaria } : { borderColor: '#e5e5e5', color: '#888' }}
                  >
                    {cat}
                  </div>
                ))}
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="rounded-lg overflow-hidden border border-gray-100">
                    <div className="h-20 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
                      <Package className="w-6 h-6 text-gray-300" />
                      <button className="absolute top-1 right-1">
                        <Heart className="w-3 h-3 text-gray-300" />
                      </button>
                    </div>
                    <div className="p-1.5">
                      <div className="h-1.5 w-16 bg-gray-200 rounded-full mb-1" />
                      <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: form.cor_primaria + '40' }} />
                      <p className="text-[9px] font-bold mt-1" style={{ color: form.cor_primaria }}>
                        R$ {(49.9 * n).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp Float */}
              {form.whatsapp && (
                <div className="absolute bottom-10 right-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Preview Note */}
            <p className="text-[10px] text-center text-muted-foreground">
              Pré-visualização ilustrativa · Altere as cores e veja em tempo real
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Save */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-4 z-10"
          >
            <div className="flex items-center justify-between p-4 rounded-xl border bg-card/95 backdrop-blur-sm shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-xs text-muted-foreground">Alterações não salvas</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { if (config) setForm({ slug: config.slug || '', nome_loja: config.nome_loja || '', logo_url: config.logo_url || '', cor_primaria: config.cor_primaria || '#B76E79', cor_secundaria: config.cor_secundaria || '#8B4F57', descricao: config.descricao || '', ativo: config.ativo || false, apenas_com_foto: config.apenas_com_foto || false, frete_gratis_acima: config.frete_gratis_acima?.toString() || '', taxa_entrega: config.taxa_entrega?.toString() || '0', whatsapp: config.whatsapp || '', instagram: config.instagram || '' }); }}>
                  Descartar
                </Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="sm" className="px-6">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Salvar</>}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasChanges && (
        <div className="flex items-center justify-center gap-2 py-3">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Todas as alterações salvas</p>
        </div>
      )}
    </div>
  );
}
