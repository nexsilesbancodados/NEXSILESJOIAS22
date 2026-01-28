import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  DollarSign, 
  CreditCard, 
  Smartphone,
  Banknote,
  CheckCircle2,
  Lock,
  Unlock,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Printer,
  History,
  Loader2,
  User,
  Percent,
  Ticket,
  Maximize,
  Minimize,
  Package,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReciboVenda } from '@/components/recibo/ReciboVenda';
import { useAuth } from '@/contexts/AuthContext';
import { usePDVShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ShortcutsHelp } from '@/components/pdv/ShortcutsHelp';
import { BarcodeScanner } from '@/components/pdv/BarcodeScanner';
import { PDVToolbar } from '@/components/pdv/PDVToolbar';
// PDVStats removido - stats inline no toolbar
import { CalculatorModal } from '@/components/pdv/CalculatorModal';
import { DescontoModal } from '@/components/pdv/DescontoModal';
import { ClienteFielModal } from '@/components/pdv/ClienteFielModal';
import { ConsultaPrecoModal } from '@/components/pdv/ConsultaPrecoModal';
import { TrocaDevolucaoModal } from '@/components/pdv/TrocaDevolucaoModal';
import { OfflineIndicator } from '@/components/pdv/OfflineIndicator';
import { OfflineSyncDashboard } from '@/components/pdv/OfflineSyncDashboard';
import { FechamentoCaixaReport } from '@/components/pdv/FechamentoCaixaReport';
import { toast } from 'sonner';
import { CupomInput } from '@/components/pdv/CupomInput';
import { useUsarCupom, type ValidacaoCupom } from '@/hooks/useCampanhas';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useSubscriptionSafe } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase-db';
import { 
  usePecas, 
  useCaixaAtual, 
  useAbrirCaixa, 
  useFecharCaixa, 
  useVendasDoCaixa, 
  useMovimentosCaixa,
  useAddVenda,
  useAddMovimento,
  useClientes,
  useAddCliente,
  type Peca,
  type Cliente,
  type Pagamento as PagamentoType
} from '@/hooks/useSupabaseData';

interface CarrinhoItem {
  peca: Peca;
  quantidade: number;
}

interface PagamentoLocal {
  metodo: 'dinheiro' | 'pix' | 'credito' | 'debito';
  valor: number;
}

interface VendaLocal {
  id: string;
  itens: CarrinhoItem[];
  pagamentos: PagamentoLocal[];
  total: number;
  data: Date;
  tipo: 'pdv' | 'revendedora';
}

export default function PDVPage() {
  const { user } = useAuth();
  const { isReadOnly } = useSubscriptionSafe();
  const queryClient = useQueryClient();
  const { data: pecas = [], isLoading: loadingPecas } = usePecas();
  const { data: caixaAtual, isLoading: loadingCaixa } = useCaixaAtual();
  const { data: vendasCaixa = [] } = useVendasDoCaixa(caixaAtual?.id);
  const { data: movimentosCaixa = [] } = useMovimentosCaixa(caixaAtual?.id);
  const { data: clientes = [] } = useClientes();
  
  const abrirCaixa = useAbrirCaixa();
  const fecharCaixa = useFecharCaixa();
  const addVenda = useAddVenda();
  const addMovimento = useAddMovimento();
  const addCliente = useAddCliente();
  const { isFullscreen, isSupported: fullscreenSupported, toggleFullscreen } = useFullscreen();

  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstoque, setFilterEstoque] = useState<'all' | 'disponivel' | 'baixo'>('disponivel');
  const [isAbrirCaixaOpen, setIsAbrirCaixaOpen] = useState(false);
  const [isFechamentoCaixaOpen, setIsFechamentoCaixaOpen] = useState(false);
  const [isPagamentoOpen, setIsPagamentoOpen] = useState(false);
  const [isVendaConcluidaOpen, setIsVendaConcluidaOpen] = useState(false);
  const [isSangriaOpen, setIsSangriaOpen] = useState(false);
  const [isSuprimentoOpen, setIsSuprimentoOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaLocal | null>(null);
  
  // New modals state
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isDescontoOpen, setIsDescontoOpen] = useState(false);
  const [isClienteFielOpen, setIsClienteFielOpen] = useState(false);
  const [isConsultaPrecoOpen, setIsConsultaPrecoOpen] = useState(false);
  const [isTrocaDevolucaoOpen, setIsTrocaDevolucaoOpen] = useState(false);
  const [barcodeScannerEnabled, setBarcodeScannerEnabled] = useState(false);
  const [vendaPausada, setVendaPausada] = useState<CarrinhoItem[] | null>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [descontoAplicado, setDescontoAplicado] = useState<{ valor: number; tipo: 'percentual' | 'valor' } | null>(null);
  const [cupomAplicado, setCupomAplicado] = useState<ValidacaoCupom | null>(null);
  
  const [fundoTroco, setFundoTroco] = useState('');
  const [pagamentos, setPagamentos] = useState<PagamentoLocal[]>([]);
  const [novoPagamentoMetodo, setNovoPagamentoMetodo] = useState<PagamentoLocal['metodo']>('dinheiro');
  const [novoPagamentoValor, setNovoPagamentoValor] = useState('');
  const [movimentoValor, setMovimentoValor] = useState('');
  const [movimentoDescricao, setMovimentoDescricao] = useState('');
  const [ultimaVenda, setUltimaVenda] = useState<VendaLocal | null>(null);
  const [clienteNome, setClienteNome] = useState('');
  const usarCupom = useUsarCupom();

  const reciboRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  usePDVShortcuts({
    onNovaVenda: () => {
      setCarrinho([]);
      setPagamentos([]);
      setClienteNome('');
    },
    onBuscar: () => {
      searchInputRef.current?.focus();
    },
    onPagamento: () => {
      if (carrinho.length > 0 && caixaAtual) {
        setIsPagamentoOpen(true);
      }
    },
    onFecharCaixa: () => {
      if (caixaAtual) {
        setIsFechamentoCaixaOpen(true);
      }
    },
    onCancelar: () => {
      setIsPagamentoOpen(false);
      setIsFechamentoCaixaOpen(false);
      setIsSangriaOpen(false);
      setIsSuprimentoOpen(false);
    },
  });

  // Handle barcode scanner
  const handleBarcodeScanned = useCallback((code: string) => {
    const peca = pecas.find(p => p.codigo.toLowerCase() === code.toLowerCase());
    if (peca) {
      if (peca.estoque > 0) {
        addToCarrinho(peca);
        toast.success(`${peca.nome} adicionado ao carrinho`);
      } else {
        toast.error(`${peca.nome} sem estoque`);
      }
    } else {
      toast.error(`Produto não encontrado: ${code}`);
    }
  }, [pecas]);

  // Calculate discount from manual discount
  const calcularDescontoManual = useMemo(() => {
    if (!descontoAplicado) return 0;
    const subtotal = carrinho.reduce((acc, item) => acc + item.peca.preco_venda * item.quantidade, 0);
    if (descontoAplicado.tipo === 'percentual') {
      return (subtotal * descontoAplicado.valor) / 100;
    }
    return descontoAplicado.valor;
  }, [descontoAplicado, carrinho]);

  // Calculate discount from coupon
  const calcularDescontoCupom = useMemo(() => {
    if (!cupomAplicado || !cupomAplicado.valido) return 0;
    const subtotal = carrinho.reduce((acc, item) => acc + item.peca.preco_venda * item.quantidade, 0);
    const subtotalComDesconto = subtotal - calcularDescontoManual;
    
    if (cupomAplicado.tipo === 'percentual') {
      return (subtotalComDesconto * (cupomAplicado.valor || 0)) / 100;
    }
    if (cupomAplicado.tipo === 'valor_fixo') {
      return cupomAplicado.valor || 0;
    }
    // frete_gratis doesn't affect cart total in PDV
    return 0;
  }, [cupomAplicado, carrinho, calcularDescontoManual]);

  const totalDesconto = calcularDescontoManual + calcularDescontoCupom;

  const filteredPecas = useMemo(() => {
    return pecas.filter((peca) => {
      const matchesSearch =
        peca.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peca.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de estoque
      let matchesEstoque = true;
      if (filterEstoque === 'disponivel') {
        matchesEstoque = peca.estoque > 0;
      } else if (filterEstoque === 'baixo') {
        matchesEstoque = peca.estoque > 0 && peca.estoque <= (peca.estoque_minimo || 5);
      }
      
      return matchesSearch && matchesEstoque;
    });
  }, [pecas, searchTerm, filterEstoque]);

  const subtotalCarrinho = carrinho.reduce(
    (acc, item) => acc + item.peca.preco_venda * item.quantidade,
    0
  );

  const totalCarrinho = subtotalCarrinho - totalDesconto;

  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const troco = Math.max(0, totalPago - totalCarrinho);

  const totais = useMemo(() => {
    const totalVendas = vendasCaixa.reduce((acc, v) => acc + Number(v.valor_total), 0);
    const sangrias = movimentosCaixa.filter(m => m.tipo === 'sangria');
    const suprimentos = movimentosCaixa.filter(m => m.tipo === 'suprimento');
    const totalSangrias = sangrias.reduce((acc, s) => acc + Number(s.valor), 0);
    const totalSuprimentos = suprimentos.reduce((acc, s) => acc + Number(s.valor), 0);
    const saldoFinal = (caixaAtual?.fundo_troco || 0) + totalVendas + totalSuprimentos - totalSangrias;
    
    return { vendas: totalVendas, sangrias: totalSangrias, suprimentos: totalSuprimentos, saldoFinal };
  }, [vendasCaixa, movimentosCaixa, caixaAtual]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const addToCarrinho = (peca: Peca) => {
    const existingItem = carrinho.find(item => item.peca.id === peca.id);
    if (existingItem) {
      if (existingItem.quantidade < peca.estoque) {
        setCarrinho(carrinho.map(item =>
          item.peca.id === peca.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        ));
      }
    } else {
      setCarrinho([...carrinho, { peca, quantidade: 1 }]);
    }
  };

  const removeFromCarrinho = (pecaId: string) => {
    setCarrinho(carrinho.filter(item => item.peca.id !== pecaId));
  };

  const updateCarrinhoQuantidade = (pecaId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removeFromCarrinho(pecaId);
      return;
    }
    const item = carrinho.find(i => i.peca.id === pecaId);
    if (item && quantidade <= item.peca.estoque) {
      setCarrinho(carrinho.map(i =>
        i.peca.id === pecaId ? { ...i, quantidade } : i
      ));
    }
  };

  const handleAbrirCaixa = async () => {
    if (!user) return;
    await abrirCaixa.mutateAsync({ 
      userId: user.id, 
      fundoTroco: parseFloat(fundoTroco) || 0 
    });
    setFundoTroco('');
    setIsAbrirCaixaOpen(false);
  };

  const handleFecharCaixa = async () => {
    if (!caixaAtual) return;
    await fecharCaixa.mutateAsync(caixaAtual.id);
    setIsFechamentoCaixaOpen(false);
  };

  const handleAddPagamento = () => {
    if (novoPagamentoValor) {
      setPagamentos([
        ...pagamentos,
        { metodo: novoPagamentoMetodo, valor: parseFloat(novoPagamentoValor) }
      ]);
      setNovoPagamentoValor('');
    }
  };

  const handleRemovePagamento = (index: number) => {
    setPagamentos(pagamentos.filter((_, i) => i !== index));
  };

  const handleConfirmarPagamento = async () => {
    if (!caixaAtual) return;

    const vendaId = crypto.randomUUID();
    
    // Increment coupon usage if applied
    if (cupomAplicado?.id) {
      await usarCupom.mutateAsync(cupomAplicado.id);
    }
    
    // Build venda object matching actual database schema
    const vendaData = await addVenda.mutateAsync({
      venda: {
        valor_total: totalCarrinho,
        subtotal: subtotalCarrinho,
        desconto: totalDesconto,
        cliente_id: clienteSelecionado?.id || null,
        revendedora_id: null,
        status: 'finalizada',
        observacoes: cupomAplicado ? `Cupom: ${cupomAplicado.nome}` : null,
        forma_pagamento: pagamentos[0]?.metodo || 'dinheiro',
        parcelas: 1,
      },
      items: carrinho.map(item => ({
        peca_id: item.peca.id,
        quantidade: item.quantidade,
        preco_unitario: item.peca.preco_venda || 0,
        subtotal: (item.peca.preco_venda || 0) * item.quantidade,
      })),
      caixaSessaoId: caixaAtual.id,
    });

    const vendaLocal: VendaLocal = {
      id: vendaId,
      itens: [...carrinho],
      pagamentos: [...pagamentos],
      total: totalCarrinho,
      data: new Date(),
      tipo: 'pdv',
    };

    setUltimaVenda(vendaLocal);
    setCarrinho([]);
    setPagamentos([]);
    setClienteNome('');
    setCupomAplicado(null);
    setDescontoAplicado(null);
    setIsPagamentoOpen(false);
    setIsVendaConcluidaOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSangria = async () => {
    if (!caixaAtual) return;
    await addMovimento.mutateAsync({
      caixa_sessao_id: caixaAtual.id,
      tipo: 'sangria',
      valor: parseFloat(movimentoValor) || 0,
      descricao: movimentoDescricao,
    });
    setMovimentoValor('');
    setMovimentoDescricao('');
    setIsSangriaOpen(false);
  };

  const handleSuprimento = async () => {
    if (!caixaAtual) return;
    await addMovimento.mutateAsync({
      caixa_sessao_id: caixaAtual.id,
      tipo: 'suprimento',
      valor: parseFloat(movimentoValor) || 0,
      descricao: movimentoDescricao,
    });
    setMovimentoValor('');
    setMovimentoDescricao('');
    setIsSuprimentoOpen(false);
  };

  const metodoIcons = {
    dinheiro: Banknote,
    pix: Smartphone,
    credito: CreditCard,
    debito: CreditCard,
  };

  const metodoLabels = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    credito: 'Crédito',
    debito: 'Débito',
  };

  if (loadingPecas || loadingCaixa) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Caixa Fechado View
  if (!caixaAtual) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 animate-fade-in">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
            <Lock className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-display font-semibold mb-2">Caixa Fechado</h1>
          <p className="text-muted-foreground mb-8">
            Abra o caixa para começar a registrar vendas
          </p>
          <Button onClick={() => setIsAbrirCaixaOpen(true)} size="lg" className="btn-gold">
            <Unlock className="w-5 h-5 mr-2" />
            Abrir Caixa
          </Button>
        </div>

        <Dialog open={isAbrirCaixaOpen} onOpenChange={setIsAbrirCaixaOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Abrir Caixa</DialogTitle>
              <DialogDescription>
                Informe o valor do fundo de troco inicial
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="fundoTroco">Fundo de Troco (R$)</Label>
              <Input
                id="fundoTroco"
                type="number"
                step="0.01"
                value={fundoTroco}
                onChange={(e) => setFundoTroco(e.target.value)}
                placeholder="100.00"
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAbrirCaixaOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAbrirCaixa} 
                className="btn-gold"
                disabled={abrirCaixa.isPending}
              >
                {abrirCaixa.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Abrir Caixa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // PDV View
  return (
    <div className="h-screen flex flex-col lg:flex-row animate-fade-in">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Compact Header */}
        <header className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-3">
            {/* Row 1: Title + Status Indicators */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-display font-semibold truncate">PDV</h1>
                  <p className="text-xs text-muted-foreground truncate">
                    Aberto às {formatTime(caixaAtual.data_abertura)} • {vendasCaixa.length} vendas
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                <OfflineSyncDashboard />
                <OfflineIndicator />
                <ShortcutsHelp />
                <BarcodeScanner
                  enabled={barcodeScannerEnabled}
                  onEnabledChange={setBarcodeScannerEnabled}
                  onBarcodeScanned={handleBarcodeScanned}
                />
                {fullscreenSupported && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleFullscreen()}
                    title={isFullscreen ? 'Sair da tela cheia (Esc)' : 'Tela cheia'}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Row 2: Quick Actions */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              <Sheet open={isHistoricoOpen} onOpenChange={setIsHistoricoOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0">
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5">Histórico</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="font-display">Vendas do Dia</SheetTitle>
                    <SheetDescription>
                      {vendasCaixa.length} vendas • Total: {formatCurrency(totais.vendas)}
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-150px)] mt-4">
                    <div className="space-y-3 pr-4">
                      {vendasCaixa.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground text-sm">Nenhuma venda ainda</p>
                        </div>
                      ) : (
                        vendasCaixa.map((venda) => (
                          <div
                            key={venda.id}
                            className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-sm text-muted-foreground">
                                #{venda.id.slice(-6).toUpperCase()}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatTime(venda.data_venda || venda.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate flex-1 mr-2">
                                Cliente #{venda.cliente_id?.slice(-4) || 'N/A'}
                              </p>
                              <span className="font-semibold text-lg shrink-0">
                                {formatCurrency(Number(venda.valor_total))}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSangriaOpen(true)}
                className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span className="hidden sm:inline ml-1.5">Sangria</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSuprimentoOpen(true)}
                className="shrink-0 text-success border-success/30 hover:bg-success/10"
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span className="hidden sm:inline ml-1.5">Suprimento</span>
              </Button>
              
              <div className="flex-1 min-w-4" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFechamentoCaixaOpen(true)}
                className="shrink-0"
              >
                <Lock className="w-4 h-4" />
                <span className="ml-1.5">Fechar</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Toolbar Compacto - Stats e Ações em linha única */}
        <div className="shrink-0 px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3 overflow-x-auto">
            {/* Mini Stats Inline */}
            <div className="flex items-center gap-3 text-sm shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 rounded-lg">
                <Banknote className="w-4 h-4 text-success" />
                <span className="font-semibold text-success">{formatCurrency(totais.saldoFinal)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-lg">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-medium">{formatCurrency(totais.vendas)}</span>
                <span className="text-muted-foreground text-xs">({vendasCaixa.length})</span>
              </div>
            </div>
            
            <div className="h-5 w-px bg-border shrink-0" />
            
            {/* Quick Actions */}
            <PDVToolbar
              onCalculator={() => setIsCalculatorOpen(true)}
              onDesconto={() => setIsDescontoOpen(true)}
              onClienteFiel={() => setIsClienteFielOpen(true)}
              onConsultaPreco={() => setIsConsultaPrecoOpen(true)}
              onReimprimirUltimo={() => ultimaVenda && setIsVendaConcluidaOpen(true)}
              onPausarVenda={() => {
                if (carrinho.length > 0) {
                  setVendaPausada(carrinho);
                  setCarrinho([]);
                  toast.info('Venda pausada');
                }
              }}
              onRecuperarVenda={() => {
                if (vendaPausada) {
                  setCarrinho(vendaPausada);
                  setVendaPausada(null);
                  toast.success('Venda recuperada');
                }
              }}
              onTrocaDevolucao={() => setIsTrocaDevolucaoOpen(true)}
              vendaPausada={!!vendaPausada}
              ultimaVendaId={ultimaVenda?.id}
            />
            
            <div className="flex-1" />
            
            {/* Status Badges */}
            <div className="flex items-center gap-2 shrink-0">
              {clienteSelecionado && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-full text-xs">
                  <User className="w-3 h-3 text-primary" />
                  <span className="font-medium truncate max-w-[80px]">{clienteSelecionado.nome}</span>
                  <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0" onClick={() => setClienteSelecionado(null)}>
                    <X className="w-2.5 h-2.5" />
                  </Button>
                </div>
              )}
              {descontoAplicado && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 rounded-full text-xs">
                  <Percent className="w-3 h-3 text-destructive" />
                  <span className="font-medium">
                    {descontoAplicado.tipo === 'percentual' ? `${descontoAplicado.valor}%` : `R$ ${descontoAplicado.valor.toFixed(2)}`}
                  </span>
                  <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0" onClick={() => setDescontoAplicado(null)}>
                    <X className="w-2.5 h-2.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar + Quick Filters */}
        <div className="shrink-0 px-4 py-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar produto por nome ou código... (F4)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Quick Stock Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <Button
              variant={filterEstoque === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => setFilterEstoque('all')}
            >
              Todos ({pecas.length})
            </Button>
            <Button
              variant={filterEstoque === 'disponivel' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => setFilterEstoque('disponivel')}
            >
              <Package className="w-3 h-3 mr-1 text-success" />
              Disponível ({pecas.filter(p => p.estoque > 0).length})
            </Button>
            <Button
              variant={filterEstoque === 'baixo' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => setFilterEstoque('baixo')}
            >
              <AlertTriangle className="w-3 h-3 mr-1 text-warning" />
              Baixo ({pecas.filter(p => p.estoque > 0 && p.estoque <= (p.estoque_minimo || 5)).length})
            </Button>
          </div>
        </div>

        {/* Products Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredPecas.map((peca) => (
              <div
                key={peca.id}
                onClick={() => peca.estoque > 0 && addToCarrinho(peca)}
                className={cn(
                  'bg-card border border-border rounded-xl p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
                  peca.estoque <= 0 && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                  <img
                    src={peca.imagem_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'}
                    alt={peca.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-medium text-sm truncate">{peca.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{peca.codigo}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-semibold text-primary text-sm">
                    {formatCurrency(peca.preco_venda)}
                  </p>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded font-medium',
                    peca.estoque === 0 ? 'bg-muted text-muted-foreground' :
                    peca.estoque <= (peca.estoque_minimo || 5) ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                  )}>
                    {peca.estoque === 0 ? 'Esgotado' : peca.estoque}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <aside className="w-full lg:w-96 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col shrink-0 max-h-[40vh] lg:max-h-none">
        {/* Cart Header */}
        <div className="shrink-0 p-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Carrinho
            {carrinho.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {carrinho.reduce((acc, item) => acc + item.quantidade, 0)}
              </span>
            )}
          </h2>
        </div>

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {carrinho.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Carrinho vazio</p>
              <p className="text-muted-foreground/60 text-xs">
                Clique em um produto para adicionar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {carrinho.map((item) => (
                <div 
                  key={item.peca.id} 
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg animate-scale-in"
                >
                  <img
                    src={item.peca.imagem_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'}
                    alt={item.peca.nome}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.peca.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.peca.preco_venda)} × {item.quantidade}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateCarrinhoQuantidade(item.peca.id, item.quantidade - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantidade}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateCarrinhoQuantidade(item.peca.id, item.quantidade + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeFromCarrinho(item.peca.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer - Fixed */}
        <div className="shrink-0 p-4 border-t border-border bg-card space-y-3">
          {/* Coupon Input */}
          <CupomInput
            cupomAplicado={cupomAplicado}
            onCupomValidado={setCupomAplicado}
            disabled={carrinho.length === 0}
          />
          
          {/* Totals */}
          <div className="space-y-1">
            {totalDesconto > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotalCarrinho)}</span>
              </div>
            )}
            {totalDesconto > 0 && (
              <div className="flex items-center justify-between text-sm text-success">
                <span className="flex items-center gap-1">
                  <Ticket className="w-3 h-3" />
                  Desconto
                </span>
                <span>-{formatCurrency(totalDesconto)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground font-medium">Total</span>
              <span className="text-xl font-display font-semibold text-primary">
                {formatCurrency(totalCarrinho)}
              </span>
            </div>
          </div>
          
          <Button
            className="w-full btn-gold"
            size="lg"
            disabled={carrinho.length === 0 || isReadOnly}
            onClick={() => setIsPagamentoOpen(true)}
          >
            <DollarSign className="w-5 h-5 mr-2" />
            {isReadOnly ? 'Modo Leitura' : 'Finalizar Venda (F12)'}
          </Button>
        </div>
      </aside>

      {/* Modal de Pagamento */}
      <Dialog open={isPagamentoOpen} onOpenChange={setIsPagamentoOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Pagamento</DialogTitle>
            <DialogDescription>
              Total da venda: <span className="font-semibold text-foreground">{formatCurrency(totalCarrinho)}</span>
              {totalDesconto > 0 && (
                <span className="ml-2 text-green-600">(economia de {formatCurrency(totalDesconto)})</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Cliente */}
            <div className="space-y-2">
              <Label>Nome do Cliente (opcional)</Label>
              <Input
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Nome do cliente..."
              />
            </div>

            {/* Add Payment */}
            <div className="space-y-2">
              <Label>Adicionar Pagamento</Label>
              <div className="flex gap-2">
                <Select
                  value={novoPagamentoMetodo}
                  onValueChange={(v) => setNovoPagamentoMetodo(v as PagamentoLocal['metodo'])}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={novoPagamentoValor}
                  onChange={(e) => setNovoPagamentoValor(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPagamento()}
                />
                <Button onClick={handleAddPagamento} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Payment Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagamentos([{ metodo: 'dinheiro', valor: totalCarrinho }]);
                }}
              >
                <Banknote className="w-4 h-4 mr-1" />
                Dinheiro
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagamentos([{ metodo: 'pix', valor: totalCarrinho }]);
                }}
              >
                <Smartphone className="w-4 h-4 mr-1" />
                PIX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagamentos([{ metodo: 'credito', valor: totalCarrinho }]);
                }}
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Crédito
              </Button>
            </div>

            {/* Payment List */}
            {pagamentos.length > 0 && (
              <div className="space-y-2">
                {pagamentos.map((pag, index) => {
                  const Icon = metodoIcons[pag.metodo];
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg animate-scale-in"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span>{metodoLabels[pag.metodo]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(pag.valor)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemovePagamento(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pago</span>
                <span className="font-medium">{formatCurrency(totalPago)}</span>
              </div>
              {totalPago >= totalCarrinho && (
                <div className="flex justify-between text-success">
                  <span>Troco</span>
                  <span className="font-semibold">{formatCurrency(troco)}</span>
                </div>
              )}
              {totalPago < totalCarrinho && (
                <div className="flex justify-between text-destructive">
                  <span>Falta</span>
                  <span className="font-semibold">{formatCurrency(totalCarrinho - totalPago)}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPagamentoOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarPagamento}
              className="btn-gold"
              disabled={totalPago < totalCarrinho || addVenda.isPending}
            >
              {addVenda.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Venda Concluída */}
      <Dialog open={isVendaConcluidaOpen} onOpenChange={setIsVendaConcluidaOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="py-4">
            <div className="text-center mb-6 no-print">
              <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center animate-scale-in">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <DialogTitle className="font-display text-2xl mb-2">Venda Concluída!</DialogTitle>
              <DialogDescription>
                A venda foi registrada com sucesso.
              </DialogDescription>
            </div>

            {ultimaVenda && (
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <ReciboVenda 
                  ref={reciboRef} 
                  venda={ultimaVenda} 
                  numeroCaixa={caixaAtual?.id.slice(-4)}
                />
              </div>
            )}
          </div>

          <DialogFooter className="no-print gap-2">
            <Button variant="outline" onClick={() => setIsVendaConcluidaOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handlePrint} className="btn-gold">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Sangria */}
      <Dialog open={isSangriaOpen} onOpenChange={setIsSangriaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-destructive">
              Sangria
            </DialogTitle>
            <DialogDescription>
              Registre uma retirada de dinheiro do caixa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={movimentoValor}
                onChange={(e) => setMovimentoValor(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={movimentoDescricao}
                onChange={(e) => setMovimentoDescricao(e.target.value)}
                placeholder="Motivo da sangria..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSangriaOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSangria}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={addMovimento.isPending}
            >
              {addMovimento.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Sangria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Suprimento */}
      <Dialog open={isSuprimentoOpen} onOpenChange={setIsSuprimentoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-success">
              Suprimento
            </DialogTitle>
            <DialogDescription>
              Registre uma entrada de dinheiro no caixa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={movimentoValor}
                onChange={(e) => setMovimentoValor(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={movimentoDescricao}
                onChange={(e) => setMovimentoDescricao(e.target.value)}
                placeholder="Motivo do suprimento..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuprimentoOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSuprimento}
              className="bg-success text-success-foreground hover:bg-success/90"
              disabled={addMovimento.isPending}
            >
              {addMovimento.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Suprimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Fechamento de Caixa Avançado */}
      <FechamentoCaixaReport
        open={isFechamentoCaixaOpen}
        onOpenChange={setIsFechamentoCaixaOpen}
        caixa={{
          id: caixaAtual.id,
          data_abertura: caixaAtual.data_abertura || caixaAtual.created_at,
          valor_inicial: caixaAtual.fundo_troco,
          created_at: caixaAtual.created_at,
        }}
        vendas={vendasCaixa.map(v => ({
          id: v.id,
          total: Number(v.valor_total),
          forma_pagamento: v.forma_pagamento || 'dinheiro',
          created_at: v.created_at,
        }))}
        movimentos={movimentosCaixa.map(m => ({
          id: m.id,
          tipo: m.tipo as 'sangria' | 'suprimento',
          valor: Number(m.valor),
          descricao: m.descricao || null,
          created_at: m.created_at,
        }))}
        onConfirmarFechamento={handleFecharCaixa}
      />

      {/* Calculator Modal */}
      <CalculatorModal
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
        onInsertValue={(value) => {
          setNovoPagamentoValor(String(value));
          setIsCalculatorOpen(false);
          setIsPagamentoOpen(true);
        }}
      />

      {/* Desconto Modal */}
      <DescontoModal
        open={isDescontoOpen}
        onOpenChange={setIsDescontoOpen}
        totalCarrinho={subtotalCarrinho}
        onAplicarDesconto={(valor, tipo) => {
          setDescontoAplicado({ valor, tipo });
          toast.success(`Desconto de ${tipo === 'percentual' ? `${valor}%` : formatCurrency(valor)} aplicado`);
        }}
      />

      {/* Cliente Fiel Modal */}
      <ClienteFielModal
        open={isClienteFielOpen}
        onOpenChange={setIsClienteFielOpen}
        clientes={clientes}
        clienteSelecionado={clienteSelecionado}
        onSelectCliente={(cliente) => {
          setClienteSelecionado(cliente);
          if (cliente) {
            setClienteNome(cliente.nome);
            toast.success(`Cliente ${cliente.nome} selecionado`);
          } else {
            setClienteNome('');
          }
        }}
        onAddCliente={async (novoCliente) => {
          await addCliente.mutateAsync(novoCliente);
        }}
      />

      {/* Consulta Preço Modal */}
      <ConsultaPrecoModal
        open={isConsultaPrecoOpen}
        onOpenChange={setIsConsultaPrecoOpen}
        pecas={pecas}
        onAddToCarrinho={(peca) => {
          addToCarrinho(peca);
          setIsConsultaPrecoOpen(false);
        }}
      />

      {/* Troca/Devolução Modal */}
      <TrocaDevolucaoModal
        open={isTrocaDevolucaoOpen}
        onOpenChange={setIsTrocaDevolucaoOpen}
        pecas={pecas}
        onConfirmarTroca={async (dados) => {
          if (dados.tipo === 'devolucao') {
            // Return item to stock
            const peca = pecas.find(p => p.id === dados.pecaOriginal.id);
            if (peca) {
              const { error } = await supabase
                .from('pecas')
                .update({ estoque: peca.estoque + 1 })
                .eq('id', peca.id);
              
              if (!error) {
                queryClient.invalidateQueries({ queryKey: ['pecas'] });
                toast.success(`Devolução registrada. ${dados.pecaOriginal.nome} devolvido ao estoque.`);
              }
            }
          } else if (dados.tipo === 'troca' && dados.pecaNova) {
            // Handle exchange
            const pecaOriginal = pecas.find(p => p.id === dados.pecaOriginal.id);
            const pecaNova = pecas.find(p => p.id === dados.pecaNova!.id);
            
            if (pecaOriginal && pecaNova) {
              // Return original to stock
              await supabase
                .from('pecas')
                .update({ estoque: pecaOriginal.estoque + 1 })
                .eq('id', pecaOriginal.id);
              
              // Remove new from stock
              await supabase
                .from('pecas')
                .update({ estoque: pecaNova.estoque - 1 })
                .eq('id', pecaNova.id);
              
              queryClient.invalidateQueries({ queryKey: ['pecas'] });
              
              const diferenca = pecaNova.preco_venda - pecaOriginal.preco_venda;
              
              if (diferenca > 0) {
                toast.success(`Troca registrada. Cliente deve pagar diferença de ${formatCurrency(diferenca)}`);
              } else if (diferenca < 0) {
                toast.success(`Troca registrada. Devolver ${formatCurrency(Math.abs(diferenca))} ao cliente`);
              } else {
                toast.success('Troca registrada com sucesso!');
              }
            }
          }
          setIsTrocaDevolucaoOpen(false);
        }}
      />
    </div>
  );
}
