import { Link } from 'react-router-dom';
import { Suspense, lazy, useMemo } from 'react';
import { cn } from '@/lib/utils';
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
    <div className="p-4 lg:p-8 animate-fade-in space-y-6 bg-background min-h-screen">
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

      {/* Welcome Header - Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 lg:p-8 text-primary-foreground shadow-lg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute -right-20 -top-20 w-72 h-72 opacity-10" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="currentColor" />
          </svg>
          <svg className="absolute -left-10 -bottom-10 w-48 h-48 opacity-10" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="60" fill="currentColor" />
          </svg>
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-primary-foreground/70 text-sm mb-1 font-medium">
              {new Date().getHours() < 12 ? '☀️ Bom dia' : new Date().getHours() < 18 ? '🌤️ Boa tarde' : '🌙 Boa noite'},
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              {profile?.nome || 'Usuário'}
            </h1>
            <p className="text-primary-foreground/60 text-sm mt-1">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {caixaAtual ? (
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm gap-1.5 px-4 py-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Caixa Aberto
              </Badge>
            ) : (
              <Link to="/pdv">
                <Button size="sm" variant="secondary" className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm">
                  <ShoppingCart className="w-4 h-4" />
                  Abrir Caixa
                </Button>
              </Link>
            )}
          </div>
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

      {/* Quick Actions - Glass Morphism Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Gem, label: 'Peças', path: '/pecas', gradient: 'from-purple-500/10 to-violet-500/10', iconColor: 'text-purple-600 dark:text-purple-400', borderColor: 'border-purple-200/50 dark:border-purple-800/30' },
          { icon: ShoppingCart, label: 'PDV', path: '/pdv', gradient: 'from-emerald-500/10 to-teal-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-200/50 dark:border-emerald-800/30' },
          { icon: Users, label: 'Revendedoras', path: '/revendedoras', gradient: 'from-blue-500/10 to-cyan-500/10', iconColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200/50 dark:border-blue-800/30' },
          { icon: BarChart3, label: 'Relatórios', path: '/relatorios', gradient: 'from-amber-500/10 to-orange-500/10', iconColor: 'text-amber-600 dark:text-amber-400', borderColor: 'border-amber-200/50 dark:border-amber-800/30' },
        ].map((action) => (
          <Link key={action.path} to={action.path}>
            <div className={cn(
              'bg-gradient-to-br border rounded-2xl p-4 cursor-pointer group',
              'hover:shadow-md hover:scale-[1.02] transition-all duration-300',
              action.gradient,
              action.borderColor
            )}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                  <action.icon className={cn('w-5 h-5', action.iconColor)} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">Acessar</p>
                </div>
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
