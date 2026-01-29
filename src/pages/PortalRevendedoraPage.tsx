import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Package, ShoppingBag, TrendingUp, Check, X, LogOut, Eye, Briefcase, DollarSign, Clock, CheckCircle2, Bell, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePortalNotifications } from '@/hooks/usePortalNotifications';

interface Revendedora {
  id: string;
  nome: string;
  comissao_percentual: number;
  telefone?: string;
  email?: string;
}

interface Maleta {
  id: string;
  nome: string;
  codigo?: string;
  status?: string;
  valor_total?: number;
  created_at?: string;
  data_devolucao?: string;
}

interface MaletaPeca {
  id: string;
  quantidade: number;
  quantidade_vendida?: number;
  vendida: boolean;
  preco_unitario?: number;
  data_venda?: string;
  peca: {
    id: string;
    nome: string;
    codigo?: string;
    preco_venda?: number;
    imagem_url?: string;
  };
}

interface Interesse {
  id: string;
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_email?: string;
  status?: string;
  observacoes?: string;
  created_at?: string;
  maleta: {
    id: string;
    nome: string;
  };
  itens: {
    id: string;
    quantidade: number;
    peca: {
      id: string;
      nome: string;
      codigo?: string;
      preco_venda?: number;
    };
  }[];
}

export default function PortalRevendedoraPage() {
  const { revendedoraId } = useParams();
  const navigate = useNavigate();
  
  // Login state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  
  // Data state
  const [revendedora, setRevendedora] = useState<Revendedora | null>(null);
  const [maletas, setMaletas] = useState<Maleta[]>([]);
  const [maletaSelecionada, setMaletaSelecionada] = useState<Maleta | null>(null);
  const [pecasMaleta, setPecasMaleta] = useState<MaletaPeca[]>([]);
  const [interesses, setInteresses] = useState<Interesse[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [interesseModal, setInteresseModal] = useState<Interesse | null>(null);
  const [vendaModal, setVendaModal] = useState<MaletaPeca | null>(null);
  const [quantidadeVenda, setQuantidadeVenda] = useState(1);
  const [processando, setProcessando] = useState(false);

  // Portal notifications hook
  const { notifications, unreadCount, refetch: refetchNotifications } = usePortalNotifications({
    revendedoraId: revendedora?.id || null,
    enabled: isAuthenticated,
  });

  // Check session storage for existing login
  useEffect(() => {
    const session = sessionStorage.getItem(`portal_session`);
    if (session) {
      try {
        const data = JSON.parse(session);
        setRevendedora(data.revendedora);
        setIsAuthenticated(true);
        // If URL has no ID, redirect to correct portal
        if (!revendedoraId || revendedoraId === 'login') {
          navigate(`/portal/${data.revendedora.id}`, { replace: true });
        }
      } catch (e) {
        sessionStorage.removeItem(`portal_session`);
      }
    }
  }, [revendedoraId, navigate]);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && revendedora) {
      fetchMaletas();
      fetchInteresses();
    }
  }, [isAuthenticated, revendedora]);

  // Fetch peças when maleta is selected
  useEffect(() => {
    if (maletaSelecionada) {
      fetchPecasMaleta(maletaSelecionada.id);
    }
  }, [maletaSelecionada]);

  const handleLogin = async () => {
    if (!usuario.trim() || !senha.trim()) {
      toast.error('Preencha usuário e senha');
      return;
    }

    setLoginLoading(true);
    try {
      const { data, error } = await supabase
        .from('revendedoras')
        .select('id, nome, comissao_percentual, telefone, email, usuario_portal, senha_portal')
        .eq('usuario_portal', usuario.trim().toLowerCase())
        .maybeSingle();

      if (error || !data) {
        toast.error('Usuário não encontrado');
        return;
      }

      if (data.senha_portal !== senha) {
        toast.error('Senha incorreta');
        return;
      }

      const revendedoraData = {
        id: data.id,
        nome: data.nome,
        comissao_percentual: data.comissao_percentual || 30,
        telefone: data.telefone || undefined,
        email: data.email || undefined,
      };

      setRevendedora(revendedoraData);
      
      sessionStorage.setItem(`portal_session`, JSON.stringify({
        revendedora: revendedoraData
      }));
      
      setIsAuthenticated(true);
      navigate(`/portal/${data.id}`, { replace: true });
      toast.success(`Bem-vinda, ${data.nome}!`);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(`portal_session`);
    setIsAuthenticated(false);
    setRevendedora(null);
    setMaletas([]);
    setInteresses([]);
    setUsuario('');
    setSenha('');
    navigate('/portal/login', { replace: true });
  };

  const fetchMaletas = async () => {
    if (!revendedora) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maletas')
        .select('*')
        .eq('revendedora_id', revendedora.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaletas(data || []);
      
      if (data && data.length > 0 && !maletaSelecionada) {
        setMaletaSelecionada(data[0]);
      }
    } catch (error) {
      console.error('Error fetching maletas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPecasMaleta = async (maletaId: string) => {
    try {
      const { data, error } = await supabase
        .from('maletas_pecas')
        .select(`
          id,
          quantidade,
          quantidade_vendida,
          vendida,
          preco_unitario,
          data_venda,
          peca:pecas(id, nome, codigo, preco_venda, imagem_url)
        `)
        .eq('maleta_id', maletaId);

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        ...item,
        peca: Array.isArray(item.peca) ? item.peca[0] : item.peca
      })) as MaletaPeca[];
      
      setPecasMaleta(formattedData);
    } catch (error) {
      console.error('Error fetching pecas:', error);
    }
  };

  const fetchInteresses = async () => {
    if (!revendedora) return;
    
    try {
      // First get maleta IDs for this revendedora
      const { data: maletasData } = await supabase
        .from('maletas')
        .select('id')
        .eq('revendedora_id', revendedora.id);

      if (!maletasData || maletasData.length === 0) {
        setInteresses([]);
        return;
      }

      const maletaIds = maletasData.map(m => m.id);

      const { data, error } = await supabase
        .from('maleta_interesses')
        .select(`
          *,
          maleta:maletas(id, nome)
        `)
        .in('maleta_id', maletaIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch items for each interesse
      const interessesWithItems = await Promise.all(
        (data || []).map(async (interesse) => {
          const { data: itens } = await supabase
            .from('maleta_interesse_itens')
            .select(`
              id,
              quantidade,
              peca:pecas(id, nome, codigo, preco_venda)
            `)
            .eq('interesse_id', interesse.id);

          return {
            ...interesse,
            maleta: Array.isArray(interesse.maleta) ? interesse.maleta[0] : interesse.maleta,
            itens: (itens || []).map(item => ({
              ...item,
              peca: Array.isArray(item.peca) ? item.peca[0] : item.peca
            }))
          } as Interesse;
        })
      );

      setInteresses(interessesWithItems);
    } catch (error) {
      console.error('Error fetching interesses:', error);
    }
  };

  const handleAprovarInteresse = async (interesse: Interesse) => {
    setProcessando(true);
    try {
      // Mark all items as sold in maletas_pecas using quantidade_vendida
      for (const item of interesse.itens) {
        // Get current item data
        const { data: currentItem } = await supabase
          .from('maletas_pecas')
          .select('id, quantidade, quantidade_vendida')
          .eq('maleta_id', interesse.maleta.id)
          .eq('peca_id', item.peca.id)
          .maybeSingle();

        if (currentItem) {
          const quantidadeVenda = item.quantidade || 1;
          const quantidadeRestante = Math.max(0, (currentItem.quantidade || 0) - quantidadeVenda);
          const novaQuantidadeVendida = (currentItem.quantidade_vendida || 0) + quantidadeVenda;
          const isFullySold = quantidadeRestante <= 0;

          const { error } = await supabase
            .from('maletas_pecas')
            .update({
              quantidade: quantidadeRestante,
              quantidade_vendida: novaQuantidadeVendida,
              vendida: isFullySold,
              data_venda: new Date().toISOString().split('T')[0]
            })
            .eq('id', currentItem.id);

          if (error) throw error;
        }
      }

      // Update interesse status to 'atendido' (valid constraint value)
      const { error } = await supabase
        .from('maleta_interesses')
        .update({ status: 'atendido' })
        .eq('id', interesse.id);

      if (error) throw error;

      toast.success('Venda aprovada! Itens marcados como vendidos.');
      setInteresseModal(null);
      fetchInteresses();
      if (maletaSelecionada) {
        fetchPecasMaleta(maletaSelecionada.id);
      }
    } catch (error) {
      console.error('Error approving interesse:', error);
      toast.error('Erro ao aprovar venda');
    } finally {
      setProcessando(false);
    }
  };

  const handleRejeitarInteresse = async (interesseId: string) => {
    setProcessando(true);
    try {
      // Update interesse status to 'cancelado' (valid constraint value)
      const { error } = await supabase
        .from('maleta_interesses')
        .update({ status: 'cancelado' })
        .eq('id', interesseId);

      if (error) throw error;

      toast.success('Interesse rejeitado');
      setInteresseModal(null);
      fetchInteresses();
    } catch (error) {
      console.error('Error rejecting interesse:', error);
      toast.error('Erro ao rejeitar interesse');
    } finally {
      setProcessando(false);
    }
  };

  const handleMarcarVendida = async () => {
    if (!vendaModal || !maletaSelecionada) return;

    setProcessando(true);
    try {
      // Get current item data
      const { data: currentItem, error: fetchError } = await supabase
        .from('maletas_pecas')
        .select('quantidade_vendida')
        .eq('id', vendaModal.id)
        .single();

      if (fetchError) throw fetchError;

      const quantidadeRestante = vendaModal.quantidade - quantidadeVenda;
      const novaQuantidadeVendida = (currentItem?.quantidade_vendida || 0) + quantidadeVenda;
      const isFullySold = quantidadeRestante <= 0;

      // Update using quantidade_vendida for tracking (consistent with admin panel)
      const { error: updateError } = await supabase
        .from('maletas_pecas')
        .update({
          quantidade: Math.max(0, quantidadeRestante),
          quantidade_vendida: novaQuantidadeVendida,
          vendida: isFullySold,
          data_venda: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', vendaModal.id);

      if (updateError) throw updateError;

      toast.success(quantidadeVenda > 1 
        ? `${quantidadeVenda} peças marcadas como vendidas!` 
        : 'Peça marcada como vendida!'
      );
      setVendaModal(null);
      setQuantidadeVenda(1);
      fetchPecasMaleta(maletaSelecionada.id);
    } catch (error) {
      console.error('Error marking as sold:', error);
      toast.error('Erro ao marcar como vendida');
    } finally {
      setProcessando(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate metrics using quantidade_vendida for accuracy
  const pecasPendentes = pecasMaleta.reduce((acc, item) => acc + (item.quantidade || 0), 0);
  const pecasVendidas = pecasMaleta.reduce((acc, item) => acc + (item.quantidade_vendida || 0), 0);
  const totalPecas = pecasPendentes + pecasVendidas;
  const valorVendido = pecasMaleta.reduce((acc, item) => {
    const qtdVendida = item.quantidade_vendida || 0;
    return acc + (item.preco_unitario || item.peca.preco_venda || 0) * qtdVendida;
  }, 0);
  const comissao = valorVendido * ((revendedora?.comissao_percentual || 30) / 100);
  const interessesPendentes = interesses.filter(i => i.status === 'pendente').length;

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Portal da Revendedora</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar suas maletas e vendas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuário</Label>
              <Input
                id="usuario"
                placeholder="Seu usuário do portal"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Portal Dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">Olá, {revendedora?.nome}</h1>
              <p className="text-sm text-muted-foreground">Comissão: {revendedora?.comissao_percentual}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  {unreadCount > 0 ? (
                    <BellRing className="w-5 h-5 text-primary animate-pulse" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notificações
                  </h3>
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.slice(0, 10).map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-3 hover:bg-muted/50 transition-colors ${!notif.lida ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{notif.titulo.split(' ')[0]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {notif.titulo.replace(/^[^\s]+\s/, '')}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notif.mensagem}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(notif.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            {!notif.lida && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Peças</p>
                  <p className="text-2xl font-bold">{totalPecas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendidas</p>
                  <p className="text-2xl font-bold">{pecasVendidas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Vendido</p>
                  <p className="text-xl font-bold">{formatCurrency(valorVendido)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sua Comissão</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(comissao)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Interests Alert */}
        {interessesPendentes > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Você tem {interessesPendentes} pedido(s) aguardando aprovação</p>
                  <p className="text-sm text-muted-foreground">Vá para a aba "Pedidos" para revisar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="maletas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="maletas" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Minhas Maletas
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Pedidos
              {interessesPendentes > 0 && (
                <Badge variant="destructive" className="ml-1">{interessesPendentes}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Maletas Tab */}
          <TabsContent value="maletas" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : maletas.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Você ainda não tem maletas</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Maleta Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {maletas.map((maleta) => (
                    <Button
                      key={maleta.id}
                      variant={maletaSelecionada?.id === maleta.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMaletaSelecionada(maleta)}
                      className="shrink-0"
                    >
                      {maleta.nome}
                      <Badge variant="secondary" className="ml-2">
                        {maleta.status === 'ativa' ? 'Ativa' : maleta.status}
                      </Badge>
                    </Button>
                  ))}
                </div>

                {/* Pieces Table */}
                {maletaSelecionada && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{maletaSelecionada.nome}</span>
                        <Badge>{pecasPendentes} pendente(s)</Badge>
                      </CardTitle>
                      {maletaSelecionada.data_devolucao && (
                        <CardDescription>
                          Devolução: {format(new Date(maletaSelecionada.data_devolucao), "dd/MM/yyyy", { locale: ptBR })}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Peça</TableHead>
                              <TableHead className="text-center">Qtd</TableHead>
                              <TableHead className="text-right">Preço</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pecasMaleta.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {item.peca.imagem_url ? (
                                      <img
                                        src={item.peca.imagem_url}
                                        alt={item.peca.nome}
                                        className="w-10 h-10 rounded object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                        <Package className="w-5 h-5 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium">{item.peca.nome}</p>
                                      {item.peca.codigo && (
                                        <p className="text-xs text-muted-foreground">{item.peca.codigo}</p>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">{item.quantidade}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.preco_unitario || item.peca.preco_venda || 0)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {item.vendida ? (
                                    <Badge className="bg-green-500">Vendida</Badge>
                                  ) : (
                                    <Badge variant="secondary">Pendente</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {!item.vendida && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setVendaModal(item);
                                        setQuantidadeVenda(item.quantidade);
                                      }}
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Vendi
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Pedidos Tab */}
          <TabsContent value="pedidos" className="space-y-4">
            {interesses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum pedido recebido ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {interesses.map((interesse) => (
                  <Card key={interesse.id} className={interesse.status === 'pendente' ? 'border-amber-500/50' : ''}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{interesse.cliente_nome}</p>
                            <Badge
                              variant={
                                interesse.status === 'aprovado' ? 'default' :
                                interesse.status === 'rejeitado' ? 'destructive' : 'secondary'
                              }
                            >
                              {interesse.status === 'aprovado' ? 'Aprovado' :
                               interesse.status === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Maleta: {interesse.maleta?.nome} • {interesse.itens.length} item(s)
                          </p>
                          {interesse.created_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(interesse.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInteresseModal(interesse)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          {interesse.status === 'pendente' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAprovarInteresse(interesse)}
                                disabled={processando}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejeitarInteresse(interesse.id)}
                                disabled={processando}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Interesse Detail Modal */}
      <Dialog open={!!interesseModal} onOpenChange={() => setInteresseModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              Pedido de {interesseModal?.cliente_nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{interesseModal?.cliente_nome}</p>
              {interesseModal?.cliente_telefone && (
                <p className="text-sm">{interesseModal.cliente_telefone}</p>
              )}
              {interesseModal?.cliente_email && (
                <p className="text-sm">{interesseModal.cliente_email}</p>
              )}
            </div>

            {interesseModal?.observacoes && (
              <div>
                <p className="text-sm text-muted-foreground">Observações</p>
                <p className="text-sm">{interesseModal.observacoes}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-2">Itens Solicitados</p>
              <div className="space-y-2">
                {interesseModal?.itens.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.peca.nome}</p>
                      {item.peca.codigo && (
                        <p className="text-xs text-muted-foreground">{item.peca.codigo}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">x{item.quantidade}</p>
                      <p className="font-medium">{formatCurrency((item.peca.preco_venda || 0) * item.quantidade)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold text-primary">
                  {formatCurrency(
                    interesseModal?.itens.reduce((acc, item) => 
                      acc + (item.peca.preco_venda || 0) * item.quantidade, 0
                    ) || 0
                  )}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            {interesseModal?.status === 'pendente' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => interesseModal && handleRejeitarInteresse(interesseModal.id)}
                  disabled={processando}
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => interesseModal && handleAprovarInteresse(interesseModal)}
                  disabled={processando}
                >
                  {processando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar Venda
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Sold Modal */}
      <Dialog open={!!vendaModal} onOpenChange={() => setVendaModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Vendida</DialogTitle>
            <DialogDescription>
              {vendaModal?.peca.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Quantidade vendida</Label>
              <Input
                type="number"
                min={1}
                max={vendaModal?.quantidade || 1}
                value={quantidadeVenda}
                onChange={(e) => setQuantidadeVenda(Math.min(parseInt(e.target.value) || 1, vendaModal?.quantidade || 1))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Disponível: {vendaModal?.quantidade} unidade(s)
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Valor unitário:</span>
                <span>{formatCurrency(vendaModal?.preco_unitario || vendaModal?.peca.preco_venda || 0)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-primary">
                  {formatCurrency((vendaModal?.preco_unitario || vendaModal?.peca.preco_venda || 0) * quantidadeVenda)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Sua comissão ({revendedora?.comissao_percentual}%):</span>
                <span>
                  {formatCurrency(
                    (vendaModal?.preco_unitario || vendaModal?.peca.preco_venda || 0) * 
                    quantidadeVenda * 
                    ((revendedora?.comissao_percentual || 30) / 100)
                  )}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVendaModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleMarcarVendida} disabled={processando}>
              {processando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
