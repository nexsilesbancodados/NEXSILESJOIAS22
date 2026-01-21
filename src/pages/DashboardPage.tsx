import { Link } from 'react-router-dom';
import { Suspense, lazy, useMemo } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { usePecas, useVendas, useRevendedoras, useRomaneios, useCaixaAtual } from '@/hooks/useSupabaseData';
import { MetaProgress } from '@/components/dashboard/MetaProgress';
import { AniversariantesCard } from '@/components/dashboard/AniversariantesCard';
import { GradientStatCard } from '@/components/dashboard/GradientStatCard';
import { TopVendedorasCard } from '@/components/dashboard/TopVendedorasCard';
import { InsightsCard } from '@/components/dashboard/InsightsCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { QuickStatsRow } from '@/components/dashboard/QuickStatsRow';
import { PedidosPendentesCard } from '@/components/dashboard/PedidosPendentesCard';
import { InteractiveTour } from '@/components/onboarding/InteractiveTour';
import { useTourManager, DASHBOARD_TOUR_STEPS } from '@/hooks/useTourManager';

// Lazy load heavy chart component
const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts })));

// Skeleton components for loading states
const StatCardSkeleton = () => (
  <Card className="glass-card overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ChartsSkeleton = () => (
  <div className="grid md:grid-cols-2 gap-4">
    <Card className="glass-card">
      <CardContent className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
    <Card className="glass-card">
      <CardContent className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  </div>
);

export default function DashboardPage() {
  const { showTour, endTour, startTour } = useTourManager('dashboard');
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

  const totalEstoque = pecas.reduce((acc, p) => acc + (p.estoque || 0), 0);
  const estoqueValor = pecas.reduce((acc, p) => acc + (p.estoque || 0) * Number(p.preco || 0), 0);
  const estoqueBaixo = pecas.filter((p) => (p.estoque || 0) <= 5).length;
  const faturamentoTotal = vendas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const romaneiosPendentes = romaneios.filter((r) => r.status === 'pendente').length;

  const quickActions = [
    { icon: Gem, label: 'Peças', path: '/pecas', gradient: true },
    { icon: ShoppingCart, label: 'PDV', path: '/pdv', color: 'bg-success/10 text-success' },
    { icon: Users, label: 'Revendedoras', path: '/revendedoras', color: 'bg-accent/10 text-accent' },
    { icon: BarChart3, label: 'Relatórios', path: '/relatorios', color: 'bg-primary/10 text-primary' },
  ];

  return (
    <div className="p-6 lg:p-8 animate-fade-in space-y-6">
      {/* Interactive Tour */}
      {showTour && (
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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">
            Bem-vindo ao <span className="text-gradient">Nexsiles</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Seu sistema completo de gestão de semijoias
          </p>
        </div>
        <div className="flex items-center gap-2">
          {caixaAtual ? (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1.5 px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Caixa Aberto
            </Badge>
          ) : (
            <Link to="/pdv">
              <Button size="sm" className="btn-gold gap-2">
                <ShoppingCart className="w-4 h-4" />
                Abrir Caixa
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <QuickStatsRow vendas={vendas} romaneios={romaneios} />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.path} to={action.path}>
            <Card className="glass-card cursor-pointer group hover:scale-[1.02] transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  action.gradient ? 'gold-gradient text-white' : action.color
                }`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <p className="font-medium text-foreground">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Gradient Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingPecas ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <GradientStatCard
              title="Peças em Estoque"
              value={totalEstoque.toLocaleString('pt-BR')}
              subtitle={`${pecas.length} tipos diferentes`}
              icon={Package}
              gradient="purple"
            />
            
            <GradientStatCard
              title="Valor do Estoque"
              value={formatCurrency(estoqueValor)}
              subtitle="Investimento total"
              icon={Gem}
              gradient="green"
            />
          </>
        )}
        
        {loadingVendas ? (
          <StatCardSkeleton />
        ) : (
          <GradientStatCard
            title="Faturamento Total"
            value={formatCurrency(faturamentoTotal)}
            subtitle={`${vendas.length} vendas realizadas`}
            icon={DollarSign}
            gradient="blue"
          />
        )}
        
        {loadingRevendedoras ? (
          <StatCardSkeleton />
        ) : (
          <GradientStatCard
            title="Revendedoras Ativas"
            value={revendedoras.length}
            subtitle="Parceiras cadastradas"
            icon={Users}
            gradient="orange"
          />
        )}
      </div>

      {/* Meta Progress, Pedidos & Aniversariantes */}
      <div className="grid md:grid-cols-3 gap-4">
        <MetaProgress />
        <PedidosPendentesCard />
        <AniversariantesCard />
      </div>

      {/* Charts Section - Lazy loaded */}
      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardCharts vendas={vendas} pecas={pecas} />
      </Suspense>

      {/* Insights, Top Vendedoras & Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        <InsightsCard vendas={vendas} pecas={pecas as any} romaneios={romaneios} />
        <TopVendedorasCard romaneios={romaneios} />
        <RecentActivityCard vendas={vendas} romaneios={romaneios} />
      </div>

      {/* Alerts Section */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Romaneios Pendentes */}
        {romaneiosPendentes > 0 && (
          <Card className="glass-card border-warning/30 bg-warning/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="icon-container-warning flex-shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Romaneios Pendentes</h3>
                    <Badge className="bg-warning text-warning-foreground">
                      {romaneiosPendentes} novo{romaneiosPendentes > 1 ? 's' : ''}
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
            </CardContent>
          </Card>
        )}

        {/* Low Stock Alert */}
        {estoqueBaixo > 0 && (
          <Card className="glass-card border-destructive/30 bg-destructive/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="icon-container-destructive flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Atenção ao Estoque</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    <span className="font-medium text-destructive">{estoqueBaixo} peças</span> com
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
            </CardContent>
          </Card>
        )}

        {/* Cash Register Status */}
        {!romaneiosPendentes && !estoqueBaixo && (
          <Card className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
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
                    <Button variant={caixaAtual ? 'default' : 'outline'} size="sm" className={`gap-2 ${caixaAtual ? 'btn-gold' : ''}`}>
                      {caixaAtual ? 'Ir para PDV' : 'Abrir Caixa'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Romaneios Quick View */}
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="icon-container-primary flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Vendas Revendedoras</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {romaneios.length} romaneios • {' '}
                  {formatCurrency(
                    romaneios
                      .filter((r) => r.status === 'confirmado')
                      .reduce((acc, r) => acc + Number(r.total), 0)
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
