import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  ShoppingCart, Plus, Minus, Trash2, Store, Loader2, CheckCircle, Package,
  Heart, Truck, CreditCard, RefreshCw, Sparkles, Instagram, Phone, ChevronDown,
  ChevronRight, ArrowUpDown, Bell, Star, Share2, Home,
} from 'lucide-react';
import { ClienteAuthArea } from '@/components/ecommerce/ClienteAuthArea';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchAutocomplete } from '@/components/loja/SearchAutocomplete';
import { CookieConsent } from '@/components/loja/CookieConsent';
import { ProductShareButtons } from '@/components/loja/ProductShareButtons';
import { ProductReviews } from '@/components/ecommerce/ProductReviews';
import { ChatWidget } from '@/components/ai-agent/ChatWidget';
import { generatePixPayload } from '@/lib/pix-generator';
import { QRCodeSVG } from 'qrcode.react';
import { HeroCarousel } from '@/components/ecommerce/HeroCarousel';
import { ColecoesDestaque } from '@/components/ecommerce/ColecoesDestaque';
import { CountdownSection } from '@/components/ecommerce/CountdownSection';
import { LookbookSection } from '@/components/ecommerce/LookbookSection';
import { ProgressoFrete } from '@/components/ecommerce/ProgressoFrete';
import { PopupBoasVindas } from '@/components/ecommerce/PopupBoasVindas';
import { ProdutosRelacionados } from '@/components/ecommerce/ProdutosRelacionados';
import { CheckoutProgress } from '@/components/ecommerce/CheckoutProgress';
import heroSlide1 from '@/assets/hero-slide-1.jpg';
import heroSlide2 from '@/assets/hero-slide-2.jpg';
import heroSlide3 from '@/assets/hero-slide-3.jpg';

const MP_PUBLIC_KEY_FALLBACK = 'APP_USR-080297dc-b2f8-4e1b-9a31-d445004700dc';

interface SectionConfig {
  id: string;
  tipo: string;
  titulo: string;
  visivel: boolean;
  ordem: number;
}

interface StoreConfig {
  id: string; slug: string; nome_loja: string; logo_url: string | null;
  cor_primaria: string; cor_secundaria: string; descricao: string | null;
  frete_gratis_acima: number | null; taxa_entrega: number;
  whatsapp: string | null; instagram: string | null; organization_id: string;
  apenas_com_foto: boolean | null;
  banner_ativo: boolean | null; banner_texto: string | null; banner_cor: string | null;
  banner_url: string | null; banner_link: string | null; banner_posicao: string | null;
  mostrar_estoque: boolean | null; mostrar_preco_original: boolean | null;
  pedido_minimo: number | null; produtos_por_pagina: number | null;
  metodos_pagamento: string[] | null; email_contato: string | null;
  facebook: string | null; politica_troca: string | null; politica_privacidade: string | null;
  avaliacoes_ativas: boolean | null; horario_funcionamento: any | null;
  fonte_titulos: string | null; fonte_corpo: string | null;
  layout_produtos: string | null; colunas_desktop: number | null; colunas_mobile: number | null;
  mostrar_busca: boolean | null; mostrar_categorias: boolean | null;
  mostrar_filtros: boolean | null; mostrar_ordenacao: boolean | null;
  mostrar_whatsapp_float: boolean | null; whatsapp_posicao: string | null;
  selos_confianca: string[] | null; texto_rodape: string | null;
  google_analytics_id: string | null; facebook_pixel_id: string | null;
  css_personalizado: string | null;
  hero_titulo: string | null; hero_subtitulo: string | null;
  hero_cta_texto: string | null; hero_cta_link: string | null;
  hero_imagem_url: string | null; hero_overlay_opacity: number | null;
  parcelamento_max: number | null; mostrar_parcelamento: boolean | null;
  tempo_estimado_entrega: string | null; badges_produto: string[] | null;
  mensagem_whatsapp: string | null;
  mercadopago_public_key: string | null;
  pix_chave: string | null; pix_nome: string | null; pix_tipo: string | null; pix_cidade: string | null;
  // Marketing
  banners_carousel: any[] | null;
  colecoes_destaque: any[] | null;
  countdown_ativo: boolean | null;
  countdown_titulo: string | null;
  countdown_subtitulo: string | null;
  countdown_data_fim: string | null;
  lookbook_ativo: boolean | null;
  lookbook_titulo: string | null;
  lookbook_imagens: any[] | null;
  popup_ativo: boolean | null;
  popup_titulo: string | null;
  popup_texto: string | null;
  popup_imagem_url: string | null;
  popup_cupom: string | null;
  popup_delay_segundos: number | null;
  secoes_homepage: SectionConfig[] | null;
  produtos_destaque_ids: string[] | null;
  mais_vendidos_ids: string[] | null;
}

interface Peca {
  id: string; nome: string; codigo: string; preco_venda: number;
  imagem_url: string | null; categoria: string | null; material: string | null;
  descricao: string | null; estoque: number; peso: number | null; organization_id: string;
}

interface CartItem extends Peca { quantidade: number; }
type CheckoutStep = 'cart' | 'dados' | 'metodo' | 'pagamento' | 'pix' | 'confirmacao';
type SortOption = 'nome' | 'preco_asc' | 'preco_desc' | 'novidades';

export default function LojaPublicaPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todas');
  const [materialFilter, setMaterialFilter] = useState('todos');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('dados');
  const [processing, setProcessing] = useState(false);
  const [numeroPedido, setNumeroPedido] = useState<number | null>(null);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [selectedPeca, setSelectedPeca] = useState<Peca | null>(null);

  // New feature states
  const [sortBy, setSortBy] = useState<SortOption>('nome');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [aviseEmail, setAviseEmail] = useState('');
  const [aviseLoading, setAviseLoading] = useState(false);

  // Cupom state
  const [cupomCode, setCupomCode] = useState('');
  const [cupomDesconto, setCupomDesconto] = useState(0);
  const [cupomId, setCupomId] = useState<string | null>(null);
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomApplied, setCupomApplied] = useState('');

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Frete dinâmico
  const [freteOpcoes, setFreteOpcoes] = useState<{ sedex: { valor: number; prazo: number } | null; pac: { valor: number; prazo: number } | null } | null>(null);
  const [freteEscolhido, setFreteEscolhido] = useState<'pac' | 'sedex' | 'taxa_fixa'>('taxa_fixa');
  const [freteCalculando, setFreteCalculando] = useState(false);

  const [policyModal, setPolicyModal] = useState<{ title: string; content: string } | null>(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState<'pix' | 'cartao' | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  // Agent config for chatbot
  const [agentConfig, setAgentConfig] = useState<any>(null);
  const [avaliacoes, setAvaliacoes] = useState<Record<string, { media: number; total: number }>>({});
  const [cliente, setCliente] = useState({ nome: '', email: '', telefone: '', cpf: '' });
  const [endereco, setEndereco] = useState({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });

  // Hero
  const heroSlides = [
    { image: heroSlide1, title: 'Joias que contam', subtitle: 'a sua história', cta: 'Explorar Coleção' },
    { image: heroSlide2, title: 'Brincos exclusivos', subtitle: 'para cada momento', cta: 'Ver Brincos' },
    { image: heroSlide3, title: 'Pulseiras artesanais', subtitle: 'feitas com amor', cta: 'Conferir' },
  ];
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setHeroIndex(i => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => { if (slug) loadStore(); }, [slug]);

  useEffect(() => {
    const pagamento = searchParams.get('pagamento');
    if (pagamento === 'sucesso') toast.success('Pagamento aprovado! 🎉');
    else if (pagamento === 'erro') toast.error('Pagamento não aprovado.');
    else if (pagamento === 'pendente') toast.info('Pagamento pendente.');
  }, [searchParams]);

  // Load wishlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`wishlist_${slug}`);
    if (saved) setWishlist(new Set(JSON.parse(saved)));
  }, [slug]);

  // Load Google Fonts for config fonts
  useEffect(() => {
    if (config) {
      const fonts = [config.fonte_titulos, config.fonte_corpo].filter(Boolean);
      if (fonts.length > 0) {
        const families = fonts.map(f => (f as string).replace(/ /g, '+')).join('&family=');
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@300;400;500;600;700&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => { document.head.removeChild(link); };
      }
    }
  }, [config?.fonte_titulos, config?.fonte_corpo]);

  // Inject custom CSS
  useEffect(() => {
    if (config?.css_personalizado) {
      const style = document.createElement('style');
      style.id = 'loja-custom-css';
      style.textContent = config.css_personalizado;
      document.head.appendChild(style);
      return () => { const el = document.getElementById('loja-custom-css'); if (el) el.remove(); };
    }
  }, [config?.css_personalizado]);

  // Google Analytics
  useEffect(() => {
    if (config?.google_analytics_id) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${config.google_analytics_id}`;
      script.async = true;
      document.head.appendChild(script);
      const inline = document.createElement('script');
      inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${config.google_analytics_id}');`;
      document.head.appendChild(inline);
      return () => { document.head.removeChild(script); document.head.removeChild(inline); };
    }
  }, [config?.google_analytics_id]);

  // Facebook Pixel
  useEffect(() => {
    if (config?.facebook_pixel_id) {
      const script = document.createElement('script');
      script.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${config.facebook_pixel_id}');fbq('track','PageView');`;
      document.head.appendChild(script);
      return () => { document.head.removeChild(script); };
    }
  }, [config?.facebook_pixel_id]);

  // SEO dynamic meta tags
  useEffect(() => {
    if (config) {
      document.title = `${config.nome_loja} - Semijoias Exclusivas`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', config.descricao || `Loja ${config.nome_loja} - Semijoias exclusivas com frete grátis e parcelamento em até 12x.`);
      else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = config.descricao || `Loja ${config.nome_loja} - Semijoias exclusivas.`;
        document.head.appendChild(meta);
      }
    }
    return () => { document.title = 'Nexsiles'; };
  }, [config]);

  // Update SEO for selected product
  useEffect(() => {
    if (selectedPeca && config) {
      document.title = `${selectedPeca.nome} - ${config.nome_loja}`;
    } else if (config) {
      document.title = `${config.nome_loja} - Semijoias Exclusivas`;
    }
  }, [selectedPeca, config]);

  const loadStore = async () => {
    try {
      const { data: configData, error: configError } = await supabase
        .from('ecommerce_config_public' as any).select('*').eq('slug', slug).maybeSingle();
      if (configError || !configData) { setLoading(false); return; }
      setConfig(configData as any);

      // Fetch agent config for chatbot
      const { data: agentData } = await supabase
        .from('agente_ia_config_public' as any)
        .select('nome_agente, cor_primaria, avatar_url, mensagem_boas_vindas, ativo')
        .eq('organization_id', (configData as any).organization_id)
        .eq('ativo', true)
        .maybeSingle();
      if (agentData && (agentData as any).ativo) {
        setAgentConfig(agentData);
      }
      let query = supabase
        .from('pecas_loja_public' as any).select('*')
        .eq('organization_id', (configData as any).organization_id).order('nome');
      const { data: pecasData } = await query;
      let items = (pecasData as any) || [];
      if ((configData as any).apenas_com_foto) {
        items = items.filter((p: any) => p.imagem_url);
      }
      setPecas(items);

      // Load ratings
      const { data: ratingsData } = await supabase.rpc('fetch_avaliacoes_media', { p_organization_id: (configData as any).organization_id });
      if (ratingsData) {
        const map: Record<string, { media: number; total: number }> = {};
        (ratingsData as any[]).forEach((r: any) => { map[r.peca_id] = { media: Number(r.media_nota), total: Number(r.total_avaliacoes) }; });
        setAvaliacoes(map);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Price range bounds
  const priceBounds = useMemo(() => {
    if (pecas.length === 0) return [0, 1000];
    const prices = pecas.map(p => p.preco_venda);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [pecas]);

  useEffect(() => { setPriceRange([priceBounds[0], priceBounds[1]]); }, [priceBounds]);

  const categoryTree = useMemo(() => {
    const tree: Record<string, string[]> = {};
    pecas.forEach(p => {
      const cat = p.categoria || 'Outros';
      const mat = p.material || '';
      if (!tree[cat]) tree[cat] = [];
      if (mat && !tree[cat].includes(mat)) tree[cat].push(mat);
    });
    Object.keys(tree).forEach(cat => tree[cat].sort());
    return tree;
  }, [pecas]);

  const categorias = useMemo(() => Object.keys(categoryTree).sort(), [categoryTree]);
  const materiais = useMemo(() => {
    if (categoriaFilter === 'todas') {
      return Array.from(new Set(pecas.map(p => p.material).filter(Boolean))).sort() as string[];
    }
    return categoryTree[categoriaFilter] || [];
  }, [pecas, categoriaFilter, categoryTree]);

  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  const filteredPecas = useMemo(() => {
    let result = pecas.filter(p => {
      if (showWishlistOnly && !wishlist.has(p.id)) return false;
      const matchSearch = !search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.codigo?.toLowerCase().includes(search.toLowerCase());
      const matchCategoria = categoriaFilter === 'todas' || p.categoria === categoriaFilter;
      const matchMaterial = materialFilter === 'todos' || p.material === materialFilter;
      const matchPrice = p.preco_venda >= priceRange[0] && p.preco_venda <= priceRange[1];
      return matchSearch && matchCategoria && matchMaterial && matchPrice;
    });

    // Sort
    switch (sortBy) {
      case 'preco_asc': result.sort((a, b) => a.preco_venda - b.preco_venda); break;
      case 'preco_desc': result.sort((a, b) => b.preco_venda - a.preco_venda); break;
      case 'novidades': result.reverse(); break;
      default: result.sort((a, b) => a.nome.localeCompare(b.nome));
    }
    return result;
  }, [pecas, search, categoriaFilter, materialFilter, priceRange, sortBy, showWishlistOnly, wishlist]);

  const toggleWishlist = useCallback((pecaId: string) => {
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(pecaId)) next.delete(pecaId); else next.add(pecaId);
      localStorage.setItem(`wishlist_${slug}`, JSON.stringify([...next]));
      return next;
    });
  }, [slug]);

  const handleAviseMe = async (pecaId: string) => {
    if (!aviseEmail.trim() || !config) return;
    setAviseLoading(true);
    try {
      const { error } = await (supabase as any).from('loja_avise_me').insert({
        peca_id: pecaId, organization_id: config.organization_id, email: aviseEmail.trim().toLowerCase(),
      });
      if (error) {
        if (error.code === '23505') toast.info('Você já será notificado!');
        else throw error;
      } else {
        toast.success('Você será notificado quando voltar ao estoque! 🔔');
        setAviseEmail('');
      }
    } catch { toast.error('Erro ao cadastrar'); }
    finally { setAviseLoading(false); }
  };

  const addToCart = useCallback((peca: Peca) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === peca.id);
      if (existing) {
        if (existing.quantidade >= peca.estoque) { toast.error('Estoque insuficiente'); return prev; }
        return prev.map(i => i.id === peca.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { ...peca, quantidade: 1 }];
    });
    toast.success('Adicionado ao carrinho ✨');
  }, []);

  const updateQuantity = useCallback((pecaId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id !== pecaId) return item;
      const newQty = item.quantidade + delta;
      if (newQty <= 0 || newQty > item.estoque) return item;
      return { ...item, quantidade: newQty };
    }));
  }, []);

  const removeFromCart = useCallback((pecaId: string) => {
    setCart(prev => prev.filter(i => i.id !== pecaId));
  }, []);

  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.preco_venda * i.quantidade, 0), [cart]);
  const valorFrete = useMemo(() => {
    if (!config) return 0;
    const sub = subtotal - cupomDesconto;
    if (config.frete_gratis_acima && sub >= config.frete_gratis_acima) return 0;
    // Se frete dinâmico calculado
    if (freteOpcoes && freteEscolhido !== 'taxa_fixa') {
      const opcao = freteEscolhido === 'sedex' ? freteOpcoes.sedex : freteOpcoes.pac;
      return opcao?.valor || 0;
    }
    return config.taxa_entrega || 0;
  }, [config, subtotal, cupomDesconto, freteOpcoes, freteEscolhido]);
  const total = subtotal - cupomDesconto + valorFrete;
  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantidade, 0), [cart]);

  const aplicarCupom = async () => {
    if (!cupomCode.trim() || !config) return;
    setCupomLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc('validar_cupom', {
        p_codigo: cupomCode, p_organization_id: config.organization_id, p_valor_pedido: subtotal,
      });
      if (error) throw error;
      if (data && Array.isArray(data) && data.length > 0) {
        setCupomDesconto(data[0].desconto); setCupomId(data[0].cupom_id);
        setCupomApplied(cupomCode.toUpperCase());
        toast.success(`Cupom aplicado! Desconto: ${formatCurrency(data[0].desconto)}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Cupom inválido');
      setCupomDesconto(0); setCupomId(null); setCupomApplied('');
    } finally { setCupomLoading(false); }
  };

  const removerCupom = () => {
    setCupomCode(''); setCupomDesconto(0); setCupomId(null); setCupomApplied('');
    toast.success('Cupom removido');
  };

  const calcularFreteDinamico = async (cep: string) => {
    if (!config || cep.replace(/\D/g, '').length !== 8) return;
    setFreteCalculando(true);
    try {
      const { data, error } = await supabase.functions.invoke('calcular-frete', {
        body: {
          cepOrigem: '01001000', // CEP padrão origem
          cepDestino: cep.replace(/\D/g, ''),
          peso: cart.reduce((sum, i) => sum + (i.peso || 0.05) * i.quantidade, 0),
          comprimento: 20, largura: 15, altura: 10,
          valor: subtotal,
        },
      });
      if (!error && data) {
        setFreteOpcoes(data);
        setFreteEscolhido(data.pac ? 'pac' : data.sedex ? 'sedex' : 'taxa_fixa');
      }
    } catch { /* silently fail, keep taxa_fixa */ }
    finally { setFreteCalculando(false); }
  };

  const handleCheckout = async () => {
    if (!cliente.nome.trim()) { toast.error('Informe seu nome'); return; }
    if (!config) return;
    if (config.pedido_minimo && subtotal < config.pedido_minimo) {
      toast.error(`Pedido mínimo de ${formatCurrency(config.pedido_minimo)}`);
      return;
    }
    
    // If PIX is configured and MP is also configured, let user choose
    const hasPix = !!config.pix_chave;
    const hasMp = !!config.mercadopago_public_key;
    
    if (hasPix && hasMp) {
      setCheckoutStep('metodo');
      return;
    }
    
    if (hasPix && !hasMp) {
      // PIX only
      handlePixPayment();
      return;
    }
    
    // MP only (default)
    await handleMpCheckout();
  };

  const handlePixPayment = async () => {
    if (!config) return;
    setProcessing(true);
    try {
      // Create order with status 'aguardando_pix'
      const { data, error } = await supabase.functions.invoke('ecommerce-checkout', {
        body: {
          items: cart.map(i => ({ peca_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda, nome: i.nome })),
          organization_id: config.organization_id, cliente,
          endereco: endereco.cep ? endereco : undefined, valor_frete: valorFrete,
          metodo_pagamento: 'pix_direto',
          cupom_id: cupomId, valor_desconto: cupomDesconto,
        },
      });
      if (error) { toast.error('Erro ao criar pedido'); setProcessing(false); return; }
      setNumeroPedido(data?.numero_pedido || null);
      setPedidoId(data?.pedido_id || null);
      setCheckoutStep('pix');
    } catch { toast.error('Erro ao processar'); }
    finally { setProcessing(false); }
  };

  const handleMpCheckout = async () => {
    if (!config) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ecommerce-checkout', {
        body: {
          items: cart.map(i => ({ peca_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda, nome: i.nome })),
          organization_id: config.organization_id, cliente,
          endereco: endereco.cep ? endereco : undefined, valor_frete: valorFrete,
        },
      });
      if (error || !data?.preferenceId) { toast.error(data?.error || 'Erro ao iniciar pagamento'); setProcessing(false); return; }
      setCheckoutStep('pagamento');
      setTimeout(() => initPaymentBrick(data.preferenceId), 300);
    } catch { toast.error('Erro ao processar checkout'); setProcessing(false); }
  };

  const initPaymentBrick = async (preferenceId: string) => {
    try {
      if (!(window as any).MercadoPago) {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; document.head.appendChild(script); });
      }
      const mpPublicKey = config?.mercadopago_public_key || MP_PUBLIC_KEY_FALLBACK;
      const mp = new (window as any).MercadoPago(mpPublicKey, { locale: 'pt-BR' });
      const bricksBuilder = mp.bricks();
      await bricksBuilder.create('payment', 'ecommerce-brick-container', {
        initialization: { amount: total, preferenceId },
        customization: {
          visual: { style: { theme: 'default' }, hideFormTitle: true, hidePaymentButton: false },
          paymentMethods: { creditCard: 'all', debitCard: 'all', bankTransfer: 'all', maxInstallments: 12 },
        },
        callbacks: {
          onReady: () => setProcessing(false),
          onSubmit: async ({ formData }: any) => {
            setProcessing(true);
            try {
              const response = await fetch(
                `https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/ecommerce-process-payment`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqb2Zud2N2cHpxbGhhZ2VqZ2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjIwMDAsImV4cCI6MjA4NDgzODAwMH0.kCxv9nbZ7eph4T09WYgbUednAQeW0Slutet08G9svXc' },
                  body: JSON.stringify({
                    formData, organization_id: config!.organization_id,
                    items: cart.map(i => ({ peca_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda, nome: i.nome })),
                    cliente, endereco: endereco.cep ? endereco : undefined,
                    valor_subtotal: subtotal, valor_frete: valorFrete,
                    cupom_id: cupomId, valor_desconto: cupomDesconto,
                  }),
                }
              );
              const result = await response.json();
              if (result.status === 'approved') {
                setNumeroPedido(result.numero_pedido); setPedidoId(result.pedido_id);
                setCheckoutStep('confirmacao'); setCart([]); toast.success('Pagamento aprovado! 🎉');
              } else { toast.error(result.status_detail || 'Pagamento não aprovado'); }
            } catch { toast.error('Erro ao processar pagamento'); }
            finally { setProcessing(false); }
          },
          onError: (error: any) => { console.error(error); setProcessing(false); },
        },
      });
    } catch (err) { console.error(err); setProcessing(false); }
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getProductUrl = (peca: Peca) => `${window.location.origin}/loja/${slug}?produto=${peca.id}`;

  // Auto-open product from URL
  useEffect(() => {
    const produtoId = searchParams.get('produto');
    if (produtoId && pecas.length > 0) {
      const found = pecas.find(p => p.id === produtoId);
      if (found) setSelectedPeca(found);
    }
  }, [searchParams, pecas]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF9F5' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#B76E79' }} />
        <p className="text-sm" style={{ color: '#B76E79' }}>Carregando...</p>
      </div>
    </div>
  );

  if (!config) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#FFF9F5' }}>
      <Store className="w-16 h-16" style={{ color: '#B76E79' }} />
      <h1 className="text-2xl font-bold" style={{ color: '#2D2D2D' }}>Loja não encontrada</h1>
      <p style={{ color: '#8B8B8B' }}>Verifique o endereço e tente novamente.</p>
    </div>
  );

  // Dynamic colors from config
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };
  const lighten = (hex: string, amount: number) => {
    const { r, g, b } = hexToRgb(hex);
    const lr = Math.min(255, r + Math.round((255 - r) * amount));
    const lg = Math.min(255, g + Math.round((255 - g) * amount));
    const lb = Math.min(255, b + Math.round((255 - b) * amount));
    return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
  };
  const darken = (hex: string, amount: number) => {
    const { r, g, b } = hexToRgb(hex);
    const dr = Math.max(0, Math.round(r * (1 - amount)));
    const dg = Math.max(0, Math.round(g * (1 - amount)));
    const db = Math.max(0, Math.round(b * (1 - amount)));
    return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
  };

  const roseGold = config.cor_primaria || '#B76E79';
  const roseGoldLight = lighten(roseGold, 0.4);
  const roseGoldDark = config.cor_secundaria || darken(roseGold, 0.3);
  const cream = lighten(roseGold, 0.92);
  const warmWhite = lighten(roseGold, 0.96);
  const textDark = '#2D2D2D';
  const textMuted = '#7A7A7A';

  const fontTitulos = config.fonte_titulos || 'Cormorant Garamond';
  const fontCorpo = config.fonte_corpo || 'Inter';
  const colunasDesktop = config.colunas_desktop || 4;
  const colunasMobile = config.colunas_mobile || 2;
  const parcelamentoMax = config.parcelamento_max || 12;
  const mostrarBusca = config.mostrar_busca !== false;
  const mostrarCategorias = config.mostrar_categorias !== false;
  const mostrarFiltros = config.mostrar_filtros !== false;
  const mostrarOrdenacao = config.mostrar_ordenacao !== false;
  const mostrarParcelamento = config.mostrar_parcelamento !== false;
  const mostrarWhatsappFloat = config.mostrar_whatsapp_float !== false && !!config.whatsapp;
  const whatsappPosicao = config.whatsapp_posicao || 'direita';

  const SELOS_MAP: Record<string, { label: string; icon: string }> = {
    compra_segura: { label: 'Compra Segura', icon: '🔒' },
    frete_gratis: { label: 'Frete Grátis', icon: '🚚' },
    garantia: { label: 'Garantia', icon: '✅' },
    troca_facil: { label: 'Troca Fácil', icon: '🔄' },
    satisfacao: { label: 'Satisfação Garantida', icon: '⭐' },
    parcelamento: { label: 'Parcelamento s/ juros', icon: '💳' },
    envio_rapido: { label: 'Envio Rápido', icon: '⚡' },
    suporte_24h: { label: 'Suporte 24h', icon: '🎧' },
  };

  const gridColsClass = `grid-cols-${colunasMobile} sm:grid-cols-${Math.min(colunasDesktop, 3)} lg:grid-cols-${colunasDesktop}`;

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'nome', label: 'Nome (A-Z)' },
    { value: 'preco_asc', label: 'Menor Preço' },
    { value: 'preco_desc', label: 'Maior Preço' },
    { value: 'novidades', label: 'Novidades' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: cream, fontFamily: `'${fontTitulos}', 'Georgia', serif` }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: textDark }} className="hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {config.whatsapp && (
              <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80" style={{ color: roseGoldLight }}>
                <Phone className="w-3 h-3" /> {config.whatsapp}
              </a>
            )}
          </div>
          <div className="flex items-center gap-4">
            {config.instagram && (
              <a href={`https://instagram.com/${config.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80" style={{ color: roseGoldLight }}>
                <Instagram className="w-4 h-4" />
              </a>
            )}
            <span className="text-xs" style={{ color: roseGoldLight }}>SIGA-NOS</span>
          </div>
        </div>
      </div>

      {/* Announcement Bar - uses banner config */}
      {config.banner_ativo && config.banner_texto ? (
        <div className="w-full py-2 text-center overflow-hidden cursor-pointer" style={{ backgroundColor: config.banner_cor || roseGold }}
          onClick={() => { if (config.banner_link) window.open(config.banner_link, '_blank'); }}>
          {config.banner_url ? (
            <div className="relative">
              <img src={config.banner_url} alt="Banner" className="w-full h-12 sm:h-16 object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-white font-medium" style={{ fontFamily: `'${fontCorpo}', sans-serif` }}>
                  {config.banner_texto}
                </span>
              </div>
            </div>
          ) : (
            <motion.div animate={{ x: ['100%', '-100%'] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="whitespace-nowrap">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-white" style={{ fontFamily: `'${fontCorpo}', sans-serif` }}>
                {config.banner_texto}
              </span>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="w-full py-2 text-center overflow-hidden" style={{ backgroundColor: roseGold }}>
          <motion.div animate={{ x: ['100%', '-100%'] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="whitespace-nowrap">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
              ✦ Frete grátis {config.frete_gratis_acima ? `acima de R$ ${config.frete_gratis_acima.toFixed(0)}` : 'em compras selecionadas'} ✦ Parcele em até {parcelamentoMax}x sem juros ✦ Troca grátis na primeira compra ✦ Novidades toda semana ✦
            </span>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-md" style={{ backgroundColor: `${warmWhite}F2`, borderColor: '#F0E6E0' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Search with autocomplete */}
          {mostrarBusca && <SearchAutocomplete
            pecas={pecas}
            search={search}
            setSearch={setSearch}
            onSelect={peca => setSelectedPeca(peca)}
            textDark={textDark}
            textMuted={textMuted}
            roseGold={roseGold}
            className="hidden sm:block w-72"
          />}

          {/* Logo */}
          <div className="flex flex-col items-center flex-1 sm:flex-none">
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.nome_loja} className="h-12 sm:h-14 object-contain" />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-light tracking-[0.2em] uppercase" style={{ color: textDark }}>
                {config.nome_loja}
              </h1>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Wishlist button */}
            <button
              className="relative p-2 transition-opacity hover:opacity-70"
              onClick={() => {
                if (!showWishlistOnly && wishlist.size === 0) { toast.info('Sua lista de desejos está vazia'); return; }
                setShowWishlistOnly(prev => !prev);
                if (!showWishlistOnly) { setCategoriaFilter('todas'); setMaterialFilter('todos'); setSearch(''); }
              }}
              title={showWishlistOnly ? 'Ver todos os produtos' : 'Ver favoritos'}
            >
              <Heart className="w-5 h-5" style={{ color: wishlist.size > 0 ? roseGold : textDark }} fill={wishlist.size > 0 ? roseGold : 'none'} />
              {wishlist.size > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: roseGold }}>{wishlist.size}</span>
              )}
            </button>

            <ClienteAuthArea
              organizationId={config.organization_id}
              roseGold={roseGold} roseGoldLight={roseGoldLight}
              textDark={textDark} textMuted={textMuted} warmWhite={warmWhite}
            />

            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <button className="relative p-2 transition-opacity hover:opacity-70">
                  <ShoppingCart className="w-5 h-5" style={{ color: textDark }} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: roseGold }}>{cartCount}</span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md border-l" style={{ borderColor: '#F0E6E0', backgroundColor: warmWhite }}>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-lg tracking-wide uppercase" style={{ color: textDark, fontFamily: "'Cormorant Garamond', serif" }}>
                    <ShoppingCart className="w-5 h-5" /> Sacola ({cartCount})
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col h-[calc(100vh-200px)]">
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {cart.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="w-10 h-10 mx-auto mb-3" style={{ color: roseGoldLight }} />
                        <p className="text-sm" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>Sua sacola está vazia</p>
                      </div>
                    ) : cart.map(item => (
                      <div key={item.id} className="flex gap-3 p-3 border-b" style={{ borderColor: '#F0E6E0' }}>
                        {item.imagem_url ? (
                          <img src={item.imagem_url} alt={item.nome} className="w-20 h-20 object-cover" />
                        ) : (
                          <div className="w-20 h-20 flex items-center justify-center" style={{ backgroundColor: '#F5EEEA' }}>
                            <Package className="w-6 h-6" style={{ color: roseGoldLight }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: textDark, fontFamily: "'Inter', sans-serif" }}>{item.nome}</p>
                          <p className="text-sm font-semibold mt-0.5" style={{ color: roseGold }}>{formatCurrency(item.preco_venda)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 border flex items-center justify-center hover:bg-gray-50" style={{ borderColor: '#E0D5CF' }}><Minus className="w-3 h-3" style={{ color: textDark }} /></button>
                            <span className="text-sm w-6 text-center" style={{ color: textDark, fontFamily: "'Inter', sans-serif" }}>{item.quantidade}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 border flex items-center justify-center hover:bg-gray-50" style={{ borderColor: '#E0D5CF' }}><Plus className="w-3 h-3" style={{ color: textDark }} /></button>
                            <button onClick={() => removeFromCart(item.id)} className="ml-auto hover:opacity-70"><Trash2 className="w-4 h-4" style={{ color: textMuted }} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {cart.length > 0 && (
                    <div className="border-t pt-4 space-y-2" style={{ borderColor: '#F0E6E0' }}>
                      <div className="flex justify-between text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <span style={{ color: textMuted }}>Subtotal</span><span style={{ color: textDark }}>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <span style={{ color: textMuted }}>Frete</span><span style={{ color: textDark }}>{valorFrete === 0 ? 'Grátis' : formatCurrency(valorFrete)}</span>
                      </div>
                      {config.frete_gratis_acima && subtotal < config.frete_gratis_acima && (
                        <ProgressoFrete
                          subtotal={subtotal - cupomDesconto}
                          freteGratisAcima={config.frete_gratis_acima}
                          corPrimaria={roseGold}
                        />
                      )}
                      <div className="border-t pt-2 mt-2" style={{ borderColor: '#F0E6E0' }}>
                        <div className="flex justify-between font-semibold text-lg">
                          <span style={{ color: textDark }}>Total</span>
                          <span style={{ color: roseGold }}>{formatCurrency(total)}</span>
                        </div>
                      </div>
                      <button
                        className="w-full py-3 mt-2 text-white text-sm uppercase tracking-[0.15em] transition-all hover:opacity-90"
                        style={{ backgroundColor: roseGold, fontFamily: "'Inter', sans-serif" }}
                        onClick={() => { setCartOpen(false); setCheckoutStep('dados'); setCheckoutOpen(true); }}
                      >
                        Finalizar Compra
                      </button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Category Navigation */}
        {mostrarCategorias && (
        <nav className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-6 sm:gap-8 justify-center py-3 min-w-max">
            <button onClick={() => setCategoriaFilter('todas')}
              className="text-xs sm:text-sm uppercase tracking-[0.15em] pb-1 border-b-2 transition-all whitespace-nowrap"
              style={{ color: categoriaFilter === 'todas' ? roseGold : textMuted, borderColor: categoriaFilter === 'todas' ? roseGold : 'transparent', fontFamily: `'${fontCorpo}', sans-serif`, fontWeight: categoriaFilter === 'todas' ? 600 : 400 }}
            >Todos</button>
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaFilter(cat)}
                className="text-xs sm:text-sm uppercase tracking-[0.15em] pb-1 border-b-2 transition-all whitespace-nowrap"
                style={{ color: categoriaFilter === cat ? roseGold : textMuted, borderColor: categoriaFilter === cat ? roseGold : 'transparent', fontFamily: `'${fontCorpo}', sans-serif`, fontWeight: categoriaFilter === cat ? 600 : 400 }}
              >{cat}</button>
            ))}
          </div>
        </nav>
        )}
      </header>

      {/* Mobile Search */}
      {mostrarBusca && (
      <div className="sm:hidden px-4 pt-3">
        <SearchAutocomplete
          pecas={pecas}
          search={search}
          setSearch={setSearch}
          onSelect={peca => setSelectedPeca(peca)}
          textDark={textDark}
          textMuted={textMuted}
          roseGold={roseGold}
        />
      </div>
      )}

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-1.5 text-[11px]" style={{ fontFamily: "'Inter', sans-serif", color: textMuted }}>
          <Home className="w-3 h-3" />
          <span>Início</span>
          {categoriaFilter !== 'todas' && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: roseGold }}>{categoriaFilter}</span>
            </>
          )}
          {materialFilter !== 'todos' && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: roseGold }}>{materialFilter}</span>
            </>
          )}
        </div>
      </div>

      {/* Hero Section - HeroCarousel or fallback */}
      <HeroCarousel
        banners={(config as any).banners_carousel || []}
        fallbackSlides={config.hero_imagem_url 
          ? [{ image: config.hero_imagem_url, title: config.hero_titulo || '', subtitle: config.hero_subtitulo || '', cta: config.hero_cta_texto || 'Ver Coleção' }]
          : heroSlides
        }
        fontTitulos={fontTitulos}
        corPrimaria={roseGold}
      />

      {/* Benefits Bar + Selos de Confiança */}
      <section className="border-y" style={{ borderColor: '#F0E6E0', backgroundColor: warmWhite }}>
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: CreditCard, title: 'Parcele', desc: `em até ${parcelamentoMax}x sem juros` },
              { icon: Truck, title: 'Frete Grátis', desc: config.frete_gratis_acima ? `acima de ${formatCurrency(config.frete_gratis_acima)}` : 'consulte' },
              { icon: RefreshCw, title: 'Troca Grátis', desc: 'primeira troca por nossa conta' },
              { icon: Sparkles, title: config.tempo_estimado_entrega ? 'Entrega' : 'Qualidade', desc: config.tempo_estimado_entrega || 'garantia em todas as peças' },
            ].map(b => (
              <div key={b.title} className="flex items-center gap-3 justify-center">
                <b.icon className="w-5 h-5 flex-shrink-0" style={{ color: roseGold }} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: textDark, fontFamily: `'${fontCorpo}', sans-serif` }}>{b.title}</p>
                  <p className="text-[10px]" style={{ color: textMuted, fontFamily: `'${fontCorpo}', sans-serif` }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Selos de Confiança */}
          {config.selos_confianca && config.selos_confianca.length > 0 && (
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 pt-4 border-t flex-wrap" style={{ borderColor: '#F0E6E0' }}>
              {config.selos_confianca.map(selo => {
                const info = SELOS_MAP[selo];
                if (!info) return null;
                return (
                  <div key={selo} className="flex items-center gap-1.5">
                    <span className="text-sm">{info.icon}</span>
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: textMuted, fontFamily: `'${fontCorpo}', sans-serif` }}>{info.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Dynamic Sections based on secoes_homepage config */}
      {(() => {
        const defaultSections: SectionConfig[] = [
          { id: '1', tipo: 'colecoes', titulo: 'Coleções', visivel: true, ordem: 0 },
          { id: '2', tipo: 'countdown', titulo: 'Countdown', visivel: false, ordem: 1 },
          { id: '3', tipo: 'produtos_destaque', titulo: 'Destaques', visivel: true, ordem: 2 },
          { id: '4', tipo: 'mais_vendidos', titulo: 'Mais Vendidos', visivel: true, ordem: 3 },
          { id: '5', tipo: 'lookbook', titulo: 'Lookbook', visivel: false, ordem: 4 },
          { id: '6', tipo: 'novidades', titulo: 'Novidades', visivel: true, ordem: 5 },
          { id: '7', tipo: 'sobre_marca', titulo: 'Sobre a Marca', visivel: false, ordem: 6 },
          { id: '8', tipo: 'instagram_cta', titulo: 'CTA Instagram', visivel: false, ordem: 7 },
          { id: '9', tipo: 'newsletter', titulo: 'Newsletter', visivel: true, ordem: 8 },
        ];
        const sections = (config.secoes_homepage && Array.isArray(config.secoes_homepage) && config.secoes_homepage.length > 0)
          ? [...config.secoes_homepage].sort((a, b) => a.ordem - b.ordem)
          : defaultSections;

        const destaqueIds: string[] = config.produtos_destaque_ids || [];
        const destaquePecas = destaqueIds.length > 0 ? pecas.filter(p => destaqueIds.includes(p.id)) : pecas.slice(0, 8);
        const maisVendidosIds: string[] = config.mais_vendidos_ids || [];
        const maisVendidosPecas = maisVendidosIds.length > 0 ? pecas.filter(p => maisVendidosIds.includes(p.id)) : [];

        const renderProductCarousel = (items: Peca[], badge: { text: string; color: string } | null) => (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {items.map((peca, i) => (
              <motion.div key={peca.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex-shrink-0 w-56 snap-start group cursor-pointer" onClick={() => setSelectedPeca(peca)}>
                <div className="relative overflow-hidden aspect-square" style={{ backgroundColor: '#F5EEEA' }}>
                  {peca.imagem_url ? <img src={peca.imagem_url} alt={peca.nome} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8" style={{ color: roseGoldLight }} /></div>}
                  {badge && <span className="absolute top-3 left-3 text-[9px] uppercase tracking-wider px-2 py-1 text-white" style={{ backgroundColor: badge.color }}>{badge.text}</span>}
                </div>
                <div className="pt-3 text-center">
                  <h4 className="text-sm font-light" style={{ color: textDark }}>{peca.nome}</h4>
                  <p className="text-sm font-semibold mt-1" style={{ color: roseGold }}>{formatCurrency(peca.preco_venda)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        );

        const SectionTitle = ({ subtitle, title }: { subtitle?: string; title: string }) => (
          <div className="text-center mb-8">
            {subtitle && <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: roseGold, fontFamily: "'Inter', sans-serif" }}>{subtitle}</p>}
            <h3 className="text-2xl sm:text-3xl font-light" style={{ color: textDark, fontFamily: `'${fontTitulos}', serif` }}>{title}</h3>
            <div className="w-12 h-[1px] mx-auto mt-3" style={{ backgroundColor: roseGold }} />
          </div>
        );

        const renderSection = (s: SectionConfig) => {
          if (!s.visivel) return null;
          switch (s.tipo) {
            case 'colecoes':
              return <ColecoesDestaque key={s.id} colecoes={config.colecoes_destaque || []} categorias={categorias} produtos={pecas} fontTitulos={fontTitulos} corPrimaria={roseGold} onCategoriaClick={(cat) => { setCategoriaFilter(cat); document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' }); }} />;
            case 'countdown':
              return <CountdownSection key={s.id} ativo={config.countdown_ativo || false} titulo={config.countdown_titulo} subtitulo={config.countdown_subtitulo} dataFim={config.countdown_data_fim} corPrimaria={roseGold} fontTitulos={fontTitulos} onVerProdutos={() => document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' })} />;
            case 'produtos_destaque':
              if (destaquePecas.length === 0) return null;
              return (<section key={s.id} className="py-12 border-t" style={{ borderColor: '#F0E6E0', backgroundColor: warmWhite }}><div className="max-w-7xl mx-auto px-4"><SectionTitle title="Destaques" />{renderProductCarousel(destaquePecas, { text: '⭐ Destaque', color: '#DAA520' })}</div></section>);
            case 'mais_vendidos':
              if (maisVendidosPecas.length === 0) return null;
              return (<section key={s.id} className="py-12 border-t" style={{ borderColor: '#F0E6E0', backgroundColor: cream }}><div className="max-w-7xl mx-auto px-4"><SectionTitle title="Mais Vendidos" />{renderProductCarousel(maisVendidosPecas, { text: '🔥 Mais Vendido', color: '#F59E0B' })}</div></section>);
            case 'lookbook':
              return <LookbookSection key={s.id} ativo={config.lookbook_ativo || false} titulo={config.lookbook_titulo} imagens={config.lookbook_imagens || []} pecas={pecas} corPrimaria={roseGold} fontTitulos={fontTitulos} />;
            case 'novidades':
              if (pecas.length === 0) return null;
              return (<section key={s.id} id="novidades" className="py-14 border-t" style={{ borderColor: '#F0E6E0', backgroundColor: warmWhite }}><div className="max-w-7xl mx-auto px-4"><SectionTitle subtitle="Acabaram de Chegar" title="Novidades" />{renderProductCarousel(pecas.slice(0, 8), { text: 'Novo', color: roseGold })}</div></section>);
            case 'sobre_marca':
              return (
                <section key={s.id} id="sobre-marca" className="py-14 border-t" style={{ borderColor: '#F0E6E0', backgroundColor: warmWhite }}>
                  <div className="max-w-5xl mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 items-center">
                      <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: roseGold, fontFamily: "'Inter', sans-serif" }}>Nossa História</p>
                        <h3 className="text-2xl sm:text-3xl font-light leading-snug mb-4" style={{ color: textDark }}>Cada peça conta<br /><span className="italic" style={{ color: roseGold }}>uma história única</span></h3>
                        <p className="text-sm leading-relaxed" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>{config.descricao || 'Nascemos da paixão por joias que transcendem tendências.'}</p>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
                        <div className="aspect-[4/5] overflow-hidden" style={{ backgroundColor: '#F5EEEA' }}>
                          {pecas[0]?.imagem_url ? <img src={pecas[0].imagem_url} alt="Sobre" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Heart className="w-16 h-16" style={{ color: roseGoldLight }} /></div>}
                        </div>
                        <div className="absolute -bottom-4 -left-4 w-32 h-32 border-2" style={{ borderColor: roseGold, zIndex: -1 }} />
                      </motion.div>
                    </div>
                  </div>
                </section>
              );
            case 'instagram_cta':
              if (!config.instagram) return null;
              return (
                <section key={s.id} className="py-14 border-t text-center" style={{ borderColor: '#F0E6E0', backgroundColor: cream }}>
                  <div className="max-w-3xl mx-auto px-4">
                    <Instagram className="w-8 h-8 mx-auto mb-4" style={{ color: roseGold }} />
                    <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: roseGold, fontFamily: "'Inter', sans-serif" }}>Siga-nos no Instagram</p>
                    <h3 className="text-2xl sm:text-3xl font-light mb-3" style={{ color: textDark }}>@{config.instagram!.replace('@', '')}</h3>
                    <a href={`https://instagram.com/${config.instagram!.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      className="inline-block px-8 py-3 text-xs uppercase tracking-[0.2em] border-2 transition-all"
                      style={{ borderColor: roseGold, color: roseGold, fontFamily: "'Inter', sans-serif" }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = roseGold; (e.target as HTMLElement).style.color = 'white'; }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; (e.target as HTMLElement).style.color = roseGold; }}>
                      Seguir Agora
                    </a>
                  </div>
                </section>
              );
            case 'newsletter':
              return (
                <section key={s.id} className="py-14 border-t" style={{ borderColor: '#F0E6E0', backgroundColor: roseGold }}>
                  <div className="max-w-2xl mx-auto px-4 text-center">
                    <Sparkles className="w-6 h-6 mx-auto mb-4 text-white/80" />
                    <h3 className="text-2xl sm:text-3xl font-light text-white mb-2">Fique por dentro</h3>
                    <p className="text-sm text-white/70 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>Cadastre-se e receba ofertas exclusivas em primeira mão.</p>
                    <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newsletterEmail.trim() || !config) return;
                      setNewsletterLoading(true);
                      try {
                        const { error } = await supabase.from('newsletter_subscribers' as any).insert({ email: newsletterEmail.trim().toLowerCase(), organization_id: config.organization_id });
                        if (error) { if (error.code === '23505') toast.info('E-mail já cadastrado!'); else throw error; }
                        else { toast.success('Cadastro realizado! 🎉'); setNewsletterEmail(''); }
                      } catch { toast.error('Erro ao cadastrar.'); }
                      finally { setNewsletterLoading(false); }
                    }}>
                      <input type="email" required value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} placeholder="Seu melhor e-mail"
                        className="flex-1 px-4 py-3 text-sm bg-white/10 border border-white/30 text-white placeholder-white/50 outline-none focus:border-white/60" style={{ fontFamily: "'Inter', sans-serif" }} />
                      <button type="submit" disabled={newsletterLoading} className="px-6 py-3 text-xs uppercase tracking-[0.2em] bg-white transition-all hover:opacity-90 disabled:opacity-60" style={{ color: roseGold, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                        {newsletterLoading ? 'Enviando...' : 'Cadastrar'}
                      </button>
                    </form>
                  </div>
                </section>
              );
            default: return null;
          }
        };

        return sections.map(renderSection);
      })()}

      {/* Products Section */}
      <section id="produtos" className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: roseGold, fontFamily: "'Inter', sans-serif" }}>Nossa Coleção</p>
          <h3 className="text-2xl sm:text-3xl font-light" style={{ color: textDark }}>
            {categoriaFilter !== 'todas' ? (materialFilter !== 'todos' ? `${categoriaFilter} — ${materialFilter}` : categoriaFilter) : 'Todas as Peças'}
          </h3>
          <div className="w-12 h-[1px] mx-auto mt-3" style={{ backgroundColor: roseGold }} />
        </div>

        {/* Filters: Category Pills */}
        {categorias.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <button onClick={() => { setCategoriaFilter('todas'); setMaterialFilter('todos'); setExpandedCat(null); }}
                className="px-5 py-2 text-[11px] uppercase tracking-[0.15em] border transition-all"
                style={{ borderColor: categoriaFilter === 'todas' ? roseGold : '#E0D5CF', backgroundColor: categoriaFilter === 'todas' ? roseGold : 'transparent', color: categoriaFilter === 'todas' ? 'white' : textMuted, fontFamily: "'Inter', sans-serif" }}>
                Todos
              </button>
              {categorias.map(cat => {
                const isActive = categoriaFilter === cat;
                const hasSubcats = categoryTree[cat] && categoryTree[cat].length > 0;
                return (
                  <button key={cat}
                    onClick={() => { setCategoriaFilter(cat); setMaterialFilter('todos'); setExpandedCat(isActive && expandedCat === cat ? null : cat); }}
                    className="px-5 py-2 text-[11px] uppercase tracking-[0.15em] border transition-all flex items-center gap-1.5"
                    style={{ borderColor: isActive ? roseGold : '#E0D5CF', backgroundColor: isActive ? roseGold : 'transparent', color: isActive ? 'white' : textMuted, fontFamily: "'Inter', sans-serif" }}>
                    {cat}
                    {hasSubcats && <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: isActive && expandedCat === cat ? 'rotate(180deg)' : 'rotate(0deg)' }} />}
                  </button>
                );
              })}
            </div>
            <AnimatePresence>
              {categoriaFilter !== 'todas' && materiais.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="flex items-center justify-center gap-2 flex-wrap pt-2 pb-1">
                    <span className="text-[10px] uppercase tracking-wider mr-1" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>Material:</span>
                    <button onClick={() => setMaterialFilter('todos')}
                      className="px-3 py-1 text-[10px] uppercase tracking-wider rounded-full border transition-all"
                      style={{ borderColor: materialFilter === 'todos' ? roseGoldDark : '#E0D5CF', backgroundColor: materialFilter === 'todos' ? roseGoldDark : 'transparent', color: materialFilter === 'todos' ? 'white' : textMuted, fontFamily: "'Inter', sans-serif" }}>
                      Todos
                    </button>
                    {materiais.map(mat => (
                      <button key={mat} onClick={() => setMaterialFilter(mat)}
                        className="px-3 py-1 text-[10px] uppercase tracking-wider rounded-full border transition-all"
                        style={{ borderColor: materialFilter === mat ? roseGoldDark : '#E0D5CF', backgroundColor: materialFilter === mat ? roseGoldDark : 'transparent', color: materialFilter === mat ? 'white' : textMuted, fontFamily: "'Inter', sans-serif" }}>
                        {mat}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sort + Price Filter Bar */}
        {(mostrarFiltros || mostrarOrdenacao) && (
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-xs" style={{ color: textMuted, fontFamily: `'${fontCorpo}', sans-serif` }}>
            {filteredPecas.length} produto{filteredPecas.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-3">
            {/* Price filter toggle */}
            {mostrarFiltros && (
            <button onClick={() => setShowPriceFilter(!showPriceFilter)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider border transition-all"
              style={{ borderColor: showPriceFilter ? roseGold : '#E0D5CF', color: showPriceFilter ? roseGold : textMuted, fontFamily: `'${fontCorpo}', sans-serif` }}>
              💰 Preço
            </button>
            )}
            {/* Sort */}
            {mostrarOrdenacao && (
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5" style={{ color: textMuted }} />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="text-[10px] uppercase tracking-wider bg-transparent border-b outline-none cursor-pointer py-1"
                style={{ borderColor: '#E0D5CF', color: textDark, fontFamily: `'${fontCorpo}', sans-serif` }}>
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            )}
          </div>
        </div>
        )}

        {/* Price Range Slider */}
        <AnimatePresence>
          {showPriceFilter && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <div className="p-4 border" style={{ borderColor: '#F0E6E0', backgroundColor: warmWhite }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>
                    Faixa de Preço
                  </span>
                  <span className="text-xs font-semibold" style={{ color: roseGold, fontFamily: "'Inter', sans-serif" }}>
                    {formatCurrency(priceRange[0])} — {formatCurrency(priceRange[1])}
                  </span>
                </div>
                <Slider
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  step={10}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  className="w-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="gap-4 sm:gap-6" style={{ display: 'grid', gridTemplateColumns: `repeat(${colunasMobile}, minmax(0, 1fr))` }}
          ref={(el) => { if (el && window.innerWidth >= 640) el.style.gridTemplateColumns = `repeat(${Math.min(colunasDesktop, 3)}, minmax(0, 1fr))`; if (el && window.innerWidth >= 1024) el.style.gridTemplateColumns = `repeat(${colunasDesktop}, minmax(0, 1fr))`; }}>
          {filteredPecas.map((peca, index) => (
            <motion.div key={peca.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.03 }}
              className="group cursor-pointer" onClick={() => setSelectedPeca(peca)}>
              <div className="relative overflow-hidden" style={{ backgroundColor: '#F5EEEA' }}>
                <div className="aspect-square overflow-hidden">
                  {peca.imagem_url ? (
                    <img src={peca.imagem_url} alt={peca.nome} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10" style={{ color: roseGoldLight }} /></div>
                  )}
                </div>
                {/* Hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                  <button className="px-5 py-2 text-[10px] uppercase tracking-[0.15em] text-white transition-transform translate-y-2 group-hover:translate-y-0"
                    style={{ backgroundColor: roseGold, fontFamily: "'Inter', sans-serif" }}
                    onClick={(e) => { e.stopPropagation(); addToCart(peca); }}>
                    Adicionar à Sacola
                  </button>
                </div>
                {/* Wishlist heart */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleWishlist(peca.id); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/80 hover:bg-white shadow-sm"
                >
                  <Heart className="w-4 h-4" style={{ color: roseGold }} fill={wishlist.has(peca.id) ? roseGold : 'none'} />
                </button>
                {/* Badges */}
                {/* Config badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {peca.estoque <= 3 && peca.estoque > 0 && (
                    <span className="text-[9px] uppercase tracking-wider px-2 py-1 text-white" style={{ backgroundColor: roseGoldDark, fontFamily: "'Inter', sans-serif" }}>Últimas peças</span>
                  )}
                  {peca.estoque === 0 && (
                    <span className="text-[9px] uppercase tracking-wider px-2 py-1 text-white" style={{ backgroundColor: textMuted, fontFamily: "'Inter', sans-serif" }}>Esgotado</span>
                  )}
                  {config.badges_produto?.includes('novo') && index < 4 && peca.estoque > 0 && (
                    <span className="text-[9px] uppercase tracking-wider px-2 py-1 text-white" style={{ backgroundColor: '#10B981', fontFamily: "'Inter', sans-serif" }}>Novo</span>
                  )}
                  {config.badges_produto?.includes('mais_vendido') && avaliacoes[peca.id]?.total >= 3 && (
                    <span className="text-[9px] uppercase tracking-wider px-2 py-1 text-white" style={{ backgroundColor: '#F59E0B', fontFamily: "'Inter', sans-serif" }}>Mais Vendido</span>
                  )}
                </div>
              </div>
              <div className="pt-3 pb-1 text-center">
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>
                  {[peca.categoria, peca.material].filter(Boolean).join(' · ') || ''}
                </p>
                <h4 className="text-sm sm:text-base font-light leading-snug" style={{ color: textDark }}>{peca.nome}</h4>
                <p className="text-sm font-semibold mt-1" style={{ color: roseGold, fontFamily: "'Inter', sans-serif" }}>{formatCurrency(peca.preco_venda)}</p>
                {mostrarParcelamento && <p className="text-[10px] mt-0.5" style={{ color: textMuted, fontFamily: `'${fontCorpo}', sans-serif` }}>ou {parcelamentoMax}x de {formatCurrency(peca.preco_venda / parcelamentoMax)}</p>}
                {avaliacoes[peca.id] && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className="w-2.5 h-2.5" fill={n <= Math.round(avaliacoes[peca.id].media) ? '#F5A623' : 'none'} stroke={n <= Math.round(avaliacoes[peca.id].media) ? '#F5A623' : '#D0D0D0'} strokeWidth={1.5} />
                      ))}
                    </div>
                    <span className="text-[9px]" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>({avaliacoes[peca.id].total})</span>
                  </div>
                )}
                {config.mostrar_estoque && peca.estoque > 0 && peca.estoque <= 5 && (
                  <p className="text-[10px] mt-0.5" style={{ color: roseGoldDark, fontFamily: "'Inter', sans-serif" }}>Restam {peca.estoque} un.</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPecas.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: roseGoldLight }} />
            <p style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>Nenhum produto encontrado</p>
          </div>
        )}
      </section>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedPeca} onOpenChange={() => setSelectedPeca(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 shadow-2xl rounded-2xl" style={{ backgroundColor: warmWhite }}>
          {selectedPeca && (
            <div className="flex flex-col md:flex-row">
              {/* Image Section - Enhanced */}
              <div className="md:w-[55%] relative group overflow-hidden" style={{ backgroundColor: '#F8F3F0' }}>
                {selectedPeca.imagem_url ? (
                  <img 
                    src={selectedPeca.imagem_url} 
                    alt={selectedPeca.nome} 
                    className="w-full h-full object-cover aspect-square md:aspect-auto md:min-h-[520px] transition-transform duration-700 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full aspect-square md:min-h-[520px] flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: `${roseGold}15` }}>
                      <Package className="w-10 h-10" style={{ color: roseGoldLight }} />
                    </div>
                    <p className="text-xs" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>Imagem não disponível</p>
                  </div>
                )}
                {/* Wishlist floating button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleWishlist(selectedPeca.id); }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:bg-white"
                >
                  <Heart className="w-5 h-5" style={{ color: roseGold }} fill={wishlist.has(selectedPeca.id) ? roseGold : 'none'} />
                </button>
                {selectedPeca.estoque > 0 && selectedPeca.estoque <= 5 && config.mostrar_estoque && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white" style={{ backgroundColor: '#E67E22', fontFamily: "'Inter', sans-serif" }}>
                    Últimas {selectedPeca.estoque} unidades
                  </div>
                )}
              </div>

              {/* Details Section - Enhanced */}
              <div className="md:w-[45%] p-7 md:p-8 flex flex-col overflow-y-auto max-h-[85vh]">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[10px] mb-4" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>
                  <span className="cursor-pointer hover:underline transition-colors" onClick={() => { setSelectedPeca(null); setCategoriaFilter('todas'); }}>Início</span>
                  {selectedPeca.categoria && (
                    <><ChevronRight className="w-2.5 h-2.5" /><span className="cursor-pointer hover:underline transition-colors" onClick={() => { setSelectedPeca(null); setCategoriaFilter(selectedPeca.categoria!); }}>{selectedPeca.categoria}</span></>
                  )}
                  <ChevronRight className="w-2.5 h-2.5" /><span className="font-medium" style={{ color: textDark }}>{selectedPeca.nome}</span>
                </div>

                {/* Category & Material Tag */}
                <p className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: roseGold, fontFamily: "'Inter', sans-serif" }}>
                  {[selectedPeca.categoria, selectedPeca.material].filter(Boolean).join(' · ') || 'Peça exclusiva'}
                </p>

                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-light leading-tight tracking-tight" style={{ color: textDark, fontFamily: `'${fontTitulos}', serif` }}>{selectedPeca.nome}</h3>
                {selectedPeca.codigo && <p className="text-[10px] mt-1.5 font-medium" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>Cód: {selectedPeca.codigo}</p>}

                {/* Divider */}
                <div className="w-10 h-[1px] my-4" style={{ backgroundColor: roseGold }} />

                {/* Price Section */}
                <div className="mb-4">
                  <p className="text-3xl font-bold tracking-tight" style={{ color: roseGold, fontFamily: "'Inter', sans-serif" }}>{formatCurrency(selectedPeca.preco_venda)}</p>
                  <p className="text-[11px] mt-1" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>
                    ou <strong>{parcelamentoMax}x</strong> de <strong>{formatCurrency(selectedPeca.preco_venda / parcelamentoMax)}</strong> sem juros
                  </p>
                </div>

                {/* Description */}
                {selectedPeca.descricao && (
                  <p className="text-sm leading-relaxed mb-4" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>{selectedPeca.descricao}</p>
                )}

                {/* Material Badge */}
                {selectedPeca.material && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>Material:</span>
                    <span className="px-3 py-1 text-[10px] font-medium rounded-full border" style={{ borderColor: roseGold, color: roseGold, fontFamily: "'Inter', sans-serif" }}>{selectedPeca.material}</span>
                  </div>
                )}

                {/* Availability */}
                <div className="flex items-center gap-2 text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: selectedPeca.estoque > 0 ? '#E8F5E9' : '#FFF3E0', fontFamily: "'Inter', sans-serif" }}>
                  {config.mostrar_estoque !== false ? (
                    selectedPeca.estoque > 0 ? (
                      <span className="font-medium" style={{ color: '#2E7D32' }}>✓ Em estoque ({selectedPeca.estoque} un.)</span>
                    ) : (
                      <span className="font-medium" style={{ color: '#E65100' }}>✕ Esgotado</span>
                    )
                  ) : (
                    selectedPeca.estoque > 0 ? (
                      <span className="font-medium" style={{ color: '#2E7D32' }}>✓ Disponível</span>
                    ) : (
                      <span className="font-medium" style={{ color: '#E65100' }}>✕ Esgotado</span>
                    )
                  )}
                </div>

                {/* Share buttons */}
                <ProductShareButtons
                  productName={selectedPeca.nome}
                  productUrl={getProductUrl(selectedPeca)}
                  whatsapp={config.whatsapp}
                  roseGold={roseGold}
                  textMuted={textMuted}
                />

                {/* CTA Button */}
                {selectedPeca.estoque > 0 ? (
                  <button 
                    className="w-full mt-5 py-4 text-white text-xs uppercase tracking-[0.2em] font-semibold transition-all hover:opacity-90 hover:shadow-lg rounded-lg"
                    style={{ backgroundColor: roseGold, fontFamily: "'Inter', sans-serif" }}
                    onClick={() => { addToCart(selectedPeca); setSelectedPeca(null); }}>
                    Adicionar à Sacola
                  </button>
                ) : (
                  <div className="mt-5 space-y-3 p-4 rounded-lg border" style={{ borderColor: '#E0D5CF' }}>
                    <p className="text-xs text-center font-medium flex items-center justify-center gap-1.5" style={{ color: textDark, fontFamily: "'Inter', sans-serif" }}>
                      <Bell className="w-3.5 h-3.5" />Avise-me quando disponível
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="email" placeholder="Seu melhor e-mail" value={aviseEmail}
                        onChange={e => setAviseEmail(e.target.value)}
                        className="flex-1 px-3 py-2.5 text-xs border outline-none rounded-lg transition-all focus:ring-2"
                        style={{ borderColor: '#E0D5CF', fontFamily: "'Inter', sans-serif", ['--tw-ring-color' as string]: `${roseGold}40` }}
                      />
                      <button onClick={() => handleAviseMe(selectedPeca.id)} disabled={aviseLoading}
                        className="px-5 py-2.5 text-[10px] uppercase font-semibold text-white disabled:opacity-50 rounded-lg transition-all hover:opacity-90"
                        style={{ backgroundColor: roseGold, fontFamily: "'Inter', sans-serif" }}>
                        {aviseLoading ? '...' : 'Avisar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {config.avaliacoes_ativas !== false && (
                  <div className="mt-6 pt-5 border-t" style={{ borderColor: '#F0E6E0' }}>
                    <ProductReviews
                      pecaId={selectedPeca.id}
                      organizationId={config.organization_id}
                      roseGold={roseGold}
                      textDark={textDark}
                      textMuted={textMuted}
                    />
                  </div>
                )}

                {/* Produtos Relacionados */}
                <ProdutosRelacionados
                  pecaAtual={selectedPeca}
                  todasPecas={pecas}
                  corPrimaria={roseGold}
                  onSelect={(p: any) => setSelectedPeca(p as Peca)}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Depoimentos - Stories */}
      <section id="depoimentos" className="py-14 border-t" style={{ borderColor: '#F0E6E0', backgroundColor: cream }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: roseGold, fontFamily: "'Inter', sans-serif" }}>O Que Dizem</p>
            <h3 className="text-2xl sm:text-3xl font-light" style={{ color: textDark }}>Nossas Clientes</h3>
            <div className="w-12 h-[1px] mx-auto mt-3" style={{ backgroundColor: roseGold }} />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-2">
            {[
              { nome: 'Ana Paula', texto: 'Peças incríveis! Qualidade impressionante.', estrelas: 5, iniciais: 'AP', cor: '#B76E79' },
              { nome: 'Camila R.', texto: 'Entrega rápida e embalagem linda.', estrelas: 5, iniciais: 'CR', cor: '#D4A0A7' },
              { nome: 'Juliana M.', texto: 'Atendimento excepcional!', estrelas: 5, iniciais: 'JM', cor: '#8B4F57' },
              { nome: 'Fernanda L.', texto: 'Uso minhas peças todo dia! Recomendo.', estrelas: 5, iniciais: 'FL', cor: '#C08B93' },
              { nome: 'Mariana S.', texto: 'Presente perfeito pra minha mãe!', estrelas: 5, iniciais: 'MS', cor: '#9E6B73' },
              { nome: 'Patrícia G.', texto: 'Terceira compra. Qualidade consistente.', estrelas: 5, iniciais: 'PG', cor: '#B76E79' },
            ].map((dep, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="flex-shrink-0 snap-start w-[160px] sm:w-[180px] cursor-pointer group">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-full p-[3px] transition-transform group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${dep.cor}, ${roseGold}, #E8C8CC)` }}>
                      <div className="w-full h-full rounded-full flex items-center justify-center text-base sm:text-lg font-semibold" style={{ backgroundColor: warmWhite, color: dep.cor, fontFamily: "'Cormorant Garamond', serif" }}>{dep.iniciais}</div>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: roseGold }}><Star className="w-2.5 h-2.5 text-white" fill="white" /></div>
                  </div>
                  <p className="text-[11px] font-medium text-center truncate w-full" style={{ color: textDark, fontFamily: "'Inter', sans-serif" }}>{dep.nome}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none mt-2">
                  <div className="p-3 border text-center shadow-lg" style={{ borderColor: '#F0E6E0', backgroundColor: warmWhite }}>
                    <div className="flex justify-center gap-0.5 mb-2">{Array.from({ length: dep.estrelas }).map((_, s) => <Star key={s} className="w-3 h-3" style={{ color: roseGold }} fill={roseGold} />)}</div>
                    <p className="text-[10px] leading-relaxed italic" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>"{dep.texto}"</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: '#F0E6E0', backgroundColor: textDark }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <h4 className="text-lg tracking-[0.2em] uppercase mb-4" style={{ color: roseGoldLight }}>{config.nome_loja}</h4>
              <p className="text-xs leading-relaxed mb-4" style={{ color: '#9A9A9A', fontFamily: "'Inter', sans-serif" }}>
                {config.descricao || 'Joias exclusivas com a qualidade que você merece.'}
              </p>
              <div className="flex items-center gap-3">
                {config.whatsapp && <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} className="w-8 h-8 border border-white/20 flex items-center justify-center hover:border-white/50" style={{ color: roseGoldLight }}><Phone className="w-3.5 h-3.5" /></a>}
                {config.instagram && <a href={`https://instagram.com/${config.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 border border-white/20 flex items-center justify-center hover:border-white/50" style={{ color: roseGoldLight }}><Instagram className="w-3.5 h-3.5" /></a>}
                {config.facebook && <a href={config.facebook.startsWith('http') ? config.facebook : `https://facebook.com/${config.facebook}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 border border-white/20 flex items-center justify-center hover:border-white/50" style={{ color: roseGoldLight }}><span className="text-xs font-bold">f</span></a>}
              </div>
            </div>
            <div>
              <h5 className="text-xs uppercase tracking-[0.2em] mb-4 font-semibold" style={{ color: roseGoldLight, fontFamily: "'Inter', sans-serif" }}>
                {(config as any).rodape_coluna1_titulo || 'Institucional'}
              </h5>
              <ul className="space-y-2.5">
                {(config as any).rodape_coluna1_links && (config as any).rodape_coluna1_links.length > 0 ? (
                  (config as any).rodape_coluna1_links.map((item: any, i: number) => (
                    <li key={i}><a href={item.url || '#'} className="text-xs hover:text-white text-left block" style={{ color: '#9A9A9A', fontFamily: "'Inter', sans-serif" }}>{item.label}</a></li>
                  ))
                ) : (
                  [
                    { label: 'Sobre Nós', action: () => document.getElementById('sobre-marca')?.scrollIntoView({ behavior: 'smooth' }) },
                    { label: 'Nossas Coleções', action: () => document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' }) },
                    { label: 'Novidades', action: () => document.getElementById('novidades')?.scrollIntoView({ behavior: 'smooth' }) },
                    { label: 'Depoimentos', action: () => document.getElementById('depoimentos')?.scrollIntoView({ behavior: 'smooth' }) },
                  ].map(item => (
                    <li key={item.label}><button onClick={item.action} className="text-xs hover:text-white text-left" style={{ color: '#9A9A9A', fontFamily: "'Inter', sans-serif" }}>{item.label}</button></li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h5 className="text-xs uppercase tracking-[0.2em] mb-4 font-semibold" style={{ color: roseGoldLight, fontFamily: "'Inter', sans-serif" }}>
                {(config as any).rodape_coluna2_titulo || 'Ajuda'}
              </h5>
              <ul className="space-y-2.5">
                {(config as any).rodape_coluna2_links && (config as any).rodape_coluna2_links.length > 0 ? (
                  (config as any).rodape_coluna2_links.map((item: any, i: number) => (
                    <li key={i}><a href={item.url || '#'} className="text-xs hover:text-white text-left block" style={{ color: '#9A9A9A', fontFamily: "'Inter', sans-serif" }}>{item.label}</a></li>
                  ))
                ) : (
                  [
                    { label: 'Trocas e Devoluções', action: () => setPolicyModal({ title: 'Trocas e Devoluções', content: config.politica_troca || `Primeira troca gratuita em até 7 dias.\n\nCondições:\n• Produto em perfeito estado.\n• Acompanhar embalagem e nota.\n• Solicite pelo WhatsApp${config.whatsapp ? ` (${config.whatsapp})` : ''}.` }) },
                    { label: 'Prazo de Entrega', action: () => setPolicyModal({ title: 'Prazo de Entrega', content: `Capitais: 3-7 dias úteis\nInterior: 5-12 dias úteis\nRegiões remotas: 7-15 dias úteis${config.frete_gratis_acima ? `\n\n✦ Frete grátis acima de R$ ${config.frete_gratis_acima.toFixed(0)}.` : ''}` }) },
                    { label: 'Formas de Pagamento', action: () => setPolicyModal({ title: 'Formas de Pagamento', content: config.metodos_pagamento?.length ? `Formas aceitas:\n${config.metodos_pagamento.map(m => `• ${m.charAt(0).toUpperCase() + m.slice(1)}`).join('\n')}\n\nProcessado pelo Mercado Pago.` : 'Cartão de crédito (até 12x)\nCartão de débito\nPIX\nBoleto bancário\n\nProcessado pelo Mercado Pago.' }) },
                    { label: 'Central de Ajuda', action: () => { if (config.whatsapp) window.open(`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=Olá! Preciso de ajuda.`, '_blank'); else if (config.email_contato) window.location.href = `mailto:${config.email_contato}`; else toast.info('Entre em contato pelo Instagram.'); } },
                  ].map(item => (
                    <li key={item.label}><button onClick={item.action} className="text-xs hover:text-white text-left" style={{ color: '#9A9A9A', fontFamily: "'Inter', sans-serif" }}>{item.label}</button></li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h5 className="text-xs uppercase tracking-[0.2em] mb-4 font-semibold" style={{ color: roseGoldLight, fontFamily: "'Inter', sans-serif" }}>Contato</h5>
              <ul className="space-y-2.5">
                {config.whatsapp && <li className="flex items-center gap-2"><Phone className="w-3 h-3" style={{ color: roseGoldLight }} /><span className="text-xs" style={{ color: '#9A9A9A', fontFamily: "'Inter', sans-serif" }}>{config.whatsapp}</span></li>}
                {config.email_contato && <li className="flex items-center gap-2"><span className="text-xs" style={{ color: roseGoldLight }}>✉</span><a href={`mailto:${config.email_contato}`} className="text-xs hover:text-white" style={{ color: '#9A9A9A', fontFamily: "'Inter', sans-serif" }}>{config.email_contato}</a></li>}
                {config.instagram && <li className="flex items-center gap-2"><Instagram className="w-3 h-3" style={{ color: roseGoldLight }} /><span className="text-xs" style={{ color: '#9A9A9A', fontFamily: "'Inter', sans-serif" }}>@{config.instagram.replace('@', '')}</span></li>}
              </ul>
              {/* Horário de Funcionamento */}
              {(config as any).rodape_endereco && (
                <div className="mt-4">
                  <h6 className="text-[10px] uppercase tracking-[0.15em] mb-2 font-semibold" style={{ color: roseGoldLight, fontFamily: "'Inter', sans-serif" }}>Endereço</h6>
                  <p className="text-[10px]" style={{ color: '#9A9A9A', fontFamily: "'Inter', sans-serif" }}>{(config as any).rodape_endereco}</p>
                </div>
              )}
              {config.horario_funcionamento && Object.keys(config.horario_funcionamento).length > 0 && (
                <div className="mt-4">
                  <h6 className="text-[10px] uppercase tracking-[0.15em] mb-2 font-semibold" style={{ color: roseGoldLight, fontFamily: "'Inter', sans-serif" }}>Horário</h6>
                  <ul className="space-y-1">
                    {Object.entries(config.horario_funcionamento as Record<string, { aberto: boolean; inicio: string; fim: string }>)
                      .filter(([, v]) => v.aberto)
                      .map(([dia, v]) => (
                        <li key={dia} className="text-[10px]" style={{ color: '#9A9A9A', fontFamily: "'Inter', sans-serif" }}>
                          <span className="capitalize">{dia}</span>: {v.inicio} - {v.fim}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div>
              <p className="text-[10px]" style={{ color: '#6A6A6A', fontFamily: `'${fontCorpo}', sans-serif` }}>© {new Date().getFullYear()} {config.nome_loja}. Todos os direitos reservados.</p>
              {config.texto_rodape && <p className="text-[10px] mt-1" style={{ color: '#5A5A5A', fontFamily: `'${fontCorpo}', sans-serif` }}>{config.texto_rodape}</p>}
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: 'Política de Privacidade', content: config.politica_privacidade || `A ${config.nome_loja} respeita sua privacidade.\n\nDados coletados: nome, e-mail, telefone e endereço para pedidos.\nSeus dados nunca serão vendidos.` },
                { label: 'Termos de Uso', content: `Ao utilizar a loja, você concorda que:\n1. Preços sujeitos a alteração.\n2. Imagens ilustrativas.\n3. Conteúdo protegido por direitos autorais.` },
                { label: 'Cookies', content: 'Utilizamos cookies para manter sua sessão, analisar tráfego e personalizar ofertas.' },
              ].map(item => (
                <button key={item.label} onClick={() => setPolicyModal({ title: item.label, content: item.content })} className="text-[10px] hover:text-white" style={{ color: '#6A6A6A', fontFamily: "'Inter', sans-serif" }}>{item.label}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <Dialog open={!!policyModal} onOpenChange={() => setPolicyModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto border" style={{ borderColor: '#F0E6E0', backgroundColor: warmWhite }}>
          <DialogHeader>
            <DialogTitle className="text-lg tracking-wide uppercase" style={{ color: textDark, fontFamily: "'Cormorant Garamond', serif" }}>{policyModal?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 whitespace-pre-line text-sm leading-relaxed" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>{policyModal?.content}</div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border" style={{ borderColor: '#F0E6E0', backgroundColor: warmWhite }}>
          <DialogHeader>
            <DialogTitle className="text-lg tracking-wide uppercase" style={{ color: textDark, fontFamily: "'Cormorant Garamond', serif" }}>
              {checkoutStep === 'dados' && 'Dados para Entrega'}
              {checkoutStep === 'metodo' && 'Forma de Pagamento'}
              {checkoutStep === 'pagamento' && 'Pagamento'}
              {checkoutStep === 'pix' && 'Pagamento via PIX'}
              {checkoutStep === 'confirmacao' && 'Pedido Confirmado!'}
            </DialogTitle>
          </DialogHeader>

          <CheckoutProgress currentStep={checkoutStep as any} corPrimaria={roseGold} />

          {checkoutStep === 'dados' && (
            <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Nome completo *</Label>
                <Input value={cliente.nome} onChange={e => setCliente(p => ({ ...p, nome: e.target.value }))} placeholder="Seu nome" className="rounded-none border" style={{ borderColor: '#E0D5CF' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>E-mail</Label>
                  <Input type="email" value={cliente.email} onChange={e => setCliente(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" className="rounded-none border" style={{ borderColor: '#E0D5CF' }} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Telefone</Label>
                  <Input value={cliente.telefone} onChange={e => setCliente(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" className="rounded-none border" style={{ borderColor: '#E0D5CF' }} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>CPF</Label>
                <Input value={cliente.cpf} onChange={e => setCliente(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" className="rounded-none border" style={{ borderColor: '#E0D5CF' }} />
              </div>
              <div className="border-t pt-4" style={{ borderColor: '#F0E6E0' }}>
                <h4 className="text-sm uppercase tracking-wider mb-3" style={{ color: textDark }}>Endereço de Entrega</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>CEP</Label>
                  <Input value={endereco.cep} onChange={e => setEndereco(p => ({ ...p, cep: e.target.value }))} placeholder="00000-000" className="rounded-none border" style={{ borderColor: '#E0D5CF' }}
                    onBlur={async () => {
                      const cep = endereco.cep.replace(/\D/g, '');
                      if (cep.length === 8) {
                        try {
                          const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                          const data = await resp.json();
                          if (!data.erro) setEndereco(p => ({ ...p, rua: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', estado: data.uf || '' }));
                        } catch {}
                        // Calcular frete dinâmico
                        calcularFreteDinamico(cep);
                      }
                    }} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Rua</Label>
                  <Input value={endereco.rua} onChange={e => setEndereco(p => ({ ...p, rua: e.target.value }))} className="rounded-none border" style={{ borderColor: '#E0D5CF' }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Número</Label>
                  <Input value={endereco.numero} onChange={e => setEndereco(p => ({ ...p, numero: e.target.value }))} className="rounded-none border" style={{ borderColor: '#E0D5CF' }} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Complemento</Label>
                  <Input value={endereco.complemento} onChange={e => setEndereco(p => ({ ...p, complemento: e.target.value }))} className="rounded-none border" style={{ borderColor: '#E0D5CF' }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Bairro</Label>
                  <Input value={endereco.bairro} onChange={e => setEndereco(p => ({ ...p, bairro: e.target.value }))} className="rounded-none border" style={{ borderColor: '#E0D5CF' }} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Cidade</Label>
                  <Input value={endereco.cidade} onChange={e => setEndereco(p => ({ ...p, cidade: e.target.value }))} className="rounded-none border" style={{ borderColor: '#E0D5CF' }} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>UF</Label>
                  <Input value={endereco.estado} onChange={e => setEndereco(p => ({ ...p, estado: e.target.value }))} maxLength={2} className="rounded-none border" style={{ borderColor: '#E0D5CF' }} />
                </div>
              </div>
              {/* Opções de Frete */}
              {freteOpcoes && !(config.frete_gratis_acima && (subtotal - cupomDesconto) >= config.frete_gratis_acima) && (
                <div className="border-t pt-3 space-y-2" style={{ borderColor: '#F0E6E0' }}>
                  <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Opção de envio</Label>
                  {freteOpcoes.pac && (
                    <label className="flex items-center gap-3 p-3 border cursor-pointer transition-all" style={{ borderColor: freteEscolhido === 'pac' ? roseGold : '#E0D5CF', backgroundColor: freteEscolhido === 'pac' ? '#FFF5F5' : 'transparent' }}>
                      <input type="radio" name="frete" checked={freteEscolhido === 'pac'} onChange={() => setFreteEscolhido('pac')} style={{ accentColor: roseGold }} />
                      <div className="flex-1">
                        <span className="text-xs font-semibold" style={{ color: textDark, fontFamily: "'Inter', sans-serif" }}>PAC</span>
                        <span className="text-[10px] ml-2" style={{ color: textMuted }}>({freteOpcoes.pac.prazo} dias úteis)</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: roseGold }}>{formatCurrency(freteOpcoes.pac.valor)}</span>
                    </label>
                  )}
                  {freteOpcoes.sedex && (
                    <label className="flex items-center gap-3 p-3 border cursor-pointer transition-all" style={{ borderColor: freteEscolhido === 'sedex' ? roseGold : '#E0D5CF', backgroundColor: freteEscolhido === 'sedex' ? '#FFF5F5' : 'transparent' }}>
                      <input type="radio" name="frete" checked={freteEscolhido === 'sedex'} onChange={() => setFreteEscolhido('sedex')} style={{ accentColor: roseGold }} />
                      <div className="flex-1">
                        <span className="text-xs font-semibold" style={{ color: textDark, fontFamily: "'Inter', sans-serif" }}>SEDEX</span>
                        <span className="text-[10px] ml-2" style={{ color: textMuted }}>({freteOpcoes.sedex.prazo} dias úteis)</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: roseGold }}>{formatCurrency(freteOpcoes.sedex.valor)}</span>
                    </label>
                  )}
                </div>
              )}
              {freteCalculando && (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: roseGold }} />
                  <span className="text-[10px]" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>Calculando frete...</span>
                </div>
              )}
              {/* Cupom */}
              <div className="border-t pt-3" style={{ borderColor: '#F0E6E0' }}>
                <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Cupom de desconto</Label>
                {cupomApplied ? (
                  <div className="flex items-center justify-between mt-2 px-3 py-2 border" style={{ borderColor: roseGold, backgroundColor: '#FFF5F5' }}>
                    <span className="text-xs font-semibold" style={{ color: roseGold }}>{cupomApplied} (-{formatCurrency(cupomDesconto)})</span>
                    <button onClick={removerCupom} className="text-xs underline" style={{ color: textMuted }}>Remover</button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <Input value={cupomCode} onChange={e => setCupomCode(e.target.value.toUpperCase())} placeholder="CÓDIGO" className="rounded-none border flex-1 text-xs uppercase" style={{ borderColor: '#E0D5CF' }}
                      onKeyDown={e => e.key === 'Enter' && aplicarCupom()} />
                    <button onClick={aplicarCupom} disabled={cupomLoading || !cupomCode.trim()}
                      className="px-4 py-2 text-xs uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: roseGold, fontFamily: "'Inter', sans-serif" }}>
                      {cupomLoading ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}
              </div>
              <div className="border-t pt-3 space-y-1" style={{ borderColor: '#F0E6E0' }}>
                <div className="flex justify-between text-sm"><span style={{ color: textMuted }}>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {cupomDesconto > 0 && <div className="flex justify-between text-sm"><span style={{ color: roseGold }}>Desconto</span><span style={{ color: roseGold }}>-{formatCurrency(cupomDesconto)}</span></div>}
                <div className="flex justify-between text-sm"><span style={{ color: textMuted }}>Frete</span><span>{valorFrete === 0 ? 'Grátis' : formatCurrency(valorFrete)}</span></div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t" style={{ borderColor: '#F0E6E0' }}>
                  <span style={{ color: textDark }}>Total</span><span style={{ color: roseGold }}>{formatCurrency(total)}</span>
                </div>
              </div>
              {config.pedido_minimo && subtotal < config.pedido_minimo && (
                <p className="text-[11px] text-center py-1" style={{ color: roseGoldDark, fontFamily: "'Inter', sans-serif" }}>
                  Pedido mínimo de {formatCurrency(config.pedido_minimo)} (faltam {formatCurrency(config.pedido_minimo - subtotal)})
                </p>
              )}
              <button className="w-full py-3 text-white text-xs uppercase tracking-[0.15em] hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: roseGold }} onClick={handleCheckout} disabled={processing || (!!config.pedido_minimo && subtotal < config.pedido_minimo)}>
                {processing ? 'Processando...' : 'Ir para Pagamento'}
              </button>
            </div>
          )}

          {checkoutStep === 'metodo' && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-center" style={{ color: textMuted, fontFamily: `'${fontCorpo}', sans-serif` }}>
                Escolha como deseja pagar:
              </p>
              <div className="space-y-3">
                {config.pix_chave && (
                  <button
                    onClick={() => { setSelectedPayMethod('pix'); handlePixPayment(); }}
                    className="w-full p-4 border-2 rounded-xl flex items-center gap-4 transition-all hover:shadow-md"
                    style={{ borderColor: roseGoldLight }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: '#E8F5E9' }}>💰</div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm" style={{ color: textDark }}>PIX</p>
                      <p className="text-xs" style={{ color: textMuted }}>Pagamento instantâneo — sem taxas</p>
                    </div>
                    <ChevronRight className="w-5 h-5" style={{ color: textMuted }} />
                  </button>
                )}
                {config.mercadopago_public_key && (
                  <button
                    onClick={async () => { setSelectedPayMethod('cartao'); await handleMpCheckout(); }}
                    className="w-full p-4 border-2 rounded-xl flex items-center gap-4 transition-all hover:shadow-md"
                    style={{ borderColor: roseGoldLight }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: '#E3F2FD' }}>💳</div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm" style={{ color: textDark }}>Cartão / Boleto</p>
                      <p className="text-xs" style={{ color: textMuted }}>Cartão de crédito, débito ou boleto</p>
                    </div>
                    <ChevronRight className="w-5 h-5" style={{ color: textMuted }} />
                  </button>
                )}
              </div>
              {processing && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: roseGold }} />
                </div>
              )}
            </div>
          )}

          {checkoutStep === 'pix' && config.pix_chave && config.pix_nome && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: '#E8F5E9' }}>💰</div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold" style={{ color: textDark }}>Escaneie o QR Code para pagar</p>
                <p className="text-2xl font-bold" style={{ color: roseGold }}>{formatCurrency(total)}</p>
                {numeroPedido && <p className="text-xs" style={{ color: textMuted }}>Pedido #{numeroPedido}</p>}
              </div>
              
              <div className="p-4 bg-white rounded-xl shadow-lg border">
                <QRCodeSVG
                  value={generatePixPayload({
                    chave: config.pix_chave,
                    nome: config.pix_nome,
                    cidade: config.pix_cidade || 'SAO PAULO',
                    valor: total,
                    tipo: (config.pix_tipo as any) || 'cpf',
                  })}
                  size={220}
                  level="M"
                />
              </div>

              <div className="w-full max-w-xs space-y-2">
                <p className="text-xs font-medium text-center" style={{ color: textMuted }}>Ou copie o código PIX:</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={generatePixPayload({
                      chave: config.pix_chave,
                      nome: config.pix_nome,
                      cidade: config.pix_cidade || 'SAO PAULO',
                      valor: total,
                      tipo: (config.pix_tipo as any) || 'cpf',
                    })}
                    className="flex-1 text-[10px] font-mono p-2 border rounded-lg truncate"
                    style={{ borderColor: roseGoldLight, backgroundColor: warmWhite }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatePixPayload({
                        chave: config.pix_chave!,
                        nome: config.pix_nome!,
                        cidade: config.pix_cidade || 'SAO PAULO',
                        valor: total,
                        tipo: (config.pix_tipo as any) || 'cpf',
                      }));
                      setPixCopied(true);
                      toast.success('Código PIX copiado!');
                      setTimeout(() => setPixCopied(false), 3000);
                    }}
                    className="px-3 py-2 text-xs rounded-lg border transition-all"
                    style={{ borderColor: roseGold, color: pixCopied ? 'white' : roseGold, backgroundColor: pixCopied ? roseGold : 'transparent' }}
                  >
                    {pixCopied ? '✓' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="w-full max-w-xs p-3 rounded-lg border space-y-1" style={{ borderColor: roseGoldLight, backgroundColor: warmWhite }}>
                <p className="text-xs font-medium" style={{ color: textDark }}>Recebedor: {config.pix_nome}</p>
                <p className="text-xs" style={{ color: textMuted }}>Chave: {config.pix_chave}</p>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => { setCheckoutStep('confirmacao'); setCart([]); toast.success('Pedido registrado! ✨'); }}
                  className="px-6 py-2.5 text-xs uppercase tracking-[0.15em] text-white"
                  style={{ backgroundColor: roseGold, fontFamily: `'${fontCorpo}', sans-serif` }}
                >
                  Já paguei
                </button>
                {config.whatsapp && (
                  <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=Olá! Realizei o pagamento PIX do pedido %23${numeroPedido}. Valor: ${formatCurrency(total)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-6 py-2.5 text-xs uppercase tracking-[0.15em] text-white"
                    style={{ backgroundColor: '#25D366', fontFamily: `'${fontCorpo}', sans-serif` }}>
                    Enviar comprovante
                  </a>
                )}
              </div>
              <p className="text-[10px] text-center" style={{ color: textMuted }}>
                Após o pagamento, confirme clicando em "Já paguei" ou envie o comprovante via WhatsApp.
              </p>
            </div>
          )}

          {checkoutStep === 'pagamento' && (
            <div>
              {processing && <div className="flex items-center justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" style={{ color: roseGold }} /></div>}
              <div id="ecommerce-brick-container" className="min-h-[200px]" />
            </div>
          )}

          {checkoutStep === 'confirmacao' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5EEEA' }}>
                <CheckCircle className="w-10 h-10" style={{ color: roseGold }} />
              </div>
              <h3 className="text-2xl font-light" style={{ color: textDark }}>Pedido #{numeroPedido}</h3>
              <p className="text-sm text-center max-w-xs" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>
                Seu pedido foi realizado com sucesso! Você receberá atualizações por e-mail.
              </p>
              <div className="w-full max-w-xs space-y-2 p-4 border" style={{ borderColor: '#F0E6E0', backgroundColor: '#FAFAF8' }}>
                <div className="flex justify-between text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span style={{ color: textMuted }}>Status</span>
                  <Badge className="text-[10px]" style={{ backgroundColor: roseGold, color: 'white' }}>Pago</Badge>
                </div>
                {freteOpcoes && freteEscolhido !== 'taxa_fixa' && (
                  <div className="flex justify-between text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <span style={{ color: textMuted }}>Envio</span>
                    <span style={{ color: textDark }}>{freteEscolhido.toUpperCase()} ({(freteEscolhido === 'sedex' ? freteOpcoes.sedex?.prazo : freteOpcoes.pac?.prazo) || '?'} dias úteis)</span>
                  </div>
                )}
                <div className="flex justify-between text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span style={{ color: textMuted }}>Total pago</span>
                  <span className="font-semibold" style={{ color: roseGold }}>{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button className="px-6 py-2.5 text-xs uppercase tracking-[0.15em] border hover:opacity-80"
                  style={{ borderColor: roseGold, color: roseGold, fontFamily: "'Inter', sans-serif" }}
                  onClick={() => { setCheckoutOpen(false); setCheckoutStep('dados'); }}>
                  Continuar Comprando
                </button>
                {config.whatsapp && (
                  <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=Olá! Acabei de fazer o pedido %23${numeroPedido}.`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-6 py-2.5 text-xs uppercase tracking-[0.15em] text-white hover:opacity-90"
                    style={{ backgroundColor: '#25D366', fontFamily: "'Inter', sans-serif" }}>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Cart (mobile) */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 right-4 sm:hidden z-50">
          <button className="flex items-center gap-2 px-5 py-3 text-white text-sm shadow-lg"
            style={{ backgroundColor: roseGold, fontFamily: "'Inter', sans-serif" }}
            onClick={() => setCartOpen(true)}>
            <ShoppingCart className="w-5 h-5" /> {cartCount} · {formatCurrency(total)}
          </button>
        </div>
      )}

      {/* WhatsApp Float */}
      {mostrarWhatsappFloat && (
        <a href={`https://wa.me/${config.whatsapp!.replace(/\D/g, '')}?text=${encodeURIComponent(config.mensagem_whatsapp || 'Olá!')}`} target="_blank" rel="noopener noreferrer"
          className={`fixed z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${whatsappPosicao === 'esquerda' ? 'bottom-4 left-4' : 'bottom-4 right-4'}`}
          style={{ backgroundColor: '#25D366' }}>
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}

      {/* Popup de Boas-Vindas */}
      <PopupBoasVindas
        ativo={(config as any).popup_ativo || false}
        titulo={(config as any).popup_titulo}
        texto={(config as any).popup_texto}
        imagemUrl={(config as any).popup_imagem_url}
        cupom={(config as any).popup_cupom}
        delaySegundos={(config as any).popup_delay_segundos}
        slug={slug || ''}
        corPrimaria={roseGold}
      />

      {/* Cookie Consent Banner */}
      <CookieConsent nomeLoja={config.nome_loja} roseGold={roseGold} />

      {/* AI Chatbot */}
      {agentConfig && (
        <ChatWidget
          organizationId={config.organization_id}
          config={{
            nome_agente: agentConfig.nome_agente,
            cor_primaria: agentConfig.cor_primaria || roseGold,
            avatar_url: agentConfig.avatar_url,
            mensagem_boas_vindas: agentConfig.mensagem_boas_vindas,
          }}
        />
      )}
    </div>
  );
}
