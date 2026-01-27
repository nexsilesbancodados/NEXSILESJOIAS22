import { useState, useEffect, useRef } from 'react';
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
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  
  // Customer form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Fetch maleta data first to get the real ID
  const { data: maleta, isLoading: loadingMaleta, error: maletaError } = useQuery({
    queryKey: ['maleta-publica', maletaId],
    queryFn: async () => {
      if (!maletaId) throw new Error('ID da maleta não fornecido');
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(maletaId);
      
      let query = supabase
        .from('maletas')
        .select(`
          *,
          revendedora:revendedoras(nome, telefone, whatsapp)
        `);
      
      if (isUUID) {
        query = query.eq('id', maletaId);
      } else {
        query = query.eq('sharing_slug', maletaId);
      }
      
      const { data, error } = await query.single();
      
      if (error) throw error;
      return data as MaletaPublica;
    },
    enabled: !!maletaId,
  });

  // Use presence hook for tracking online status
  const { isRevendedoraOnline, viewersCount } = useMaletaPresence(maleta?.id, 'viewer');

  // Track if we already sent the view notification
  const hasNotifiedRef = useRef(false);

  // Notify revendedora when page is viewed
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
        
        console.log('View notification sent');
      } catch (error) {
        // Silently fail - this is a non-critical feature
        console.error('Failed to send view notification:', error);
      }
    };

    // Small delay to ensure the page is actually being viewed
    const timeoutId = setTimeout(notifyView, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [maleta?.id]);

  // Fetch maleta items (only non-sold items)
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
      
      // Verify maleta is public before attempting to insert
      if (!maleta.is_public) {
        throw new Error('Esta vitrine não está disponível para pedidos no momento. Entre em contato com a revendedora.');
      }
      
      // Create interest record
      const { data: interesse, error: interesseError } = await supabase
        .from('maleta_interesses')
        .insert({
          maleta_id: maleta.id,
          cliente_nome: customerName.trim(),
          cliente_telefone: customerPhone.trim() || null,
          cliente_email: customerEmail.trim() || null,
          observacoes: observacoes.trim() || null,
          status: 'pendente',
        })
        .select()
        .single();

      if (interesseError) {
        console.error('Erro ao criar interesse:', interesseError);
        if (interesseError.message?.includes('policy') || interesseError.code === '42501') {
          throw new Error('Esta vitrine não está disponível para pedidos no momento.');
        }
        throw new Error('Erro ao enviar seu interesse. Tente novamente.');
      }

      // Create interest items
      const cartItems = Array.from(selectedItems.values());
      const interesseItems = cartItems.map(({ item, quantidade }) => ({
        interesse_id: interesse.id,
        peca_id: item.peca_id,
        quantidade,
      }));

      const { error: itensError } = await supabase
        .from('maleta_interesse_itens')
        .insert(interesseItems);

      if (itensError) {
        console.error('Erro ao criar itens:', itensError);
        throw new Error('Erro ao salvar os itens do pedido. Tente novamente.');
      }

      // Trigger email notification via edge function (fire and forget)
      try {
        await supabase.functions.invoke('notificar-novo-pedido-revendedora', {
          body: { interesse_id: interesse.id },
        });
      } catch (emailError) {
        // Don't fail the whole flow if email fails
        console.error('Failed to send email notification:', emailError);
      }

      return interesse;
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
      toast.success('Interesse enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar interesse');
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
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

  // Cart calculations
  const cartItems = Array.from(selectedItems.values());
  const cartTotal = cartItems.reduce((acc, { item, quantidade }) => {
    const preco = item.preco_unitario || item.peca?.preco_venda || 0;
    return acc + (preco * quantidade);
  }, 0);
  const cartItemCount = cartItems.reduce((acc, { quantidade }) => acc + quantidade, 0);

  const openWhatsApp = () => {
    if (!maleta?.revendedora?.whatsapp && !maleta?.revendedora?.telefone) {
      toast.error('Revendedora sem contato disponível');
      return;
    }
    
    const phone = (maleta.revendedora.whatsapp || maleta.revendedora.telefone || '').replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá! Vi sua maleta "${maleta.nome}" e tenho interesse em algumas peças. Podemos conversar?`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  // Loading state
  if (loadingMaleta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando vitrine...</p>
        </div>
      </div>
    );
  }

  // Error or not found
  if (maletaError || !maleta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Vitrine não encontrada</h1>
            <p className="text-muted-foreground">
              A vitrine que você está procurando não existe ou não está disponível.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not public
  if (!maleta.is_public) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Vitrine Privada</h1>
            <p className="text-muted-foreground">
              Esta vitrine não está disponível para visualização pública no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Interesse Enviado!</h1>
            <p className="text-muted-foreground">
              {maleta.revendedora?.nome || 'A revendedora'} receberá seu interesse e entrará em contato em breve.
            </p>
            {(maleta.revendedora?.whatsapp || maleta.revendedora?.telefone) && (
              <Button 
                onClick={openWhatsApp}
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
              >
                <Phone className="w-4 h-4" />
                Falar no WhatsApp
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setIsSuccess(false)}
              className="w-full"
            >
              Ver mais peças
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableItems = itens.filter(item => !item.vendida && item.peca);

  // Custom colors with fallbacks
  const corPrimaria = maleta.cor_primaria || '#8B5CF6';
  const corSecundaria = maleta.cor_secundaria || '#EC4899';
  const hasCustomImage = !!maleta.imagem_capa;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary pb-24">
      {/* Hero Banner with custom colors/image */}
      {hasCustomImage ? (
        <div 
          className="h-32 md:h-48 w-full relative"
          style={{
            backgroundImage: `url(${maleta.imagem_capa})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        </div>
      ) : (
        <div 
          className="h-24 md:h-32 w-full"
          style={{
            background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
          }}
        />
      )}

      {/* Header - overlays the hero when has image */}
      <div className={cn(
        "bg-card border-b sticky top-0 z-10",
        hasCustomImage && "-mt-16 md:-mt-20 mx-4 md:mx-auto md:max-w-4xl rounded-t-2xl shadow-lg"
      )}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Icon with custom colors or image */}
            <div 
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0",
                !hasCustomImage && "border border-border/50"
              )}
              style={{
                background: hasCustomImage 
                  ? `url(${maleta.imagem_capa}) center/cover`
                  : `linear-gradient(135deg, ${corPrimaria}20, ${corSecundaria}20)`,
              }}
            >
              {hasCustomImage ? (
                <div className="w-full h-full bg-black/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
              ) : (
                <Briefcase className="w-5 h-5" style={{ color: corPrimaria }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {maleta.nome}
                </h1>
                {/* Online/Offline Indicator */}
                <div 
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    isRevendedoraOnline 
                      ? "bg-success/10 text-success" 
                      : "bg-muted text-muted-foreground"
                  )}
                  title={isRevendedoraOnline ? "Revendedora online" : "Revendedora offline"}
                >
                  <Circle 
                    className={cn(
                      "w-2 h-2",
                      isRevendedoraOnline && "fill-success animate-pulse"
                    )} 
                  />
                  {isRevendedoraOnline ? "Online" : "Offline"}
                </div>
              </div>
              {maleta.revendedora && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    por {maleta.revendedora.nome}
                  </p>
                  {viewersCount > 1 && (
                    <span className="text-xs text-muted-foreground">
                      • {viewersCount} visualizando
                    </span>
                  )}
                </div>
              )}
            </div>
            {(maleta.revendedora?.whatsapp || maleta.revendedora?.telefone) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={openWhatsApp}
                className="gap-2"
                style={isRevendedoraOnline ? {
                  borderColor: corPrimaria,
                  color: corPrimaria,
                } : undefined}
              >
                <Phone className="w-4 h-4" />
                {isRevendedoraOnline ? "Online agora" : "Contato"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className={cn(
        "max-w-4xl mx-auto px-4 py-6 space-y-6",
        hasCustomImage && "md:px-0"
      )}>
        {/* Info Card */}
        <Card 
          className="border-l-4"
          style={{ 
            borderLeftColor: corPrimaria,
            backgroundColor: `${corPrimaria}08`,
          }}
        >
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 mt-0.5" style={{ color: corPrimaria }} />
              <div>
                <p className="font-medium text-foreground">Vitrine Exclusiva</p>
                <p className="text-sm text-muted-foreground">
                  Selecione as peças que você gostou e envie seu interesse. 
                  A revendedora entrará em contato para combinar a compra.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold" style={{ color: corPrimaria }}>{availableItems.length}</p>
              <p className="text-sm text-muted-foreground">Peças disponíveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold" style={{ color: corSecundaria }}>{cartItemCount}</p>
              <p className="text-sm text-muted-foreground">Selecionadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Loading items */}
        {loadingItens ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        ) : availableItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Não há peças disponíveis nesta vitrine no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Items Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {availableItems.map((item) => {
              const isSelected = selectedItems.has(item.id);
              const preco = item.preco_unitario || item.peca?.preco_venda || 0;
              
              return (
                <Card 
                  key={item.id}
                  className={cn(
                    "overflow-hidden cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2"
                  )}
                  style={isSelected ? { 
                    '--tw-ring-color': corPrimaria,
                  } as React.CSSProperties : undefined}
                  onClick={() => toggleItemSelection(item)}
                >
                  <div className="aspect-square bg-muted relative">
                    {item.peca?.imagem_url ? (
                      <img
                        src={item.peca.imagem_url}
                        alt={item.peca.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Briefcase className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {isSelected && (
                      <div 
                        className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}
                      >
                        <Heart className="w-4 h-4 text-white fill-current" />
                      </div>
                    )}
                    {item.peca?.categoria && (
                      <Badge 
                        variant="secondary" 
                        className="absolute bottom-2 left-2 text-xs"
                      >
                        {item.peca.categoria}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">
                      {item.peca?.nome || 'Peça'}
                    </h3>
                    {item.peca?.codigo && (
                      <p className="text-xs text-muted-foreground">
                        Cód: {item.peca.codigo}
                      </p>
                    )}
                    <p className="font-semibold mt-1" style={{ color: corPrimaria }}>
                      {formatCurrency(preco)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-20">
          <div className="max-w-4xl mx-auto">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button 
                  size="lg" 
                  className="w-full gap-2 shadow-lg text-white"
                  style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}
                >
                  <Heart className="w-5 h-5" />
                  Ver seleção ({cartItemCount} {cartItemCount === 1 ? 'peça' : 'peças'})
                  <span className="ml-auto">{formatCurrency(cartTotal)}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh]">
                <SheetHeader>
                  <SheetTitle>Sua Seleção</SheetTitle>
                  <SheetDescription>
                    Revise as peças selecionadas e envie seu interesse
                  </SheetDescription>
                </SheetHeader>
                
                <ScrollArea className="flex-1 h-[calc(100%-200px)] my-4">
                  <div className="space-y-3 pr-4">
                    {cartItems.map(({ item, quantidade }) => {
                      const preco = item.preco_unitario || item.peca?.preco_venda || 0;
                      
                      return (
                        <Card key={item.id}>
                          <CardContent className="p-3">
                            <div className="flex gap-3">
                              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                                {item.peca?.imagem_url ? (
                                  <img
                                    src={item.peca.imagem_url}
                                    alt={item.peca.nome}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Briefcase className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {item.peca?.nome}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(preco)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => updateItemQuantity(item.id, -1)}
                                    disabled={quantidade <= 1}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="text-sm font-medium w-8 text-center">
                                    {quantidade}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => updateItemQuantity(item.id, 1)}
                                    disabled={quantidade >= item.quantidade}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <p className="font-semibold text-sm">
                                  {formatCurrency(preco * quantidade)}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />
                
                <SheetFooter className="flex-col gap-3">
                  <div className="flex justify-between items-center w-full">
                    <span className="font-semibold">Total estimado:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    onClick={() => setIsFormOpen(true)}
                  >
                    <Send className="w-4 h-4" />
                    Enviar interesse
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      {/* Customer Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seus Dados</DialogTitle>
            <DialogDescription>
              Preencha seus dados para a revendedora entrar em contato
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                <User className="w-4 h-4 inline mr-2" />
                Nome *
              </Label>
              <Input
                id="name"
                placeholder="Seu nome completo"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefone / WhatsApp
              </Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="obs">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Observações
              </Label>
              <Textarea
                id="obs"
                placeholder="Alguma mensagem ou dúvida?"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => submitInterest.mutate()}
              disabled={!customerName.trim() || submitInterest.isPending}
              className="gap-2"
            >
              {submitInterest.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
