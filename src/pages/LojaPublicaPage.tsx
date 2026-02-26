import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShoppingCart, Search, Plus, Minus, Trash2, Store, Loader2, CheckCircle, Package, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MP_PUBLIC_KEY = 'APP_USR-080297dc-b2f8-4e1b-9a31-d445004700dc';

interface StoreConfig {
  id: string;
  slug: string;
  nome_loja: string;
  logo_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  descricao: string | null;
  frete_gratis_acima: number | null;
  taxa_entrega: number;
  whatsapp: string | null;
  instagram: string | null;
  organization_id: string;
}

interface Peca {
  id: string;
  nome: string;
  codigo: string;
  preco_venda: number;
  imagem_url: string | null;
  categoria: string | null;
  material: string | null;
  descricao: string | null;
  estoque: number;
  peso: number | null;
  organization_id: string;
}

interface CartItem extends Peca {
  quantidade: number;
}

type CheckoutStep = 'cart' | 'dados' | 'pagamento' | 'confirmacao';

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

  // Client data
  const [cliente, setCliente] = useState({ nome: '', email: '', telefone: '', cpf: '' });
  const [endereco, setEndereco] = useState({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });

  // Load store config and products
  useEffect(() => {
    if (!slug) return;
    loadStore();
  }, [slug]);

  // Check payment result from URL params
  useEffect(() => {
    const pagamento = searchParams.get('pagamento');
    if (pagamento === 'sucesso') {
      toast.success('Pagamento aprovado! 🎉');
    } else if (pagamento === 'erro') {
      toast.error('Pagamento não aprovado. Tente novamente.');
    } else if (pagamento === 'pendente') {
      toast.info('Pagamento pendente de confirmação.');
    }
  }, [searchParams]);

  const loadStore = async () => {
    try {
      // Load config via public view (anon access)
      const { data: configData, error: configError } = await supabase
        .from('ecommerce_config_public' as any)
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (configError || !configData) {
        setLoading(false);
        return;
      }

      setConfig(configData as any);

      // Load products via public view (no cost price exposed)
      const { data: pecasData } = await supabase
        .from('pecas_loja_public' as any)
        .select('*')
        .eq('organization_id', (configData as any).organization_id)
        .order('nome');

      setPecas((pecasData as any) || []);
    } catch (err) {
      console.error('Error loading store:', err);
    } finally {
      setLoading(false);
    }
  };

  const categorias = useMemo(() => {
    const cats = new Set(pecas.map(p => p.categoria).filter(Boolean));
    return Array.from(cats) as string[];
  }, [pecas]);

  const materiais = useMemo(() => {
    const mats = new Set(pecas.map(p => p.material).filter(Boolean));
    return Array.from(mats) as string[];
  }, [pecas]);

  const filteredPecas = useMemo(() => {
    return pecas.filter(p => {
      const matchSearch = !search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.codigo?.toLowerCase().includes(search.toLowerCase());
      const matchCategoria = categoriaFilter === 'todas' || p.categoria === categoriaFilter;
      const matchMaterial = materialFilter === 'todos' || p.material === materialFilter;
      return matchSearch && matchCategoria && matchMaterial;
    });
  }, [pecas, search, categoriaFilter, materialFilter]);

  const addToCart = useCallback((peca: Peca) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === peca.id);
      if (existing) {
        if (existing.quantidade >= peca.estoque) {
          toast.error('Estoque insuficiente');
          return prev;
        }
        return prev.map(i => i.id === peca.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { ...peca, quantidade: 1 }];
    });
    toast.success('Adicionado ao carrinho');
  }, []);

  const updateQuantity = useCallback((pecaId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id !== pecaId) return item;
        const newQty = item.quantidade + delta;
        if (newQty <= 0) return item;
        if (newQty > item.estoque) { toast.error('Estoque insuficiente'); return item; }
        return { ...item, quantidade: newQty };
      });
    });
  }, []);

  const removeFromCart = useCallback((pecaId: string) => {
    setCart(prev => prev.filter(i => i.id !== pecaId));
  }, []);

  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.preco_venda * i.quantidade, 0), [cart]);
  const valorFrete = useMemo(() => {
    if (!config) return 0;
    if (config.frete_gratis_acima && subtotal >= config.frete_gratis_acima) return 0;
    return config.taxa_entrega || 0;
  }, [config, subtotal]);
  const total = subtotal + valorFrete;
  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantidade, 0), [cart]);

  const handleCheckout = async () => {
    if (!cliente.nome.trim()) { toast.error('Informe seu nome'); return; }
    if (!config) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ecommerce-checkout', {
        body: {
          items: cart.map(i => ({ peca_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda, nome: i.nome })),
          organization_id: config.organization_id,
          cliente,
          endereco: endereco.cep ? endereco : undefined,
          valor_frete: valorFrete,
        },
      });

      if (error || !data?.preferenceId) {
        toast.error(data?.error || 'Erro ao iniciar pagamento');
        setProcessing(false);
        return;
      }

      setCheckoutStep('pagamento');
      // Initialize MP brick
      setTimeout(() => initPaymentBrick(data.preferenceId), 300);
    } catch (err) {
      toast.error('Erro ao processar checkout');
      setProcessing(false);
    }
  };

  const initPaymentBrick = async (preferenceId: string) => {
    try {
      // Load SDK
      if (!(window as any).MercadoPago) {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; document.head.appendChild(script); });
      }

      const mp = new (window as any).MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
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
                    formData,
                    organization_id: config!.organization_id,
                    items: cart.map(i => ({ peca_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda, nome: i.nome })),
                    cliente,
                    endereco: endereco.cep ? endereco : undefined,
                    valor_subtotal: subtotal,
                    valor_frete: valorFrete,
                  }),
                }
              );
              const result = await response.json();
              if (result.status === 'approved') {
                setNumeroPedido(result.numero_pedido);
                setCheckoutStep('confirmacao');
                setCart([]);
                toast.success('Pagamento aprovado! 🎉');
              } else {
                toast.error(result.status_detail || 'Pagamento não aprovado');
              }
            } catch (err) {
              toast.error('Erro ao processar pagamento');
            } finally {
              setProcessing(false);
            }
          },
          onError: (error: any) => { console.error('Brick error:', error); setProcessing(false); },
        },
      });
    } catch (err) {
      console.error('Error initializing brick:', err);
      setProcessing(false);
    }
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!config) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Store className="w-16 h-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold text-foreground">Loja não encontrada</h1>
      <p className="text-muted-foreground">Verifique o endereço e tente novamente.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.nome_loja} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.cor_primaria }}>
                <Store className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-foreground text-lg">{config.nome_loja}</h1>
              {config.descricao && <p className="text-xs text-muted-foreground line-clamp-1">{config.descricao}</p>}
            </div>
          </div>

          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Carrinho ({cartCount})
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col h-[calc(100vh-200px)]">
                <div className="flex-1 overflow-y-auto space-y-3">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Carrinho vazio</p>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-border">
                        {item.imagem_url ? (
                          <img src={item.imagem_url} alt={item.nome} className="w-16 h-16 rounded-md object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-foreground">{item.nome}</p>
                          <p className="text-sm font-bold" style={{ color: config.cor_primaria }}>{formatCurrency(item.preco_venda)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantidade}</span>
                            <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-7 h-7 ml-auto text-destructive" onClick={() => removeFromCart(item.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {cart.length > 0 && (
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frete</span><span className="text-foreground">{valorFrete === 0 ? 'Grátis' : formatCurrency(valorFrete)}</span></div>
                    {config.frete_gratis_acima && subtotal < config.frete_gratis_acima && (
                      <p className="text-xs text-muted-foreground">Frete grátis acima de {formatCurrency(config.frete_gratis_acima)}</p>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(total)}</span></div>
                    <Button className="w-full mt-2" size="lg" onClick={() => { setCartOpen(false); setCheckoutStep('dados'); setCheckoutOpen(true); }} style={{ backgroundColor: config.cor_primaria }}>
                      Finalizar Compra
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar produtos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas categorias</SelectItem>
              {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={materialFilter} onValueChange={setMaterialFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Material" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos materiais</SelectItem>
              {materiais.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{filteredPecas.length} produto{filteredPecas.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPecas.map(peca => (
            <motion.div key={peca.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-border">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {peca.imagem_url ? (
                    <img src={peca.imagem_url} alt={peca.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  {peca.estoque <= 3 && (
                    <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px]">
                      Últimas unidades
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate text-foreground">{peca.nome}</p>
                  {peca.categoria && <p className="text-xs text-muted-foreground">{peca.categoria}</p>}
                  <p className="font-bold mt-1" style={{ color: config.cor_primaria }}>{formatCurrency(peca.preco_venda)}</p>
                  <Button size="sm" className="w-full mt-2 text-xs" onClick={() => addToCart(peca)} style={{ backgroundColor: config.cor_primaria }}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        {filteredPecas.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {checkoutStep === 'dados' && 'Dados para Entrega'}
              {checkoutStep === 'pagamento' && 'Pagamento'}
              {checkoutStep === 'confirmacao' && 'Pedido Confirmado!'}
            </DialogTitle>
          </DialogHeader>

          {checkoutStep === 'dados' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <Input value={cliente.nome} onChange={e => setCliente(p => ({ ...p, nome: e.target.value }))} placeholder="Seu nome" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={cliente.email} onChange={e => setCliente(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={cliente.telefone} onChange={e => setCliente(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={cliente.cpf} onChange={e => setCliente(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" />
              </div>
              <Separator />
              <h4 className="font-medium text-foreground">Endereço de Entrega</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={endereco.cep} onChange={e => setEndereco(p => ({ ...p, cep: e.target.value }))} placeholder="00000-000" onBlur={async () => {
                    const cep = endereco.cep.replace(/\D/g, '');
                    if (cep.length === 8) {
                      try {
                        const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                        const data = await resp.json();
                        if (!data.erro) {
                          setEndereco(p => ({ ...p, rua: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', estado: data.uf || '' }));
                        }
                      } catch {}
                    }
                  }} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Rua</Label>
                  <Input value={endereco.rua} onChange={e => setEndereco(p => ({ ...p, rua: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={endereco.numero} onChange={e => setEndereco(p => ({ ...p, numero: e.target.value }))} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Complemento</Label>
                  <Input value={endereco.complemento} onChange={e => setEndereco(p => ({ ...p, complemento: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={endereco.bairro} onChange={e => setEndereco(p => ({ ...p, bairro: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={endereco.cidade} onChange={e => setEndereco(p => ({ ...p, cidade: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input value={endereco.estado} onChange={e => setEndereco(p => ({ ...p, estado: e.target.value }))} maxLength={2} />
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frete</span><span>{valorFrete === 0 ? 'Grátis' : formatCurrency(valorFrete)}</span></div>
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={processing} style={{ backgroundColor: config?.cor_primaria }}>
                {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</> : 'Ir para Pagamento'}
              </Button>
            </div>
          )}

          {checkoutStep === 'pagamento' && (
            <div>
              {processing && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              <div id="ecommerce-brick-container" className="min-h-[200px]" />
            </div>
          )}

          {checkoutStep === 'confirmacao' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Pedido #{numeroPedido}</h3>
              <p className="text-muted-foreground text-center">
                Seu pedido foi realizado com sucesso! Você receberá atualizações por e-mail.
              </p>
              <Button onClick={() => { setCheckoutOpen(false); setCheckoutStep('dados'); }}>
                Continuar Comprando
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Cart Button (mobile) */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 right-4 sm:hidden z-50">
          <Button size="lg" className="rounded-full shadow-lg gap-2" onClick={() => setCartOpen(true)} style={{ backgroundColor: config.cor_primaria }}>
            <ShoppingCart className="w-5 h-5" />
            {cartCount} · {formatCurrency(total)}
          </Button>
        </div>
      )}
    </div>
  );
}
