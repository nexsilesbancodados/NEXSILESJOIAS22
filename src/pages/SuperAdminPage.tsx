import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Shield, Users, DollarSign, Crown, Search, Ban, CheckCircle, Edit,
  TrendingUp, Calendar, AlertTriangle, RefreshCw, Loader2, Eye, Trash2,
  ChevronDown, ChevronRight, UserCheck, Activity, BarChart3, Clock,
  ArrowUpRight, ArrowDownRight, Zap, CreditCard, Sparkles, Store,
  ShoppingBag, Package, Globe
} from 'lucide-react';

interface Funcionario {
  user_id: string;
  nome: string;
  email: string;
  cargo: string;
}

interface AssinaturaRow {
  id: string | null;
  user_id: string;
  plano: string | null;
  status: string;
  data_inicio: string | null;
  data_vencimento: string | null;
  valor_mensal: number;
  trial_ativo: boolean;
  metodo_pagamento: string | null;
  created_at: string;
  has_subscription: boolean;
  auth_created_at: string;
  profiles?: { nome: string | null; email: string | null } | null;
  funcionarios?: Funcionario[];
}

// Stat card with gradient accent
function StatCard({ icon: Icon, label, value, subtitle, color }: {
  icon: any; label: string; value: string | number; subtitle?: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'from-primary/20 to-primary/5 border-primary/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
    red: 'from-red-500/20 to-red-500/5 border-red-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20',
  };
  const iconColorMap: Record<string, string> = {
    primary: 'text-primary',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    violet: 'text-violet-400',
  };

  return (
    <Card className={`bg-gradient-to-br ${colorMap[color]} border overflow-hidden relative group hover:scale-[1.02] transition-transform duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center ${iconColorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [editDialog, setEditDialog] = useState<AssinaturaRow | null>(null);
  const [editForm, setEditForm] = useState({ plano: '', status: '', data_vencimento: '', valor_mensal: '' });
  const [detailDialog, setDetailDialog] = useState<AssinaturaRow | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<AssinaturaRow | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('platform');

  const isSuperAdmin = profile?.is_super_admin === true;

  // Platform-wide stats (stores & sales)
  const { data: platformStats, isLoading: platformLoading } = useQuery({
    queryKey: ['super-admin-platform-stats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/admin-assinaturas?stats=platform`,
        { headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' } }
      );
      if (!res.ok) throw new Error('Erro ao buscar stats');
      return await res.json();
    },
    enabled: !!profile?.is_super_admin,
  });

  const { data: assinaturas = [], isLoading, refetch } = useQuery({
    queryKey: ['super-admin-assinaturas'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/admin-assinaturas`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error('Erro ao buscar assinaturas');
      return await res.json() as AssinaturaRow[];
    },
    enabled: !!isSuperAdmin,
  });

  const edgeFnUrl = `https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/admin-assinaturas`;

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    };
  };

  const updateAssinatura = useMutation({
    mutationFn: async ({ id, user_id, updates }: { id: string | null; user_id: string; updates: Record<string, any> }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(edgeFnUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, user_id, updates }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-assinaturas'] });
      toast.success('Assinatura atualizada com sucesso!');
      setEditDialog(null);
    },
    onError: (err: any) => toast.error('Erro ao atualizar: ' + err.message),
  });

  const deleteAssinatura = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(edgeFnUrl, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao excluir');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-assinaturas'] });
      toast.success('Assinatura excluída com sucesso!');
      setDeleteDialog(null);
    },
    onError: (err: any) => toast.error('Erro ao excluir: ' + err.message),
  });

  const stats = useMemo(() => {
    const ativos = assinaturas.filter((a: any) => a.status === 'ativo');
    const expirados = assinaturas.filter((a: any) => a.status === 'expirado');
    const bloqueados = assinaturas.filter((a: any) => a.status === 'cancelado');
    const receitaMensal = ativos.reduce((sum: number, a: any) => sum + (a.valor_mensal || 0), 0);
    const trials = assinaturas.filter((a: any) => a.trial_ativo);
    const semPlano = assinaturas.filter((a: any) => !a.has_subscription);
    const totalFuncionarios = assinaturas.reduce((sum: number, a: any) => sum + (a.funcionarios?.length || 0), 0);

    // Users expiring within 7 days
    const expirandoEm7Dias = assinaturas.filter((a: any) => {
      if (!a.data_vencimento) return false;
      const days = differenceInDays(new Date(a.data_vencimento), new Date());
      return days >= 0 && days <= 7 && a.status === 'ativo';
    });

    // Conversion rate
    const taxaConversao = assinaturas.length > 0
      ? ((ativos.length / assinaturas.length) * 100).toFixed(1)
      : '0';

    return {
      totalUsers: assinaturas.length,
      totalFuncionarios,
      ativos: ativos.length,
      expirados: expirados.length,
      bloqueados: bloqueados.length,
      trials: trials.length,
      receitaMensal,
      usersWithoutSub: semPlano.length,
      expirandoEm7Dias: expirandoEm7Dias.length,
      taxaConversao,
    };
  }, [assinaturas]);

  const filtered = useMemo(() => {
    return assinaturas.filter((a: any) => {
      const matchSearch = !search ||
        a.profiles?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        a.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
        a.user_id.includes(search) ||
        a.funcionarios?.some((f: Funcionario) =>
          f.nome.toLowerCase().includes(search.toLowerCase()) ||
          f.email.toLowerCase().includes(search.toLowerCase())
        );
      const matchStatus = statusFilter === 'todos' || a.status === statusFilter || (statusFilter === 'sem_plano' && !a.has_subscription);
      return matchSearch && matchStatus;
    });
  }, [assinaturas, search, statusFilter]);

  // Group by plan for the overview
  const planDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    assinaturas.forEach((a: any) => {
      const plano = a.plano || 'sem_plano';
      map[plano] = (map[plano] || 0) + 1;
    });
    return Object.entries(map).map(([plano, count]) => ({ plano, count }));
  }, [assinaturas]);

  const openEdit = (a: AssinaturaRow) => {
    setEditForm({
      plano: a.plano || 'nexsiles',
      status: a.status === 'sem_plano' ? 'ativo' : a.status,
      data_vencimento: a.data_vencimento?.split('T')[0] || '',
      valor_mensal: String(a.valor_mensal || 0),
    });
    setEditDialog(a);
  };

  const handleSaveEdit = () => {
    if (!editDialog) return;
    updateAssinatura.mutate({
      id: editDialog.id,
      user_id: editDialog.user_id,
      updates: {
        plano: editForm.plano,
        status: editForm.status,
        data_vencimento: editForm.data_vencimento,
        valor_mensal: parseFloat(editForm.valor_mensal) || 0,
      },
    });
  };

  const handleBlock = (a: AssinaturaRow) => {
    if (!a.id) {
      toast.error('Usuário sem assinatura. Edite primeiro para criar uma.');
      return;
    }
    const newStatus = a.status === 'cancelado' ? 'ativo' : 'cancelado';
    updateAssinatura.mutate({
      id: a.id,
      user_id: a.user_id,
      updates: { status: newStatus },
    });
  };

  const toggleExpand = (userId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo': return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/25 hover:bg-emerald-500/20">Ativo</Badge>;
      case 'expirado': return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/25 hover:bg-amber-500/20">Expirado</Badge>;
      case 'cancelado': return <Badge className="bg-red-500/15 text-red-500 border-red-500/25 hover:bg-red-500/20">Bloqueado</Badge>;
      case 'pendente': return <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/25 hover:bg-blue-500/20">Pendente</Badge>;
      case 'sem_plano': return <Badge variant="outline" className="text-muted-foreground border-dashed">Sem Plano</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDaysRemaining = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return <span className="text-red-400 text-[11px] font-medium flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" /> Expirado há {Math.abs(days)}d</span>;
    if (days <= 7) return <span className="text-amber-400 text-[11px] font-medium flex items-center gap-0.5"><Clock className="w-3 h-3" /> {days}d restantes</span>;
    return <span className="text-muted-foreground text-[11px]">{days}d restantes</span>;
  };

  const getPlanLabel = (plano: string | null) => {
    if (!plano || plano === 'sem_plano') return '—';
    if (plano === 'nexsiles_max') return 'Max';
    return 'Nexsiles';
  };

  const getUserInitials = (nome: string | null | undefined) => {
    if (!nome) return '?';
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="border-b border-border bg-gradient-to-r from-card via-card to-muted/30">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Painel Administrativo</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  Gestão centralizada de assinaturas e usuários
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-0 p-0 h-auto gap-0">
              <TabsTrigger
                value="platform"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-sm"
              >
                <Globe className="w-4 h-4 mr-2" />
                Plataforma
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Assinaturas
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Usuários
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Platform Tab ── */}
        {activeTab === 'platform' && (
          <div className="space-y-6 animate-fade-in">
            {platformLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : platformStats ? (
              <>
                {/* Main Platform KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <StatCard icon={Globe} label="Organizações" value={platformStats.totalOrgs} subtitle="Cadastradas" color="primary" />
                  <StatCard icon={Store} label="Lojas Ativas" value={platformStats.totalLojasAtivas} subtitle={`de ${platformStats.totalLojas} criadas`} color="emerald" />
                  <StatCard icon={ShoppingBag} label="Vendas (Total)" value={platformStats.totalVendas} subtitle={`${platformStats.vendasMesCount} este mês`} color="blue" />
                  <StatCard icon={DollarSign} label="Volume Total" value={`R$ ${Number(platformStats.volumeTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} subtitle="Todas as lojas" color="amber" />
                  <StatCard icon={Package} label="Peças Cadastradas" value={platformStats.totalPecas} subtitle="Na plataforma" color="violet" />
                </div>

                {/* Month & E-commerce */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Vendas Este Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-foreground">R$ {Number(platformStats.volumeMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground mt-1">{platformStats.vendasMesCount} vendas realizadas</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> E-commerce (Pedidos Online)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-foreground">R$ {Number(platformStats.volumeEcom).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground mt-1">{platformStats.totalPedidosEcom} pedidos online</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Ticket Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-foreground">
                        R$ {platformStats.totalVendas > 0 ? (platformStats.volumeTotal / platformStats.totalVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Por venda (PDV + online)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Organizations by Sales */}
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Crown className="w-4 h-4 text-primary" />
                      Ranking de Organizações por Vendas
                    </CardTitle>
                    <CardDescription className="text-xs">Volume total de vendas por loja (sem acesso ao saldo individual)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {platformStats.topOrgs.length > 0 ? (
                      <div className="space-y-3">
                        {platformStats.topOrgs.map((org: any, idx: number) => {
                          const maxTotal = platformStats.topOrgs[0]?.total || 1;
                          const pct = (org.total / maxTotal) * 100;
                          return (
                            <div key={org.id} className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
                                  <span className="font-medium text-foreground truncate max-w-[200px]">{org.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{org.count} vendas</span>
                                  <span className="font-semibold text-foreground">R$ {org.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">Nenhuma venda registrada ainda</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Modo somente leitura</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Esta visão mostra apenas métricas agregadas. Você não tem acesso ao saldo financeiro individual de nenhuma loja — apenas ao volume total de vendas da plataforma.</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Não foi possível carregar os dados da plataforma.</p>
            )}
          </div>
        )}

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard icon={Users} label="Total Usuários" value={stats.totalUsers} subtitle={`${stats.totalFuncionarios} funcionários`} color="primary" />
              <StatCard icon={CheckCircle} label="Ativos" value={stats.ativos} subtitle={`${stats.taxaConversao}% conversão`} color="emerald" />
              <StatCard icon={DollarSign} label="Receita Mensal" value={`R$ ${stats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} subtitle="Recorrente" color="blue" />
              <StatCard icon={AlertTriangle} label="Atenção" value={stats.expirandoEm7Dias} subtitle="Expiram em 7 dias" color="amber" />
              <StatCard icon={TrendingUp} label="Sem Plano" value={stats.usersWithoutSub} subtitle="Potenciais conversões" color="violet" />
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{stats.trials}</p>
                    <p className="text-xs text-muted-foreground">Em Trial</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{stats.expirados}</p>
                    <p className="text-xs text-muted-foreground">Expirados</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Ban className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{stats.bloqueados}</p>
                    <p className="text-xs text-muted-foreground">Bloqueados</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      R$ {(stats.receitaMensal * 12).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Projeção Anual</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Plan Distribution */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  Distribuição por Plano
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {planDistribution.map(({ plano, count }) => {
                    const pct = assinaturas.length > 0 ? (count / assinaturas.length) * 100 : 0;
                    const label = plano === 'nexsiles_max' ? 'Nexsiles Max' : plano === 'nexsiles' ? 'Nexsiles' : 'Sem Plano';
                    return (
                      <div key={plano} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground capitalize">{label}</span>
                          <span className="text-muted-foreground">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1.5 text-xs"
                    onClick={() => { setActiveTab('users'); setStatusFilter('expirado'); }}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Ver Expirados
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1.5 text-xs"
                    onClick={() => { setActiveTab('users'); setStatusFilter('sem_plano'); }}
                  >
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Sem Plano
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1.5 text-xs"
                    onClick={() => { setActiveTab('users'); setStatusFilter('cancelado'); }}
                  >
                    <Ban className="w-4 h-4 text-red-400" />
                    Bloqueados
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1.5 text-xs"
                    onClick={() => { setActiveTab('users'); setStatusFilter('todos'); }}
                  >
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Todos Usuários
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Users Tab ── */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-card"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-card">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos ({assinaturas.length})</SelectItem>
                  <SelectItem value="ativo">Ativos ({stats.ativos})</SelectItem>
                  <SelectItem value="expirado">Expirados ({stats.expirados})</SelectItem>
                  <SelectItem value="cancelado">Bloqueados ({stats.bloqueados})</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="sem_plano">Sem Plano ({stats.usersWithoutSub})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Users className="w-10 h-10 mb-3 opacity-40" />
                  <p className="font-medium">Nenhum usuário encontrado</p>
                  <p className="text-xs mt-1">Tente alterar os filtros de busca</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground px-1">{filtered.length} resultado(s)</p>
                {filtered.map((a: AssinaturaRow) => {
                  const hasEmployees = (a.funcionarios?.length || 0) > 0;
                  const isExpanded = expandedRows.has(a.user_id);

                  return (
                    <Card key={a.user_id} className="border-border/50 overflow-hidden hover:border-border transition-colors">
                      <CardContent className="p-0">
                        <div className="flex items-center gap-4 p-4">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">{getUserInitials(a.profiles?.nome)}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-foreground truncate">{a.profiles?.nome || 'Sem nome'}</p>
                              {getStatusBadge(a.status)}
                              {a.trial_ativo && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400">Trial</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{a.profiles?.email || a.user_id.substring(0, 12) + '...'}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {a.plano && (
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Crown className="w-3 h-3" /> {getPlanLabel(a.plano)}
                                </span>
                              )}
                              {a.valor_mensal > 0 && (
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" /> R$ {a.valor_mensal.toFixed(2)}
                                </span>
                              )}
                              {a.data_vencimento && getDaysRemaining(a.data_vencimento)}
                              {hasEmployees && (
                                <button
                                  onClick={() => toggleExpand(a.user_id)}
                                  className="text-[11px] text-primary flex items-center gap-0.5 hover:underline"
                                >
                                  <UserCheck className="w-3 h-3" /> {a.funcionarios!.length} func.
                                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailDialog(a)} title="Ver detalhes">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)} title="Editar">
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            {a.has_subscription && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteDialog(a)} title="Excluir assinatura">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleBlock(a)}
                              title={a.status === 'cancelado' ? 'Desbloquear' : 'Bloquear'}
                            >
                              {a.status === 'cancelado'
                                ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                                : <Ban className="w-4 h-4 text-red-400" />}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded employees */}
                        {hasEmployees && isExpanded && (
                          <div className="border-t border-border/50 bg-muted/20 px-4 py-3 space-y-2">
                            {a.funcionarios!.map((f) => (
                              <div key={f.user_id} className="flex items-center gap-3 pl-12">
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                                  <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">{f.nome}</p>
                                  <p className="text-xs text-muted-foreground">{f.email}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs">{f.cargo}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editDialog?.has_subscription ? 'Editar Assinatura' : 'Criar Assinatura'}</DialogTitle>
            <DialogDescription>
              {editDialog?.profiles?.nome} — {editDialog?.profiles?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={editForm.plano} onValueChange={(v) => setEditForm({ ...editForm, plano: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nexsiles">Nexsiles (R$ 189)</SelectItem>
                  <SelectItem value="nexsiles_max">Nexsiles Max (R$ 249)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="expirado">Expirado</SelectItem>
                  <SelectItem value="cancelado">Bloqueado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={editForm.data_vencimento}
                onChange={(e) => setEditForm({ ...editForm, data_vencimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.valor_mensal}
                onChange={(e) => setEditForm({ ...editForm, valor_mensal: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateAssinatura.isPending}>
              {updateAssinatura.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={(open) => !open && setDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Detalhes do Usuário
            </DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-4">
              {/* User header */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{getUserInitials(detailDialog.profiles?.nome)}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{detailDialog.profiles?.nome || '—'}</p>
                  <p className="text-xs text-muted-foreground">{detailDialog.profiles?.email || '—'}</p>
                </div>
                <div className="ml-auto">{getStatusBadge(detailDialog.status)}</div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">User ID</p>
                  <p className="font-mono text-xs text-foreground break-all">{detailDialog.user_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Plano</p>
                  <p className="font-medium text-foreground capitalize">{getPlanLabel(detailDialog.plano)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Valor Mensal</p>
                  <p className="font-medium text-foreground">R$ {detailDialog.valor_mensal?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Pagamento</p>
                  <p className="font-medium text-foreground capitalize">{detailDialog.metodo_pagamento || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Início</p>
                  <p className="text-foreground">{detailDialog.data_inicio ? format(new Date(detailDialog.data_inicio), 'dd/MM/yyyy HH:mm') : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Vencimento</p>
                  <p className="text-foreground">{detailDialog.data_vencimento ? format(new Date(detailDialog.data_vencimento), 'dd/MM/yyyy HH:mm') : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Trial</p>
                  <p className="text-foreground">{detailDialog.trial_ativo ? '✓ Ativo' : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Cadastro</p>
                  <p className="text-foreground">{detailDialog.created_at ? format(new Date(detailDialog.created_at), 'dd/MM/yyyy HH:mm') : '—'}</p>
                </div>
              </div>

              {/* Funcionarios section */}
              {detailDialog.funcionarios && detailDialog.funcionarios.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium text-foreground mb-2 flex items-center gap-2 text-sm">
                      <UserCheck className="w-4 h-4 text-primary" />
                      Funcionários ({detailDialog.funcionarios.length})
                    </p>
                    <div className="space-y-2">
                      {detailDialog.funcionarios.map((f) => (
                        <div key={f.user_id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{f.nome}</p>
                            <p className="text-xs text-muted-foreground truncate">{f.email}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">{f.cargo}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a assinatura de <strong>{deleteDialog?.profiles?.nome}</strong>?
              Esta ação não pode ser desfeita. O usuário ficará sem plano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDialog?.id && deleteAssinatura.mutate(deleteDialog.id)}
            >
              {deleteAssinatura.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
