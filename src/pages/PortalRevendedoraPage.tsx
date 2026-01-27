import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Gem, 
  Lock, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X,
  CheckCircle2,
  User,
  ArrowLeft,
  Loader2,
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  ShoppingCart,
  BarChart3,
  LogOut,
  Calendar,
  XCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  type Peca, 
  type MaletaItem, 
  type Maleta 
} from '@/hooks/useSupabaseData';

interface CarrinhoRevendedora {
  item: MaletaItem & { peca: Peca };
  quantidade: number;
}

interface Romaneio {
  id: string;
  cliente_nome: string | null;
  total: number;
  status: string;
  data: string;
  romaneio_itens?: { id: string; peca_nome: string; quantidade: number; preco_unitario: number }[];
}

export default function PortalRevendedoraPage() {
  const { revendedoraId } = useParams();
  const queryClient = useQueryClient();
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [senha, setSenha] = useState('');
  const [senhaError, setSenhaError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [carrinho, setCarrinho] = useState<CarrinhoRevendedora[]>([]);
  const [isVendaOpen, setIsVendaOpen] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [isVendaConcluidaOpen, setIsVendaConcluidaOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalogo' | 'vendas'>('catalogo');
  const [selectedRomaneio, setSelectedRomaneio] = useState<Romaneio | null>(null);

  // Fetch revendedora profile (excluding senha_portal for security)
  const { data: revendedora, isLoading: loadingRevendedora } = useQuery({
    queryKey: ['revendedora-portal', revendedoraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revendedoras')
        .select('*')
        .eq('id', revendedoraId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!revendedoraId,
  });

  // Fetch open maleta for this revendedora
  const { data: maletaAberta, isLoading: loadingMaleta } = useQuery({
    queryKey: ['maleta-aberta-portal', revendedoraId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('maletas')
        .select('*')
        .eq('revendedora_id', revendedoraId)
        .eq('status', 'aberta')
        .maybeSingle();
      
      if (error) throw error;
      return data as Maleta | null;
    },
    enabled: !!revendedoraId,
  });

  // Fetch maleta items with pieces
  const { data: maletaItens = [], isLoading: loadingItens } = useQuery({
    queryKey: ['maleta-itens-portal', maletaAberta?.id],
    queryFn: async () => {
      if (!maletaAberta?.id) return [];
      
      const { data, error } = await supabase
        .from('maleta_itens')
        .select(`
          *,
          peca:pecas(*)
        `)
        .eq('maleta_id', maletaAberta.id);
      
      if (error) throw error;
      return data as (MaletaItem & { peca: Peca })[];
    },
    enabled: !!maletaAberta?.id,
  });

  // Fetch romaneios for this maleta (reseller's sales)
  const { data: romaneios = [], isLoading: loadingRomaneios } = useQuery({
    queryKey: ['romaneios-portal', maletaAberta?.id],
    queryFn: async () => {
      if (!maletaAberta?.id) return [];
      
      const { data, error } = await supabase
        .from('romaneios')
        .select('*, romaneios_pecas(*)')
        .eq('revendedora_id', maletaAberta.revendedora_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Romaneio[];
    },
    enabled: !!maletaAberta?.id && isLoggedIn,
  });

  // Update romaneio status mutation
  const updateRomaneioStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('romaneios')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['romaneios-portal'] });
      if (variables.status === 'confirmado') {
        toast.success('Venda confirmada!');
      } else if (variables.status === 'cancelado') {
        toast.success('Venda cancelada');
      }
    },
    onError: () => {
      toast.error('Erro ao atualizar venda');
    },
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalVendas = romaneios.length;
    const vendasPendentes = romaneios.filter(r => r.status === 'pendente').length;
    const vendasConfirmadas = romaneios.filter(r => r.status === 'confirmado').length;
    const totalFaturado = romaneios
      .filter(r => r.status === 'confirmado')
      .reduce((acc, r) => acc + (r.total || 0), 0);
    const totalPendente = romaneios
      .filter(r => r.status === 'pendente')
      .reduce((acc, r) => acc + (r.total || 0), 0);
    const comissao = (revendedora as any)?.comissao_percentual || 30;
    const comissaoGanha = totalFaturado * (comissao / 100);
    
    return {
      totalVendas,
      vendasPendentes,
      vendasConfirmadas,
      totalFaturado,
      totalPendente,
      comissaoGanha,
      comissao,
    };
  }, [romaneios, revendedora]);

  const itensPendentes = useMemo(() => 
    maletaItens.filter((i) => i.status === 'pendente'), 
    [maletaItens]
  );

  // Mutation to register a sale (romaneio)
  const registerSale = useMutation({
    mutationFn: async (data: {
      clienteNome: string;
      items: CarrinhoRevendedora[];
      total: number;
    }) => {
      if (!revendedora || !maletaAberta) throw new Error('Dados incompletos');

      // Create romaneio - get organization_id from maleta
      const { data: maletaData } = await (supabase as any)
        .from('maletas')
        .select('organization_id')
        .eq('id', maletaAberta.id)
        .single();

      const { data: romaneioData, error: romaneioError } = await (supabase as any)
        .from('romaneios')
        .insert({
          organization_id: maletaData?.organization_id,
          revendedora_id: (revendedora as any).id,
          numero: `ROM-${Date.now()}`,
          status: 'pendente',
          data_criacao: new Date().toISOString(),
          observacoes: data.clienteNome ? `Cliente: ${data.clienteNome}` : null,
        })
        .select()
        .single();
      
      if (romaneioError) throw romaneioError;

      // Create romaneio items
      const romaneioItems = data.items.map((c) => ({
        romaneio_id: romaneioData.id,
        peca_id: c.item.peca.id,
        peca_nome: c.item.peca.nome,
        quantidade: c.quantidade,
        preco_unitario: c.item.peca.preco_venda,
      }));

      // Correct table name is 'romaneios_pecas'
      const { error: itemsError } = await supabase
        .from('romaneios_pecas')
        .insert(romaneioItems);
      
      if (itemsError) throw itemsError;

      // Mark items as sold in the maleta
      const pecasVendidas: string[] = [];
      const contadorPorPeca: { [key: string]: number } = {};
      
      for (const c of data.items) {
        for (let i = 0; i < c.quantidade; i++) {
          pecasVendidas.push(c.item.peca.id);
        }
      }

      // Update each maleta item status to 'vendido'
      for (const item of itensPendentes) {
        const count = contadorPorPeca[item.peca.id] || 0;
        const quantidadeNecessaria = data.items.find(
          (c) => c.item.peca.id === item.peca.id
        )?.quantidade || 0;
        
        if (pecasVendidas.includes(item.peca.id) && count < quantidadeNecessaria) {
          contadorPorPeca[item.peca.id] = count + 1;
          
          const { error: updateError } = await supabase
            .from('maleta_itens')
            .update({ status: 'vendido' })
            .eq('id', item.id);
          
          if (updateError) console.error('Error updating item:', updateError);
        }
      }

      return romaneioData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maleta-itens-portal'] });
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
      setCarrinho([]);
      setClienteNome('');
      setIsVendaOpen(false);
      setIsVendaConcluidaOpen(true);
    },
    onError: (error) => {
      console.error('Error registering sale:', error);
      toast.error('Erro ao registrar venda');
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleLogin = async () => {
    if (!revendedoraId || !senha) {
      setSenhaError('Digite sua senha');
      return;
    }

    setIsLoggingIn(true);
    setSenhaError('');

    try {
      const { data, error } = await (supabase as any).rpc('verify_portal_password', {
        p_user_id: revendedoraId,
        p_password: senha
      });

      if (error) {
        console.error('Login error:', error);
        setSenhaError('Erro ao verificar senha');
        return;
      }

      const result = data as any;
      if (!result || (Array.isArray(result) && (result.length === 0 || !result[0]?.is_valid)) || (typeof result === 'object' && !result.is_valid)) {
        setSenhaError('Senha incorreta');
        return;
      }

      setIsLoggedIn(true);
      setIsLoginOpen(false);
      setSenha('');
      setSenhaError('');
    } catch (error) {
      console.error('Login error:', error);
      setSenhaError('Erro ao fazer login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAddToCarrinho = (item: MaletaItem & { peca: Peca }) => {
    const existente = carrinho.find((c) => c.item.peca.id === item.peca.id);
    if (existente) {
      const totalNoCarrinho = existente.quantidade;
      const disponivelNaMaleta = itensPendentes.filter(
        (i) => i.peca.id === item.peca.id
      ).length;
      
      if (totalNoCarrinho < disponivelNaMaleta) {
        setCarrinho(
          carrinho.map((c) =>
            c.item.peca.id === item.peca.id
              ? { ...c, quantidade: c.quantidade + 1 }
              : c
          )
        );
      }
    } else {
      setCarrinho([...carrinho, { item, quantidade: 1 }]);
    }
  };

  const handleRemoveFromCarrinho = (pecaId: string) => {
    const existente = carrinho.find((c) => c.item.peca.id === pecaId);
    if (existente && existente.quantidade > 1) {
      setCarrinho(
        carrinho.map((c) =>
          c.item.peca.id === pecaId
            ? { ...c, quantidade: c.quantidade - 1 }
            : c
        )
      );
    } else {
      setCarrinho(carrinho.filter((c) => c.item.peca.id !== pecaId));
    }
  };

  const handleRemoveItemCarrinho = (pecaId: string) => {
    setCarrinho(carrinho.filter((c) => c.item.peca.id !== pecaId));
  };

  const totalCarrinho = carrinho.reduce(
    (acc, c) => acc + Number(c.item.peca.preco_venda) * c.quantidade,
    0
  );

  const handleRegistrarVenda = () => {
    registerSale.mutate({
      clienteNome,
      items: carrinho,
      total: totalCarrinho,
    });
  };

  const isLoading = loadingRevendedora || loadingMaleta || loadingItens;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found state
  if (!revendedora) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center">
          <Gem className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-semibold mb-2">
            Revendedora não encontrada
          </h1>
          <p className="text-muted-foreground mb-6">
            O link que você acessou não é válido
          </p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // No open maleta
  if (!maletaAberta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-semibold mb-2">
            Catálogo Indisponível
          </h1>
          <p className="text-muted-foreground mb-2">
            {(revendedora as any).nome} não possui uma maleta aberta no momento
          </p>
          <p className="text-sm text-muted-foreground/60">
            Entre em contato para mais informações
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-sidebar text-sidebar-foreground py-6 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center text-lg font-display text-primary-foreground">
              {(revendedora as any).nome?.charAt(0)}
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold">
                {(revendedora as any).nome}
              </h1>
              <p className="text-sm text-sidebar-foreground/60">
                Catálogo de Semijoias
              </p>
            </div>
          </div>
          
          {!isLoggedIn ? (
            <Button
              onClick={() => setIsLoginOpen(true)}
              variant="outline"
              className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Lock className="w-4 h-4 mr-2" />
              Área da Revendedora
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-success/20 text-success border-0">
                <User className="w-3 h-3 mr-1" />
                Modo Revendedora
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsLoggedIn(false);
                  setActiveTab('catalogo');
                  setCarrinho([]);
                }}
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </header>


      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-8">
        {/* Sales Dashboard - Only visible when logged in */}
        {isLoggedIn ? (
          <div className="space-y-6 animate-fade-in">
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-violet-500 via-purple-500 to-purple-600">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
                </div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm">Total Vendas</p>
                    <p className="text-white text-2xl font-bold">{metrics.totalVendas}</p>
                  </div>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
                </div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm">Pendentes</p>
                    <p className="text-white text-2xl font-bold">{metrics.vendasPendentes}</p>
                  </div>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
                </div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm">Faturado</p>
                    <p className="text-white text-xl font-bold truncate">{formatCurrency(metrics.totalFaturado)}</p>
                  </div>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
                </div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm">Comissão ({metrics.comissao}%)</p>
                    <p className="text-white text-xl font-bold truncate">{formatCurrency(metrics.comissaoGanha)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending sales alert */}
            {metrics.vendasPendentes > 0 && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-700">Você tem {metrics.vendasPendentes} venda(s) aguardando confirmação da loja</p>
                  <p className="text-sm text-yellow-600/80">Total: {formatCurrency(metrics.totalPendente)}</p>
                </div>
              </div>
            )}

            {/* Sales List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Histórico de Vendas</h3>
              
              {loadingRomaneios ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : romaneios.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma venda registrada ainda</p>
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab('catalogo')}
                    className="mt-2"
                  >
                    Ir para o catálogo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {romaneios.map((romaneio) => {
                    const statusColors: Record<string, string> = {
                      'pendente': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
                      'confirmado': 'bg-success/10 text-success border-success/30',
                      'cancelado': 'bg-destructive/10 text-destructive border-destructive/30',
                    };
                    return (
                      <Card key={romaneio.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {format(new Date(romaneio.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              {romaneio.cliente_nome && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Cliente: {romaneio.cliente_nome}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">
                                  {romaneio.romaneio_itens?.length || 0} {(romaneio.romaneio_itens?.length || 0) === 1 ? 'item' : 'itens'}
                                </span>
                                <span className="font-semibold text-lg text-primary">
                                  {formatCurrency(romaneio.total || 0)}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn("capitalize", statusColors[romaneio.status] || '')}
                              >
                                {romaneio.status === 'pendente' ? 'Pendente' : 
                                 romaneio.status === 'confirmado' ? 'Confirmado' : 
                                 romaneio.status === 'cancelado' ? 'Cancelado' : romaneio.status}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {romaneio.status === 'pendente' && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-success hover:bg-success/90 text-success-foreground h-8"
                                      onClick={() => updateRomaneioStatus.mutate({ id: romaneio.id, status: 'confirmado' })}
                                      disabled={updateRomaneioStatus.isPending}
                                    >
                                      {updateRomaneioStatus.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Confirmar
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-destructive border-destructive/30 hover:bg-destructive/10 h-8"
                                      onClick={() => {
                                        if (window.confirm('Deseja cancelar este pedido?')) {
                                          updateRomaneioStatus.mutate({ id: romaneio.id, status: 'cancelado' });
                                        }
                                      }}
                                      disabled={updateRomaneioStatus.isPending}
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => setSelectedRomaneio(romaneio)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Catalog View */
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-display font-semibold mb-2">
                Peças Disponíveis
              </h2>
              <p className="text-muted-foreground">
                {itensPendentes.length} peças disponíveis para venda
              </p>
            </div>

        {itensPendentes.length === 0 ? (
          <div className="text-center py-16">
            <Gem className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma peça disponível no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Object.values(
              itensPendentes.reduce((acc, item) => {
                if (!acc[item.peca.id]) {
                  acc[item.peca.id] = { item, count: 0 };
                }
                acc[item.peca.id].count++;
                return acc;
              }, {} as { [key: string]: { item: typeof itensPendentes[0]; count: number } })
            ).map(({ item, count }) => {
              const noCarrinho = carrinho.find(
                (c) => c.item.peca.id === item.peca.id
              )?.quantidade || 0;
              const disponivel = count - noCarrinho;

              return (
                <div
                  key={item.peca.id}
                  className="glass-card rounded-xl overflow-hidden hover-lift"
                >
                  <div className="aspect-square relative">
                    <img
                      src={item.peca.imagem_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'}
                      alt={item.peca.nome}
                      className="w-full h-full object-cover"
                    />
                    {count > 1 && (
                      <Badge className="absolute top-2 right-2 bg-primary">
                        {count} un.
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-1 truncate">{item.peca.nome}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.peca.codigo}
                    </p>
                    <p className="text-lg font-display font-semibold text-primary mb-3">
                      {formatCurrency(Number(item.peca.preco_venda))}
                    </p>

                    {!isLoggedIn && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveFromCarrinho(item.peca.id)}
                          disabled={noCarrinho === 0}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {noCarrinho}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleAddToCarrinho(item)}
                          disabled={disponivel === 0}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </main>

      {/* Fixed Footer Cart - Only for customers (not logged in) */}
      {!isLoggedIn && carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg animate-slide-up">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {carrinho.slice(0, 3).map((c) => (
                  <img
                    key={c.item.peca.id}
                    src={c.item.peca.imagem_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'}
                    alt=""
                    className="w-10 h-10 rounded-full border-2 border-background object-cover"
                  />
                ))}
                {carrinho.length > 3 && (
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                    +{carrinho.length - 3}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {carrinho.reduce((acc, c) => acc + c.quantidade, 0)} itens
                </p>
                <p className="text-xl font-display font-semibold">
                  {formatCurrency(totalCarrinho)}
                </p>
              </div>
            </div>
            <Button onClick={() => setIsVendaOpen(true)} className="btn-gold" size="lg">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Finalizar Pedido
            </Button>
          </div>
        </div>
      )}

      {/* Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Área da Revendedora
            </DialogTitle>
            <DialogDescription>
              Digite sua senha para acessar os controles de venda
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                setSenhaError('');
              }}
              placeholder="••••••••"
              className="mt-2"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {senhaError && (
              <p className="text-sm text-destructive mt-2">{senhaError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLoginOpen(false)} disabled={isLoggingIn}>
              Cancelar
            </Button>
            <Button onClick={handleLogin} className="btn-gold" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Venda Dialog */}
      <Dialog open={isVendaOpen} onOpenChange={setIsVendaOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Finalizar Pedido
            </DialogTitle>
            <DialogDescription>
              Confirme os itens e informe seus dados
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Cart Items */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {carrinho.map((c) => (
                <div
                  key={c.item.peca.id}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                >
                  <img
                    src={c.item.peca.imagem_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'}
                    alt={c.item.peca.nome}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{c.item.peca.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.quantidade}x {formatCurrency(Number(c.item.peca.preco_venda))}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(Number(c.item.peca.preco_venda) * c.quantidade)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveItemCarrinho(c.item.peca.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
              <span className="font-medium">Total</span>
              <span className="text-xl font-display font-semibold text-primary">
                {formatCurrency(totalCarrinho)}
              </span>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="clienteNome">Seu Nome</Label>
              <Input
                id="clienteNome"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVendaOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegistrarVenda}
              className="btn-gold"
              disabled={registerSale.isPending}
            >
              {registerSale.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Venda Concluída Dialog */}
      <Dialog open={isVendaConcluidaOpen} onOpenChange={setIsVendaConcluidaOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-8">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-display font-semibold mb-2">
              Pedido Enviado!
            </h2>
            <p className="text-muted-foreground">
              Seu pedido foi enviado para a revendedora e será processado em breve.
            </p>
          </div>
          <DialogFooter className="justify-center">
            <Button
              onClick={() => setIsVendaConcluidaOpen(false)}
              className="btn-gold"
            >
              Continuar Vendendo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Romaneio Details Dialog */}
      <Dialog open={!!selectedRomaneio} onOpenChange={(open) => !open && setSelectedRomaneio(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Detalhes da Venda
            </DialogTitle>
            <DialogDescription>
              {selectedRomaneio && format(new Date(selectedRomaneio.data), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRomaneio && (
            <div className="py-4 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "capitalize",
                    selectedRomaneio.status === 'pendente' && 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
                    selectedRomaneio.status === 'confirmado' && 'bg-success/10 text-success border-success/30',
                    selectedRomaneio.status === 'cancelado' && 'bg-destructive/10 text-destructive border-destructive/30',
                  )}
                >
                  {selectedRomaneio.status === 'pendente' ? 'Aguardando confirmação' : 
                   selectedRomaneio.status === 'confirmado' ? 'Confirmado' : 
                   selectedRomaneio.status === 'cancelado' ? 'Cancelado' : selectedRomaneio.status}
                </Badge>
              </div>

              {/* Client */}
              {selectedRomaneio.cliente_nome && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">{selectedRomaneio.cliente_nome}</span>
                </div>
              )}

              {/* Items */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Itens vendidos</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedRomaneio.romaneio_itens?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.peca_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantidade}x {formatCurrency(item.preco_unitario)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.preco_unitario * item.quantidade)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="font-medium">Total</span>
                <span className="text-xl font-display font-semibold text-primary">
                  {formatCurrency(selectedRomaneio.total)}
                </span>
              </div>

              {/* Commission info */}
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Sua comissão ({(revendedora as any)?.comissao_percentual || 30}%)</span>
                <span className="font-semibold text-success">
                  {formatCurrency(selectedRomaneio.total * (((revendedora as any)?.comissao_percentual || 30) / 100))}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRomaneio(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
