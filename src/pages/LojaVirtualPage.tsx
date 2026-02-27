import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, Settings, Package, LayoutGrid, Tag, 
  ArrowLeft, ChevronLeft, ChevronRight, BarChart3,
  Palette, Globe, Megaphone
} from 'lucide-react';
import { EcommerceConfigTab } from '@/components/ecommerce/EcommerceConfigTab';
import { EcommercePedidosTab } from '@/components/ecommerce/EcommercePedidosTab';
import { EcommerceProdutosTab } from '@/components/ecommerce/EcommerceProdutosTab';
import { CuponsManager } from '@/components/ecommerce/CuponsManager';
import { cn } from '@/lib/utils';

type Section = 'produtos' | 'cupons' | 'pedidos' | 'config';

const NAV_ITEMS: { id: Section; label: string; icon: typeof LayoutGrid; description: string }[] = [
  { id: 'produtos', label: 'Produtos', icon: LayoutGrid, description: 'Catálogo de produtos' },
  { id: 'cupons', label: 'Cupons', icon: Tag, description: 'Cupons de desconto' },
  { id: 'pedidos', label: 'Pedidos', icon: Package, description: 'Pedidos recebidos' },
  { id: 'config', label: 'Configurações', icon: Settings, description: 'Personalizar loja' },
];

export default function LojaVirtualPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('produtos');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeNav = NAV_ITEMS.find(n => n.id === activeSection);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r bg-card transition-all duration-300 ease-in-out flex-shrink-0",
        sidebarCollapsed ? "w-[68px]" : "w-[240px]"
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b h-[60px]">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          </button>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold truncate">Loja Virtual</h1>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-muted-foreground">Ativa</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            const button = (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg transition-all duration-200 text-sm",
                  sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );

            if (sidebarCollapsed) {
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
            return button;
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-[60px] border-b bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            {activeNav && (
              <>
                <activeNav.icon className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold leading-tight">{activeNav.label}</h2>
                  <p className="text-xs text-muted-foreground">{activeNav.description}</p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Loja ativa
            </Badge>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'produtos' && <EcommerceProdutosTab />}
          {activeSection === 'cupons' && <CuponsManager />}
          {activeSection === 'pedidos' && <EcommercePedidosTab />}
          {activeSection === 'config' && <EcommerceConfigTab />}
        </div>
      </main>
    </div>
  );
}
