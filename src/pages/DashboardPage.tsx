import { Link } from 'react-router-dom';
import { Suspense, lazy, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Gem, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Package,
  AlertTriangle,
  ArrowRight,
  FileText,
  Bell,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { usePecas, useVendas, useRevendedoras, useRomaneios, useCaixaAtual } from '@/hooks/useSupabaseData';
import { MetaProgress } from '@/components/dashboard/MetaProgress';
import { AniversariantesCard } from '@/components/dashboard/AniversariantesCard';
import { ModernStatCard } from '@/components/dashboard/ModernStatCard';
import { TopVendedorasCard } from '@/components/dashboard/TopVendedorasCard';
import { InsightsCard } from '@/components/dashboard/InsightsCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { PedidosPendentesCard } from '@/components/dashboard/PedidosPendentesCard';
import { InteractiveTour } from '@/components/onboarding/InteractiveTour';
import { useTourManager, DASHBOARD_TOUR_STEPS } from '@/hooks/useTourManager';
import { SetupWizard, useSetupWizard } from '@/components/onboarding/SetupWizard';

// Lazy load heavy chart component
const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts })));

// Skeleton components for loading states
const StatCardSkeleton = () => (
  <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-3 w-20 mb-2" />
    <Skeleton className="h-7 w-32" />
  </div>
);

const ChartsSkeleton = () => (
  <div className="grid md:grid-cols-2 gap-4">
    <Card className="bg-card border border-border/50 rounded-2xl">
      <CardContent className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
    <Card className="bg-card border border-border/50 rounded-2xl">
      <CardContent className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  </div>
);

export default function DashboardPage() {
  const { profile } = useAuth();
  const { showTour, endTour, startTour } = useTourManager('dashboard');
  const { showWizard, setShowWizard, isLoading: wizardLoading } = useSetupWizard();
  const { data: pecas = [], isLoading: loadingPecas } = usePecas();
  const { data: vendas = [], isLoading: loadingVendas } = useVendas();
  const { data: revendedoras = [], isLoading: loadingRevendedoras } = useRevendedoras();
  const { data: romaneios = [], isLoading: loadingRomaneios } = useRomaneios();
  const { data: caixaAtual, isLoading: loadingCaixa } = useCaixaAtual();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate stats - with null safety
  const stats = useMemo(() => {
    const safeVendas = vendas || [];
    const safePecas = pecas || [];
    const safeRomaneios = romaneios || [];
    
    const today = new Date();
    const todayStr = today.toDateString();
    const vendasHoje = safeVendas.filter(v => v?.created_at && new Date(v.created_at).toDateString() === todayStr);
    const totalHoje = vendasHoje.reduce((acc, v) => acc + Number(v?.valor_total || 0), 0);
    const faturamentoTotal = safeVendas.reduce((acc, v) => acc + Number(v?.valor_total || 0), 0);
    const totalEstoque = safePecas.reduce((acc, p) => acc + (p?.estoque || 0), 0);
    const estoqueBaixo = safePecas.filter((p) => (p?.estoque || 0) <= 5).length;
    const romaneiosPendentes = safeRomaneios.filter((r) => r?.status === 'pendente').length;

    // Calculate trend comparing this week vs last week
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const thisWeekVendas = safeVendas.filter(v => {
      const date = new Date(v?.created_at || 0);
      return date >= oneWeekAgo && date <= today;
    }).reduce((acc, v) => acc + Number(v?.valor_total || 0), 0);

    const lastWeekVendas = safeVendas.filter(v => {
      const date = new Date(v?.created_at || 0);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    }).reduce((acc, v) => acc + Number(v?.valor_total || 0), 0);

    // Only show trend if there's data to compare
    let trendValue: number | null = null;
    if (lastWeekVendas > 0 && thisWeekVendas > 0) {
      trendValue = Math.round(((thisWeekVendas - lastWeekVendas) / lastWeekVendas) * 100);
    }

    return { totalHoje, vendasHoje, faturamentoTotal, totalEstoque, estoqueBaixo, romaneiosPendentes, trendValue };
  }, [vendas, pecas, romaneios]);

  // Map vendas to include 'total' alias for components that expect it
  const vendasWithTotal = useMemo(() => 
    vendas.map(v => ({ ...v, total: v.valor_total })),
    [vendas]
  );

  // Map romaneios to include 'total' alias for components that expect it
  const romaneiosWithTotal = useMemo(() => 
    romaneios.map(r => ({ ...r, total: r.valor_frete || 0, reseller_id: r.revendedora_id })),
    [romaneios]
  );

  return (
    <div className="p-6 lg:p-8 animate-fade-in space-y-6 bg-background min-h-screen">
      {/* Setup Wizard for new users */}
      {showWizard && !wizardLoading && (
        <SetupWizard 
          onComplete={() => setShowWizard(false)}
          onSkip={() => setShowWizard(false)}
        />
      )}

      {/* Interactive Tour */}
      {showTour && !showWizard && (
        <InteractiveTour
          steps={DASHBOARD_TOUR_STEPS}
          onComplete={endTour}
          onSkip={endTour}
          storageKey="tour_dashboard_completed"
        />
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm mb-1">
            {new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'},
          </p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {profile?.nome || 'Usuário'} <Badge variant="outline" className="ml-2 text-xs font-normal">Sistema de Gestão</Badge>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {caixaAtual ? (
            <Badge className="bg-success/10 text-success border-success/30 gap-1.5 px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Caixa Aberto
            </Badge>
          ) : (
            <Link to="/pdv">
              <Button size="sm" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Abrir Caixa
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Stats Grid - Colorful Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingVendas ? (
          <StatCardSkeleton />
        ) : (
          <ModernStatCard
            title="Vendas Hoje"
            value={formatCurrency(stats.totalHoje)}
            subtitle={`${stats.vendasHoje.length} vendas`}
            icon={DollarSign}
            variant="primary"
          />
        )}
        
        {loadingVendas ? (
          <StatCardSkeleton />
        ) : (
          <ModernStatCard
            title="Total Vendas"
            value={formatCurrency(stats.faturamentoTotal)}
            icon={TrendingUp}
            trend={stats.trendValue !== null ? { value: stats.trendValue } : undefined}
            variant="purple"
          />
        )}
        
        {loadingPecas ? (
          <StatCardSkeleton />
        ) : (
          <ModernStatCard
            title="Peças Estoque"
            value={stats.totalEstoque.toLocaleString('pt-BR')}
            subtitle={`${pecas.length} tipos`}
            icon={Package}
            variant="success"
          />
        )}
        
        {loadingRevendedoras ? (
          <StatCardSkeleton />
        ) : (
          <ModernStatCard
            title="Revendedoras"
            value={revendedoras.length}
            subtitle="Parceiras ativas"
            icon={Users}
            variant="amber"
          />
        )}
      </div>

      {/* Quick Actions - Clean Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Gem, label: 'Peças', path: '/pecas', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { icon: ShoppingCart, label: 'PDV', path: '/pdv', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { icon: Users, label: 'Revendedoras', path: '/revendedoras', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: BarChart3, label: 'Relatórios', path: '/relatorios', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((action) => (
          <Link key={action.path} to={action.path}>
            <div className="bg-card border border-border/50 rounded-2xl p-4 cursor-pointer group hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${action.bg}`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <p className="font-medium text-foreground">{action.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Meta Progress, Pedidos & Aniversariantes */}
      <div className="grid md:grid-cols-3 gap-4">
        <MetaProgress />
        <PedidosPendentesCard />
        <AniversariantesCard />
      </div>

      {/* Charts Section - Lazy loaded */}
      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardCharts vendas={vendasWithTotal} pecas={pecas} />
      </Suspense>

      {/* Insights, Top Vendedoras & Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        <InsightsCard vendas={vendasWithTotal} pecas={pecas as any} romaneios={romaneiosWithTotal as any} />
        <TopVendedorasCard romaneios={romaneiosWithTotal as any} />
        <RecentActivityCard vendas={vendasWithTotal} romaneios={romaneiosWithTotal as any} />
      </div>

      {/* Alerts Section - Clean Style */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Romaneios Pendentes */}
        {stats.romaneiosPendentes > 0 && (
          <div className="bg-card border border-warning/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Romaneios Pendentes</h3>
                  <Badge className="bg-warning text-warning-foreground text-xs">
                    {stats.romaneiosPendentes}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Vendas das revendedoras aguardando confirmação.
                </p>
                <Link to="/romaneios">
                  <Button variant="outline" size="sm" className="gap-2">
                    Ver Romaneios
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Alert */}
        {stats.estoqueBaixo > 0 && (
          <div className="bg-card border border-destructive/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Atenção ao Estoque</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="font-medium text-destructive">{stats.estoqueBaixo} peças</span> com
                  estoque baixo (≤ 5 unidades).
                </p>
                <Link to="/pecas">
                  <Button variant="outline" size="sm" className="gap-2">
                    Ver Peças
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Cash Register Status */}
        {!stats.romaneiosPendentes && !stats.estoqueBaixo && (
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                caixaAtual ? 'bg-success/10' : 'bg-muted'
              }`}>
                <ShoppingCart className={`w-5 h-5 ${caixaAtual ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {caixaAtual ? 'Caixa Aberto' : 'Caixa Fechado'}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {caixaAtual
                    ? `Aberto às ${new Date(caixaAtual.data_abertura).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'Abra o caixa para registrar vendas'}
                </p>
                <Link to="/pdv">
                  <Button variant={caixaAtual ? 'default' : 'outline'} size="sm" className="gap-2">
                    {caixaAtual ? 'Ir para PDV' : 'Abrir Caixa'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Romaneios Quick View */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Vendas Revendedoras</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {(romaneios || []).length} romaneios • {' '}
                {formatCurrency(
                  (romaneios || [])
                    .filter((r) => r?.status === 'confirmado')
                    .reduce((acc, r) => acc + Number(r?.total || 0), 0)
                )} confirmados
              </p>
              <Link to="/romaneios">
                <Button variant="outline" size="sm" className="gap-2">
                  Ver Todos
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
