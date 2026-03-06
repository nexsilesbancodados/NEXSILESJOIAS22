import { useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Package, 
  ShoppingBag, 
  Loader2, 
  AlertTriangle,
  Sparkles,
  Info,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Copy,
  Check,
  Send,
  MapPin,
  Search,
  X,
  LayoutGrid,
  LayoutList,
  ZoomIn,
  Share2,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Tag,
  Truck,
  Shield,
  Clock,
  ArrowUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { catalogOrderSchema } from '@/lib/validation-schemas';
import { openWhatsAppWithoutPhone } from '@/lib/whatsapp';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_OPTIONS = [
  { value: 'em_preparacao', label: 'Em Preparação', color: 'bg-yellow-500/20 text-yellow-600', message: 'Este catálogo está sendo preparado. Em breve estará disponível!' },
  { value: 'aberto', label: 'Disponível', color: 'bg-emerald-500/20 text-emerald-600', message: 'Catálogo aberto para pedidos!' },
  { value: 'em_fabricacao', label: 'Em Fabricação', color: 'bg-blue-500/20 text-blue-600', message: 'As peças estão em fabricação.' },
  { value: 'fechado', label: 'Fechado', color: 'bg-gray-500/20 text-gray-600', message: 'Este catálogo está fechado para novos pedidos.' },
  { value: 'separacao', label: 'Separação', color: 'bg-purple-500/20 text-purple-600', message: 'As peças estão sendo separadas.' },
  { value: 'envio_liberado', label: 'Envio Liberado', color: 'bg-teal-500/20 text-teal-600', message: 'Envio das peças está liberado!' },
  { value: 'bloqueado', label: 'Bloqueado', color: 'bg-red-500/20 text-red-600', message: 'Este catálogo está temporariamente bloqueado.' },
  { value: 'finalizado', label: 'Finalizado', color: 'bg-emerald-500/20 text-emerald-600', message: 'Este catálogo foi finalizado.' },
];

interface CatalogoPublico {
  id: string;
  nome: string;
  organization_id?: string | null;
  status?: string | null;
  observacao?: string | null;
  custo_separacao?: number | null;
  custo_operacional?: number | null;
  taxa_entrega?: number | null;
  descricao?: string | null;
  ativo?: boolean;
  slug?: string | null;
  pedido_minimo_pecas?: number | null;
  whatsapp?: string | null;
  email_contato?: string | null;
  logo_url?: string | null;
  cor_primaria?: string | null;
  cor_secundaria?: string | null;
  banner_url?: string | null;
  imagem_url?: string | null;
  imagem_capa?: string | null;
  titulo?: string | null;
  mensagem_boas_vindas?: string | null;
}

interface CatalogoItemPublico {
  id: string;
  catalogo_id: string;
  peca_id: string;
  quantidade: number;
  quantidade_minima?: number;
  ordem?: number | null;
  destaque: boolean | null;
  created_at: string | null;
  peca: {
    id: string;
    nome: string;
    codigo: string;
    imagem_url: string | null;
    categoria: string | null;
    preco_venda: number | null;
    material: string | null;
    estoque: number | null;
  } | null;
}

interface SelectedItem {
  item: CatalogoItemPublico;
  quantidade: number;
}

export default function CatalogoPublicoPage() {
  const { catalogoId } = useParams<{ catalogoId: string }>();
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isOrderSent, setIsOrderSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detailItem, setDetailItem] = useState<CatalogoItemPublico | null>(null);
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'>('default');
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  
  // Address fields
  const [enderecoCep, setEnderecoCep] = useState('');
  const [enderecoLogradouro, setEnderecoLogradouro] = useState('');
  const [enderecoNumero, setEnderecoNumero] = useState('');
  const [enderecoComplemento, setEnderecoComplemento] = useState('');
  const [enderecoBairro, setEnderecoBairro] = useState('');
  const [enderecoCidade, setEnderecoCidade] = useState('');
  const [enderecoEstado, setEnderecoEstado] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);

  const productsRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Scroll listener
  useState(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const { data: catalogo, isLoading: loadingCatalogo, error: catalogoError } = useQuery({
    queryKey: ['catalogo-publico', catalogoId],
    queryFn: async () => {
      if (!catalogoId) throw new Error('ID do catálogo não fornecido');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catalogoId);
      let query = supabase.from('catalogos_public' as 'catalogos').select('*');
      if (isUUID) query = query.eq('id', catalogoId);
      else query = query.eq('slug', catalogoId);
      const { data, error } = await query.single();
      if (error) throw error;
      return data as CatalogoPublico;
    },
    enabled: !!catalogoId,
  });

  const { data: itens = [], isLoading: loadingItens } = useQuery({
    queryKey: ['catalogo-items-publico', catalogo?.id],
    queryFn: async () => {
      if (!catalogo?.id) return [];
      const { data, error } = await supabase
        .from('catalogos_pecas')
        .select(`id, catalogo_id, peca_id, quantidade, quantidade_minima, ordem, destaque, created_at, peca:pecas(id, nome, codigo, imagem_url, categoria, preco_venda, material, estoque)`)
        .eq('catalogo_id', catalogo.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CatalogoItemPublico[];
    },
    enabled: !!catalogo?.id,
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const getStatusInfo = (status: string) => STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  const toggleWishlist = (id: string) => {
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleItemSelection = (item: CatalogoItemPublico) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      const minQty = item.quantidade_minima || 1;
      newSelected.set(item.id, { item, quantidade: minQty });
    }
    setSelectedItems(newSelected);
  };

  const updateItemQuantity = (itemId: string, delta: number, item?: CatalogoItemPublico) => {
    const newSelected = new Map(selectedItems);
    const selected = newSelected.get(itemId);
    if (selected) {
      const minQty = selected.item.quantidade_minima || 1;
      const maxQty = selected.item.quantidade || 999;
      const newQty = Math.max(minQty, Math.min(maxQty, selected.quantidade + delta));
      newSelected.set(itemId, { ...selected, quantidade: newQty });
      setSelectedItems(newSelected);
    } else if (item) {
      const minQty = item.quantidade_minima || 1;
      const maxQty = item.quantidade || 999;
      const newQty = Math.max(minQty, Math.min(maxQty, minQty + delta));
      newSelected.set(itemId, { item, quantidade: newQty });
      setSelectedItems(newSelected);
    }
  };

  const setItemQuantity = (itemId: string, quantity: number, item: CatalogoItemPublico) => {
    const newSelected = new Map(selectedItems);
    const minQty = item.quantidade_minima || 1;
    const maxQty = item.quantidade || 999;
    const newQty = Math.max(minQty, Math.min(maxQty, quantity));
    const wasSelected = newSelected.has(itemId);
    if (newQty < minQty) {
      newSelected.delete(itemId);
    } else {
      newSelected.set(itemId, { item, quantidade: newQty });
      if (!wasSelected) {
        setLastAddedItemId(itemId);
        toast.success(`${item.peca?.nome || 'Item'} adicionado!`, { duration: 2000, icon: '🛒' });
        setTimeout(() => setLastAddedItemId(null), 600);
      }
    }
    setSelectedItems(newSelected);
  };

  const removeFromCart = (itemId: string) => {
    const newSelected = new Map(selectedItems);
    newSelected.delete(itemId);
    setSelectedItems(newSelected);
  };

  const clearCart = () => {
    setSelectedItems(new Map());
    setIsCartOpen(false);
  };

  // Filters
  const categorias = useMemo(() => [...new Set(itens.map(i => i.peca?.categoria).filter(Boolean))] as string[], [itens]);
  const materiais = useMemo(() => [...new Set(itens.map(i => i.peca?.material).filter(Boolean))] as string[], [itens]);

  const filteredItens = useMemo(() => itens.filter(item => {
    const matchesSearch = !searchQuery || item.peca?.nome?.toLowerCase().includes(searchQuery.toLowerCase()) || item.peca?.codigo?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategoria = !selectedCategoria || item.peca?.categoria === selectedCategoria;
    const matchesMaterial = !selectedMaterial || item.peca?.material === selectedMaterial;
    return matchesSearch && matchesCategoria && matchesMaterial;
  }), [itens, searchQuery, selectedCategoria, selectedMaterial]);

  const sortedItens = useMemo(() => [...filteredItens].sort((a, b) => {
    switch (sortOrder) {
      case 'price_asc': return (a.peca?.preco_venda || 0) - (b.peca?.preco_venda || 0);
      case 'price_desc': return (b.peca?.preco_venda || 0) - (a.peca?.preco_venda || 0);
      case 'name_asc': return (a.peca?.nome || '').localeCompare(b.peca?.nome || '');
      case 'name_desc': return (b.peca?.nome || '').localeCompare(a.peca?.nome || '');
      default: return (a.destaque ? -1 : 0) - (b.destaque ? -1 : 0);
    }
  }), [filteredItens, sortOrder]);

  const hasActiveFilters = searchQuery || selectedCategoria || selectedMaterial || sortOrder !== 'default';
  const clearFilters = () => { setSearchQuery(''); setSelectedCategoria(''); setSelectedMaterial(''); setSortOrder('default'); };

  // Cart calculations
  const cartItems = Array.from(selectedItems.values());
  const cartTotal = cartItems.reduce((acc, { item, quantidade }) => acc + ((item.peca?.preco_venda || 0) * quantidade), 0);
  const cartItemCount = cartItems.reduce((acc, { quantidade }) => acc + quantidade, 0);
  const custoExtra = (catalogo?.custo_separacao || 0) + (catalogo?.custo_operacional || 0) + (catalogo?.taxa_entrega || 0);
  const cartGrandTotal = cartTotal + custoExtra;

  const generateOrderSummary = () => {
    const lines: string[] = [];
    lines.push(`📦 *PEDIDO - ${catalogo?.nome}*`);
    lines.push('');
    if (customerName) lines.push(`👤 Cliente: ${customerName}`);
    if (customerPhone) lines.push(`📱 Telefone: ${customerPhone}`);
    if (customerEmail) lines.push(`📧 Email: ${customerEmail}`);
    if (enderecoLogradouro || enderecoCidade) {
      lines.push('');
      lines.push('📍 *Endereço de Entrega:*');
      if (enderecoLogradouro) lines.push(`${enderecoLogradouro}${enderecoNumero ? `, ${enderecoNumero}` : ''}`);
      if (enderecoComplemento) lines.push(enderecoComplemento);
      if (enderecoBairro) lines.push(enderecoBairro);
      if (enderecoCidade || enderecoEstado) lines.push(`${enderecoCidade}${enderecoEstado ? ` - ${enderecoEstado}` : ''}`);
      if (enderecoCep) lines.push(`CEP: ${enderecoCep}`);
    }
    if (customerName || customerPhone || enderecoLogradouro) lines.push('');
    lines.push('*Itens do Pedido:*');
    lines.push('─────────────────');
    cartItems.forEach(({ item, quantidade }) => {
      const preco = item.peca?.preco_venda || 0;
      lines.push(`• ${item.peca?.nome || 'Peça'}`);
      lines.push(`  Cód: ${item.peca?.codigo || '-'}`);
      lines.push(`  Qtd: ${quantidade} x ${formatCurrency(preco)} = ${formatCurrency(preco * quantidade)}`);
      lines.push('');
    });
    lines.push('─────────────────');
    lines.push(`*Subtotal:* ${formatCurrency(cartTotal)}`);
    if (custoExtra > 0) {
      if ((catalogo?.custo_separacao || 0) > 0) lines.push(`Separação: ${formatCurrency(catalogo?.custo_separacao || 0)}`);
      if ((catalogo?.custo_operacional || 0) > 0) lines.push(`Operacional: ${formatCurrency(catalogo?.custo_operacional || 0)}`);
      if ((catalogo?.taxa_entrega || 0) > 0) lines.push(`Entrega: ${formatCurrency(catalogo?.taxa_entrega || 0)}`);
    }
    lines.push('─────────────────');
    lines.push(`*TOTAL: ${formatCurrency(cartGrandTotal)}*`);
    lines.push('');
    lines.push(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}`);
    return lines.join('\n');
  };

  const buscarEnderecoPorCep = async () => {
    const cepLimpo = enderecoCep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) { toast.error('CEP deve ter 8 dígitos'); return; }
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (data.erro) { toast.error('CEP não encontrado'); return; }
      setEnderecoLogradouro(data.logradouro || '');
      setEnderecoBairro(data.bairro || '');
      setEnderecoCidade(data.localidade || '');
      setEnderecoEstado(data.uf || '');
      toast.success('Endereço preenchido!');
    } catch { toast.error('Erro ao buscar endereço'); }
    finally { setBuscandoCep(false); }
  };

  const copyOrderSummary = async () => {
    const summary = generateOrderSummary();
    try { await navigator.clipboard.writeText(summary); } catch {
      const textarea = document.createElement('textarea');
      textarea.value = summary;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    toast.success('Resumo copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const submitOrder = async () => {
    if (!catalogoId) return;
    const validationResult = catalogOrderSchema.safeParse({
      cliente_nome: customerName,
      cliente_telefone: customerPhone.replace(/\D/g, ''),
      cliente_email: customerEmail,
      endereco_cep: enderecoCep.replace(/\D/g, ''),
      endereco_logradouro: enderecoLogradouro,
      endereco_numero: enderecoNumero,
      endereco_complemento: enderecoComplemento,
      endereco_bairro: enderecoBairro,
      endereco_cidade: enderecoCidade,
      endereco_estado: enderecoEstado,
    });
    if (!validationResult.success) { toast.error(validationResult.error.errors[0]?.message || 'Dados inválidos'); return; }
    const validatedData = validationResult.data;
    setIsSending(true);
    try {
      const addressParts: string[] = [];
      if (validatedData.endereco_logradouro) addressParts.push(`${validatedData.endereco_logradouro}${validatedData.endereco_numero ? `, ${validatedData.endereco_numero}` : ''}`);
      if (validatedData.endereco_complemento) addressParts.push(validatedData.endereco_complemento);
      if (validatedData.endereco_bairro) addressParts.push(validatedData.endereco_bairro);
      if (validatedData.endereco_cidade || validatedData.endereco_estado) addressParts.push(`${validatedData.endereco_cidade || ''}${validatedData.endereco_estado ? ` - ${validatedData.endereco_estado}` : ''}`);
      if (validatedData.endereco_cep) addressParts.push(`CEP: ${validatedData.endereco_cep}`);
      const addressText = addressParts.length > 0 ? `Endereço: ${addressParts.join(', ')}` : null;

      const orderItems = cartItems.map(({ item, quantidade }) => ({
        peca_id: item.peca_id,
        quantidade,
        preco_unitario: item.peca?.preco_venda || 0,
      }));

      const { data: pedidoId, error: rpcError } = await supabase.rpc('criar_pedido_catalogo', {
        p_catalogo_id: catalogo?.id,
        p_cliente_nome: validatedData.cliente_nome,
        p_cliente_telefone: validatedData.cliente_telefone || null,
        p_cliente_email: validatedData.cliente_email || null,
        p_observacoes: addressText,
        p_valor_total: cartGrandTotal,
        p_itens: orderItems,
      });

      if (rpcError) throw rpcError;
      setIsOrderSent(true);
      setIsSummaryOpen(false);
      setIsCartOpen(false);
      setSelectedItems(new Map());
      setCustomerName(''); setCustomerPhone(''); setCustomerEmail('');
      setEnderecoCep(''); setEnderecoLogradouro(''); setEnderecoNumero('');
      setEnderecoComplemento(''); setEnderecoBairro(''); setEnderecoCidade(''); setEnderecoEstado('');
      setCheckoutStep(1);
      toast.success('Pedido enviado com sucesso!');
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Erro ao enviar pedido. Tente novamente.');
    } finally { setIsSending(false); }
  };

  const publishedUrl = catalogo ? `${window.location.origin}/catalogo/${catalogo.slug || catalogo.id}` : '';

  if (loadingCatalogo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
          </div>
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  if (catalogoError || !catalogo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="pt-10 pb-10 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Catálogo não encontrado</h1>
            <p className="text-muted-foreground text-sm">O catálogo que você está procurando não existe ou foi removido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(catalogo.status || 'aberto');
  const isBlocked = catalogo.status === 'bloqueado' || catalogo.status === 'finalizado' || catalogo.status === 'fechado';
  const canOrder = catalogo.status === 'aberto';
  const primaryColor = catalogo.cor_primaria || undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* ─── PREMIUM HERO ─── */}
      <div className="relative overflow-hidden">
        {catalogo.banner_url || catalogo.imagem_capa || catalogo.imagem_url ? (
          <div className="absolute inset-0">
            <img
              src={catalogo.banner_url || catalogo.imagem_capa || catalogo.imagem_url || ''}
              alt=""
              className="w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
          </div>
        ) : (
          <div 
            className="absolute inset-0"
            style={primaryColor ? { background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd, ${primaryColor}aa)` } : undefined}
          >
            {!primaryColor && <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/60" />}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          </div>
        )}

        <div className="relative z-10 px-4 pt-10 pb-14 sm:pt-14 sm:pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
              {catalogo.logo_url ? (
                <img src={catalogo.logo_url} alt="Logo" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30 shadow-2xl flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-2 ring-white/20 flex-shrink-0">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                  {catalogo.titulo || catalogo.nome}
                </h1>
                {catalogo.descricao && (
                  <p className="text-white/70 text-sm mt-1.5 line-clamp-2">{catalogo.descricao}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Badge className={cn('text-xs font-medium border-0 px-3 py-1',
                    isBlocked ? 'bg-red-500/30 text-red-200' : 'bg-white/15 text-white/90 backdrop-blur-sm'
                  )}>
                    {statusInfo.label}
                  </Badge>
                  {canOrder && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-xs px-3 py-1 backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                      Aceitando pedidos
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {catalogo.mensagem_boas_vindas && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/10 mb-6">
                <p className="text-white/90 text-sm leading-relaxed">{catalogo.mensagem_boas_vindas}</p>
              </div>
            )}

            {/* Trust Bar */}
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <Package className="w-4 h-4" />
                <span><strong className="text-white">{itens.length}</strong> produtos</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <Tag className="w-4 h-4" />
                <span><strong className="text-white">{categorias.length}</strong> categorias</span>
              </div>
              {(catalogo.taxa_entrega || 0) > 0 && (
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <Truck className="w-4 h-4" />
                  <span>Entrega: {formatCurrency(catalogo.taxa_entrega || 0)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <Shield className="w-4 h-4" />
                <span>Compra segura</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {(isBlocked || catalogo.observacao) && (
        <div className="max-w-5xl mx-auto px-4 -mt-6 relative z-10 mb-4">
          <div className={cn('rounded-2xl p-4 shadow-lg border backdrop-blur-sm',
            isBlocked ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/5 border-primary/20'
          )}>
            <div className="flex items-start gap-3">
              {isBlocked ? <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" /> : <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />}
              <div>
                {isBlocked && <p className="font-medium text-foreground text-sm">{statusInfo.message}</p>}
                {catalogo.observacao && <p className="text-sm text-muted-foreground mt-0.5">{catalogo.observacao}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STICKY CATEGORY NAV ─── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          {/* Search bar */}
          <div className="flex items-center gap-2 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-muted/50 border-0 rounded-xl text-sm focus-visible:ring-primary/30"
              />
              {searchQuery && (
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button variant={showFilters ? 'secondary' : 'outline'} size="icon" className="h-11 w-11 rounded-xl flex-shrink-0" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
            <div className="hidden sm:flex bg-muted/50 rounded-xl overflow-hidden border-0">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-11 w-11 rounded-none" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-11 w-11 rounded-none" onClick={() => setViewMode('list')}>
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Category Pills */}
          {categorias.length > 0 && (
            <div className="relative pb-3" ref={categoryScrollRef}>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedCategoria('')}
                  className={cn(
                    'whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0',
                    !selectedCategoria
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                  )}
                >
                  Todos
                </button>
                {categorias.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoria(selectedCategoria === cat ? '' : cat)}
                    className={cn(
                      'whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0',
                      selectedCategoria === cat
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extended Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap gap-2 pb-3">
                  {materiais.length > 0 && (
                    <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)} className="h-9 px-3 text-xs border border-border/50 rounded-xl bg-muted/50 focus:outline-none">
                      <option value="">Todos materiais</option>
                      {materiais.map(mat => <option key={mat} value={mat}>{mat}</option>)}
                    </select>
                  )}
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)} className="h-9 px-3 text-xs border border-border/50 rounded-xl bg-muted/50 focus:outline-none">
                    <option value="default">Relevância</option>
                    <option value="price_asc">Menor preço</option>
                    <option value="price_desc">Maior preço</option>
                    <option value="name_asc">A → Z</option>
                    <option value="name_desc">Z → A</option>
                  </select>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-9 px-3 text-destructive">
                      <X className="w-3 h-3 mr-1" /> Limpar
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <p className="text-xs text-muted-foreground">{filteredItens.length} de {itens.length} produtos</p>
        </div>
      )}

      {/* ─── PRODUCTS ─── */}
      <div className="max-w-5xl mx-auto px-4 py-5 pb-32" ref={productsRef}>
        {loadingItens ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-2xl mb-3" />
                <div className="h-4 bg-muted rounded-lg w-3/4 mb-2" />
                <div className="h-5 bg-muted rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : sortedItens.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-5">
              <Search className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{hasActiveFilters ? 'Nenhum resultado' : 'Catálogo vazio'}</h3>
            <p className="text-sm text-muted-foreground mb-4">{hasActiveFilters ? 'Tente alterar os filtros' : 'Nenhum produto adicionado ainda'}</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="rounded-xl">Limpar filtros</Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {sortedItens.map((item) => {
              const isSelected = selectedItems.has(item.id);
              const selectedQty = selectedItems.get(item.id)?.quantidade || 0;
              const maxQty = item.quantidade || 1;
              const isOutOfStock = (item.peca?.estoque || 0) === 0;
              const isWishlisted = wishlist.has(item.id);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "group relative bg-card rounded-2xl overflow-hidden border transition-all duration-300",
                    isSelected ? "ring-2 ring-primary border-primary/30 shadow-lg" : "border-border/30 hover:shadow-lg hover:border-border/60",
                    isOutOfStock && "opacity-60"
                  )}
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-muted/20 overflow-hidden cursor-pointer" onClick={() => setDetailItem(item)}>
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-[5] flex items-center justify-center">
                        <Badge variant="secondary" className="text-xs">Esgotado</Badge>
                      </div>
                    )}
                    {item.destaque && (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <Badge className="bg-amber-500 text-white border-0 text-[10px] px-2 py-0.5 shadow-md gap-1">
                          <Star className="w-3 h-3 fill-current" /> Destaque
                        </Badge>
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(item.id); }}
                      className={cn(
                        "absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        isWishlisted ? "bg-red-500 text-white shadow-md" : "bg-white/80 backdrop-blur-sm text-muted-foreground hover:bg-white hover:text-red-500 shadow-sm"
                      )}
                    >
                      <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                    </button>
                    {item.peca?.imagem_url ? (
                      <img src={item.peca.imagem_url} alt={item.peca?.nome || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60">
                        <Package className="w-12 h-12 text-muted-foreground/15" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          <ZoomIn className="w-5 h-5 text-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 sm:p-4 space-y-2">
                    <div>
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug min-h-[2.5rem]">
                        {item.peca?.nome || 'Peça removida'}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.peca?.codigo && (
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">{item.peca.codigo}</span>
                        )}
                        {item.peca?.material && (
                          <span className="text-[10px] text-muted-foreground">{item.peca.material}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-end justify-between">
                      <p className="font-bold text-lg text-primary tracking-tight">{formatCurrency(item.peca?.preco_venda || 0)}</p>
                      <span className="text-[10px] text-muted-foreground">Disp: {maxQty}</span>
                    </div>

                    {/* Add/Qty Controls */}
                    {canOrder && !isOutOfStock && (
                      <div className="pt-1">
                        {isSelected ? (
                          <div className="flex items-center justify-between bg-primary/5 rounded-xl px-2 py-1.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); if (selectedQty <= 1) toggleItemSelection(item); else updateItemQuantity(item.id, -1); }}>
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-bold text-primary text-base">{selectedQty}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" disabled={selectedQty >= maxQty} onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, 1); }}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="w-full h-10 text-xs rounded-xl font-semibold gap-1.5 transition-all active:scale-95"
                            onClick={(e) => { e.stopPropagation(); setItemQuantity(item.id, 1, item); }}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Adicionar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* ─── LIST VIEW ─── */
          <div className="space-y-3">
            {sortedItens.map((item) => {
              const isSelected = selectedItems.has(item.id);
              const selectedQty = selectedItems.get(item.id)?.quantidade || 0;
              const maxQty = item.quantidade || 1;
              const isOutOfStock = (item.peca?.estoque || 0) === 0;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "group bg-card rounded-2xl overflow-hidden border transition-all duration-200",
                    isSelected ? "ring-2 ring-primary border-primary/30 shadow-md" : "border-border/30 hover:shadow-sm",
                    isOutOfStock && "opacity-50"
                  )}
                >
                  <div className="flex gap-0">
                    <div className="relative w-28 sm:w-36 flex-shrink-0 bg-muted/20 overflow-hidden cursor-pointer" onClick={() => setDetailItem(item)}>
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-[5] flex items-center justify-center">
                          <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Esgotado</span>
                        </div>
                      )}
                      {item.peca?.imagem_url ? (
                        <img src={item.peca.imagem_url} alt={item.peca?.nome || ''} className="w-full h-full object-cover aspect-square" loading="lazy" />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center"><Package className="w-8 h-8 text-muted-foreground/20" /></div>
                      )}
                    </div>
                    <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-snug">{item.peca?.nome || 'Peça removida'}</h3>
                          <span className="font-bold text-primary text-base whitespace-nowrap">{formatCurrency(item.peca?.preco_venda || 0)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {item.peca?.codigo && <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">{item.peca.codigo}</span>}
                          {item.peca?.categoria && <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-border/50">{item.peca.categoria}</Badge>}
                          {item.peca?.material && <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{item.peca.material}</Badge>}
                          {item.destaque && <Badge className="text-[10px] h-5 px-1.5 bg-amber-500/10 text-amber-600 border-amber-500/20 gap-0.5"><Star className="w-2.5 h-2.5 fill-current" />Destaque</Badge>}
                        </div>
                      </div>
                      {canOrder && !isOutOfStock && (
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[11px] text-muted-foreground">Disp: {maxQty}</span>
                          {isSelected ? (
                            <div className="flex items-center gap-1 bg-primary/5 rounded-lg px-2 py-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (selectedQty <= 1) toggleItemSelection(item); else updateItemQuantity(item.id, -1); }}><Minus className="w-3 h-3" /></Button>
                              <span className="w-6 text-center font-bold text-sm text-primary">{selectedQty}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={selectedQty >= maxQty} onClick={() => updateItemQuantity(item.id, 1)}><Plus className="w-3 h-3" /></Button>
                            </div>
                          ) : (
                            <Button size="sm" className="h-8 text-xs rounded-lg gap-1 active:scale-95 transition-transform" onClick={() => setItemQuantity(item.id, 1, item)}>
                              <ShoppingCart className="w-3.5 h-3.5" /> Adicionar
                            </Button>
                          )}
                        </div>
                      )}
                      {isSelected && selectedQty > 1 && (
                        <p className="text-xs text-muted-foreground text-right mt-1">
                          Subtotal: <span className="font-semibold text-foreground">{formatCurrency((item.peca?.preco_venda || 0) * selectedQty)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Contact & Footer */}
        {(catalogo.whatsapp || catalogo.email_contato) && (
          <div className="flex items-center justify-center gap-6 py-8 mt-8 border-t border-border/30">
            {catalogo.whatsapp && (
              <a href={`https://wa.me/${catalogo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Send className="w-4 h-4" /> WhatsApp
              </a>
            )}
            {catalogo.email_contato && (
              <a href={`mailto:${catalogo.email_contato}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Info className="w-4 h-4" /> E-mail
              </a>
            )}
          </div>
        )}
      </div>

      {/* ─── FLOATING CART BAR ─── */}
      <AnimatePresence>
        {canOrder && selectedItems.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40"
          >
            <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl">
              <div className="max-w-5xl mx-auto px-4 py-3">
                <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                  <SheetTrigger asChild>
                    <Button className="w-full h-14 text-base rounded-2xl font-semibold shadow-lg gap-3 active:scale-[0.98] transition-transform">
                      <div className="relative">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-primary text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                          {cartItemCount}
                        </span>
                      </div>
                      <span>Ver Carrinho</span>
                      <span className="ml-auto font-bold text-lg">{formatCurrency(cartTotal)}</span>
                    </Button>
                  </SheetTrigger>

                  <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2 text-xl">
                        <ShoppingCart className="w-6 h-6 text-primary" />
                        Carrinho
                        <Badge variant="secondary" className="ml-1 text-sm">{cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'}</Badge>
                      </SheetTitle>
                      <SheetDescription>Revise seus itens antes de finalizar</SheetDescription>
                    </SheetHeader>

                    <ScrollArea className="h-[calc(100%-240px)] mt-4">
                      <div className="space-y-3 pr-4">
                        {cartItems.map(({ item, quantidade }) => (
                          <div key={item.id} className="flex gap-3 p-3 bg-muted/30 rounded-2xl border border-border/20">
                            <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0 overflow-hidden">
                              {item.peca?.imagem_url ? (
                                <img src={item.peca.imagem_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground/30" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{item.peca?.nome || 'Peça'}</h4>
                              <p className="text-xs text-muted-foreground">{formatCurrency(item.peca?.preco_venda || 0)} cada</p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1 bg-background rounded-xl px-1 border border-border/30">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.id, -1)} disabled={quantidade <= 1}><Minus className="w-3 h-3" /></Button>
                                  <span className="w-7 text-center text-sm font-semibold">{quantidade}</span>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.id, 1)} disabled={quantidade >= (item.peca?.estoque || 999)}><Plus className="w-3 h-3" /></Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-primary">{formatCurrency((item.peca?.preco_venda || 0) * quantidade)}</span>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <SheetFooter className="mt-4 flex-col gap-3">
                      <div className="w-full space-y-2 text-sm bg-muted/30 rounded-2xl p-4">
                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(cartTotal)}</span></div>
                        {custoExtra > 0 && (
                          <>
                            {(catalogo?.custo_separacao || 0) > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Separação</span><span>{formatCurrency(catalogo?.custo_separacao || 0)}</span></div>}
                            {(catalogo?.custo_operacional || 0) > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Operacional</span><span>{formatCurrency(catalogo?.custo_operacional || 0)}</span></div>}
                            {(catalogo?.taxa_entrega || 0) > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Entrega</span><span>{formatCurrency(catalogo?.taxa_entrega || 0)}</span></div>}
                          </>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{formatCurrency(cartGrandTotal)}</span></div>
                      </div>
                      <div className="w-full flex gap-2">
                        <Button variant="outline" onClick={clearCart} className="flex-1 rounded-xl h-12">Limpar</Button>
                        <Button className="flex-[2] rounded-xl h-12 font-semibold text-base gap-2" onClick={() => { setCheckoutStep(1); setIsSummaryOpen(true); }}>
                          <Send className="w-5 h-5" /> Finalizar Pedido
                        </Button>
                      </div>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CHECKOUT DIALOG ─── */}
      <Dialog open={isSummaryOpen} onOpenChange={(open) => { setIsSummaryOpen(open); if (!open) setCheckoutStep(1); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
          {/* Progress Steps */}
          <div className="sticky top-0 bg-background z-10 border-b border-border/30 px-6 pt-6 pb-4">
            <DialogTitle className="text-lg font-bold mb-4">Finalizar Pedido</DialogTitle>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex-1 flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    checkoutStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {checkoutStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {step === 1 ? 'Dados' : step === 2 ? 'Endereço' : 'Confirmar'}
                  </span>
                  {step < 3 && <div className={cn("flex-1 h-0.5 rounded-full", checkoutStep > step ? "bg-primary" : "bg-muted")} />}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Step 1: Personal Data */}
            {checkoutStep === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">👤 Seus Dados</p>
                <div className="space-y-3">
                  <div><Label htmlFor="customer-name">Nome Completo *</Label><Input id="customer-name" placeholder="Digite seu nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="rounded-xl mt-1.5 h-11" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label htmlFor="customer-phone">WhatsApp</Label><Input id="customer-phone" placeholder="(00) 00000-0000" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="rounded-xl mt-1.5 h-11" /></div>
                    <div><Label htmlFor="customer-email">E-mail</Label><Input id="customer-email" type="email" placeholder="seu@email.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="rounded-xl mt-1.5 h-11" /></div>
                  </div>
                </div>
                <Button className="w-full h-12 rounded-xl font-semibold text-sm" disabled={!customerName.trim()} onClick={() => setCheckoutStep(2)}>
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Address */}
            {checkoutStep === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Endereço de Entrega</p>
                <div className="space-y-3">
                  <div><Label htmlFor="cep">CEP</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input id="cep" placeholder="00000-000" value={enderecoCep} onChange={(e) => setEnderecoCep(e.target.value)} maxLength={9} className="rounded-xl h-11" />
                      <Button variant="outline" size="icon" onClick={buscarEnderecoPorCep} disabled={buscandoCep} className="rounded-xl h-11 w-11 flex-shrink-0">{buscandoCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><Label>Logradouro</Label><Input placeholder="Rua, Av, etc." value={enderecoLogradouro} onChange={(e) => setEnderecoLogradouro(e.target.value)} className="rounded-xl mt-1.5 h-11" /></div>
                    <div><Label>Número</Label><Input placeholder="123" value={enderecoNumero} onChange={(e) => setEnderecoNumero(e.target.value)} className="rounded-xl mt-1.5 h-11" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Complemento</Label><Input placeholder="Apto, Bloco" value={enderecoComplemento} onChange={(e) => setEnderecoComplemento(e.target.value)} className="rounded-xl mt-1.5 h-11" /></div>
                    <div><Label>Bairro</Label><Input placeholder="Bairro" value={enderecoBairro} onChange={(e) => setEnderecoBairro(e.target.value)} className="rounded-xl mt-1.5 h-11" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><Label>Cidade</Label><Input placeholder="Cidade" value={enderecoCidade} onChange={(e) => setEnderecoCidade(e.target.value)} className="rounded-xl mt-1.5 h-11" /></div>
                    <div><Label>UF</Label><Input placeholder="SP" value={enderecoEstado} onChange={(e) => setEnderecoEstado(e.target.value.toUpperCase())} maxLength={2} className="rounded-xl mt-1.5 h-11" /></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setCheckoutStep(1)}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
                  <Button className="flex-[2] h-12 rounded-xl font-semibold" onClick={() => setCheckoutStep(3)}>Revisar pedido <ChevronRight className="w-4 h-4 ml-1" /></Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {checkoutStep === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Check className="w-4 h-4" /> Revisão do Pedido</p>
                
                {/* Customer info */}
                <div className="bg-muted/30 rounded-xl p-3 text-sm space-y-1">
                  <p className="font-medium">{customerName}</p>
                  {customerPhone && <p className="text-muted-foreground text-xs">{customerPhone}</p>}
                  {customerEmail && <p className="text-muted-foreground text-xs">{customerEmail}</p>}
                  {enderecoCidade && <p className="text-muted-foreground text-xs">{enderecoLogradouro}, {enderecoNumero} - {enderecoCidade}/{enderecoEstado}</p>}
                </div>

                {/* Items */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cartItems.map(({ item, quantidade }) => (
                    <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/20 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {item.peca?.imagem_url && <img src={item.peca.imagem_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate text-xs">{item.peca?.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{quantidade}x {formatCurrency(item.peca?.preco_venda || 0)}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-xs">{formatCurrency((item.peca?.preco_venda || 0) * quantidade)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="bg-primary/5 rounded-xl p-4 space-y-2 border border-primary/10">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(cartTotal)}</span></div>
                  {custoExtra > 0 && (
                    <>
                      {(catalogo?.custo_separacao || 0) > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Separação</span><span>{formatCurrency(catalogo?.custo_separacao || 0)}</span></div>}
                      {(catalogo?.custo_operacional || 0) > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Operacional</span><span>{formatCurrency(catalogo?.custo_operacional || 0)}</span></div>}
                      {(catalogo?.taxa_entrega || 0) > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Entrega</span><span>{formatCurrency(catalogo?.taxa_entrega || 0)}</span></div>}
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{formatCurrency(cartGrandTotal)}</span></div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setCheckoutStep(2)}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
                  <Button variant="outline" onClick={copyOrderSummary} className="h-12 rounded-xl px-4">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button className="flex-[2] h-12 rounded-xl font-semibold text-base" onClick={submitOrder} disabled={isSending}>
                    {isSending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Send className="w-4 h-4 mr-2" />Confirmar Pedido</>}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── SUCCESS ─── */}
      <Dialog open={isOrderSent} onOpenChange={setIsOrderSent}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-12 h-12 text-emerald-500" />
              </div>
            </motion.div>
            <DialogTitle className="text-2xl mb-3">Pedido Enviado! 🎉</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              Seu pedido foi recebido com sucesso!<br />Entraremos em contato em breve.
            </DialogDescription>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOrderSent(false)} className="w-full rounded-xl h-12 font-semibold">
              Continuar Comprando
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── PRODUCT DETAIL ─── */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {detailItem && (
            <>
              <div className="relative aspect-square bg-muted/20 overflow-hidden">
                {detailItem.peca?.imagem_url ? (
                  <img src={detailItem.peca.imagem_url} alt={detailItem.peca?.nome || ''} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-20 h-20 text-muted-foreground/15" /></div>
                )}
                <button onClick={() => toggleWishlist(detailItem.id)} className={cn("absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all", wishlist.has(detailItem.id) ? "bg-red-500 text-white" : "bg-white/90 text-muted-foreground hover:text-red-500")}>
                  <Heart className={cn("w-5 h-5", wishlist.has(detailItem.id) && "fill-current")} />
                </button>
                {detailItem.destaque && (
                  <Badge className="absolute top-4 left-4 bg-amber-500 text-white border-0 shadow-md gap-1"><Star className="w-3 h-3 fill-current" /> Destaque</Badge>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{detailItem.peca?.nome || 'Peça'}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-1">Código: {detailItem.peca?.codigo || '-'}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-primary">{formatCurrency(detailItem.peca?.preco_venda || 0)}</span>
                  <Badge variant="outline" className="text-xs"><Package className="w-3 h-3 mr-1" /> {detailItem.quantidade || 1} disponível</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {detailItem.peca?.categoria && <Badge variant="outline" className="rounded-lg">{detailItem.peca.categoria}</Badge>}
                  {detailItem.peca?.material && <Badge variant="secondary" className="rounded-lg">{detailItem.peca.material}</Badge>}
                </div>
                {/* Share */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-10" onClick={() => {
                    const peca = detailItem.peca;
                    if (!peca) return;
                    const message = [`✨ *${peca.nome}*`, '', `💰 ${formatCurrency(peca.preco_venda || 0)}`, peca.codigo ? `📦 ${peca.codigo}` : '', '', `👉 ${publishedUrl}`].filter(Boolean).join('\n');
                    openWhatsAppWithoutPhone(message);
                  }}>
                    <Share2 className="w-4 h-4 mr-2" />Compartilhar
                  </Button>
                  <Button variant="outline" className="rounded-xl h-10" onClick={async () => {
                    const peca = detailItem.peca;
                    if (!peca) return;
                    const textToCopy = `${peca.nome} - ${formatCurrency(peca.preco_venda || 0)}\n${publishedUrl}`;
                    try { await navigator.clipboard.writeText(textToCopy); } catch {
                      const ta = document.createElement('textarea'); ta.value = textToCopy; ta.style.position = 'fixed'; ta.style.opacity = '0';
                      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
                    }
                    toast.success('Link copiado!', { duration: 2000 });
                  }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                {/* Cart action */}
                {canOrder && (
                  <div className="pt-2 border-t border-border/30">
                    {detailItem.quantidade_minima && detailItem.quantidade_minima > 1 && (
                      <p className="text-xs text-muted-foreground text-center mb-2">Mínimo: {detailItem.quantidade_minima} un</p>
                    )}
                    {selectedItems.has(detailItem.id) ? (
                      <div className="flex items-center justify-center gap-3">
                        <Button variant="outline" size="icon" className="rounded-xl h-11 w-11"
                          disabled={(selectedItems.get(detailItem.id)?.quantidade || 1) <= (detailItem.quantidade_minima || 1)}
                          onClick={() => { const qty = selectedItems.get(detailItem.id)?.quantidade || 1; if (qty <= (detailItem.quantidade_minima || 1)) toggleItemSelection(detailItem); else updateItemQuantity(detailItem.id, -1); }}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-bold text-xl">{selectedItems.get(detailItem.id)?.quantidade || 1}</span>
                        <Button variant="outline" size="icon" className="rounded-xl h-11 w-11"
                          disabled={(selectedItems.get(detailItem.id)?.quantidade || 1) >= (detailItem.quantidade || 1)}
                          onClick={() => updateItemQuantity(detailItem.id, 1)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" className="rounded-xl h-11" onClick={() => { toggleItemSelection(detailItem); setDetailItem(null); }}>
                          <Trash2 className="w-4 h-4 mr-1" />Remover
                        </Button>
                      </div>
                    ) : (
                      <Button className="w-full rounded-xl h-12 font-semibold text-base gap-2 active:scale-[0.98] transition-transform" onClick={() => { setItemQuantity(detailItem.id, detailItem.quantidade_minima || 1, detailItem); setDetailItem(null); }}>
                        <ShoppingCart className="w-5 h-5" /> Adicionar ao Carrinho
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-4 z-30 w-10 h-10 rounded-full bg-card border border-border/50 shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* no-scrollbar style */}
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
