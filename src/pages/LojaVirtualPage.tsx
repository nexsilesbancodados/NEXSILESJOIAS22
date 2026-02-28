import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  ShoppingBag, Settings, Package, LayoutGrid, Tag, 
  ArrowLeft, ChevronLeft, ChevronRight,
  Star, Users, Link2, LayoutDashboard, BarChart3,
  Boxes, ShoppingCart, Bell, Search, ExternalLink, Menu,
  Sparkles, Zap, Globe
} from 'lucide-react';
import { EcommerceConfigTab } from '@/components/ecommerce/EcommerceConfigTab';
import { EcommercePedidosTab } from '@/components/ecommerce/EcommercePedidosTab';
import { EcommerceProdutosTab } from '@/components/ecommerce/EcommerceProdutosTab';
import { CuponsManager } from '@/components/ecommerce/CuponsManager';
import { EcommerceDashboard } from '@/components/ecommerce/EcommerceDashboard';
import { EcommerceAvaliacoesTab } from '@/components/ecommerce/EcommerceAvaliacoesTab';
import { EcommerceClientesTab } from '@/components/ecommerce/EcommerceClientesTab';
import { EcommerceLinksTab } from '@/components/ecommerce/EcommerceLinksTab';
import { EcommerceRelatoriosTab } from '@/components/ecommerce/EcommerceRelatoriosTab';
import { EcommerceEstoqueTab } from '@/components/ecommerce/EcommerceEstoqueTab';
import { EcommerceCarrinhoAbandonadoTab } from '@/components/ecommerce/EcommerceCarrinhoAbandonadoTab';
import { EcommerceNotificacoesTab } from '@/components/ecommerce/EcommerceNotificacoesTab';
import { EcommerceSEOTab } from '@/components/ecommerce/EcommerceSEOTab';
import { EcommerceBannersTab } from '@/components/ecommerce/EcommerceBannersTab';
import { EcommerceSectionOrderTab } from '@/components/ecommerce/EcommerceSectionOrderTab';
import { EcommerceColecoeTab } from '@/components/ecommerce/EcommerceColecoeTab';
import { EcommercePromocoesTab } from '@/components/ecommerce/EcommercePromocoesTab';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/supabase-db';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

type Section = 'dashboard' | 'produtos' | 'estoque' | 'cupons' | 'pedidos' | 'carrinho' | 'avaliacoes' | 'clientes' | 'relatorios' | 'notificacoes' | 'seo' | 'links' | 'config' | 'banners' | 'secoes' | 'colecoes' | 'promocoes';

const NAV_ITEMS: { id: Section; label: string; icon: typeof LayoutGrid; description: string; group: string; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Visão geral de vendas', group: 'Principal' },
  { id: 'produtos', label: 'Produtos', icon: LayoutGrid, description: 'Catálogo de produtos', group: 'Catálogo' },
  { id: 'estoque', label: 'Estoque', icon: Boxes, description: 'Controle de estoque', group: 'Catálogo' },
  { id: 'pedidos', label: 'Pedidos', icon: Package, description: 'Pedidos recebidos', group: 'Vendas' },
  { id: 'carrinho', label: 'Carrinho Abandonado', icon: ShoppingCart, description: 'Recuperação de vendas', group: 'Vendas' },
  { id: 'clientes', label: 'Clientes', icon: Users, description: 'Base de clientes', group: 'Vendas' },
  { id: 'banners', label: 'Banners', icon: LayoutGrid, description: 'Carrossel de banners', group: 'Marketing' },
  { id: 'colecoes', label: 'Coleções', icon: ShoppingBag, description: 'Categorias em destaque', group: 'Marketing' },
  { id: 'promocoes', label: 'Promoções', icon: Zap, description: 'Countdown, popup e lookbook', group: 'Marketing' },
  { id: 'cupons', label: 'Cupons', icon: Tag, description: 'Cupons de desconto', group: 'Marketing' },
  { id: 'avaliacoes', label: 'Avaliações', icon: Star, description: 'Avaliações de produtos', group: 'Marketing' },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, description: 'Análises detalhadas', group: 'Análise' },
  { id: 'seo', label: 'SEO & Analytics', icon: Search, description: 'Otimização e métricas', group: 'Análise' },
  { id: 'secoes', label: 'Seções', icon: LayoutDashboard, description: 'Ordem das seções', group: 'Sistema' },
  { id: 'notificacoes', label: 'Automações', icon: Bell, description: 'Notificações automáticas', group: 'Sistema' },
  { id: 'links', label: 'Link da Loja', icon: Link2, description: 'Compartilhar e QR Code', group: 'Sistema' },
  { id: 'config', label: 'Configurações', icon: Settings, description: 'Personalizar loja', group: 'Sistema' },
];

const GROUP_ICONS: Record<string, typeof Sparkles> = {
  'Principal': Sparkles,
  'Catálogo': LayoutGrid,
  'Vendas': Zap,
  'Marketing': Star,
  'Análise': BarChart3,
  'Sistema': Settings,
};

export default function LojaVirtualPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { organization } = useOrganization();

  // Fetch live badge counts
  const { data: counts } = useQuery({
    queryKey: ['ecommerce-nav-counts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { pedidos: 0, estoqueBaixo: 0 };
      const [pedidosRes, estoqueRes] = await Promise.all([
        db.from('ecommerce_pedidos').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).eq('status', 'pendente'),
        db.from('pecas').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).eq('disponivel_loja', true).lte('quantidade', 3),
      ]);
      return { pedidos: pedidosRes.count || 0, estoqueBaixo: estoqueRes.count || 0 };
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });

  const getBadge = (id: Section): number | null => {
    if (id === 'pedidos' && counts?.pedidos) return counts.pedidos;
    if (id === 'estoque' && counts?.estoqueBaixo) return counts.estoqueBaixo;
    return null;
  };

  const activeNav = NAV_ITEMS.find(n => n.id === activeSection);

  const groups = NAV_ITEMS.reduce((acc, item) => {
    const g = item.group || 'Outros';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, typeof NAV_ITEMS>);

  const { data: ecommerceConfig } = useQuery({
    queryKey: ['ecommerce-config-slug', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await db.from('ecommerce_config').select('slug, ativo').eq('organization_id', organization.id).maybeSingle();
      return data;
    },
    enabled: !!organization?.id,
  });

  const renderNavContent = (collapsed: boolean) => (
    <>
      {/* Logo / Header */}
      <div className={cn("flex items-center gap-3 border-b border-border/50", collapsed ? "p-3 justify-center" : "p-4")}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
              <ShoppingBag className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">Loja Virtual</h1>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", ecommerceConfig?.ativo ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
                <span className="text-[10px] text-muted-foreground">{ecommerceConfig?.ativo ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-thin">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} className="mb-4">
            {!collapsed && (
              <div className="flex items-center gap-1.5 px-3 mb-1.5">
                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.1em]">{groupName}</p>
              </div>
            )}
            {collapsed && <div className="h-px bg-border/30 mx-2 mb-2" />}
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const badge = getBadge(item.id);

                const button = (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      if (isMobile) setMobileOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-xl transition-all duration-200 text-[13px] relative group",
                      collapsed ? "justify-center p-2.5" : "px-3 py-2",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 flex-shrink-0 transition-transform", isActive && "scale-110")} />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {badge !== null && badge > 0 && (
                          <span className={cn(
                            "min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1",
                            isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive text-destructive-foreground"
                          )}>
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && badge !== null && badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-bold bg-destructive text-destructive-foreground">
                        {badge}
                      </span>
                    )}
                  </button>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.id} delayDuration={0}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-muted-foreground">{item.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return <div key={item.id}>{button}</div>;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && ecommerceConfig?.slug && (
        <div className="px-3 pb-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5 h-8 border-dashed"
            onClick={() => window.open(`/loja/${ecommerceConfig.slug}`, '_blank')}
          >
            <Globe className="h-3 w-3" />
            Ver loja
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
        </div>
      )}
      <div className="p-2 border-t border-border/50">
        {!isMobile && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <EcommerceDashboard />;
      case 'produtos': return <EcommerceProdutosTab />;
      case 'estoque': return <EcommerceEstoqueTab />;
      case 'cupons': return <CuponsManager />;
      case 'pedidos': return <EcommercePedidosTab />;
      case 'carrinho': return <EcommerceCarrinhoAbandonadoTab />;
      case 'avaliacoes': return <EcommerceAvaliacoesTab />;
      case 'clientes': return <EcommerceClientesTab />;
      case 'relatorios': return <EcommerceRelatoriosTab />;
      case 'seo': return <EcommerceSEOTab />;
      case 'notificacoes': return <EcommerceNotificacoesTab />;
      case 'links': return <EcommerceLinksTab />;
      case 'banners': return <EcommerceBannersTab />;
      case 'secoes': return <EcommerceSectionOrderTab />;
      case 'colecoes': return <EcommerceColecoeTab />;
      case 'promocoes': return <EcommercePromocoesTab />;
      case 'config': return <EcommerceConfigTab />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={cn(
          "hidden md:flex flex-col bg-card/80 backdrop-blur-sm border-r border-border/50 transition-all duration-300 ease-in-out flex-shrink-0",
          sidebarCollapsed ? "w-[64px]" : "w-[230px]"
        )}>
          {renderNavContent(sidebarCollapsed)}
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 md:px-6 h-[56px] border-b border-border/50 bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] p-0 flex flex-col">
                  {renderNavContent(false)}
                </SheetContent>
              </Sheet>
            )}
            {activeNav && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <activeNav.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold leading-tight">{activeNav.label}</h2>
                  <p className="text-[11px] text-muted-foreground hidden sm:block">{activeNav.description}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {ecommerceConfig?.slug && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5 h-7 hidden sm:flex"
                onClick={() => window.open(`/loja/${ecommerceConfig.slug}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
                Visitar loja
              </Button>
            )}
            <Badge variant="secondary" className={cn(
              "gap-1.5 text-[11px]",
              ecommerceConfig?.ativo
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-200/50"
                : "bg-muted text-muted-foreground"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", ecommerceConfig?.ativo ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
              {ecommerceConfig?.ativo ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
