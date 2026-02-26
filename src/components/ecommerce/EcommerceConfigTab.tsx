import { useState, useEffect } from 'react';
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
import { 
  Store, Loader2, ExternalLink, Copy, Palette, Globe, Truck, 
  MessageCircle, Image, Eye, EyeOff, CheckCircle2, AlertCircle,
  Instagram, Phone, Link2, Settings2, Sparkles, ShieldCheck
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';

export function EcommerceConfigTab() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

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
      toast.success('Configurações da loja salvas com sucesso!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao salvar'),
  });

  const lojaUrl = form.slug ? `${window.location.origin}/loja/${form.slug}` : '';
  const hasChanges = config && (
    form.slug !== (config.slug || '') ||
    form.nome_loja !== (config.nome_loja || '') ||
    form.ativo !== (config.ativo || false)
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando configurações...</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Status Banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${form.ativo ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'}`}>
        {form.ativo ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Loja ativa e acessível ao público</p>
              {lojaUrl && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{lojaUrl}</p>}
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="h-8 text-xs border-emerald-300 dark:border-emerald-700" onClick={() => { navigator.clipboard.writeText(lojaUrl); toast.success('Link copiado!'); }}>
                <Copy className="w-3 h-3 mr-1" /> Copiar Link
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs border-emerald-300 dark:border-emerald-700" onClick={() => window.open(lojaUrl, '_blank')}>
                <ExternalLink className="w-3 h-3 mr-1" /> Visitar
              </Button>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Loja desativada</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Ative a loja para que seus clientes possam acessá-la</p>
            </div>
          </>
        )}
      </div>

      {/* Section 1: General */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Informações Gerais</CardTitle>
              <CardDescription className="text-xs">Nome, descrição e endereço da loja</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {form.ativo ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium text-foreground">Ativar Loja Virtual</p>
                <p className="text-xs text-muted-foreground">Sua loja ficará acessível ao público</p>
              </div>
            </div>
            <Switch checked={form.ativo} onCheckedChange={v => setForm(p => ({ ...p, ativo: v }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                Nome da Loja <span className="text-destructive">*</span>
              </Label>
              <Input value={form.nome_loja} onChange={e => setForm(p => ({ ...p, nome_loja: e.target.value }))} placeholder="Ex: Joias Elegance" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Slug da URL <span className="text-destructive">*</span>
              </Label>
              <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="joias-elegance" className="h-9 font-mono text-xs" />
              {lojaUrl && (
                <p className="text-[10px] text-muted-foreground font-mono truncate">{lojaUrl}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Descrição da Loja</Label>
            <Textarea 
              value={form.descricao} 
              onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} 
              placeholder="Conte sobre sua loja, produtos e diferenciais..." 
              rows={3} 
              className="text-sm resize-none"
            />
            <p className="text-[10px] text-muted-foreground">{form.descricao.length}/300 caracteres — Aparece na meta description (SEO)</p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Appearance */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Aparência</CardTitle>
              <CardDescription className="text-xs">Logo, cores e identidade visual da loja</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Image className="w-3 h-3" /> URL do Logo
            </Label>
            <Input value={form.logo_url} onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://exemplo.com/logo.png" className="h-9 text-sm" />
            {form.logo_url && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <img src={form.logo_url} alt="Logo preview" className="w-10 h-10 rounded-md object-contain bg-white border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <p className="text-[10px] text-muted-foreground">Pré-visualização do logo</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Cor Primária</Label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input 
                    type="color" 
                    value={form.cor_primaria} 
                    onChange={e => setForm(p => ({ ...p, cor_primaria: e.target.value }))} 
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border"
                  />
                </div>
                <Input value={form.cor_primaria} onChange={e => setForm(p => ({ ...p, cor_primaria: e.target.value }))} className="h-9 font-mono text-xs flex-1" />
              </div>
              <p className="text-[10px] text-muted-foreground">Usada em botões, links e destaques</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Cor Secundária</Label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input 
                    type="color" 
                    value={form.cor_secundaria} 
                    onChange={e => setForm(p => ({ ...p, cor_secundaria: e.target.value }))} 
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border"
                  />
                </div>
                <Input value={form.cor_secundaria} onChange={e => setForm(p => ({ ...p, cor_secundaria: e.target.value }))} className="h-9 font-mono text-xs flex-1" />
              </div>
              <p className="text-[10px] text-muted-foreground">Usada em gradientes e hover</p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="rounded-lg overflow-hidden border">
            <div className="h-16 flex items-center justify-center gap-3" style={{ background: `linear-gradient(135deg, ${form.cor_primaria}, ${form.cor_secundaria})` }}>
              <span className="text-white text-sm font-medium drop-shadow-sm">
                {form.nome_loja || 'Sua Loja'}
              </span>
            </div>
            <div className="flex h-6">
              <div className="flex-1" style={{ backgroundColor: form.cor_primaria }} />
              <div className="flex-1" style={{ backgroundColor: form.cor_secundaria }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Catalog Settings */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Catálogo</CardTitle>
              <CardDescription className="text-xs">Controle quais produtos aparecem na loja</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Image className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Exibir apenas produtos com foto</p>
                <p className="text-xs text-muted-foreground">Oculta produtos sem imagem na vitrine</p>
              </div>
            </div>
            <Switch checked={form.apenas_com_foto} onCheckedChange={v => setForm(p => ({ ...p, apenas_com_foto: v }))} />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Shipping */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Truck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Entrega & Frete</CardTitle>
              <CardDescription className="text-xs">Valores de frete e promoções de entrega</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Taxa de Entrega Padrão</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                <Input type="number" value={form.taxa_entrega} onChange={e => setForm(p => ({ ...p, taxa_entrega: e.target.value }))} placeholder="0,00" className="h-9 pl-9 text-sm" min="0" step="0.01" />
              </div>
              <p className="text-[10px] text-muted-foreground">Valor cobrado por pedido</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Frete Grátis acima de
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                <Input type="number" value={form.frete_gratis_acima} onChange={e => setForm(p => ({ ...p, frete_gratis_acima: e.target.value }))} placeholder="Sem limite" className="h-9 pl-9 text-sm" min="0" step="0.01" />
              </div>
              <p className="text-[10px] text-muted-foreground">Deixe vazio para não oferecer</p>
            </div>
          </div>
          {form.frete_gratis_acima && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <Truck className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Frete grátis para pedidos acima de <strong>R$ {parseFloat(form.frete_gratis_acima).toFixed(2)}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5: Contact & Social */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Contato & Redes Sociais</CardTitle>
              <CardDescription className="text-xs">Canais de comunicação exibidos na loja</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-500" /> WhatsApp
              </Label>
              <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" className="h-9 text-sm" />
              <p className="text-[10px] text-muted-foreground">Botão flutuante aparece na loja</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Instagram className="w-3 h-3 text-pink-500" /> Instagram
              </Label>
              <Input value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@sualoja" className="h-9 text-sm" />
              <p className="text-[10px] text-muted-foreground">Link exibido no rodapé da loja</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button - Sticky */}
      <div className="sticky bottom-4 z-10">
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card/95 backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {hasChanges ? 'Você possui alterações não salvas' : 'Todas as alterações salvas'}
            </p>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="sm" className="px-6">
            {saveMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Salvar Configurações</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
