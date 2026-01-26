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
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { catalogOrderSchema } from '@/lib/validation-schemas';

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
  status?: string | null;
  observacao?: string | null;
  custo_separacao?: number | null;
  custo_operacional?: number | null;
  taxa_entrega?: number | null;
  descricao?: string | null;
  ativo?: boolean;
  slug?: string | null;
}

interface CatalogoItemPublico {
  id: string;
  catalogo_id: string;
  peca_id: string;
  ordem?: number | null;
  destaque: boolean | null;
  preco_catalogo?: number | null;
  created_at: string;
  peca: {
    id: string;
    nome: string;
    codigo: string;
    imagem_url: string | null;
    categoria: string | null;
    preco?: number | null;
    preco_venda?: number | null;
    material: string | null;
    estoque: number;
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
      
      let query = supabase.from('catalogos').select('*');
      
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
          *,
          peca:pecas(id, nome, codigo, imagem_url, categoria, preco_venda, material, estoque)
        `)
        .eq('catalogo_id', catalogo.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
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
      newSelected.set(item.id, { item, quantidade: 1 });
    }
    setSelectedItems(newSelected);
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
    const newSelected = new Map(selectedItems);
    const selected = newSelected.get(itemId);
    if (selected) {
      const maxQty = selected.item.peca?.estoque || 999;
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

  const clearCart = () => {
    setSelectedItems(new Map());
    setIsCartOpen(false);
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
      // Create the order with validated data
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_catalogo')
        .insert({
          catalogo_id: catalogo?.id,
          cliente_nome: validatedData.cliente_nome,
          cliente_telefone: validatedData.cliente_telefone || null,
          cliente_email: validatedData.cliente_email || null,
          endereco_cep: validatedData.endereco_cep || null,
          endereco_logradouro: validatedData.endereco_logradouro || null,
          endereco_numero: validatedData.endereco_numero || null,
          endereco_complemento: validatedData.endereco_complemento || null,
          endereco_bairro: validatedData.endereco_bairro || null,
          endereco_cidade: validatedData.endereco_cidade || null,
          endereco_estado: validatedData.endereco_estado || null,
          valor_total: cartGrandTotal,
          status: 'pendente',
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Create order items
      const orderItems = cartItems.map(({ item, quantidade }) => ({
        pedido_id: pedido.id,
        peca_id: item.peca_id,
        peca_nome: item.peca?.nome || 'Peça',
        peca_codigo: item.peca?.codigo || '-',
        quantidade,
        preco_unitario: item.peca?.preco_venda || 0,
      }));

      const { error: itensError } = await supabase
        .from('pedidos_catalogo_itens')
        .insert(orderItems);

      if (itensError) throw itensError;

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

  const totalItens = itens.length;
  const totalValor = itens.reduce((acc, item) => acc + (item.peca?.preco_venda || 0), 0);
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
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary pb-24">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {catalogo.nome}
              </h1>
              <Badge className={cn('text-xs mt-1', statusInfo.color)}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Message */}
        <Card className={cn(
          'border-l-4',
          isBlocked ? 'border-l-destructive bg-destructive/5' : 'border-l-primary bg-primary/5'
        )}>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              {isBlocked ? (
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              )}
              <div>
                <p className="font-medium text-foreground">{statusInfo.message}</p>
                {catalogo.observacao && (
                  <p className="text-sm text-muted-foreground mt-1">{catalogo.observacao}</p>
                )}
                {canOrder && (
                  <p className="text-sm text-primary mt-2 font-medium">
                    ✨ Selecione as peças desejadas para montar seu pedido!
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{totalItens}</p>
                <p className="text-sm text-muted-foreground">Peças Disponíveis</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalValor)}</p>
                <p className="text-sm text-muted-foreground">Valor Total</p>
              </div>
            </div>

            {custoExtra > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  {(catalogo.custo_separacao || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo de Separação</span>
                      <span>{formatCurrency(catalogo.custo_separacao || 0)}</span>
                    </div>
                  )}
                  {(catalogo.custo_operacional || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo Operacional</span>
                      <span>{formatCurrency(catalogo.custo_operacional || 0)}</span>
                    </div>
                  )}
                  {(catalogo.taxa_entrega || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de Entrega</span>
                      <span>{formatCurrency(catalogo.taxa_entrega || 0)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Peças do Catálogo</h2>
            </div>
            {canOrder && selectedItems.size > 0 && (
              <Badge variant="secondary" className="animate-pulse">
                {selectedItems.size} selecionada(s)
              </Badge>
            )}
          </div>

          {loadingItens ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </div>
          ) : itens.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma peça no catálogo ainda.</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-auto">
              <div className="space-y-3">
                {itens.map((item) => {
                  const isSelected = selectedItems.has(item.id);
                  return (
                    <Card 
                      key={item.id} 
                      className={cn(
                        "overflow-hidden transition-all cursor-pointer",
                        isSelected && "ring-2 ring-primary bg-primary/5",
                        canOrder && "hover:shadow-md"
                      )}
                      onClick={() => canOrder && toggleItemSelection(item)}
                    >
                      <CardContent className="p-0">
                        <div className="flex gap-4">
                          {/* Checkbox + Image */}
                          <div className="relative w-24 h-24 bg-secondary flex-shrink-0">
                            {canOrder && (
                              <div className="absolute top-2 left-2 z-10">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleItemSelection(item)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-background"
                                />
                              </div>
                            )}
                            {item.peca?.imagem_url ? (
                              <img
                                src={item.peca.imagem_url}
                                alt={item.peca?.nome || 'Peça'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 py-3 pr-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-medium text-foreground truncate">
                                  {item.peca?.nome || 'Peça removida'}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  Cód: {item.peca?.codigo || '-'}
                                </p>
                              </div>
                              {isSelected && (
                                <Badge className="bg-primary text-primary-foreground shrink-0">
                                  <Check className="w-3 h-3" />
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {item.peca?.categoria && (
                                <Badge variant="outline" className="text-xs">
                                  {item.peca.categoria}
                                </Badge>
                              )}
                              {item.peca?.material && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.peca.material}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <span className="text-sm text-muted-foreground">
                                Disponível: <span className="font-medium text-foreground">{item.peca?.estoque || 0}</span>
                              </span>
                              <span className="font-semibold text-primary">
                                {formatCurrency(item.peca?.preco_venda || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer Info */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                {canOrder 
                  ? 'Selecione as peças desejadas e clique no carrinho para gerar o resumo do seu pedido.'
                  : 'Este é um catálogo de visualização. Para realizar seu pedido, entre em contato com a loja através dos canais oficiais.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Cart Button */}
      {canOrder && selectedItems.size > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-20">
          <div className="max-w-4xl mx-auto">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button className="w-full h-14 text-lg shadow-lg bg-primary hover:bg-primary/90">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Ver Carrinho ({cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'})
                  <span className="ml-auto font-bold">{formatCurrency(cartTotal)}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Seu Carrinho
                  </SheetTitle>
                  <SheetDescription>
                    Revise as peças selecionadas e gere o resumo do pedido
                  </SheetDescription>
                </SheetHeader>
                
                <ScrollArea className="h-[calc(100%-200px)] mt-4">
                  <div className="space-y-3 pr-4">
                    {cartItems.map(({ item, quantidade }) => (
                      <Card key={item.id}>
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <div className="w-16 h-16 bg-secondary rounded-lg flex-shrink-0 overflow-hidden">
                              {item.peca?.imagem_url ? (
                                <img
                                  src={item.peca.imagem_url}
                                  alt={item.peca?.nome || 'Peça'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-muted-foreground/30" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">
                                {item.peca?.nome || 'Peça'}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.peca?.preco_venda || 0)} cada
                              </p>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => updateItemQuantity(item.id, -1)}
                                    disabled={quantidade <= 1}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">{quantidade}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => updateItemQuantity(item.id, 1)}
                                    disabled={quantidade >= (item.peca?.estoque || 999)}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-primary">
                                    {formatCurrency((item.peca?.preco_venda || 0) * quantidade)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                <SheetFooter className="mt-4 flex-col gap-3">
                  <div className="w-full space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    {custoExtra > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Taxas adicionais</span>
                        <span>{formatCurrency(custoExtra)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(cartGrandTotal)}</span>
                    </div>
                  </div>
                  <div className="w-full flex gap-2">
                    <Button variant="outline" onClick={clearCart} className="flex-1">
                      Limpar
                    </Button>
                    <Button className="flex-1" onClick={() => setIsSummaryOpen(true)}>
                      <Send className="w-4 h-4 mr-2" />
                      Gerar Resumo
                    </Button>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      {/* Summary Dialog */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Pedido</DialogTitle>
            <DialogDescription>
              Preencha seus dados para enviar o pedido
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Dados pessoais */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span>👤</span>
                <span>Dados Pessoais</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-name">Seu Nome *</Label>
                <Input
                  id="customer-name"
                  placeholder="Digite seu nome"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Telefone/WhatsApp</Label>
                  <Input
                    id="customer-phone"
                    placeholder="(00) 00000-0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">E-mail</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Endereço de entrega */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Endereço de Entrega</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={enderecoCep}
                    onChange={(e) => setEnderecoCep(e.target.value)}
                    maxLength={9}
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    onClick={buscarEnderecoPorCep}
                    disabled={buscandoCep}
                  >
                    {buscandoCep ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    placeholder="Rua, Av, etc."
                    value={enderecoLogradouro}
                    onChange={(e) => setEnderecoLogradouro(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    placeholder="123"
                    value={enderecoNumero}
                    onChange={(e) => setEnderecoNumero(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    placeholder="Apto, Bloco, etc."
                    value={enderecoComplemento}
                    onChange={(e) => setEnderecoComplemento(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    placeholder="Bairro"
                    value={enderecoBairro}
                    onChange={(e) => setEnderecoBairro(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    placeholder="Cidade"
                    value={enderecoCidade}
                    onChange={(e) => setEnderecoCidade(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">UF</Label>
                  <Input
                    id="estado"
                    placeholder="SP"
                    value={enderecoEstado}
                    onChange={(e) => setEnderecoEstado(e.target.value.toUpperCase())}
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Resumo do Pedido:</p>
              <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                <p className="font-medium">{cartItemCount} itens selecionados</p>
                {cartItems.slice(0, 3).map(({ item, quantidade }) => (
                  <p key={item.id}>• {item.peca?.nome} (x{quantidade})</p>
                ))}
                {cartItems.length > 3 && (
                  <p>... e mais {cartItems.length - 3} item(ns)</p>
                )}
                <Separator className="my-2" />
                <p className="font-semibold text-primary text-sm">Total: {formatCurrency(cartGrandTotal)}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={copyOrderSummary}
              className="w-full sm:w-auto"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
            <Button 
              onClick={submitOrder} 
              disabled={isSending || !customerName.trim()}
              className="w-full sm:w-auto"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Pedido
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Sent Success Dialog */}
      <Dialog open={isOrderSent} onOpenChange={setIsOrderSent}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Pedido Enviado!</DialogTitle>
            <DialogDescription className="text-base">
              Seu pedido foi recebido com sucesso. A loja entrará em contato em breve para confirmar os detalhes.
            </DialogDescription>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOrderSent(false)} className="w-full">
              Continuar Navegando
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
