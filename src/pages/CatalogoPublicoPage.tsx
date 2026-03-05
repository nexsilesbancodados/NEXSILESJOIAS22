import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
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
  Filter,
  X,
  LayoutGrid,
  LayoutList,
  ZoomIn,
  Share2,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { catalogOrderSchema } from '@/lib/validation-schemas';
import { openWhatsAppWithoutPhone } from '@/lib/whatsapp';

const STATUS_OPTIONS = [
  { value: 'em_preparacao', label: 'Em Preparação', color: 'bg-yellow-500/20 text-yellow-600', message: 'Este catálogo está sendo preparado. Em breve estará disponível!' },
  { value: 'aberto', label: 'Aberto e Pronto', color: 'bg-green-500/20 text-green-600', message: 'Catálogo aberto para pedidos!' },
  { value: 'em_fabricacao', label: 'Em Fabricação', color: 'bg-blue-500/20 text-blue-600', message: 'As peças estão em fabricação.' },
  { value: 'fechado', label: 'Fechado', color: 'bg-gray-500/20 text-gray-600', message: 'Este catálogo está fechado para novos pedidos.' },
  { value: 'separacao', label: 'Separação de Peças', color: 'bg-purple-500/20 text-purple-600', message: 'As peças estão sendo separadas.' },
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
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [detailItem, setDetailItem] = useState<CatalogoItemPublico | null>(null);
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'>('default');
  
  // Address fields
  const [enderecoCep, setEnderecoCep] = useState('');
  const [enderecoLogradouro, setEnderecoLogradouro] = useState('');
  const [enderecoNumero, setEnderecoNumero] = useState('');
  const [enderecoComplemento, setEnderecoComplemento] = useState('');
  const [enderecoBairro, setEnderecoBairro] = useState('');
  const [enderecoCidade, setEnderecoCidade] = useState('');
  const [enderecoEstado, setEnderecoEstado] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);

  const { data: catalogo, isLoading: loadingCatalogo, error: catalogoError } = useQuery({
    queryKey: ['catalogo-publico', catalogoId],
    queryFn: async () => {
      if (!catalogoId) throw new Error('ID do catálogo não fornecido');
      
      // Check if catalogoId is a valid UUID format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catalogoId);
      
      // Use the secure public view for anon access
      let query = supabase.from('catalogos_public' as 'catalogos').select('*');
      
      if (isUUID) {
        // Search by ID if it's a UUID
        query = query.eq('id', catalogoId);
      } else {
        // Search by slug if it's not a UUID
        query = query.eq('slug', catalogoId);
      }
      
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
        .select(`
          id,
          catalogo_id,
          peca_id,
          quantidade,
          quantidade_minima,
          ordem,
          destaque,
          created_at,
          peca:pecas(id, nome, codigo, imagem_url, categoria, preco_venda, material, estoque)
        `)
        .eq('catalogo_id', catalogo.id)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching catalog items:', error);
        throw error;
      }
      
      console.log('Catalog items loaded:', data);
      return (data || []) as CatalogoItemPublico[];
    },
    enabled: !!catalogo?.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const toggleItemSelection = (item: CatalogoItemPublico) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      // Start with minimum quantity when adding
      const minQty = item.quantidade_minima || 1;
      newSelected.set(item.id, { item, quantidade: minQty });
    }
    setSelectedItems(newSelected);
  };

  const updateItemQuantity = (itemId: string, delta: number, item?: CatalogoItemPublico) => {
    const newSelected = new Map(selectedItems);
    const selected = newSelected.get(itemId);
    
    if (selected) {
      // Update existing selection respecting min/max
      const minQty = selected.item.quantidade_minima || 1;
      const maxQty = selected.item.quantidade || 999;
      const newQty = Math.max(minQty, Math.min(maxQty, selected.quantidade + delta));
      newSelected.set(itemId, { ...selected, quantidade: newQty });
      setSelectedItems(newSelected);
    } else if (item) {
      // Add new item with minimum quantity
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
      
      // Show feedback when adding new item
      if (!wasSelected) {
        setLastAddedItemId(itemId);
        const minMsg = minQty > 1 ? ` (mín. ${minQty})` : '';
        toast.success(`${item.peca?.nome || 'Item'} adicionado ao carrinho!${minMsg}`, {
          duration: 2000,
          icon: '🛒',
        });
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

  // Extract unique categories and materials for filters
  const categorias = [...new Set(itens.map(i => i.peca?.categoria).filter(Boolean))] as string[];
  const materiais = [...new Set(itens.map(i => i.peca?.material).filter(Boolean))] as string[];

  // Filter items based on search and filters
  const filteredItens = itens.filter(item => {
    const matchesSearch = !searchQuery || 
      item.peca?.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.peca?.codigo?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategoria = !selectedCategoria || item.peca?.categoria === selectedCategoria;
    const matchesMaterial = !selectedMaterial || item.peca?.material === selectedMaterial;
    return matchesSearch && matchesCategoria && matchesMaterial;
  });

  // Sort filtered items
  const sortedItens = [...filteredItens].sort((a, b) => {
    switch (sortOrder) {
      case 'price_asc':
        return (a.peca?.preco_venda || 0) - (b.peca?.preco_venda || 0);
      case 'price_desc':
        return (b.peca?.preco_venda || 0) - (a.peca?.preco_venda || 0);
      case 'name_asc':
        return (a.peca?.nome || '').localeCompare(b.peca?.nome || '');
      case 'name_desc':
        return (b.peca?.nome || '').localeCompare(a.peca?.nome || '');
      default:
        return 0;
    }
  });

  const hasActiveFilters = searchQuery || selectedCategoria || selectedMaterial || sortOrder !== 'default';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategoria('');
    setSelectedMaterial('');
    setSortOrder('default');
  };

  // Cart calculations
  const cartItems = Array.from(selectedItems.values());
  const cartTotal = cartItems.reduce((acc, { item, quantidade }) => acc + ((item.peca?.preco_venda || 0) * quantidade), 0);
  const cartItemCount = cartItems.reduce((acc, { quantidade }) => acc + quantidade, 0);
  const custoExtra = (catalogo?.custo_separacao || 0) + (catalogo?.custo_operacional || 0) + (catalogo?.taxa_entrega || 0);
  const cartGrandTotal = cartTotal + custoExtra;

  // Generate order summary text
  const generateOrderSummary = () => {
    const lines: string[] = [];
    lines.push(`📦 *PEDIDO - ${catalogo?.nome}*`);
    lines.push('');
    
    if (customerName) {
      lines.push(`👤 Cliente: ${customerName}`);
    }
    if (customerPhone) {
      lines.push(`📱 Telefone: ${customerPhone}`);
    }
    if (customerEmail) {
      lines.push(`📧 Email: ${customerEmail}`);
    }
    
    // Add address
    if (enderecoLogradouro || enderecoCidade) {
      lines.push('');
      lines.push('📍 *Endereço de Entrega:*');
      if (enderecoLogradouro) {
        lines.push(`${enderecoLogradouro}${enderecoNumero ? `, ${enderecoNumero}` : ''}`);
      }
      if (enderecoComplemento) {
        lines.push(`${enderecoComplemento}`);
      }
      if (enderecoBairro) {
        lines.push(`${enderecoBairro}`);
      }
      if (enderecoCidade || enderecoEstado) {
        lines.push(`${enderecoCidade}${enderecoEstado ? ` - ${enderecoEstado}` : ''}`);
      }
      if (enderecoCep) {
        lines.push(`CEP: ${enderecoCep}`);
      }
    }
    
    if (customerName || customerPhone || enderecoLogradouro) {
      lines.push('');
    }
    
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
      if ((catalogo?.custo_separacao || 0) > 0) {
        lines.push(`Custo Separação: ${formatCurrency(catalogo?.custo_separacao || 0)}`);
      }
      if ((catalogo?.custo_operacional || 0) > 0) {
        lines.push(`Custo Operacional: ${formatCurrency(catalogo?.custo_operacional || 0)}`);
      }
      if ((catalogo?.taxa_entrega || 0) > 0) {
        lines.push(`Taxa Entrega: ${formatCurrency(catalogo?.taxa_entrega || 0)}`);
      }
    }
    
    lines.push('─────────────────');
    lines.push(`*TOTAL: ${formatCurrency(cartGrandTotal)}*`);
    lines.push('');
    lines.push(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}`);
    
    return lines.join('\n');
  };

  // Buscar endereço por CEP
  const buscarEnderecoPorCep = async () => {
    const cepLimpo = enderecoCep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return;
    }

    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setEnderecoLogradouro(data.logradouro || '');
      setEnderecoBairro(data.bairro || '');
      setEnderecoCidade(data.localidade || '');
      setEnderecoEstado(data.uf || '');
      toast.success('Endereço preenchido!');
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar endereço');
    } finally {
      setBuscandoCep(false);
    }
  };

  const copyOrderSummary = async () => {
    const summary = generateOrderSummary();
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('Resumo copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const submitOrder = async () => {
    if (!catalogoId) return;

    // Validate customer input using Zod schema
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

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0]?.message || 'Dados inválidos');
      return;
    }

    // Use validated data
    const validatedData = validationResult.data;

    setIsSending(true);
    try {
      // Build address string for observacoes field since table doesn't have separate address columns
      const addressParts: string[] = [];
      if (validatedData.endereco_logradouro) {
        addressParts.push(`${validatedData.endereco_logradouro}${validatedData.endereco_numero ? `, ${validatedData.endereco_numero}` : ''}`);
      }
      if (validatedData.endereco_complemento) addressParts.push(validatedData.endereco_complemento);
      if (validatedData.endereco_bairro) addressParts.push(validatedData.endereco_bairro);
      if (validatedData.endereco_cidade || validatedData.endereco_estado) {
        addressParts.push(`${validatedData.endereco_cidade || ''}${validatedData.endereco_estado ? ` - ${validatedData.endereco_estado}` : ''}`);
      }
      if (validatedData.endereco_cep) addressParts.push(`CEP: ${validatedData.endereco_cep}`);
      
      const addressText = addressParts.length > 0 ? `Endereço: ${addressParts.join(', ')}` : null;

      // Generate IDs client-side so we don't need .select() (anon users can't read back rows due to RLS)
      const pedidoId = crypto.randomUUID();
      const romaneioId = crypto.randomUUID();

      // Create the order with validated data (address goes to observacoes)
      const { error: pedidoError } = await supabase
        .from('pedidos_catalogo')
        .insert({
          id: pedidoId,
          catalogo_id: catalogo?.id,
          cliente_nome: validatedData.cliente_nome,
          cliente_telefone: validatedData.cliente_telefone || null,
          cliente_email: validatedData.cliente_email || null,
          observacoes: addressText,
          valor_total: cartGrandTotal,
          status: 'pendente',
        });

      if (pedidoError) throw pedidoError;

      // Create order items
      const orderItems = cartItems.map(({ item, quantidade }) => ({
        pedido_id: pedidoId,
        peca_id: item.peca_id,
        quantidade,
        preco_unitario: item.peca?.preco_venda || 0,
      }));

      const { error: itensError } = await supabase
        .from('pedidos_catalogo_itens')
        .insert(orderItems);

      if (itensError) throw itensError;

      // Criar romaneio automaticamente para o pedido
      if (catalogo?.organization_id) {
        const enderecoCompleto = [
          validatedData.endereco_logradouro,
          validatedData.endereco_numero ? `nº ${validatedData.endereco_numero}` : '',
          validatedData.endereco_complemento,
          validatedData.endereco_bairro,
        ].filter(Boolean).join(', ');

        const { error: romaneioError } = await supabase
          .from('romaneios')
          .insert({
            id: romaneioId,
            organization_id: catalogo.organization_id,
            endereco_entrega: enderecoCompleto || null,
            cidade: validatedData.endereco_cidade || null,
            estado: validatedData.endereco_estado || null,
            cep: validatedData.endereco_cep || null,
            cliente_telefone: validatedData.cliente_telefone || null,
            observacoes: `Pedido do catálogo: ${catalogo.nome}. Cliente: ${validatedData.cliente_nome}${validatedData.cliente_email ? `. Email: ${validatedData.cliente_email}` : ''}`,
            status: 'pendente',
          });

        if (romaneioError) {
          console.error('Erro ao criar romaneio:', romaneioError);
        } else {
          // Criar itens do romaneio
          const romaneioItens = cartItems.map(({ item, quantidade }) => ({
            romaneio_id: romaneioId,
            peca_id: item.peca_id,
            quantidade,
          }));

          const { error: romaneioItensError } = await supabase
            .from('romaneios_pecas')
            .insert(romaneioItens);

          if (romaneioItensError) {
            console.error('Erro ao criar itens do romaneio:', romaneioItensError);
          }
        }
      }

      // Success! Reset form
      setIsOrderSent(true);
      setIsSummaryOpen(false);
      setIsCartOpen(false);
      setSelectedItems(new Map());
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setEnderecoCep('');
      setEnderecoLogradouro('');
      setEnderecoNumero('');
      setEnderecoComplemento('');
      setEnderecoBairro('');
      setEnderecoCidade('');
      setEnderecoEstado('');
      toast.success('Pedido enviado com sucesso!');
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const totalItens = itens.reduce((acc, item) => acc + (item.quantidade || 1), 0);
  const totalValor = itens.reduce((acc, item) => acc + ((item.peca?.preco_venda || 0) * (item.quantidade || 1)), 0);
  const totalGeralCatalogo = totalValor + custoExtra;

  if (loadingCatalogo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  if (catalogoError || !catalogo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Catálogo não encontrado</h1>
            <p className="text-muted-foreground">
              O catálogo que você está procurando não existe ou foi removido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(catalogo.status);
  const isBlocked = catalogo.status === 'bloqueado' || catalogo.status === 'finalizado' || catalogo.status === 'fechado';
  const canOrder = catalogo.status === 'aberto';

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero Header with Banner */}
      <div className="relative overflow-hidden">
        {/* Background */}
        {catalogo.banner_url || catalogo.imagem_capa || catalogo.imagem_url ? (
          <div className="absolute inset-0">
            <img
              src={catalogo.banner_url || catalogo.imagem_capa || catalogo.imagem_url || ''}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/60" />
        )}

        {/* Header Content */}
        <div className="relative z-10 px-4 pt-8 pb-10">
          <div className="max-w-4xl mx-auto">
            {/* Logo + Title */}
            <div className="flex items-center gap-4 mb-6">
              {catalogo.logo_url ? (
                <img
                  src={catalogo.logo_url}
                  alt="Logo"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/20 shadow-xl"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/20">
                  <ShoppingBag className="w-7 h-7 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white tracking-tight truncate">
                  {catalogo.titulo || catalogo.nome}
                </h1>
                <Badge className={cn(
                  'mt-1.5 text-xs font-medium border-0',
                  isBlocked
                    ? 'bg-red-500/20 text-red-200 backdrop-blur-sm'
                    : 'bg-white/15 text-white/90 backdrop-blur-sm'
                )}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>

            {/* Welcome Message */}
            {catalogo.mensagem_boas_vindas && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
                <p className="text-white/90 text-sm leading-relaxed">{catalogo.mensagem_boas_vindas}</p>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center border border-white/5">
                <p className="text-xl font-bold text-white">{totalItens}</p>
                <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">Peças</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center border border-white/5">
                <p className="text-xl font-bold text-white">{categorias.length}</p>
                <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">Categorias</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center border border-white/5">
                <p className="text-xl font-bold text-white">{materiais.length}</p>
                <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">Materiais</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert (only if blocked or has observacao) */}
      {(isBlocked || catalogo.observacao) && (
        <div className="max-w-4xl mx-auto px-4 -mt-4 relative z-10 mb-4">
          <div className={cn(
            'rounded-xl p-4 shadow-sm border',
            isBlocked
              ? 'bg-destructive/5 border-destructive/20'
              : 'bg-primary/5 border-primary/20'
          )}>
            <div className="flex items-start gap-3">
              {isBlocked ? (
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              )}
              <div>
                {isBlocked && (
                  <p className="font-medium text-foreground text-sm">{statusInfo.message}</p>
                )}
                {catalogo.observacao && (
                  <p className="text-sm text-muted-foreground mt-0.5">{catalogo.observacao}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* Search and Filters - Compact */}
        <div className="space-y-3">
          {/* Search + View Toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar peças..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-card border-border/50 rounded-xl"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <div className="flex bg-card border border-border/50 rounded-xl overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          {(categorias.length > 0 || materiais.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {categorias.length > 0 && (
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="h-9 px-3 py-1 text-sm border border-border/50 rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Todas categorias</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
              {materiais.length > 0 && (
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="h-9 px-3 py-1 text-sm border border-border/50 rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Todos materiais</option>
                  {materiais.map(mat => (
                    <option key={mat} value={mat}>{mat}</option>
                  ))}
                </select>
              )}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="h-9 px-3 py-1 text-sm border border-border/50 rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="default">Ordenar</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="name_asc">Nome A-Z</option>
                <option value="name_desc">Nome Z-A</option>
              </select>
            </div>
          )}

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">{filteredItens.length} de {itens.length}</span>
              {selectedCategoria && (
                <Badge variant="secondary" className="text-xs gap-1">
                  {selectedCategoria}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategoria('')} />
                </Badge>
              )}
              {selectedMaterial && (
                <Badge variant="secondary" className="text-xs gap-1">
                  {selectedMaterial}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedMaterial('')} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-6 px-2">
                Limpar tudo
              </Button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loadingItens ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Carregando peças...</p>
          </div>
        ) : sortedItens.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">
              {hasActiveFilters ? 'Nenhuma peça encontrada' : 'Catálogo vazio'}
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-1 text-sm">
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              : "space-y-2.5"
          )}>
            {sortedItens.map((item) => {
              const isSelected = selectedItems.has(item.id);
              const selectedQty = selectedItems.get(item.id)?.quantidade || 0;
              const maxQty = item.quantidade || 1;
              const justAdded = lastAddedItemId === item.id;
              const isOutOfStock = (item.peca?.estoque || 0) === 0;

              // ─── GRID VIEW ───
              if (viewMode === 'grid') {
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative bg-card rounded-xl overflow-hidden border transition-all duration-200",
                      isSelected ? "ring-2 ring-primary border-primary/30 shadow-md" : "border-border/40 hover:shadow-md hover:border-border",
                      isOutOfStock && "opacity-50",
                      justAdded && "animate-scale-in ring-2 ring-primary shadow-lg"
                    )}
                  >
                    {/* Image */}
                    <div
                      className="relative aspect-square bg-muted/30 overflow-hidden cursor-pointer"
                      onClick={() => setDetailItem(item)}
                    >
                      {canOrder && !isOutOfStock && (
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItemSelection(item)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white shadow-sm border-border/50"
                          />
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-[5] flex items-center justify-center">
                          <span className="text-xs font-semibold bg-muted px-3 py-1 rounded-full text-muted-foreground">Esgotado</span>
                        </div>
                      )}
                      {item.destaque && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-amber-500/90 text-white border-0 text-[10px] px-1.5 py-0.5 shadow-sm">
                            ★ Destaque
                          </Badge>
                        </div>
                      )}
                      {item.peca?.imagem_url ? (
                        <img
                          src={item.peca.imagem_url}
                          alt={item.peca?.nome || 'Peça'}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-1.5">
                      <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                        {item.peca?.nome || 'Peça removida'}
                      </h3>
                      {item.peca?.codigo && (
                        <p className="text-[11px] text-muted-foreground font-mono">{item.peca.codigo}</p>
                      )}
                      <p className="font-bold text-lg text-primary tracking-tight">
                        {formatCurrency(item.peca?.preco_venda || 0)}
                      </p>

                      {/* Add/Qty */}
                      {canOrder && !isOutOfStock && (
                        <div className="pt-2">
                          {isSelected ? (
                            <div className="flex items-center justify-between bg-primary/5 rounded-lg px-2 py-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (selectedQty <= 1) toggleItemSelection(item);
                                  else updateItemQuantity(item.id, -1);
                                }}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <span className="font-bold text-sm text-primary">{selectedQty}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-primary/10"
                                disabled={selectedQty >= maxQty}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateItemQuantity(item.id, 1);
                                }}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-8 text-xs rounded-lg border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemQuantity(item.id, 1, item);
                              }}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Adicionar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // ─── LIST VIEW ───
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group bg-card rounded-xl overflow-hidden border transition-all duration-200",
                    isSelected ? "ring-2 ring-primary border-primary/30 shadow-md" : "border-border/40 hover:shadow-sm",
                    isOutOfStock && "opacity-50",
                    justAdded && "animate-scale-in ring-2 ring-primary shadow-lg"
                  )}
                >
                  <div className="flex gap-0">
                    {/* Image */}
                    <div
                      className="relative w-28 sm:w-32 flex-shrink-0 bg-muted/30 overflow-hidden cursor-pointer"
                      onClick={() => setDetailItem(item)}
                    >
                      {canOrder && !isOutOfStock && (
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItemSelection(item)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white shadow-sm"
                          />
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-[5] flex items-center justify-center">
                          <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Esgotado</span>
                        </div>
                      )}
                      {item.peca?.imagem_url ? (
                        <img
                          src={item.peca.imagem_url}
                          alt={item.peca?.nome || 'Peça'}
                          className="w-full h-full object-cover aspect-square"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className="font-medium text-foreground text-sm line-clamp-2 leading-tight cursor-pointer"
                            onClick={() => canOrder && !isOutOfStock && toggleItemSelection(item)}
                          >
                            {item.peca?.nome || 'Peça removida'}
                          </h3>
                          <span className="font-bold text-primary text-base whitespace-nowrap">
                            {formatCurrency(item.peca?.preco_venda || 0)}
                          </span>
                        </div>
                        {item.peca?.codigo && (
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{item.peca.codigo}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.peca?.categoria && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-border/50">
                              {item.peca.categoria}
                            </Badge>
                          )}
                          {item.peca?.material && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              {item.peca.material}
                            </Badge>
                          )}
                          {item.destaque && (
                            <Badge className="text-[10px] h-5 px-1.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                              ★ Destaque
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      {canOrder && !isOutOfStock && (
                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-[11px] text-muted-foreground">
                            Disp: {maxQty}
                          </span>
                          {isSelected ? (
                            <div className="flex items-center gap-1.5 bg-primary/5 rounded-lg px-2 py-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (selectedQty <= 1) toggleItemSelection(item);
                                  else updateItemQuantity(item.id, -1);
                                }}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center font-bold text-sm text-primary">{selectedQty}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={selectedQty >= maxQty}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateItemQuantity(item.id, 1);
                                }}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs rounded-lg border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemQuantity(item.id, 1, item);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Adicionar
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
                </div>
              );
            })}
          </div>
        )}

        {/* Contact Info */}
        {(catalogo.whatsapp || catalogo.email_contato) && (
          <div className="flex items-center justify-center gap-4 py-4 text-sm text-muted-foreground">
            {catalogo.whatsapp && (
              <a
                href={`https://wa.me/${catalogo.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            )}
            {catalogo.email_contato && (
              <a
                href={`mailto:${catalogo.email_contato}`}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                E-mail
              </a>
            )}
          </div>
        )}
      </div>

      {/* ─── FLOATING CART ─── */}
      {canOrder && selectedItems.size > 0 && (
        <div className="fixed bottom-5 left-0 right-0 px-4 z-20">
          <div className="max-w-4xl mx-auto">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button
                  className={cn(
                    "w-full h-14 text-base shadow-2xl rounded-2xl bg-primary hover:bg-primary/90 transition-all",
                    lastAddedItemId && "animate-scale-in"
                  )}
                >
                  <ShoppingCart className={cn(
                    "w-5 h-5 mr-2",
                    lastAddedItemId && "animate-bounce"
                  )} />
                  <span>Carrinho ({cartItemCount})</span>
                  <span className="ml-auto font-bold">{formatCurrency(cartTotal)}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Seu Carrinho
                    <Badge variant="secondary" className="ml-1">{cartItemCount}</Badge>
                  </SheetTitle>
                  <SheetDescription>
                    Revise seus itens e finalize o pedido
                  </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100%-220px)] mt-4">
                  <div className="space-y-2.5 pr-4">
                    {cartItems.map(({ item, quantidade }) => (
                      <div key={item.id} className="flex gap-3 p-3 bg-muted/30 rounded-xl border border-border/30">
                        <div className="w-14 h-14 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                          {item.peca?.imagem_url ? (
                            <img src={item.peca.imagem_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.peca?.nome || 'Peça'}</h4>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.peca?.preco_venda || 0)} cada</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1.5 bg-background rounded-lg px-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, -1)} disabled={quantidade <= 1}>
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium">{quantidade}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, 1)} disabled={quantidade >= (item.peca?.estoque || 999)}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-primary">{formatCurrency((item.peca?.preco_venda || 0) * quantidade)}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <SheetFooter className="mt-4 flex-col gap-3">
                  <div className="w-full space-y-1.5 text-sm bg-muted/30 rounded-xl p-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    {custoExtra > 0 && (
                      <>
                        {(catalogo?.custo_separacao || 0) > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Separação</span>
                            <span>{formatCurrency(catalogo?.custo_separacao || 0)}</span>
                          </div>
                        )}
                        {(catalogo?.custo_operacional || 0) > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Operacional</span>
                            <span>{formatCurrency(catalogo?.custo_operacional || 0)}</span>
                          </div>
                        )}
                        {(catalogo?.taxa_entrega || 0) > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Entrega</span>
                            <span>{formatCurrency(catalogo?.taxa_entrega || 0)}</span>
                          </div>
                        )}
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(cartGrandTotal)}</span>
                    </div>
                  </div>
                  <div className="w-full flex gap-2">
                    <Button variant="outline" onClick={clearCart} className="flex-1 rounded-xl">
                      Limpar
                    </Button>
                    <Button className="flex-1 rounded-xl" onClick={() => setIsSummaryOpen(true)}>
                      <Send className="w-4 h-4 mr-2" />
                      Finalizar Pedido
                    </Button>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      {/* ─── SUMMARY / CHECKOUT DIALOG ─── */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Finalizar Pedido</DialogTitle>
            <DialogDescription>Preencha seus dados para enviar</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Personal Data */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <span>👤</span> Dados Pessoais
              </p>
              <div className="space-y-2">
                <Label htmlFor="customer-name">Seu Nome *</Label>
                <Input id="customer-name" placeholder="Digite seu nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="rounded-xl" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">WhatsApp</Label>
                  <Input id="customer-phone" placeholder="(00) 00000-0000" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">E-mail</Label>
                  <Input id="customer-email" type="email" placeholder="seu@email.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="rounded-xl" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Endereço de Entrega
              </p>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-2">
                  <Input id="cep" placeholder="00000-000" value={enderecoCep} onChange={(e) => setEnderecoCep(e.target.value)} maxLength={9} className="rounded-xl" />
                  <Button type="button" variant="outline" size="icon" onClick={buscarEnderecoPorCep} disabled={buscandoCep} className="rounded-xl flex-shrink-0">
                    {buscandoCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input id="logradouro" placeholder="Rua, Av, etc." value={enderecoLogradouro} onChange={(e) => setEnderecoLogradouro(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" placeholder="123" value={enderecoNumero} onChange={(e) => setEnderecoNumero(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" placeholder="Apto, Bloco" value={enderecoComplemento} onChange={(e) => setEnderecoComplemento(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" placeholder="Bairro" value={enderecoBairro} onChange={(e) => setEnderecoBairro(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" placeholder="Cidade" value={enderecoCidade} onChange={(e) => setEnderecoCidade(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">UF</Label>
                  <Input id="estado" placeholder="SP" value={enderecoEstado} onChange={(e) => setEnderecoEstado(e.target.value.toUpperCase())} maxLength={2} className="rounded-xl" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="bg-muted/40 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumo do Pedido</p>
              <div className="text-sm space-y-1 max-h-28 overflow-y-auto">
                <p className="font-medium">{cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'}</p>
                {cartItems.slice(0, 4).map(({ item, quantidade }) => (
                  <p key={item.id} className="text-muted-foreground text-xs">• {item.peca?.nome} × {quantidade}</p>
                ))}
                {cartItems.length > 4 && (
                  <p className="text-muted-foreground text-xs">... +{cartItems.length - 4} item(ns)</p>
                )}
              </div>
              <Separator />
              <p className="font-bold text-primary text-base">Total: {formatCurrency(cartGrandTotal)}</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={copyOrderSummary} className="w-full sm:w-auto rounded-xl">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
            <Button onClick={submitOrder} disabled={isSending || !customerName.trim()} className="w-full sm:w-auto rounded-xl">
              {isSending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />Enviar Pedido</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── SUCCESS DIALOG ─── */}
      <Dialog open={isOrderSent} onOpenChange={setIsOrderSent}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <DialogTitle className="text-xl mb-2">Pedido Enviado! 🎉</DialogTitle>
            <DialogDescription className="text-base">
              Seu pedido foi recebido com sucesso. A loja entrará em contato em breve.
            </DialogDescription>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOrderSent(false)} className="w-full rounded-xl">
              Continuar Navegando
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DETAIL MODAL ─── */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {detailItem && (
            <>
              {/* Large Image */}
              <div className="relative aspect-square bg-muted/30 overflow-hidden">
                {detailItem.peca?.imagem_url ? (
                  <img src={detailItem.peca.imagem_url} alt={detailItem.peca?.nome || ''} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground/20" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{detailItem.peca?.nome || 'Peça'}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">Código: {detailItem.peca?.codigo || '-'}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{formatCurrency(detailItem.peca?.preco_venda || 0)}</span>
                  <span className="text-sm text-muted-foreground">Disp: {detailItem.quantidade || 1}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {detailItem.peca?.categoria && <Badge variant="outline">{detailItem.peca.categoria}</Badge>}
                  {detailItem.peca?.material && <Badge variant="secondary">{detailItem.peca.material}</Badge>}
                </div>

                {/* Share */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      const peca = detailItem.peca;
                      if (!peca) return;
                      const pageUrl = window.location.href;
                      const message = [
                        `✨ *${peca.nome}*`, '',
                        `💰 ${formatCurrency(peca.preco_venda || 0)}`,
                        peca.codigo ? `📦 ${peca.codigo}` : '',
                        '', `👉 ${pageUrl}`,
                      ].filter(Boolean).join('\n');
                      openWhatsAppWithoutPhone(message);
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={async () => {
                      const peca = detailItem.peca;
                      if (!peca) return;
                      try {
                        await navigator.clipboard.writeText(`${peca.nome} - ${formatCurrency(peca.preco_venda || 0)}\n${window.location.href}`);
                        toast.success('Link copiado!', { duration: 2000 });
                      } catch { toast.error('Erro ao copiar'); }
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                {/* Add to Cart */}
                {canOrder && (
                  <div className="pt-2 border-t">
                    {detailItem.quantidade_minima && detailItem.quantidade_minima > 1 && (
                      <p className="text-xs text-muted-foreground text-center mb-2">
                        Mínimo: {detailItem.quantidade_minima} un
                      </p>
                    )}
                    {selectedItems.has(detailItem.id) ? (
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          disabled={(selectedItems.get(detailItem.id)?.quantidade || 1) <= (detailItem.quantidade_minima || 1)}
                          onClick={() => {
                            const qty = selectedItems.get(detailItem.id)?.quantidade || 1;
                            if (qty <= (detailItem.quantidade_minima || 1)) toggleItemSelection(detailItem);
                            else updateItemQuantity(detailItem.id, -1);
                          }}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 text-center font-bold text-lg">{selectedItems.get(detailItem.id)?.quantidade || 1}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          disabled={(selectedItems.get(detailItem.id)?.quantidade || 1) >= (detailItem.quantidade || 1)}
                          onClick={() => updateItemQuantity(detailItem.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => { toggleItemSelection(detailItem); setDetailItem(null); }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />Remover
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full rounded-xl h-11"
                        onClick={() => {
                          setItemQuantity(detailItem.id, detailItem.quantidade_minima || 1, detailItem);
                          setDetailItem(null);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar ao Carrinho
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
