import { useState, useEffect, useMemo } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Loader2, ExternalLink, Copy, Palette, Truck, 
  MessageCircle, Image, Eye, EyeOff, CheckCircle2, AlertCircle,
  Instagram, Phone, Link2, Settings2, Sparkles, ShieldCheck,
  QrCode, Search, ShoppingBag, Heart, Share2, BarChart3,
  Package, Users, TrendingUp, Monitor, Smartphone, Globe,
  Mail, FileText, Clock, CreditCard, Megaphone, Tag,
  LayoutGrid, Facebook, Shield, Star, BarChart, DollarSign,
  Type, Columns, MousePointer, Code, Layers, ImagePlus,
  Percent, Timer, BadgeCheck, Grid3X3, List, SlidersHorizontal, Plus,
  RefreshCw
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
  { name: 'Tiffany', primary: '#0abab5', secondary: '#088f8f' },
  { name: 'Bordeaux', primary: '#722f37', secondary: '#4a0e1c' },
];

const FONT_OPTIONS = [
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', style: 'Clássica & Elegante' },
  { value: 'Playfair Display', label: 'Playfair Display', style: 'Sofisticada' },
  { value: 'Lora', label: 'Lora', style: 'Editorial' },
  { value: 'Montserrat', label: 'Montserrat', style: 'Moderna' },
  { value: 'Raleway', label: 'Raleway', style: 'Clean & Leve' },
  { value: 'Josefin Sans', label: 'Josefin Sans', style: 'Minimalista' },
  { value: 'DM Serif Display', label: 'DM Serif Display', style: 'Impactante' },
];

const FONT_CORPO_OPTIONS = [
  { value: 'Inter', label: 'Inter', style: 'Moderna & Legível' },
  { value: 'Open Sans', label: 'Open Sans', style: 'Versátil' },
  { value: 'Lato', label: 'Lato', style: 'Equilibrada' },
  { value: 'Nunito', label: 'Nunito', style: 'Amigável' },
  { value: 'Source Sans 3', label: 'Source Sans', style: 'Profissional' },
];

const METODOS_PAGAMENTO = [
  { id: 'pix', label: 'PIX', icon: '💰' },
  { id: 'cartao', label: 'Cartão de Crédito', icon: '💳' },
  { id: 'boleto', label: 'Boleto', icon: '📄' },
  { id: 'transferencia', label: 'Transferência', icon: '🏦' },
  { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
];

const SELOS_OPCOES = [
  { id: 'compra_segura', label: 'Compra Segura', icon: '🔒' },
  { id: 'frete_gratis', label: 'Frete Grátis', icon: '🚚' },
  { id: 'garantia', label: 'Garantia', icon: '✅' },
  { id: 'troca_facil', label: 'Troca Fácil', icon: '🔄' },
  { id: 'satisfacao', label: 'Satisfação Garantida', icon: '⭐' },
  { id: 'parcelamento', label: 'Parcelamento s/ juros', icon: '💳' },
  { id: 'envio_rapido', label: 'Envio Rápido', icon: '⚡' },
  { id: 'suporte_24h', label: 'Suporte 24h', icon: '🎧' },
];

const BADGES_PRODUTO_OPCOES = [
  { id: 'novo', label: 'Novo', color: '#10B981' },
  { id: 'mais_vendido', label: 'Mais Vendido', color: '#F59E0B' },
  { id: 'exclusivo', label: 'Exclusivo', color: '#8B5CF6' },
  { id: 'destaque', label: 'Destaque', color: '#EF4444' },
  { id: 'ultima_peca', label: 'Última Peça', color: '#F97316' },
  { id: 'lancamento', label: 'Lançamento', color: '#06B6D4' },
];

const DIAS_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const DIAS_LABELS: Record<string, string> = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' };

export function EcommerceConfigTab() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('mobile');
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');

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
    banner_texto: '',
    banner_ativo: false,
    banner_cor: '#B76E79',
    banner_url: '',
    banner_link: '',
    banner_posicao: 'topo',
    email_contato: '',
    facebook: '',
    politica_troca: '',
    politica_privacidade: '',
    pedido_minimo: '',
    mostrar_preco_original: true,
    avaliacoes_ativas: false,
    metodos_pagamento: ['pix', 'cartao', 'boleto'] as string[],
    horario_funcionamento: {} as Record<string, { aberto: boolean; inicio: string; fim: string }>,
    mensagem_whatsapp: 'Olá! Vi sua loja e gostaria de mais informações.',
    mostrar_estoque: false,
    produtos_por_pagina: '12',
    fonte_titulos: 'Cormorant Garamond',
    fonte_corpo: 'Inter',
    layout_produtos: 'grid',
    colunas_desktop: '4',
    colunas_mobile: '2',
    mostrar_busca: true,
    mostrar_categorias: true,
    mostrar_filtros: true,
    mostrar_ordenacao: true,
    mostrar_whatsapp_float: true,
    whatsapp_posicao: 'direita',
    selos_confianca: [] as string[],
    texto_rodape: '',
    google_analytics_id: '',
    facebook_pixel_id: '',
    css_personalizado: '',
    hero_titulo: '',
    hero_subtitulo: '',
    hero_cta_texto: 'Ver Coleção',
    hero_cta_link: '',
    hero_imagem_url: '',
    hero_overlay_opacity: '0.4',
    parcelamento_max: '12',
    mostrar_parcelamento: true,
    tempo_estimado_entrega: '',
    cep_origem: '',
    badges_produto: [] as string[],
    mercadopago_access_token: '',
    mercadopago_public_key: '',
    pix_chave: '',
    pix_nome: '',
    pix_tipo: 'cpf',
    pix_cidade: 'SAO PAULO',
    // Marketing fields
    banners_carousel: [] as any[],
    countdown_ativo: false,
    countdown_titulo: '',
    countdown_subtitulo: '',
    countdown_data_fim: '',
    popup_ativo: false,
    popup_titulo: '',
    popup_texto: '',
    popup_imagem_url: '',
    popup_cupom: '',
    popup_delay_segundos: '5',
    lookbook_ativo: false,
    lookbook_titulo: '',
    lookbook_imagens: [] as any[],
    colecoes_destaque: [] as any[],
    // Rodapé columns
    rodape_coluna1_titulo: '',
    rodape_coluna1_links: [] as { label: string; url: string }[],
    rodape_coluna2_titulo: '',
    rodape_coluna2_links: [] as { label: string; url: string }[],
    rodape_endereco: '',
    rodape_exibir_mapa: false,
  });
  const [showMpToken, setShowMpToken] = useState(false);

  useEffect(() => {
    if (config) {
      const horario = config.horario_funcionamento || {};
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
        banner_texto: config.banner_texto || '',
        banner_ativo: config.banner_ativo || false,
        banner_cor: config.banner_cor || '#B76E79',
        banner_url: config.banner_url || '',
        banner_link: config.banner_link || '',
        banner_posicao: config.banner_posicao || 'topo',
        email_contato: config.email_contato || '',
        facebook: config.facebook || '',
        politica_troca: config.politica_troca || '',
        politica_privacidade: config.politica_privacidade || '',
        pedido_minimo: config.pedido_minimo?.toString() || '',
        mostrar_preco_original: config.mostrar_preco_original !== false,
        avaliacoes_ativas: config.avaliacoes_ativas || false,
        metodos_pagamento: config.metodos_pagamento || ['pix', 'cartao', 'boleto'],
        horario_funcionamento: horario,
        mensagem_whatsapp: config.mensagem_whatsapp || 'Olá! Vi sua loja e gostaria de mais informações.',
        mostrar_estoque: config.mostrar_estoque || false,
        produtos_por_pagina: config.produtos_por_pagina?.toString() || '12',
        fonte_titulos: config.fonte_titulos || 'Cormorant Garamond',
        fonte_corpo: config.fonte_corpo || 'Inter',
        layout_produtos: config.layout_produtos || 'grid',
        colunas_desktop: config.colunas_desktop?.toString() || '4',
        colunas_mobile: config.colunas_mobile?.toString() || '2',
        mostrar_busca: config.mostrar_busca !== false,
        mostrar_categorias: config.mostrar_categorias !== false,
        mostrar_filtros: config.mostrar_filtros !== false,
        mostrar_ordenacao: config.mostrar_ordenacao !== false,
        mostrar_whatsapp_float: config.mostrar_whatsapp_float !== false,
        whatsapp_posicao: config.whatsapp_posicao || 'direita',
        selos_confianca: config.selos_confianca || [],
        texto_rodape: config.texto_rodape || '',
        google_analytics_id: config.google_analytics_id || '',
        facebook_pixel_id: config.facebook_pixel_id || '',
        css_personalizado: config.css_personalizado || '',
        hero_titulo: config.hero_titulo || '',
        hero_subtitulo: config.hero_subtitulo || '',
        hero_cta_texto: config.hero_cta_texto || 'Ver Coleção',
        hero_cta_link: config.hero_cta_link || '',
        hero_imagem_url: config.hero_imagem_url || '',
        hero_overlay_opacity: config.hero_overlay_opacity?.toString() || '0.4',
        parcelamento_max: config.parcelamento_max?.toString() || '12',
        mostrar_parcelamento: config.mostrar_parcelamento !== false,
        tempo_estimado_entrega: config.tempo_estimado_entrega || '',
        cep_origem: config.cep_origem || '',
        badges_produto: config.badges_produto || [],
        mercadopago_access_token: config.mercadopago_access_token || '',
        mercadopago_public_key: config.mercadopago_public_key || '',
        pix_chave: config.pix_chave || '',
        pix_nome: config.pix_nome || '',
        pix_tipo: config.pix_tipo || 'cpf',
        pix_cidade: config.pix_cidade || 'SAO PAULO',
        // Marketing
        banners_carousel: config.banners_carousel || [],
        countdown_ativo: config.countdown_ativo || false,
        countdown_titulo: config.countdown_titulo || '',
        countdown_subtitulo: config.countdown_subtitulo || '',
        countdown_data_fim: config.countdown_data_fim || '',
        popup_ativo: config.popup_ativo || false,
        popup_titulo: config.popup_titulo || '',
        popup_texto: config.popup_texto || '',
        popup_imagem_url: config.popup_imagem_url || '',
        popup_cupom: config.popup_cupom || '',
        popup_delay_segundos: config.popup_delay_segundos?.toString() || '5',
        lookbook_ativo: config.lookbook_ativo || false,
        lookbook_titulo: config.lookbook_titulo || '',
        lookbook_imagens: config.lookbook_imagens || [],
        colecoes_destaque: config.colecoes_destaque || [],
        // Rodapé columns
        rodape_coluna1_titulo: config.rodape_coluna1_titulo || '',
        rodape_coluna1_links: config.rodape_coluna1_links || [],
        rodape_coluna2_titulo: config.rodape_coluna2_titulo || '',
        rodape_coluna2_links: config.rodape_coluna2_links || [],
        rodape_endereco: config.rodape_endereco || '',
        rodape_exibir_mapa: config.rodape_exibir_mapa || false,
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
        banner_texto: form.banner_texto || null,
        banner_ativo: form.banner_ativo,
        banner_cor: form.banner_cor,
        banner_url: form.banner_url || null,
        banner_link: form.banner_link || null,
        banner_posicao: form.banner_posicao,
        email_contato: form.email_contato || null,
        facebook: form.facebook || null,
        politica_troca: form.politica_troca || null,
        politica_privacidade: form.politica_privacidade || null,
        pedido_minimo: form.pedido_minimo ? parseFloat(form.pedido_minimo) : null,
        mostrar_preco_original: form.mostrar_preco_original,
        avaliacoes_ativas: form.avaliacoes_ativas,
        metodos_pagamento: form.metodos_pagamento,
        horario_funcionamento: Object.keys(form.horario_funcionamento).length > 0 ? form.horario_funcionamento : null,
        mensagem_whatsapp: form.mensagem_whatsapp || null,
        mostrar_estoque: form.mostrar_estoque,
        produtos_por_pagina: parseInt(form.produtos_por_pagina) || 12,
        fonte_titulos: form.fonte_titulos,
        fonte_corpo: form.fonte_corpo,
        layout_produtos: form.layout_produtos,
        colunas_desktop: parseInt(form.colunas_desktop) || 4,
        colunas_mobile: parseInt(form.colunas_mobile) || 2,
        mostrar_busca: form.mostrar_busca,
        mostrar_categorias: form.mostrar_categorias,
        mostrar_filtros: form.mostrar_filtros,
        mostrar_ordenacao: form.mostrar_ordenacao,
        mostrar_whatsapp_float: form.mostrar_whatsapp_float,
        whatsapp_posicao: form.whatsapp_posicao,
        selos_confianca: form.selos_confianca,
        texto_rodape: form.texto_rodape || null,
        google_analytics_id: form.google_analytics_id || null,
        facebook_pixel_id: form.facebook_pixel_id || null,
        css_personalizado: form.css_personalizado || null,
        hero_titulo: form.hero_titulo || null,
        hero_subtitulo: form.hero_subtitulo || null,
        hero_cta_texto: form.hero_cta_texto || 'Ver Coleção',
        hero_cta_link: form.hero_cta_link || null,
        hero_imagem_url: form.hero_imagem_url || null,
        hero_overlay_opacity: parseFloat(form.hero_overlay_opacity) || 0.4,
        parcelamento_max: parseInt(form.parcelamento_max) || 12,
        mostrar_parcelamento: form.mostrar_parcelamento,
        tempo_estimado_entrega: form.tempo_estimado_entrega || null,
        cep_origem: form.cep_origem || null,
        badges_produto: form.badges_produto,
        mercadopago_access_token: form.mercadopago_access_token || null,
        mercadopago_public_key: form.mercadopago_public_key || null,
        pix_chave: form.pix_chave || null,
        pix_nome: form.pix_nome || null,
        pix_tipo: form.pix_tipo || 'cpf',
        pix_cidade: form.pix_cidade || 'SAO PAULO',
        // Marketing
        banners_carousel: form.banners_carousel,
        countdown_ativo: form.countdown_ativo,
        countdown_titulo: form.countdown_titulo || null,
        countdown_subtitulo: form.countdown_subtitulo || null,
        countdown_data_fim: form.countdown_data_fim || null,
        popup_ativo: form.popup_ativo,
        popup_titulo: form.popup_titulo || null,
        popup_texto: form.popup_texto || null,
        popup_imagem_url: form.popup_imagem_url || null,
        popup_cupom: form.popup_cupom || null,
        popup_delay_segundos: parseInt(form.popup_delay_segundos) || 5,
        lookbook_ativo: form.lookbook_ativo,
        lookbook_titulo: form.lookbook_titulo || null,
        lookbook_imagens: form.lookbook_imagens,
        colecoes_destaque: form.colecoes_destaque,
        // Rodapé columns
        rodape_coluna1_titulo: form.rodape_coluna1_titulo || null,
        rodape_coluna1_links: form.rodape_coluna1_links.length > 0 ? form.rodape_coluna1_links : null,
        rodape_coluna2_titulo: form.rodape_coluna2_titulo || null,
        rodape_coluna2_links: form.rodape_coluna2_links.length > 0 ? form.rodape_coluna2_links : null,
        rodape_endereco: form.rodape_endereco || null,
        rodape_exibir_mapa: form.rodape_exibir_mapa,
      };

      if (config?.id) {
        const { error } = await supabase.from('ecommerce_config' as any).update(payload).eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ecommerce_config' as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-config'] });
      toast.success('Configurações salvas!');
      // Auto-reload the live preview iframe
      setTimeout(() => {
        const iframe = document.getElementById('store-preview-iframe') as HTMLIFrameElement;
        if (iframe) iframe.src = iframe.src;
      }, 500);
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao salvar'),
  });

  const lojaUrl = form.slug ? `${window.location.origin}/loja/${form.slug}` : '';

  const hasChanges = useMemo(() => {
    if (!config) return Object.values(form).some(v => v !== '' && v !== false && v !== '#B76E79' && v !== '#8B4F57' && v !== '0' && v !== '12');
    return true; // Simplified - always allow save
  }, [form, config]);

  const toggleMetodoPagamento = (id: string) => {
    setForm(p => ({
      ...p,
      metodos_pagamento: p.metodos_pagamento.includes(id) ? p.metodos_pagamento.filter(m => m !== id) : [...p.metodos_pagamento, id]
    }));
  };

  const toggleSelo = (id: string) => {
    setForm(p => ({
      ...p,
      selos_confianca: p.selos_confianca.includes(id) ? p.selos_confianca.filter(s => s !== id) : [...p.selos_confianca, id]
    }));
  };

  const toggleBadge = (id: string) => {
    setForm(p => ({
      ...p,
      badges_produto: p.badges_produto.includes(id) ? p.badges_produto.filter(b => b !== id) : [...p.badges_produto, id]
    }));
  };

  const updateHorario = (dia: string, field: string, value: any) => {
    setForm(p => ({
      ...p,
      horario_funcionamento: {
        ...p.horario_funcionamento,
        [dia]: { aberto: true, inicio: '09:00', fim: '18:00', ...p.horario_funcionamento[dia], [field]: value }
      }
    }));
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando configurações...</p>
    </div>
  );

  const SectionCard = ({ icon: Icon, title, description, children, iconColor = 'text-primary' }: { icon: any; title: string; description: string; children: React.ReactNode; iconColor?: string }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className={`w-4 h-4 ${iconColor}`} /></div>
          <div><CardTitle className="text-base">{title}</CardTitle><CardDescription className="text-xs">{description}</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );

  const ToggleRow = ({ icon: Icon, title, description, checked, onChange, iconColor }: { icon: any; title: string; description: string; checked: boolean; onChange: (v: boolean) => void; iconColor?: string }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${iconColor || 'text-muted-foreground'}`} />
        <div><p className="text-sm font-medium text-foreground">{title}</p><p className="text-xs text-muted-foreground">{description}</p></div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
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
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <stat.icon className={`w-5 h-5 ${stat.color} flex-shrink-0`} />
              <div className="min-w-0"><p className="text-xs text-muted-foreground">{stat.label}</p><p className="text-sm font-semibold text-foreground truncate">{stat.value}</p></div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Status Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${form.ativo ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'}`}>
        {form.ativo ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Loja ativa e acessível</p>
              {lojaUrl && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">{lojaUrl}</p>}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { navigator.clipboard.writeText(lojaUrl); toast.success('Link copiado!'); }}><Copy className="w-3 h-3 mr-1" /> Copiar</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowQR(!showQR)}><QrCode className="w-3 h-3 mr-1" /> QR</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(lojaUrl, '_blank')}><ExternalLink className="w-3 h-3 mr-1" /> Abrir</Button>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1"><p className="text-sm font-medium text-amber-800 dark:text-amber-300">Loja desativada</p><p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Ative para que clientes possam acessar</p></div>
            <Button size="sm" className="h-8 text-xs" onClick={() => setForm(p => ({ ...p, ativo: true }))}>Ativar Agora</Button>
          </>
        )}
      </motion.div>

      {/* QR Code */}
      <AnimatePresence>
        {showQR && lojaUrl && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="border-dashed">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <p className="text-sm font-medium text-foreground">QR Code da Loja</p>
                <div className="p-4 bg-white rounded-xl shadow-sm"><QRCodeSVG value={lojaUrl} size={180} fgColor={form.cor_primaria} /></div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">Imprima ou compartilhe para seus clientes acessarem a loja</p>
                <Button variant="outline" size="sm" onClick={() => setShowQR(false)}>Fechar</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Mode Toggle */}
      <div className="flex items-center gap-3 p-3 rounded-xl border bg-card/80">
        <div className="flex items-center gap-2 flex-1">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground">Preview ao Vivo</span>
          <span className="text-[10px] text-muted-foreground">— Veja sua loja em tempo real enquanto edita</span>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted">
          <button onClick={() => setPreviewDevice('mobile')} className={`p-1.5 rounded-md transition-colors ${previewDevice === 'mobile' ? 'bg-card shadow-sm' : 'hover:bg-card/50'}`}><Smartphone className="w-3.5 h-3.5 text-foreground" /></button>
          <button onClick={() => setPreviewDevice('desktop')} className={`p-1.5 rounded-md transition-colors ${previewDevice === 'desktop' ? 'bg-card shadow-sm' : 'hover:bg-card/50'}`}><Monitor className="w-3.5 h-3.5 text-foreground" /></button>
        </div>
        {lojaUrl && (
          <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => window.open(lojaUrl, '_blank')}>
            <ExternalLink className="w-3 h-3" /> Abrir Loja
          </Button>
        )}
      </div>

      {/* Main Layout - Split View */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" style={{ minHeight: '75vh' }}>
        {/* Left: Config Forms */}
        <div className="space-y-4 overflow-y-auto max-h-[80vh] pr-1 scrollbar-thin">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="geral" className="text-xs gap-1"><Store className="w-3 h-3" /> Geral</TabsTrigger>
              <TabsTrigger value="aparencia" className="text-xs gap-1"><Palette className="w-3 h-3" /> Visual</TabsTrigger>
              <TabsTrigger value="hero" className="text-xs gap-1"><ImagePlus className="w-3 h-3" /> Hero</TabsTrigger>
              <TabsTrigger value="marketing" className="text-xs gap-1"><Megaphone className="w-3 h-3" /> Marketing</TabsTrigger>
              <TabsTrigger value="vendas" className="text-xs gap-1"><CreditCard className="w-3 h-3" /> Vendas</TabsTrigger>
              <TabsTrigger value="avancado" className="text-xs gap-1"><Settings2 className="w-3 h-3" /> Avançado</TabsTrigger>
              <TabsTrigger value="politicas" className="text-xs gap-1"><Shield className="w-3 h-3" /> Legal</TabsTrigger>
            </TabsList>

            {/* TAB: Geral */}
            <TabsContent value="geral" className="space-y-5">
              <SectionCard icon={Store} title="Informações Gerais" description="Nome, descrição e endereço da loja">
                <ToggleRow icon={form.ativo ? Eye : EyeOff} title="Ativar Loja" description="Visível ao público" checked={form.ativo} onChange={v => setForm(p => ({ ...p, ativo: v }))} iconColor={form.ativo ? 'text-emerald-500' : undefined} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nome da Loja <span className="text-destructive">*</span></Label>
                    <Input value={form.nome_loja} onChange={e => setForm(p => ({ ...p, nome_loja: e.target.value }))} placeholder="Ex: Joias Elegance" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1"><Link2 className="w-3 h-3" /> Slug <span className="text-destructive">*</span></Label>
                    <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="joias-elegance" className="h-9 font-mono text-xs" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Descrição</Label>
                  <Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Sobre sua loja..." rows={2} className="text-sm resize-none" />
                  <p className="text-[10px] text-muted-foreground">{form.descricao.length}/300 · Aparece no Google (SEO)</p>
                </div>
              </SectionCard>

              <SectionCard icon={MessageCircle} title="Contato & Redes Sociais" description="Canais de comunicação com o cliente">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-500" /> WhatsApp</Label>
                    <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1"><Mail className="w-3 h-3 text-blue-500" /> E-mail</Label>
                    <Input value={form.email_contato} onChange={e => setForm(p => ({ ...p, email_contato: e.target.value }))} placeholder="contato@loja.com" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1"><Instagram className="w-3 h-3 text-pink-500" /> Instagram</Label>
                    <Input value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@sualoja" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1"><Facebook className="w-3 h-3 text-blue-600" /> Facebook</Label>
                    <Input value={form.facebook} onChange={e => setForm(p => ({ ...p, facebook: e.target.value }))} placeholder="facebook.com/sualoja" className="h-9 text-sm" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Mensagem padrão do WhatsApp</Label>
                  <Textarea value={form.mensagem_whatsapp} onChange={e => setForm(p => ({ ...p, mensagem_whatsapp: e.target.value }))} rows={2} className="text-sm resize-none" />
                </div>
                <ToggleRow icon={Phone} title="Botão WhatsApp flutuante" description="Exibe botão fixo para contato rápido" checked={form.mostrar_whatsapp_float} onChange={v => setForm(p => ({ ...p, mostrar_whatsapp_float: v }))} iconColor="text-emerald-500" />
                {form.mostrar_whatsapp_float && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Posição do botão</Label>
                    <Select value={form.whatsapp_posicao} onValueChange={v => setForm(p => ({ ...p, whatsapp_posicao: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direita">Canto inferior direito</SelectItem>
                        <SelectItem value="esquerda">Canto inferior esquerdo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </SectionCard>

              <SectionCard icon={Clock} title="Horário de Funcionamento" description="Informe seus clientes quando você atende">
                {DIAS_SEMANA.map(dia => {
                  const horario = form.horario_funcionamento[dia] || { aberto: false, inicio: '09:00', fim: '18:00' };
                  return (
                    <div key={dia} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Switch checked={horario.aberto} onCheckedChange={v => updateHorario(dia, 'aberto', v)} className="scale-75" />
                      <span className={`text-xs font-medium w-16 ${horario.aberto ? 'text-foreground' : 'text-muted-foreground'}`}>{DIAS_LABELS[dia]}</span>
                      {horario.aberto ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input type="time" value={horario.inicio} onChange={e => updateHorario(dia, 'inicio', e.target.value)} className="h-7 text-xs w-24" />
                          <span className="text-xs text-muted-foreground">até</span>
                          <Input type="time" value={horario.fim} onChange={e => updateHorario(dia, 'fim', e.target.value)} className="h-7 text-xs w-24" />
                        </div>
                      ) : <span className="text-xs text-muted-foreground italic">Fechado</span>}
                    </div>
                  );
                })}
              </SectionCard>

              {/* SEO Preview */}
              <SectionCard icon={Globe} title="Preview Google (SEO)" description="Como sua loja aparece na busca">
                <div className="p-4 rounded-lg bg-white dark:bg-muted/30 border space-y-1">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono truncate">{lojaUrl || 'seusite.com/loja/slug'}</p>
                  <p className="text-base text-blue-700 dark:text-blue-400 font-medium hover:underline cursor-pointer truncate">{form.nome_loja || 'Nome da Loja'} — Loja Online</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{form.descricao || 'Adicione uma descrição para melhorar seu posicionamento nos resultados de busca.'}</p>
                </div>
              </SectionCard>
            </TabsContent>

            {/* TAB: Aparência */}
            <TabsContent value="aparencia" className="space-y-5">
              <SectionCard icon={Image} title="Logo & Identidade" description="Imagem e cores da sua marca">
                <ImageUpload value={form.logo_url} onChange={(url) => setForm(p => ({ ...p, logo_url: url }))} label="Logo da Loja" />
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Temas Prontos</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button key={preset.name} onClick={() => setForm(p => ({ ...p, cor_primaria: preset.primary, cor_secundaria: preset.secondary }))}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-medium transition-all hover:scale-105 ${form.cor_primaria === preset.primary ? 'ring-2 ring-primary ring-offset-1' : 'hover:border-primary/50'}`}>
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
              </SectionCard>

              {/* Tipografia */}
              <SectionCard icon={Type} title="Tipografia" description="Fontes para títulos e textos">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Fonte dos Títulos</Label>
                    <Select value={form.fonte_titulos} onValueChange={v => setForm(p => ({ ...p, fonte_titulos: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(f => (
                          <SelectItem key={f.value} value={f.value}>
                            <span style={{ fontFamily: f.value }}>{f.label}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">({f.style})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Fonte do Corpo</Label>
                    <Select value={form.fonte_corpo} onValueChange={v => setForm(p => ({ ...p, fonte_corpo: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_CORPO_OPTIONS.map(f => (
                          <SelectItem key={f.value} value={f.value}>
                            <span style={{ fontFamily: f.value }}>{f.label}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">({f.style})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Preview */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-lg font-semibold mb-1" style={{ fontFamily: form.fonte_titulos }}>Título da Sua Loja</p>
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: form.fonte_corpo }}>Este é um exemplo de texto do corpo usando a fonte selecionada. Ideal para descrições de produtos.</p>
                </div>
              </SectionCard>

              {/* Banner de Anúncios */}
              <SectionCard icon={Megaphone} title="Banner de Anúncio" description="Barra superior com promoções e avisos">
                <ToggleRow icon={Megaphone} title="Ativar Banner" description="Exibe barra no topo da loja" checked={form.banner_ativo} onChange={v => setForm(p => ({ ...p, banner_ativo: v }))} />
                {form.banner_ativo && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Texto do Banner</Label>
                      <Input value={form.banner_texto} onChange={e => setForm(p => ({ ...p, banner_texto: e.target.value }))} placeholder="🔥 Frete grátis acima de R$ 200!" className="h-9 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Cor do Banner</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={form.banner_cor} onChange={e => setForm(p => ({ ...p, banner_cor: e.target.value }))} className="w-9 h-9 rounded-lg cursor-pointer border-2 border-border" />
                          <Input value={form.banner_cor} onChange={e => setForm(p => ({ ...p, banner_cor: e.target.value }))} className="h-9 font-mono text-[10px] flex-1" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Link (opcional)</Label>
                        <Input value={form.banner_link} onChange={e => setForm(p => ({ ...p, banner_link: e.target.value }))} placeholder="https://..." className="h-9 text-sm" />
                      </div>
                    </div>
                    <div className="rounded-lg overflow-hidden border">
                      <div className="py-2 px-4 text-center text-xs font-medium text-white" style={{ backgroundColor: form.banner_cor }}>
                        {form.banner_texto || 'Texto do banner aparecerá aqui'}
                      </div>
                    </div>
                  </>
                )}
              </SectionCard>

              {/* Catálogo & Exibição */}
              <SectionCard icon={LayoutGrid} title="Catálogo & Exibição" description="Controle como os produtos aparecem">
                <ToggleRow icon={Image} title="Apenas com foto" description="Oculta produtos sem imagem" checked={form.apenas_com_foto} onChange={v => setForm(p => ({ ...p, apenas_com_foto: v }))} />
                <ToggleRow icon={Tag} title="Mostrar preço original" description="Exibe preço riscado em promoções" checked={form.mostrar_preco_original} onChange={v => setForm(p => ({ ...p, mostrar_preco_original: v }))} />
                <ToggleRow icon={Package} title="Mostrar estoque" description="Exibe quantidade disponível" checked={form.mostrar_estoque} onChange={v => setForm(p => ({ ...p, mostrar_estoque: v }))} />
                <ToggleRow icon={Star} title="Avaliações de clientes" description="Permite reviews nos produtos" checked={form.avaliacoes_ativas} onChange={v => setForm(p => ({ ...p, avaliacoes_ativas: v }))} />
                <ToggleRow icon={Search} title="Barra de busca" description="Permite buscar produtos por nome" checked={form.mostrar_busca} onChange={v => setForm(p => ({ ...p, mostrar_busca: v }))} />
                <ToggleRow icon={Layers} title="Filtro por categorias" description="Menu de categorias no topo" checked={form.mostrar_categorias} onChange={v => setForm(p => ({ ...p, mostrar_categorias: v }))} />
                <ToggleRow icon={SlidersHorizontal} title="Filtros avançados" description="Filtro por preço, material etc." checked={form.mostrar_filtros} onChange={v => setForm(p => ({ ...p, mostrar_filtros: v }))} />
                <ToggleRow icon={BarChart} title="Ordenação" description="Permite ordenar por preço, nome etc." checked={form.mostrar_ordenacao} onChange={v => setForm(p => ({ ...p, mostrar_ordenacao: v }))} />
                <ToggleRow icon={Percent} title="Mostrar parcelamento" description="Exibe parcelas no produto" checked={form.mostrar_parcelamento} onChange={v => setForm(p => ({ ...p, mostrar_parcelamento: v }))} />

                <Separator />
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Produtos/página</Label>
                    <Select value={form.produtos_por_pagina} onValueChange={v => setForm(p => ({ ...p, produtos_por_pagina: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{['8', '12', '16', '20', '24', '32'].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Colunas Desktop</Label>
                    <Select value={form.colunas_desktop} onValueChange={v => setForm(p => ({ ...p, colunas_desktop: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{['2', '3', '4', '5'].map(n => <SelectItem key={n} value={n}>{n} colunas</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Colunas Mobile</Label>
                    <Select value={form.colunas_mobile} onValueChange={v => setForm(p => ({ ...p, colunas_mobile: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{['1', '2', '3'].map(n => <SelectItem key={n} value={n}>{n} coluna(s)</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {form.mostrar_parcelamento && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Máximo de parcelas</Label>
                    <Select value={form.parcelamento_max} onValueChange={v => setForm(p => ({ ...p, parcelamento_max: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{['3', '6', '10', '12'].map(n => <SelectItem key={n} value={n}>{n}x sem juros</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </SectionCard>

              {/* Badges de Produto */}
              <SectionCard icon={BadgeCheck} title="Badges de Produto" description="Selos automáticos nos produtos">
                <div className="flex flex-wrap gap-2">
                  {BADGES_PRODUTO_OPCOES.map(badge => (
                    <button key={badge.id} onClick={() => toggleBadge(badge.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${form.badges_produto.includes(badge.id) ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
                      style={form.badges_produto.includes(badge.id) ? { backgroundColor: badge.color + '20', borderColor: badge.color, color: badge.color, ['--tw-ring-color' as string]: badge.color } : {}}>
                      {badge.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">{form.badges_produto.length} badge(s) ativo(s) · Aparece nos cards de produto</p>
              </SectionCard>
            </TabsContent>

            {/* TAB: Hero Banner */}
            <TabsContent value="hero" className="space-y-5">
              <SectionCard icon={ImagePlus} title="Hero Banner Principal" description="Imagem destaque no topo da loja">
                <ImageUpload value={form.hero_imagem_url} onChange={(url) => setForm(p => ({ ...p, hero_imagem_url: url }))} label="Imagem do Hero" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Título Principal</Label>
                    <Input value={form.hero_titulo} onChange={e => setForm(p => ({ ...p, hero_titulo: e.target.value }))} placeholder="Nova Coleção 2025" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Subtítulo</Label>
                    <Input value={form.hero_subtitulo} onChange={e => setForm(p => ({ ...p, hero_subtitulo: e.target.value }))} placeholder="Peças exclusivas com até 30% OFF" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Texto do Botão (CTA)</Label>
                    <Input value={form.hero_cta_texto} onChange={e => setForm(p => ({ ...p, hero_cta_texto: e.target.value }))} placeholder="Ver Coleção" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Link do Botão</Label>
                    <Input value={form.hero_cta_link} onChange={e => setForm(p => ({ ...p, hero_cta_link: e.target.value }))} placeholder="#produtos ou URL" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Opacidade do Overlay ({Math.round(parseFloat(form.hero_overlay_opacity) * 100)}%)</Label>
                  <input type="range" min="0" max="1" step="0.05" value={form.hero_overlay_opacity} onChange={e => setForm(p => ({ ...p, hero_overlay_opacity: e.target.value }))} className="w-full accent-primary" />
                  <p className="text-[10px] text-muted-foreground">Controla a escuridão sobre a imagem de fundo</p>
                </div>

                {/* Hero Preview */}
                <div className="rounded-lg overflow-hidden border relative" style={{ height: 160 }}>
                  {form.hero_imagem_url ? (
                    <img src={form.hero_imagem_url} alt="Hero" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${form.cor_primaria}, ${form.cor_secundaria})` }} />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4" style={{ backgroundColor: `rgba(0,0,0,${form.hero_overlay_opacity})` }}>
                    <p className="text-white text-sm font-bold" style={{ fontFamily: form.fonte_titulos }}>{form.hero_titulo || form.nome_loja || 'Sua Loja'}</p>
                    {form.hero_subtitulo && <p className="text-white/80 text-xs mt-1" style={{ fontFamily: form.fonte_corpo }}>{form.hero_subtitulo}</p>}
                    <div className="mt-2 px-4 py-1 bg-white/20 rounded-full border border-white/30">
                      <span className="text-white text-[10px] font-medium">{form.hero_cta_texto || 'Ver Coleção'}</span>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Banner Imagem */}
              <SectionCard icon={Image} title="Banner Secundário (Imagem)" description="Banner adicional com imagem personalizada">
                <ImageUpload value={form.banner_url} onChange={(url) => setForm(p => ({ ...p, banner_url: url }))} label="Imagem do Banner" />
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Link de destino</Label>
                  <Input value={form.banner_link} onChange={e => setForm(p => ({ ...p, banner_link: e.target.value }))} placeholder="https://... ou #secao" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Posição do Banner</Label>
                  <Select value={form.banner_posicao} onValueChange={v => setForm(p => ({ ...p, banner_posicao: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="topo">Abaixo do Hero</SelectItem>
                      <SelectItem value="meio">No meio dos produtos</SelectItem>
                      <SelectItem value="rodape">Acima do rodapé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SectionCard>

              {/* Selos de Confiança */}
              <SectionCard icon={BadgeCheck} title="Selos de Confiança" description="Exibidos na barra de benefícios">
                <div className="grid grid-cols-2 gap-2">
                  {SELOS_OPCOES.map(selo => (
                    <button key={selo.id} onClick={() => toggleSelo(selo.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${form.selos_confianca.includes(selo.id) ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:border-primary/40'}`}>
                      <span className="text-base">{selo.icon}</span>
                      <span className="text-xs font-medium text-foreground">{selo.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">{form.selos_confianca.length} selo(s) ativo(s) · Exibidos abaixo do Hero</p>
              </SectionCard>
            </TabsContent>

            {/* TAB: Marketing */}
            <TabsContent value="marketing" className="space-y-5">
              {/* Banners Carousel */}
              <SectionCard icon={Layers} title="Banners Carousel" description="Banners rotativos no topo da loja">
                {form.banners_carousel.map((banner: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-2 relative">
                    <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0 text-destructive" onClick={() => setForm(p => ({ ...p, banners_carousel: p.banners_carousel.filter((_: any, i: number) => i !== idx) }))}>×</Button>
                    <p className="text-xs font-medium text-muted-foreground">Banner {idx + 1}</p>
                    <ImageUpload value={banner.image || ''} onChange={(url) => { const arr = [...form.banners_carousel]; arr[idx] = { ...arr[idx], image: url }; setForm(p => ({ ...p, banners_carousel: arr })); }} label="Imagem" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Título" value={banner.title || ''} onChange={e => { const arr = [...form.banners_carousel]; arr[idx] = { ...arr[idx], title: e.target.value }; setForm(p => ({ ...p, banners_carousel: arr })); }} className="h-8 text-xs" />
                      <Input placeholder="Subtítulo" value={banner.subtitle || ''} onChange={e => { const arr = [...form.banners_carousel]; arr[idx] = { ...arr[idx], subtitle: e.target.value }; setForm(p => ({ ...p, banners_carousel: arr })); }} className="h-8 text-xs" />
                    </div>
                    <Input placeholder="Texto do botão (CTA)" value={banner.cta || ''} onChange={e => { const arr = [...form.banners_carousel]; arr[idx] = { ...arr[idx], cta: e.target.value }; setForm(p => ({ ...p, banners_carousel: arr })); }} className="h-8 text-xs" />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setForm(p => ({ ...p, banners_carousel: [...p.banners_carousel, { image: '', title: '', subtitle: '', cta: 'Ver Coleção' }] }))}>
                  <Plus className="w-3 h-3 mr-1" /> Adicionar Banner
                </Button>
                <p className="text-[10px] text-muted-foreground">{form.banners_carousel.length} banner(s) · Rotação automática a cada 5s</p>
              </SectionCard>

              {/* Coleções em Destaque */}
              <SectionCard icon={Grid3X3} title="Coleções em Destaque" description="Cards de categorias com imagem de destaque">
                {form.colecoes_destaque.map((col: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-2 relative">
                    <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0 text-destructive" onClick={() => setForm(p => ({ ...p, colecoes_destaque: p.colecoes_destaque.filter((_: any, i: number) => i !== idx) }))}>×</Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Nome (ex: Anéis)" value={col.nome || ''} onChange={e => { const arr = [...form.colecoes_destaque]; arr[idx] = { ...arr[idx], nome: e.target.value }; setForm(p => ({ ...p, colecoes_destaque: arr })); }} className="h-8 text-xs" />
                      <Input placeholder="Subtítulo" value={col.subtitulo || ''} onChange={e => { const arr = [...form.colecoes_destaque]; arr[idx] = { ...arr[idx], subtitulo: e.target.value }; setForm(p => ({ ...p, colecoes_destaque: arr })); }} className="h-8 text-xs" />
                    </div>
                    <ImageUpload value={col.imagem || ''} onChange={(url) => { const arr = [...form.colecoes_destaque]; arr[idx] = { ...arr[idx], imagem: url }; setForm(p => ({ ...p, colecoes_destaque: arr })); }} label="Imagem" />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setForm(p => ({ ...p, colecoes_destaque: [...p.colecoes_destaque, { nome: '', subtitulo: '', imagem: '' }] }))}>
                  <Plus className="w-3 h-3 mr-1" /> Adicionar Coleção
                </Button>
              </SectionCard>

              {/* Countdown */}
              <SectionCard icon={Timer} title="Contagem Regressiva" description="Timer de promoção por tempo limitado">
                <ToggleRow icon={Timer} title="Ativar Countdown" description="Exibe timer regressivo na loja" checked={form.countdown_ativo} onChange={v => setForm(p => ({ ...p, countdown_ativo: v }))} iconColor="text-amber-500" />
                {form.countdown_ativo && (
                  <div className="space-y-3 mt-2">
                    <Input placeholder="Título (ex: Black Friday)" value={form.countdown_titulo} onChange={e => setForm(p => ({ ...p, countdown_titulo: e.target.value }))} className="h-9 text-sm" />
                    <Input placeholder="Subtítulo" value={form.countdown_subtitulo} onChange={e => setForm(p => ({ ...p, countdown_subtitulo: e.target.value }))} className="h-9 text-sm" />
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Data/hora de término</Label>
                      <Input type="datetime-local" value={form.countdown_data_fim} onChange={e => setForm(p => ({ ...p, countdown_data_fim: e.target.value }))} className="h-9 text-sm" />
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Popup */}
              <SectionCard icon={Megaphone} title="Popup de Boas-Vindas" description="Captura de leads com desconto">
                <ToggleRow icon={Megaphone} title="Ativar Popup" description="Exibe popup ao entrar na loja" checked={form.popup_ativo} onChange={v => setForm(p => ({ ...p, popup_ativo: v }))} iconColor="text-purple-500" />
                {form.popup_ativo && (
                  <div className="space-y-3 mt-2">
                    <Input placeholder="Título" value={form.popup_titulo} onChange={e => setForm(p => ({ ...p, popup_titulo: e.target.value }))} className="h-9 text-sm" />
                    <Textarea placeholder="Texto do popup" value={form.popup_texto} onChange={e => setForm(p => ({ ...p, popup_texto: e.target.value }))} className="text-sm" rows={2} />
                    <ImageUpload value={form.popup_imagem_url} onChange={(url) => setForm(p => ({ ...p, popup_imagem_url: url }))} label="Imagem do Popup" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Cupom de desconto</Label>
                        <Input placeholder="BEMVINDO10" value={form.popup_cupom} onChange={e => setForm(p => ({ ...p, popup_cupom: e.target.value }))} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Delay (segundos)</Label>
                        <Input type="number" value={form.popup_delay_segundos} onChange={e => setForm(p => ({ ...p, popup_delay_segundos: e.target.value }))} className="h-9 text-sm" min="1" max="60" />
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Lookbook */}
              <SectionCard icon={Image} title="Lookbook" description="Galeria de fotos estilo editorial">
                <ToggleRow icon={Image} title="Ativar Lookbook" description="Seção de fotos inspiracionais" checked={form.lookbook_ativo} onChange={v => setForm(p => ({ ...p, lookbook_ativo: v }))} iconColor="text-pink-500" />
                {form.lookbook_ativo && (
                  <div className="space-y-3 mt-2">
                    <Input placeholder="Título da seção" value={form.lookbook_titulo} onChange={e => setForm(p => ({ ...p, lookbook_titulo: e.target.value }))} className="h-9 text-sm" />
                    {form.lookbook_imagens.map((img: any, idx: number) => (
                      <div key={idx} className="p-2 border rounded-lg relative">
                        <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0 text-destructive" onClick={() => setForm(p => ({ ...p, lookbook_imagens: p.lookbook_imagens.filter((_: any, i: number) => i !== idx) }))}>×</Button>
                        <ImageUpload value={img.url || ''} onChange={(url) => { const arr = [...form.lookbook_imagens]; arr[idx] = { ...arr[idx], url }; setForm(p => ({ ...p, lookbook_imagens: arr })); }} label={`Imagem ${idx + 1}`} />
                        <Input placeholder="Legenda (opcional)" value={img.legenda || ''} onChange={e => { const arr = [...form.lookbook_imagens]; arr[idx] = { ...arr[idx], legenda: e.target.value }; setForm(p => ({ ...p, lookbook_imagens: arr })); }} className="h-8 text-xs mt-2" />
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setForm(p => ({ ...p, lookbook_imagens: [...p.lookbook_imagens, { url: '', legenda: '' }] }))}>
                      <Plus className="w-3 h-3 mr-1" /> Adicionar Imagem
                    </Button>
                  </div>
                )}
              </SectionCard>
            </TabsContent>

            {/* TAB: Vendas */}
            <TabsContent value="vendas" className="space-y-5">
              <SectionCard icon={Truck} title="Entrega & Frete" description="Valores e promoções de entrega">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Taxa Padrão</Label>
                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span><Input type="number" value={form.taxa_entrega} onChange={e => setForm(p => ({ ...p, taxa_entrega: e.target.value }))} className="h-9 pl-9 text-sm" min="0" step="0.01" /></div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> Grátis acima de</Label>
                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span><Input type="number" value={form.frete_gratis_acima} onChange={e => setForm(p => ({ ...p, frete_gratis_acima: e.target.value }))} placeholder="—" className="h-9 pl-9 text-sm" min="0" step="0.01" /></div>
                  </div>
                </div>
                {form.frete_gratis_acima && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <Truck className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Frete grátis acima de <strong>R$ {parseFloat(form.frete_gratis_acima).toFixed(2)}</strong></p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1"><Package className="w-3 h-3" /> CEP de Origem</Label>
                  <Input value={form.cep_origem} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 8); setForm(p => ({ ...p, cep_origem: v.length > 5 ? v.slice(0,5) + '-' + v.slice(5) : v })); }} placeholder="00000-000" className="h-9 text-sm" maxLength={9} />
                  <p className="text-[10px] text-muted-foreground">Seu CEP para cálculo de frete dinâmico</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1"><Timer className="w-3 h-3" /> Prazo estimado de entrega</Label>
                  <Input value={form.tempo_estimado_entrega} onChange={e => setForm(p => ({ ...p, tempo_estimado_entrega: e.target.value }))} placeholder="Ex: 3 a 7 dias úteis" className="h-9 text-sm" />
                  <p className="text-[10px] text-muted-foreground">Exibido na página do produto</p>
                </div>
              </SectionCard>

              <SectionCard icon={DollarSign} title="Pedido Mínimo" description="Valor mínimo para finalizar compra">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Valor mínimo do pedido</Label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span><Input type="number" value={form.pedido_minimo} onChange={e => setForm(p => ({ ...p, pedido_minimo: e.target.value }))} placeholder="Sem mínimo" className="h-9 pl-9 text-sm" min="0" step="0.01" /></div>
                  <p className="text-[10px] text-muted-foreground">Deixe vazio para permitir pedidos de qualquer valor</p>
                </div>
              </SectionCard>

              <SectionCard icon={CreditCard} title="Métodos de Pagamento" description="Formas aceitas na loja">
                {METODOS_PAGAMENTO.map(metodo => (
                  <div key={metodo.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3"><span className="text-lg">{metodo.icon}</span><p className="text-sm font-medium text-foreground">{metodo.label}</p></div>
                    <Switch checked={form.metodos_pagamento.includes(metodo.id)} onCheckedChange={() => toggleMetodoPagamento(metodo.id)} />
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground mt-2">{form.metodos_pagamento.length} método(s) ativo(s)</p>
              </SectionCard>

              {/* PIX Direto */}
              <SectionCard icon={DollarSign} title="PIX Direto" description="Receba pagamentos diretamente via PIX — sem intermediário">
                <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: form.pix_chave ? '#10B981' : '#F59E0B', backgroundColor: form.pix_chave ? '#10B98110' : '#F59E0B10' }}>
                  {form.pix_chave ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">PIX configurado ✓ — Pagamentos vão direto para sua conta</span></>
                  ) : (
                    <><AlertCircle className="w-4 h-4 text-amber-500" /><span className="text-xs font-medium text-amber-700 dark:text-amber-300">Configure sua chave PIX para receber pagamentos</span></>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Tipo da Chave</Label>
                    <Select value={form.pix_tipo} onValueChange={v => setForm(p => ({ ...p, pix_tipo: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Chave PIX</Label>
                    <Input value={form.pix_chave} onChange={e => setForm(p => ({ ...p, pix_chave: e.target.value }))}
                      placeholder={form.pix_tipo === 'cpf' ? '000.000.000-00' : form.pix_tipo === 'email' ? 'seu@email.com' : form.pix_tipo === 'telefone' ? '+5511999999999' : 'Sua chave PIX'}
                      className="h-9 text-sm font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nome do Recebedor</Label>
                    <Input value={form.pix_nome} onChange={e => setForm(p => ({ ...p, pix_nome: e.target.value }))} placeholder="Seu nome ou razão social" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Cidade</Label>
                    <Input value={form.pix_cidade} onChange={e => setForm(p => ({ ...p, pix_cidade: e.target.value }))} placeholder="SAO PAULO" className="h-9 text-sm" />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs font-medium text-foreground">💡 Como funciona:</p>
                  <p className="text-[10px] text-muted-foreground">O cliente verá um QR Code PIX no checkout. Ao pagar, o valor cai <strong>direto na sua conta</strong> — sem taxas de intermediário.</p>
                </div>
              </SectionCard>

              {/* Integração Mercado Pago */}
              <SectionCard icon={CreditCard} title="Integração Mercado Pago" description="Credenciais para receber pagamentos na sua conta (cartão, boleto)">
                <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: form.mercadopago_access_token ? '#10B981' : '#F59E0B', backgroundColor: form.mercadopago_access_token ? '#10B98110' : '#F59E0B10' }}>
                  {form.mercadopago_access_token ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Mercado Pago configurado ✓</span></>
                  ) : (
                    <><AlertCircle className="w-4 h-4 text-amber-500" /><span className="text-xs font-medium text-amber-700 dark:text-amber-300">Opcional — para cartão de crédito e boleto</span></>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Access Token (Produção)</Label>
                  <div className="relative">
                    <Input
                      type={showMpToken ? 'text' : 'password'}
                      value={form.mercadopago_access_token}
                      onChange={e => setForm(p => ({ ...p, mercadopago_access_token: e.target.value }))}
                      placeholder="APP_USR-xxxx..."
                      className="h-9 text-sm pr-10 font-mono"
                    />
                    <button type="button" onClick={() => setShowMpToken(!showMpToken)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showMpToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.mercadopago_access_token && (
                    <p className="text-[10px] text-muted-foreground">Token: ****{form.mercadopago_access_token.slice(-4)}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Public Key</Label>
                  <Input
                    value={form.mercadopago_public_key}
                    onChange={e => setForm(p => ({ ...p, mercadopago_public_key: e.target.value }))}
                    placeholder="APP_USR-xxxx..."
                    className="h-9 text-sm font-mono"
                  />
                </div>

                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-xs font-medium text-foreground">📋 Como obter as credenciais:</p>
                  <ol className="text-[10px] text-muted-foreground space-y-1 list-decimal pl-4">
                    <li>Acesse <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer" className="text-primary underline">Mercado Pago Developers</a></li>
                    <li>Crie uma aplicação ou selecione existente</li>
                    <li>Vá em <strong>Credenciais de Produção</strong></li>
                    <li>Copie o <strong>Access Token</strong> e a <strong>Public Key</strong></li>
                  </ol>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">⚠️ Use credenciais de PRODUÇÃO, não de teste.</p>
                </div>
              </SectionCard>
            </TabsContent>

            {/* TAB: Avançado */}
            <TabsContent value="avancado" className="space-y-5">
              <SectionCard icon={Share2} title="Compartilhamento" description="Links e compartilhamento social">
                {lojaUrl && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Link da Loja</Label>
                      <div className="flex gap-2">
                        <Input value={lojaUrl} readOnly className="h-9 text-xs font-mono bg-muted/50 flex-1" />
                        <Button variant="outline" size="sm" className="h-9" onClick={() => { navigator.clipboard.writeText(lojaUrl); toast.success('Link copiado!'); }}><Copy className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Confira nossa loja: ${lojaUrl}`)}`, '_blank')}><Phone className="w-3 h-3 mr-1 text-emerald-500" /> WhatsApp</Button>
                      <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(lojaUrl)}`, '_blank')}><Facebook className="w-3 h-3 mr-1 text-blue-500" /> Facebook</Button>
                    </div>
                  </>
                )}
              </SectionCard>

              <SectionCard icon={BarChart3} title="Analytics & Rastreio" description="Integre com Google Analytics e Facebook Pixel">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1"><Globe className="w-3 h-3" /> Google Analytics ID</Label>
                  <Input value={form.google_analytics_id} onChange={e => setForm(p => ({ ...p, google_analytics_id: e.target.value }))} placeholder="G-XXXXXXXXXX" className="h-9 text-sm font-mono" />
                  <p className="text-[10px] text-muted-foreground">Rastreie visitas, conversões e comportamento dos usuários</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1"><Facebook className="w-3 h-3 text-blue-600" /> Facebook Pixel ID</Label>
                  <Input value={form.facebook_pixel_id} onChange={e => setForm(p => ({ ...p, facebook_pixel_id: e.target.value }))} placeholder="123456789012345" className="h-9 text-sm font-mono" />
                  <p className="text-[10px] text-muted-foreground">Para anúncios e remarketing no Facebook/Instagram</p>
                </div>
              </SectionCard>

              <SectionCard icon={Code} title="CSS Personalizado" description="Estilize a loja com código CSS">
                <Textarea value={form.css_personalizado} onChange={e => setForm(p => ({ ...p, css_personalizado: e.target.value }))} placeholder={`.loja-header {\n  /* suas customizações */\n}`} rows={6} className="text-xs font-mono resize-none" />
                <p className="text-[10px] text-muted-foreground">⚠️ CSS avançado — pode afetar o layout. Use com cautela.</p>
              </SectionCard>

              <SectionCard icon={FileText} title="Rodapé" description="Texto e colunas de links do rodapé">
                <Textarea value={form.texto_rodape} onChange={e => setForm(p => ({ ...p, texto_rodape: e.target.value }))} placeholder="© 2025 Sua Loja. Todos os direitos reservados." rows={2} className="text-sm resize-none" />
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Endereço / Localização</Label>
                  <Input value={form.rodape_endereco} onChange={e => setForm(p => ({ ...p, rodape_endereco: e.target.value }))} placeholder="Rua das Joias, 123 - São Paulo/SP" className="h-9 text-sm" />
                </div>
                <Separator />
                {/* Coluna 1 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Coluna 1 — Links</Label>
                  <Input value={form.rodape_coluna1_titulo} onChange={e => setForm(p => ({ ...p, rodape_coluna1_titulo: e.target.value }))} placeholder="Título da coluna (ex: Institucional)" className="h-8 text-xs" />
                  {form.rodape_coluna1_links.map((link: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input value={link.label} onChange={e => { const arr = [...form.rodape_coluna1_links]; arr[idx] = { ...arr[idx], label: e.target.value }; setForm(p => ({ ...p, rodape_coluna1_links: arr })); }} placeholder="Texto" className="h-7 text-xs flex-1" />
                      <Input value={link.url} onChange={e => { const arr = [...form.rodape_coluna1_links]; arr[idx] = { ...arr[idx], url: e.target.value }; setForm(p => ({ ...p, rodape_coluna1_links: arr })); }} placeholder="Link" className="h-7 text-xs flex-1 font-mono" />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setForm(p => ({ ...p, rodape_coluna1_links: p.rodape_coluna1_links.filter((_: any, i: number) => i !== idx) }))}>×</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setForm(p => ({ ...p, rodape_coluna1_links: [...p.rodape_coluna1_links, { label: '', url: '' }] }))}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar link
                  </Button>
                </div>
                <Separator />
                {/* Coluna 2 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Coluna 2 — Links</Label>
                  <Input value={form.rodape_coluna2_titulo} onChange={e => setForm(p => ({ ...p, rodape_coluna2_titulo: e.target.value }))} placeholder="Título da coluna (ex: Atendimento)" className="h-8 text-xs" />
                  {form.rodape_coluna2_links.map((link: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input value={link.label} onChange={e => { const arr = [...form.rodape_coluna2_links]; arr[idx] = { ...arr[idx], label: e.target.value }; setForm(p => ({ ...p, rodape_coluna2_links: arr })); }} placeholder="Texto" className="h-7 text-xs flex-1" />
                      <Input value={link.url} onChange={e => { const arr = [...form.rodape_coluna2_links]; arr[idx] = { ...arr[idx], url: e.target.value }; setForm(p => ({ ...p, rodape_coluna2_links: arr })); }} placeholder="Link" className="h-7 text-xs flex-1 font-mono" />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setForm(p => ({ ...p, rodape_coluna2_links: p.rodape_coluna2_links.filter((_: any, i: number) => i !== idx) }))}>×</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setForm(p => ({ ...p, rodape_coluna2_links: [...p.rodape_coluna2_links, { label: '', url: '' }] }))}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar link
                  </Button>
                </div>
              </SectionCard>
            </TabsContent>

            {/* TAB: Políticas */}
            <TabsContent value="politicas" className="space-y-5">
              <SectionCard icon={FileText} title="Política de Troca e Devolução" description="Regras para trocas e devoluções">
                <Textarea value={form.politica_troca} onChange={e => setForm(p => ({ ...p, politica_troca: e.target.value }))} placeholder="Ex: Aceitamos trocas em até 7 dias..." rows={5} className="text-sm resize-none" />
                <p className="text-[10px] text-muted-foreground">Exibida no rodapé da loja e na página de produto</p>
              </SectionCard>
              <SectionCard icon={Shield} title="Política de Privacidade" description="LGPD e proteção de dados">
                <Textarea value={form.politica_privacidade} onChange={e => setForm(p => ({ ...p, politica_privacidade: e.target.value }))} placeholder="Ex: Seus dados pessoais são protegidos..." rows={5} className="text-sm resize-none" />
                <p className="text-[10px] text-muted-foreground">Importante para conformidade com a LGPD</p>
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Live Store Preview (iframe) */}
        <div className="hidden xl:block">
          <div className="sticky top-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Preview da Loja Real
              </p>
              {lojaUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-6 gap-1 text-muted-foreground"
                  onClick={() => {
                    const iframe = document.getElementById('store-preview-iframe') as HTMLIFrameElement;
                    if (iframe) iframe.src = iframe.src; // force reload
                  }}
                >
                  <RefreshCw className="w-3 h-3" /> Recarregar
                </Button>
              )}
            </div>

            {lojaUrl ? (
              <motion.div 
                layout 
                className={`mx-auto rounded-[1.5rem] border-[5px] border-foreground/10 bg-background overflow-hidden shadow-2xl transition-all duration-300 ${previewDevice === 'mobile' ? 'w-[375px]' : 'w-full'}`} 
                style={{ height: previewDevice === 'mobile' ? '667px' : '600px' }}
              >
                <div className="h-7 flex items-center justify-between px-4 bg-foreground/5 border-b border-border/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-background/80 rounded-md px-3 py-0.5 text-center">
                      <span className="text-[9px] text-muted-foreground font-mono truncate block">{lojaUrl}</span>
                    </div>
                  </div>
                  <div className="w-10" />
                </div>
                <iframe 
                  id="store-preview-iframe"
                  src={lojaUrl} 
                  className="w-full border-0"
                  style={{ height: previewDevice === 'mobile' ? '640px' : '573px' }}
                  title="Preview da Loja"
                />
              </motion.div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Globe className="w-10 h-10 mb-3 opacity-40" />
                  <p className="font-medium text-sm">Nenhum preview disponível</p>
                  <p className="text-xs mt-1">Defina um slug para sua loja para ver o preview</p>
                </CardContent>
              </Card>
            )}

            <p className="text-[10px] text-center text-muted-foreground">
              Salve as alterações para atualizar o preview · Clique em "Recarregar" para ver
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Save */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="sticky bottom-4 z-10">
            <div className="flex items-center justify-between p-4 rounded-xl border bg-card/95 backdrop-blur-sm shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-xs text-muted-foreground">Alterações não salvas</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['ecommerce-config'] })}>Descartar</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="sm" className="px-6">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Salvar</>}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
