import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useMaletaPresence } from '@/hooks/useMaletaPresence';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Briefcase, 
  Loader2, 
  AlertTriangle,
  Heart,
  Plus,
  Minus,
  Trash2,
  Send,
  CheckCircle2,
  Phone,
  User,
  MessageSquare,
  Sparkles,
  Circle,
  Search,
  ShoppingBag,
  Star,
  ChevronRight,
  X,
  Package,
  Eye,
  Gem,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface MaletaPublica {
  id: string;
  nome: string;
  status: string | null;
  sharing_slug: string | null;
  is_public: boolean | null;
  revendedora_id: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  imagem_capa: string | null;
  revendedora?: {
    nome: string;
    telefone: string | null;
    whatsapp: string | null;
  } | null;
}

interface MaletaItemPublico {
  id: string;
  maleta_id: string;
  peca_id: string;
  quantidade: number;
  vendida: boolean | null;
  preco_unitario: number | null;
  peca: {
    id: string;
    nome: string;
    codigo: string | null;
    imagem_url: string | null;
    categoria: string | null;
    preco_venda: number | null;
    material: string | null;
  } | null;
}

interface SelectedItem {
  item: MaletaItemPublico;
  quantidade: number;
}

export default function MaletaPublicaPage() {
  const { maletaId } = useParams<{ maletaId: string }>();
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [productModal, setProductModal] = useState<MaletaItemPublico | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Customer form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Fetch maleta data
  const { data: maleta, isLoading: loadingMaleta, error: maletaError } = useQuery({
    queryKey: ['maleta-publica', maletaId],
    queryFn: async () => {
      if (!maletaId) throw new Error('ID da maleta não fornecido');
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(maletaId);
      
      let query = supabase
        .from('maletas_public' as 'maletas')
        .select('*');
      
      if (isUUID) {
        query = query.eq('id', maletaId);
      } else {
        query = query.eq('sharing_slug', maletaId);
      }
      
      const { data: maletaData, error: maletaError } = await query.single();
      if (maletaError) throw maletaError;
      
      return { ...maletaData, revendedora: null } as MaletaPublica;
    },
    enabled: !!maletaId,
  });

  const { isRevendedoraOnline, viewersCount } = useMaletaPresence(maleta?.id, 'viewer');

  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (!maleta?.id || hasNotifiedRef.current) return;
    
    const notifyView = async () => {
      try {
        hasNotifiedRef.current = true;
        await supabase.functions.invoke('notificar-visualizacao-maleta', {
          body: {
            maleta_id: maleta.id,
            visitor_info: {
              user_agent: navigator.userAgent,
              referrer: document.referrer || undefined,
            },
          },
        });
      } catch (error) {
        console.error('Failed to send view notification:', error);
      }
    };

    const timeoutId = setTimeout(notifyView, 2000);
    return () => clearTimeout(timeoutId);
  }, [maleta?.id]);

  const { data: itens = [], isLoading: loadingItens } = useQuery({
    queryKey: ['maleta-items-publica', maleta?.id],
    queryFn: async () => {
      if (!maleta?.id) return [];
      
      const { data, error } = await supabase
        .from('maletas_pecas')
        .select(`
          *,
          peca:pecas(id, nome, codigo, imagem_url, categoria, preco_venda, material)
        `)
        .eq('maleta_id', maleta.id)
        .eq('vendida', false);
      
      if (error) throw error;
      return (data || []) as MaletaItemPublico[];
    },
    enabled: !!maleta?.id,
  });

  // Submit interest mutation
  const submitInterest = useMutation({
    mutationFn: async () => {
      if (!maleta?.id) throw new Error('Maleta não encontrada');
      if (!customerName.trim()) throw new Error('Nome é obrigatório');
      
      const cartItems = Array.from(selectedItems.values());
      const itensPayload = cartItems.map(({ item, quantidade }) => ({
        peca_id: item.peca_id,
        quantidade,
      }));

      const { data: interesseId, error } = await supabase.rpc('criar_interesse_maleta', {
        p_maleta_id: maleta.id,
        p_cliente_nome: customerName.trim(),
        p_cliente_telefone: customerPhone.trim() || null,
        p_cliente_email: customerEmail.trim() || null,
        p_observacoes: observacoes.trim() || null,
        p_itens: JSON.stringify(itensPayload),
      });

      if (error) {
        console.error('RPC criar_interesse_maleta error:', error);
        throw new Error('Erro ao enviar pedido. Tente novamente.');
      }

      try {
        await supabase.functions.invoke('notificar-novo-pedido-revendedora', {
          body: { interesse_id: interesseId },
        });
      } catch {}

      return { id: interesseId };
    },
    onSuccess: () => {
      setIsSuccess(true);
      setIsFormOpen(false);
      setIsCartOpen(false);
      setSelectedItems(new Map());
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setObservacoes('');
      toast.success('Pedido enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar interesse');
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const toggleItemSelection = (item: MaletaItemPublico) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.set(item.id, { item, quantidade: 1 });
    }
    setSelectedItems(newSelected);
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
    const newSelected = new Map(selectedItems);
    const selected = newSelected.get(itemId);
    if (selected) {
      const maxQty = selected.item.quantidade || 1;
      const newQty = Math.max(1, Math.min(maxQty, selected.quantidade + delta));
      newSelected.set(itemId, { ...selected, quantidade: newQty });
      setSelectedItems(newSelected);
    }
  };

  const removeFromCart = (itemId: string) => {
    const newSelected = new Map(selectedItems);
    newSelected.delete(itemId);
    setSelectedItems(newSelected);
  };

  const addToCartFromModal = () => {
    if (!productModal) return;
    const newSelected = new Map(selectedItems);
    if (!newSelected.has(productModal.id)) {
      newSelected.set(productModal.id, { item: productModal, quantidade: 1 });
    }
    setSelectedItems(newSelected);
    toast.success('Adicionado à sacola!');
    setProductModal(null);
  };

  // Derived data
  const availableItems = itens.filter(item => !item.vendida && item.peca);
  
  const categories = useMemo(() => {
    const cats = new Set<string>();
    availableItems.forEach(item => {
      if (item.peca?.categoria) cats.add(item.peca.categoria);
    });
    return Array.from(cats).sort();
  }, [availableItems]);

  const filteredItems = useMemo(() => {
    return availableItems.filter(item => {
      const matchSearch = !searchQuery || 
        item.peca?.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.peca?.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.peca?.material?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = !selectedCategory || item.peca?.categoria === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [availableItems, searchQuery, selectedCategory]);

  const cartItems = Array.from(selectedItems.values());
  const cartTotal = cartItems.reduce((acc, { item, quantidade }) => {
    return acc + (item.preco_unitario || item.peca?.preco_venda || 0) * quantidade;
  }, 0);
  const cartItemCount = cartItems.reduce((acc, { quantidade }) => acc + quantidade, 0);

  const openWhatsApp = () => {
    if (!maleta?.revendedora?.whatsapp && !maleta?.revendedora?.telefone) {
      toast.error('Revendedora sem contato disponível');
      return;
    }
    const phone = (maleta.revendedora.whatsapp || maleta.revendedora.telefone || '').replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Vi sua vitrine "${maleta.nome}" e tenho interesse em algumas peças!`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const corPrimaria = maleta?.cor_primaria || '#8B5CF6';
  const corSecundaria = maleta?.cor_secundaria || '#EC4899';

  // Loading
  if (loadingMaleta) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${corPrimaria}10, ${corSecundaria}10)` }}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}>
            <Gem className="w-8 h-8 text-white animate-pulse" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Carregando vitrine...</p>
        </div>
      </div>
    );
  }

  // Error
  if (maletaError || !maleta) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold">Vitrine não encontrada</h1>
            <p className="text-muted-foreground">A vitrine que você procura não existe ou não está disponível.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!maleta.is_public) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
            <h1 className="text-xl font-semibold">Vitrine Privada</h1>
            <p className="text-muted-foreground">Esta vitrine não está disponível no momento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${corPrimaria}05, ${corSecundaria}08)` }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <Card className="max-w-md w-full shadow-2xl border-0">
            <CardContent className="pt-10 pb-10 text-center space-y-5">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${corPrimaria}20, ${corSecundaria}20)` }}>
                <CheckCircle2 className="w-10 h-10" style={{ color: corPrimaria }} />
              </div>
              <h1 className="text-2xl font-bold">Pedido Enviado!</h1>
              <p className="text-muted-foreground">
                Sua seleção foi enviada com sucesso. A revendedora entrará em contato em breve para finalizar a compra.
              </p>
              <div className="space-y-3 pt-2">
                <Button variant="outline" onClick={() => setIsSuccess(false)} className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Continuar vendo peças
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${corPrimaria}04, #fafafa 30%, #ffffff)` }}>
      {/* Announcement Bar */}
      <div className="text-white text-center py-2.5 text-xs sm:text-sm font-medium tracking-wide" style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}>
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>✨ Vitrine Exclusiva • Selecione suas peças favoritas e faça seu pedido</span>
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Hero Banner */}
      {maleta.imagem_capa ? (
        <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden">
          <img src={maleta.imagem_capa} alt={maleta.nome} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${corPrimaria}40, ${corPrimaria}90)` }} />
          <div className="absolute inset-0 flex items-center justify-center text-center px-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {maleta.nome}
              </h1>
              <p className="text-white/80 mt-2 text-sm sm:text-base">Coleção exclusiva com {availableItems.length} peças disponíveis</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-40 sm:h-52 overflow-hidden" style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-center px-4">
            <div>
              <Gem className="w-10 h-10 text-white/90 mx-auto mb-3" />
              <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {maleta.nome}
              </h1>
              <p className="text-white/70 mt-2 text-sm">{availableItems.length} peças disponíveis</p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}>
                <Gem className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm truncate text-foreground">{maleta.nome}</h2>
                <div className="flex items-center gap-2">
                  <div className={cn("flex items-center gap-1 text-xs", isRevendedoraOnline ? "text-green-600" : "text-muted-foreground")}>
                    <Circle className={cn("w-1.5 h-1.5", isRevendedoraOnline && "fill-green-500 text-green-500 animate-pulse")} />
                    {isRevendedoraOnline ? "Online" : "Offline"}
                  </div>
                  {viewersCount > 1 && (
                    <span className="text-xs text-muted-foreground">• {viewersCount} visualizando</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(maleta.revendedora?.whatsapp || maleta.revendedora?.telefone) && (
                <Button variant="outline" size="sm" onClick={openWhatsApp} className="text-xs gap-1.5 border-green-200 text-green-700 hover:bg-green-50">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
              )}
              {cartItemCount > 0 && (
                <Button size="sm" className="gap-1.5 text-xs text-white relative" style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }} onClick={() => setIsCartOpen(true)}>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sacola</span>
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-white border-2" style={{ color: corPrimaria, borderColor: corPrimaria }}>
                    {cartItemCount}
                  </Badge>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="bg-muted/30 border-b">
        <div className="max-w-6xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground overflow-x-auto">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Star className="w-3.5 h-3.5" style={{ color: corPrimaria }} />
              <span>Peças exclusivas</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: corPrimaria }} />
              <span>Qualidade garantida</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Phone className="w-3.5 h-3.5" style={{ color: corPrimaria }} />
              <span>Atendimento personalizado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-32">
        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-muted-foreground/20 focus-visible:ring-1"
              style={{ '--tw-ring-color': corPrimaria } as React.CSSProperties}
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery('')}>
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                className="rounded-full text-xs shrink-0 h-8"
                style={selectedCategory === null ? { background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` } : undefined}
                onClick={() => setSelectedCategory(null)}
              >
                Todas ({availableItems.length})
              </Button>
              {categories.map(cat => {
                const count = availableItems.filter(i => i.peca?.categoria === cat).length;
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full text-xs shrink-0 h-8"
                    style={selectedCategory === cat ? { background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` } : undefined}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat} ({count})
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        {/* Results count */}
        {(searchQuery || selectedCategory) && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} {filteredItems.length === 1 ? 'peça encontrada' : 'peças encontradas'}
            </p>
            {(searchQuery || selectedCategory) && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>
                Limpar filtros
              </Button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {loadingItens ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-xl" />
                <div className="mt-2 space-y-2 px-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-foreground">
                {searchQuery || selectedCategory ? 'Nenhuma peça encontrada' : 'Não há peças disponíveis'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || selectedCategory ? 'Tente alterar os filtros de busca' : 'Volte em breve para novas peças!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <AnimatePresence>
              {filteredItems.map((item, index) => {
                const isSelected = selectedItems.has(item.id);
                const preco = item.preco_unitario || item.peca?.preco_venda || 0;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                  >
                    <div
                      className={cn(
                        "group bg-white rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-lg cursor-pointer",
                        isSelected ? "ring-2 shadow-md" : "hover:border-muted-foreground/20"
                      )}
                      style={isSelected ? { '--tw-ring-color': corPrimaria } as React.CSSProperties : undefined}
                    >
                      {/* Image */}
                      <div className="aspect-square bg-muted/30 relative overflow-hidden" onClick={() => setProductModal(item)}>
                        {item.peca?.imagem_url ? (
                          <img
                            src={item.peca.imagem_url}
                            alt={item.peca.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gem className="w-10 h-10 text-muted-foreground/30" />
                          </div>
                        )}
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              Ver detalhes
                            </div>
                          </div>
                        </div>

                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md" style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}>
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </div>
                        )}
                        
                        {/* Category badge */}
                        {item.peca?.categoria && (
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="text-[10px] bg-white/90 backdrop-blur-sm border-0 shadow-sm">
                              {item.peca.categoria}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h3 className="font-medium text-sm truncate text-foreground">{item.peca?.nome || 'Peça'}</h3>
                        {item.peca?.codigo && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">Cód: {item.peca.codigo}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-bold text-base" style={{ color: corPrimaria }}>
                            {formatCurrency(preco)}
                          </p>
                          <Button
                            size="sm"
                            variant={isSelected ? "outline" : "default"}
                            className={cn("h-8 w-8 p-0 rounded-full", isSelected && "border-2")}
                            style={isSelected 
                              ? { borderColor: corPrimaria, color: corPrimaria } 
                              : { background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }
                            }
                            onClick={(e) => { e.stopPropagation(); toggleItemSelection(item); }}
                          >
                            {isSelected ? <Heart className="w-3.5 h-3.5 fill-current" /> : <Plus className="w-4 h-4 text-white" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 px-4 z-20"
          >
            <div className="max-w-lg mx-auto">
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button 
                    size="lg" 
                    className="w-full gap-3 shadow-2xl text-white h-14 rounded-2xl text-base"
                    style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Ver sacola ({cartItemCount})
                    <span className="ml-auto font-bold">{formatCurrency(cartTotal)}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
                  <SheetHeader className="text-left">
                    <SheetTitle className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" style={{ color: corPrimaria }} />
                      Sua Sacola
                    </SheetTitle>
                    <SheetDescription>
                      {cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'} selecionado(s)
                    </SheetDescription>
                  </SheetHeader>
                  
                  <ScrollArea className="flex-1 h-[calc(100%-220px)] my-4">
                    <div className="space-y-3 pr-4">
                      {cartItems.map(({ item, quantidade }) => {
                        const preco = item.preco_unitario || item.peca?.preco_venda || 0;
                        return (
                          <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-muted/30 border">
                            <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                              {item.peca?.imagem_url ? (
                                <img src={item.peca.imagem_url} alt={item.peca.nome} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Gem className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{item.peca?.nome}</h4>
                              <p className="text-xs text-muted-foreground">{formatCurrency(preco)}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateItemQuantity(item.id, -1)} disabled={quantidade <= 1}>
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm font-medium w-6 text-center">{quantidade}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateItemQuantity(item.id, 1)} disabled={quantidade >= item.quantidade}>
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="font-bold text-sm" style={{ color: corPrimaria }}>{formatCurrency(preco * quantidade)}</p>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total estimado:</span>
                      <span className="text-xl font-bold" style={{ color: corPrimaria }}>{formatCurrency(cartTotal)}</span>
                    </div>
                    <Button 
                      className="w-full gap-2 h-12 rounded-xl text-white text-base" 
                      style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}
                      onClick={() => setIsFormOpen(true)}
                    >
                      <Send className="w-4 h-4" />
                      Finalizar pedido
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <Dialog open={!!productModal} onOpenChange={(open) => !open && setProductModal(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {productModal && (() => {
            const preco = productModal.preco_unitario || productModal.peca?.preco_venda || 0;
            const isSelected = selectedItems.has(productModal.id);
            return (
              <>
                {/* Image */}
                <div className="aspect-[4/3] bg-muted relative">
                  {productModal.peca?.imagem_url ? (
                    <img src={productModal.peca.imagem_url} alt={productModal.peca.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gem className="w-16 h-16 text-muted-foreground/20" />
                    </div>
                  )}
                  {productModal.peca?.categoria && (
                    <Badge className="absolute bottom-3 left-3 bg-white/90 text-foreground backdrop-blur-sm border-0 shadow-sm">
                      {productModal.peca.categoria}
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{productModal.peca?.nome}</h2>
                    {productModal.peca?.codigo && (
                      <p className="text-sm text-muted-foreground mt-1">Código: {productModal.peca.codigo}</p>
                    )}
                  </div>
                  
                  {productModal.peca?.material && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {productModal.peca.material}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Preço</p>
                      <p className="text-2xl font-bold" style={{ color: corPrimaria }}>{formatCurrency(preco)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Disponível</p>
                      <p className="font-semibold">{productModal.quantidade} un.</p>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 gap-2 rounded-xl text-white text-base"
                    style={{ background: isSelected ? undefined : `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}
                    variant={isSelected ? 'outline' : 'default'}
                    onClick={isSelected ? () => { toggleItemSelection(productModal); setProductModal(null); } : addToCartFromModal}
                  >
                    {isSelected ? (
                      <>
                        <Heart className="w-4 h-4 fill-current" style={{ color: corPrimaria }} />
                        <span style={{ color: corPrimaria }}>Remover da sacola</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Adicionar à sacola
                      </>
                    )}
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Customer Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" style={{ color: corPrimaria }} />
              Seus Dados
            </DialogTitle>
            <DialogDescription>
              Preencha para enviar seu pedido à revendedora
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" placeholder="Seu nome completo" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input id="phone" placeholder="(11) 99999-9999" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea id="obs" placeholder="Alguma mensagem?" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => submitInterest.mutate()}
              disabled={!customerName.trim() || submitInterest.isPending}
              className="gap-2 text-white"
              style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}
            >
              {submitInterest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
