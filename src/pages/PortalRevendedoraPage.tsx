import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-db';
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
import { Loader2, Package, ShoppingBag, TrendingUp, Check, X, LogOut, Eye, EyeOff, Briefcase, DollarSign, Clock, CheckCircle2, Bell, BellRing, Download, WifiOff, Smartphone, Share2, Copy, ExternalLink, History, Receipt, Search, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePortalNotifications } from '@/hooks/usePortalNotifications';
import { usePortalPWA } from '@/hooks/usePortalPWA';

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
  is_public?: boolean;
  slug?: string;
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
  const [loginEmail, setLoginEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  
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
  const [desfazerModal, setDesfazerModal] = useState<MaletaPeca | null>(null);
  const [quantidadeDesfazer, setQuantidadeDesfazer] = useState(1);
  const [buscaPeca, setBuscaPeca] = useState('');
  const [processando, setProcessando] = useState(false);

  // Portal notifications hook
  const { notifications, unreadCount, refetch: refetchNotifications } = usePortalNotifications({
    revendedoraId: revendedora?.id || null,
    enabled: isAuthenticated,
  });

  // PWA
  const { canInstall, isInstalled, isOnline, installApp } = usePortalPWA();

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
    if (maletaSelecionada && revendedora) {
      fetchPecasMaleta(maletaSelecionada.id);
    }
  }, [maletaSelecionada, revendedora, fetchPecasMaleta]);

  const handleLogin = async () => {
    if (!loginEmail.trim() || !senha.trim()) {
      toast.error('Preencha e-mail e senha');
      return;
    }

    setLoginLoading(true);
    try {
      // Step 1: Use secure RPC function to find user by email (bypasses RLS safely)
      const { data: lookupData, error: lookupError } = await supabase
        .rpc('portal_login_lookup', { p_email: loginEmail.trim().toLowerCase() });

      const publicData = Array.isArray(lookupData) ? lookupData[0] : lookupData;

      if (lookupError || !publicData) {
        toast.error('E-mail não encontrado');
        setLoginLoading(false);
        return;
      }

      // Step 2: Verify password via edge function (never expose password hash to client)
      const { data: authResult, error: authError } = await supabase.functions.invoke('verificar-senha-portal', {
        body: { 
          revendedora_id: publicData.id,
          senha: senha
        }
      });

      if (authError || !authResult?.success) {
        toast.error(authResult?.message || 'Senha incorreta');
        setLoginLoading(false);
        return;
      }

      // Step 3: Use data from login lookup (already has all needed fields)
      const revendedoraData = {
        id: publicData.id,
        nome: publicData.nome,
        comissao_percentual: publicData.comissao_percentual || 30,
        telefone: publicData.telefone || undefined,
        email: publicData.email || undefined,
      };

      setRevendedora(revendedoraData);
      
      sessionStorage.setItem(`portal_session`, JSON.stringify({
        revendedora: revendedoraData
      }));
      
      setIsAuthenticated(true);
      navigate(`/portal/${revendedoraData.id}`, { replace: true });
      toast.success(`Bem-vinda, ${revendedoraData.nome}!`);
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
    setLoginEmail('');
    setSenha('');
    navigate('/portal/login', { replace: true });
  };

  const fetchMaletas = async () => {
    if (!revendedora) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('portal_fetch_maletas', { p_revendedora_id: revendedora.id });

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

  const fetchPecasMaleta = useCallback(async (maletaId: string) => {
    if (!revendedora) return;
    try {
      console.log('[Portal] Fetching pecas for maleta:', maletaId, 'revendedora:', revendedora.id);
      const { data, error } = await supabase
        .rpc('portal_fetch_maleta_pecas', { p_maleta_id: maletaId, p_revendedora_id: revendedora.id });

      if (error) {
        console.error('[Portal] Error from RPC:', error);
        throw error;
      }
      
      console.log('[Portal] Pecas received:', data?.length || 0);
      
      const formattedData = (data || []).map((item: any) => ({
        id: item.id,
        quantidade: item.quantidade,
        quantidade_vendida: item.quantidade_vendida,
        vendida: item.vendida,
        preco_unitario: item.preco_unitario,
        data_venda: item.data_venda,
        peca: {
          id: item.peca_id,
          nome: item.peca_nome,
          codigo: item.peca_codigo,
          preco_venda: item.peca_preco_venda,
          imagem_url: item.peca_imagem_url,
        }
      })) as MaletaPeca[];
      
      setPecasMaleta(formattedData);
    } catch (error) {
      console.error('Error fetching pecas:', error);
    }
  }, [revendedora]);

  const fetchInteresses = async () => {
    if (!revendedora) return;
    
    try {
      const { data, error } = await supabase
        .rpc('portal_fetch_interesses', { p_revendedora_id: revendedora.id });

      if (error) throw error;

      // Group interesses and fetch items via RPC
      const interessesWithItems = await Promise.all(
        (data || []).map(async (interesse: any) => {
          // Fetch items for each interesse using RPC
          const { data: itens } = await supabase
            .rpc('portal_fetch_interesse_itens', { p_interesse_id: interesse.id, p_revendedora_id: revendedora.id });

          // Find maleta name from our loaded maletas
          const maletaInfo = maletas.find(m => m.id === interesse.maleta_id);

          return {
            ...interesse,
            maleta: { id: interesse.maleta_id, nome: maletaInfo?.nome || 'Maleta' },
            itens: (itens || []).map((item: any) => ({
              id: item.id,
              quantidade: item.quantidade,
              peca: {
                id: item.peca_id,
                nome: item.peca_nome,
                codigo: item.peca_codigo,
                preco_venda: item.peca_preco_venda,
              }
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
    if (!revendedora) return;
    setProcessando(true);
    try {
      // Mark all items as sold via RPC
      for (const item of interesse.itens) {
        // We need to find the maleta_peca by maleta_id + peca_id via a dedicated lookup
        // For now, use portal_marcar_vendida_by_peca RPC or fetch via existing RPC
        const pecas = await supabase.rpc('portal_fetch_maleta_pecas', { 
          p_maleta_id: interesse.maleta.id, 
          p_revendedora_id: revendedora.id 
        });
        
        const matchingPeca = (pecas.data || []).find((p: any) => p.peca_id === item.peca.id);
        if (matchingPeca) {
          await supabase.rpc('portal_marcar_vendida', {
            p_revendedora_id: revendedora.id,
            p_maleta_peca_id: matchingPeca.id,
            p_quantidade_venda: item.quantidade || 1
          });
        }
      }

      // Update interesse status
      await supabase.rpc('portal_update_interesse_status', {
        p_revendedora_id: revendedora.id,
        p_interesse_id: interesse.id,
        p_status: 'atendido'
      });

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
    if (!revendedora) return;
    setProcessando(true);
    try {
      await supabase.rpc('portal_update_interesse_status', {
        p_revendedora_id: revendedora.id,
        p_interesse_id: interesseId,
        p_status: 'cancelado'
      });

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
    if (!vendaModal || !maletaSelecionada || !revendedora) return;

    setProcessando(true);
    try {
      const { data: result, error } = await supabase.rpc('portal_marcar_vendida', {
        p_revendedora_id: revendedora.id,
        p_maleta_peca_id: vendaModal.id,
        p_quantidade_venda: quantidadeVenda
      });

      if (error) throw error;
      if (!result) throw new Error('Não autorizado');

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

  const handleDesfazerVenda = async () => {
    if (!desfazerModal || !maletaSelecionada || !revendedora) return;

    setProcessando(true);
    try {
      const { data: result, error } = await supabase.rpc('portal_desfazer_venda' as any, {
        p_revendedora_id: revendedora.id,
        p_maleta_peca_id: desfazerModal.id,
        p_quantidade_desfazer: quantidadeDesfazer
      });

      if (error) throw error;

      toast.success(quantidadeDesfazer > 1 
        ? `${quantidadeDesfazer} peças devolvidas ao estoque da maleta!` 
        : 'Venda desfeita com sucesso!'
      );
      setDesfazerModal(null);
      setQuantidadeDesfazer(1);
      fetchPecasMaleta(maletaSelecionada.id);
    } catch (error: any) {
      console.error('Error undoing sale:', error);
      toast.error(error.message || 'Erro ao desfazer venda');
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground text-center py-2 text-sm font-medium flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" /> Você está offline
          </div>
        )}

        <div className="w-full max-w-md space-y-6">
          {/* Logo / Branding */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
              <Briefcase className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Portal da Revendedora</h1>
            <p className="text-muted-foreground text-sm">
              Acesse suas maletas, vendas e comissões
            </p>
          </div>

          <Card className="border-0 shadow-xl shadow-black/5">
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="loginEmail" className="text-sm font-medium">E-mail</Label>
                <Input
                  id="loginEmail"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && document.getElementById('loginSenha')?.focus()}
                  className="h-11"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loginSenha" className="text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    id="loginSenha"
                    type={showSenha ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="h-11 pr-10"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowSenha(!showSenha)}
                  >
                    {showSenha ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                className="w-full h-11 font-semibold text-base" 
                onClick={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Entrar no Portal
              </Button>
            </CardContent>
          </Card>

          {/* PWA Install Banner */}
          {canInstall && !isInstalled && (
            <Card className="border border-primary/20 bg-primary/5">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Instalar App</p>
                  <p className="text-xs text-muted-foreground">Acesse direto da tela inicial</p>
                </div>
                <Button size="sm" onClick={installApp} className="shrink-0">
                  <Download className="w-4 h-4 mr-1" /> Instalar
                </Button>
              </CardContent>
            </Card>
          )}

          {isInstalled && (
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" /> App instalado
            </p>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Solicite suas credenciais ao administrador da loja
          </p>
        </div>
      </div>
    );
  }

  // Portal Dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-destructive text-destructive-foreground text-center py-2 text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" /> Você está offline — dados podem estar desatualizados
        </div>
      )}

      {/* Install Banner (top, dismissible) */}
      {canInstall && !isInstalled && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="w-4 h-4 text-primary" />
            <span>Instale o app para acesso rápido</span>
          </div>
          <Button size="sm" variant="default" onClick={installApp} className="h-7 text-xs">
            <Download className="w-3 h-3 mr-1" /> Instalar
          </Button>
        </div>
      )}

      {/* Header */}
      <header className={`sticky ${!isOnline ? 'top-8' : 'top-0'} z-50 border-b bg-card/95 backdrop-blur`}>
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
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="maletas" className="flex items-center gap-1 text-xs sm:text-sm">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Maletas</span>
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="flex items-center gap-1 text-xs sm:text-sm">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Pedidos</span>
              {interessesPendentes > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{interessesPendentes}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-1 text-xs sm:text-sm">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="extrato" className="flex items-center gap-1 text-xs sm:text-sm">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Extrato</span>
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
                        <div className="flex items-center gap-2">
                          {maletaSelecionada.is_public && maletaSelecionada.slug && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const url = `${window.location.origin}/maleta/${maletaSelecionada.slug}`;
                                if (navigator.share) {
                                  navigator.share({ title: `Maleta ${maletaSelecionada.nome}`, url }).catch(() => {
                                    navigator.clipboard.writeText(url);
                                    toast.success('Link copiado!');
                                  });
                                } else {
                                  navigator.clipboard.writeText(url);
                                  toast.success('Link copiado!');
                                }
                              }}
                            >
                              <Share2 className="w-4 h-4 mr-1" />
                              Compartilhar
                            </Button>
                          )}
                          {maletaSelecionada.is_public && maletaSelecionada.slug && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600/50 hover:bg-green-600/10"
                              onClick={() => {
                                const url = `${window.location.origin}/maleta/${maletaSelecionada.slug}`;
                                const text = `Confira as peças da minha maleta "${maletaSelecionada.nome}"! 💎\n${url}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                              }}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                          <Badge>{pecasPendentes} pendente(s)</Badge>
                        </div>
                      </CardTitle>
                      {maletaSelecionada.data_devolucao && (
                        <CardDescription>
                          Devolução: {format(new Date(maletaSelecionada.data_devolucao), "dd/MM/yyyy", { locale: ptBR })}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {/* Search */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar peça por nome ou código..."
                          value={buscaPeca}
                          onChange={(e) => setBuscaPeca(e.target.value)}
                          className="pl-9"
                        />
                      </div>
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
                            {pecasMaleta
                              .filter(item => {
                                if (!buscaPeca) return true;
                                const search = buscaPeca.toLowerCase();
                                return item.peca.nome.toLowerCase().includes(search) || 
                                       (item.peca.codigo || '').toLowerCase().includes(search);
                              })
                              .map((item) => (
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
                                  {item.quantidade > 0 && (item.quantidade_vendida || 0) > 0 ? (
                                    <Badge className="bg-amber-500">Parcial</Badge>
                                  ) : item.quantidade === 0 && (item.quantidade_vendida || 0) > 0 ? (
                                    <Badge className="bg-green-500">Vendida</Badge>
                                  ) : (
                                    <Badge variant="secondary">Pendente</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                  {item.quantidade > 0 && (
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
                                  {(item.quantidade_vendida || 0) > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-amber-500 border-amber-500/50 hover:bg-amber-500/10"
                                      onClick={() => {
                                        setDesfazerModal(item);
                                        setQuantidadeDesfazer(1);
                                      }}
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Desfazer
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

          {/* Histórico de Vendas Tab */}
          <TabsContent value="historico" className="space-y-4">
            {(() => {
              const vendasRealizadas = pecasMaleta.filter(item => (item.quantidade_vendida || 0) > 0);
              const allVendas = maletas.length > 0 ? vendasRealizadas : [];
              
              if (allVendas.length === 0) {
                return (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma venda registrada ainda</p>
                      <p className="text-sm text-muted-foreground mt-1">Selecione uma maleta na aba "Maletas" para ver as vendas</p>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Histórico de Vendas
                      {maletaSelecionada && <Badge variant="outline">{maletaSelecionada.nome}</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {allVendas.length} item(s) vendido(s) • Total: {formatCurrency(valorVendido)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Peça</TableHead>
                            <TableHead className="text-center">Qtd Vendida</TableHead>
                            <TableHead className="text-right">Preço Unit.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead className="text-center">Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allVendas.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {item.peca.imagem_url ? (
                                    <img src={item.peca.imagem_url} alt={item.peca.nome} className="w-10 h-10 rounded object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                      <Package className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium">{item.peca.nome}</p>
                                    {item.peca.codigo && <p className="text-xs text-muted-foreground">{item.peca.codigo}</p>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-medium">{item.quantidade_vendida}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.preco_unitario || item.peca.preco_venda || 0)}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency((item.preco_unitario || item.peca.preco_venda || 0) * (item.quantidade_vendida || 0))}
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {item.data_venda ? format(new Date(item.data_venda), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>

          {/* Extrato de Comissões Tab */}
          <TabsContent value="extrato" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Extrato de Comissões
                </CardTitle>
                <CardDescription>
                  Resumo financeiro baseado nas vendas realizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Total Vendido</p>
                    <p className="text-2xl font-bold">{formatCurrency(valorVendido)}</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Sua Comissão ({revendedora?.comissao_percentual || 30}%)</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(comissao)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Peças Vendidas</p>
                    <p className="text-2xl font-bold">{pecasVendidas}</p>
                  </div>
                </div>

                {/* Per-maleta breakdown */}
                {maletas.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Detalhamento por Maleta</h4>
                    <div className="space-y-2">
                      {maletas.map((maleta) => {
                        const isSelecionada = maletaSelecionada?.id === maleta.id;
                        return (
                          <div key={maleta.id} className={`flex items-center justify-between p-3 rounded-lg border ${isSelecionada ? 'border-primary bg-primary/5' : ''}`}>
                            <div className="flex items-center gap-3">
                              <Briefcase className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{maleta.nome}</p>
                                <p className="text-xs text-muted-foreground capitalize">{maleta.status || 'aberta'}</p>
                              </div>
                            </div>
                            {isSelecionada && (
                              <div className="text-right">
                                <p className="font-medium text-sm">{formatCurrency(valorVendido)}</p>
                                <p className="text-xs text-primary">Comissão: {formatCurrency(comissao)}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      * Selecione uma maleta na aba "Maletas" para ver os valores detalhados
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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

      {/* Desfazer Venda Modal */}
      <Dialog open={!!desfazerModal} onOpenChange={(open) => !open && setDesfazerModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desfazer Venda</DialogTitle>
            <DialogDescription>
              Escolha quantos itens deseja desfazer a venda de "{desfazerModal?.peca.nome}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quantidade vendida:</span>
              <span className="font-medium">{desfazerModal?.quantidade_vendida || 0}</span>
            </div>

            <div className="space-y-2">
              <Label>Quantidade a desfazer</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantidadeDesfazer(Math.max(1, quantidadeDesfazer - 1))}
                  disabled={quantidadeDesfazer <= 1}
                >
                  -
                </Button>
                <span className="text-xl font-bold w-12 text-center">{quantidadeDesfazer}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantidadeDesfazer(Math.min(desfazerModal?.quantidade_vendida || 1, quantidadeDesfazer + 1))}
                  disabled={quantidadeDesfazer >= (desfazerModal?.quantidade_vendida || 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDesfazerModal(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDesfazerVenda} disabled={processando}>
              {processando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Desfazer Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
