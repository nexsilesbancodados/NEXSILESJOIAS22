import { memo, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Use loose typing to bypass schema validation until migrations are applied
const db = supabase as any;
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Link2,
  History,
  Package,
  UserCircle,
  Tag,
  Droplets,
  Truck,
  Sparkles,
  ChevronLeft,
  Pin,
  PinOff,
  UserCog,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRomaneios } from '@/hooks/useSupabaseData';
import logo from '@/assets/logo.png';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

// Prefetch functions for each route
const prefetchFunctions: Record<string, (queryClient: ReturnType<typeof useQueryClient>) => void> = {
  '/pecas': async (queryClient) => {
    const { data: { user } } = await supabase.auth.getUser();
    queryClient.prefetchQuery({
      queryKey: ['pecas'],
      queryFn: async () => {
        const { data } = await db.from('pecas').select('*').eq('user_id', user?.id).order('nome');
        return data;
      },
      staleTime: 30000,
    });
  },
  '/clientes': async (queryClient) => {
    const { data: { user } } = await supabase.auth.getUser();
    queryClient.prefetchQuery({
      queryKey: ['clientes'],
      queryFn: async () => {
        const { data } = await db.from('clientes').select('*').eq('user_id', user?.id).order('nome');
        return data;
      },
      staleTime: 30000,
    });
  },
  '/fornecedores': async (queryClient) => {
    const { data: { user } } = await supabase.auth.getUser();
    queryClient.prefetchQuery({
      queryKey: ['fornecedores'],
      queryFn: async () => {
        const { data } = await db.from('fornecedores').select('*').eq('user_id', user?.id).order('nome');
        return data;
      },
      staleTime: 30000,
    });
  },
  '/romaneios': async (queryClient) => {
    const { data: { user } } = await supabase.auth.getUser();
    queryClient.prefetchQuery({
      queryKey: ['romaneios'],
      queryFn: async () => {
        const { data } = await db.from('romaneios').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
        return data;
      },
      staleTime: 30000,
    });
  },
  '/revendedoras': async (queryClient) => {
    const { data: { user } } = await supabase.auth.getUser();
    queryClient.prefetchQuery({
      queryKey: ['revendedoras'],
      queryFn: async () => {
        const { data } = await db.from('profiles').select('*').eq('role', 'reseller').eq('user_id', user?.id).order('nome');
        return data;
      },
      staleTime: 30000,
    });
  },
  '/vendas': async (queryClient) => {
    const { data: { user } } = await supabase.auth.getUser();
    queryClient.prefetchQuery({
      queryKey: ['vendas'],
      queryFn: async () => {
        const { data } = await db.from('vendas').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
        return data;
      },
      staleTime: 30000,
    });
  },
};

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', color: 'from-violet-500 to-purple-600' },
  { icon: Package, label: 'Peças', path: '/pecas', color: 'from-amber-500 to-orange-600' },
  { icon: Tag, label: 'Etiquetas', path: '/etiquetas', color: 'from-teal-500 to-emerald-600' },
  { icon: Droplets, label: 'Banhos', path: '/banhos', color: 'from-blue-500 to-cyan-600' },
  { icon: ShoppingCart, label: 'Caixa / PDV', path: '/pdv', color: 'from-green-500 to-emerald-600' },
  { icon: Sparkles, label: 'Campanhas', path: '/campanhas', color: 'from-purple-500 to-pink-600' },
  { icon: UserCircle, label: 'Clientes', path: '/clientes', color: 'from-pink-500 to-rose-600' },
  { icon: Link2, label: 'Catálogos', path: '/catalogos', color: 'from-indigo-500 to-blue-600' },
  { icon: Users, label: 'Revendedoras', path: '/revendedoras', color: 'from-fuchsia-500 to-pink-600' },
  { icon: TrendingUp, label: 'Desempenho', path: '/revendedoras/desempenho', color: 'from-emerald-500 to-teal-600' },
  { icon: Truck, label: 'Fornecedores', path: '/fornecedores', color: 'from-slate-500 to-gray-600' },
  { icon: FileText, label: 'Romaneios', path: '/romaneios', badge: true, color: 'from-orange-500 to-red-600' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios', color: 'from-cyan-500 to-blue-600' },
  { icon: History, label: 'Histórico', path: '/historico', color: 'from-gray-500 to-slate-600' },
  { icon: UserCog, label: 'Funcionários', path: '/funcionarios', color: 'from-sky-500 to-blue-600', adminOnly: true },
  { icon: Settings, label: 'Configurações', path: '/configuracoes', color: 'from-zinc-500 to-neutral-600' },
];

// Memoized menu item for collapsed sidebar
const CollapsedMenuItem = memo(({ 
  item, 
  isActive, 
  pendingRomaneios, 
  onClick,
  onMouseEnter
}: { 
  item: typeof menuItems[0]; 
  isActive: boolean; 
  pendingRomaneios: number;
  onClick: () => void;
  onMouseEnter: () => void;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={cn(
          'relative w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 group',
          isActive 
            ? 'text-white shadow-lg' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
        )}
      >
        {isActive && (
          <div className={cn('absolute inset-0 rounded-xl bg-gradient-to-br', item.color)} />
        )}
        
        <item.icon className={cn(
          "w-5 h-5 relative z-10 transition-transform duration-150",
          !isActive && 'group-hover:scale-110'
        )} />
        
        {item.badge && pendingRomaneios > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-md z-20">
            {pendingRomaneios > 9 ? '9+' : pendingRomaneios}
          </span>
        )}
      </button>
    </TooltipTrigger>
    <TooltipContent side="right" sideOffset={8} className="bg-card border-border shadow-xl">
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full bg-gradient-to-br', item.color)} />
        <p className="font-medium">{item.label}</p>
        {item.badge && pendingRomaneios > 0 && (
          <span className="text-primary font-bold">({pendingRomaneios})</span>
        )}
      </div>
    </TooltipContent>
  </Tooltip>
));
CollapsedMenuItem.displayName = 'CollapsedMenuItem';

// Memoized menu item for expanded sidebar
const ExpandedMenuItem = memo(({ 
  item, 
  isActive, 
  pendingRomaneios, 
  onClick,
  onMouseEnter
}: { 
  item: typeof menuItems[0]; 
  isActive: boolean; 
  pendingRomaneios: number;
  onClick: () => void;
  onMouseEnter: () => void;
}) => (
  <button
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    className={cn(
      'relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left overflow-hidden',
      isActive 
        ? 'text-white shadow-lg' 
        : 'text-muted-foreground hover:text-foreground'
    )}
  >
    {isActive && (
      <div className={cn('absolute inset-0 rounded-xl bg-gradient-to-r', item.color)} />
    )}
    
    {!isActive && (
      <div className="absolute inset-0 rounded-xl bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
    )}
    
    <div className={cn(
      'relative z-10 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
      isActive 
        ? 'bg-white/20' 
        : 'bg-muted group-hover:bg-muted-foreground/10'
    )}>
      <item.icon className={cn(
        "w-5 h-5 transition-transform duration-150",
        !isActive && 'group-hover:scale-110'
      )} />
    </div>
    
    <span className="relative z-10 flex-1 font-medium">{item.label}</span>
    
    {item.badge && pendingRomaneios > 0 && (
      <span className={cn(
        "relative z-10 text-xs px-2 py-0.5 rounded-full font-bold",
        isActive 
          ? 'bg-white/25 text-white' 
          : 'bg-destructive text-destructive-foreground'
      )}>
        {pendingRomaneios}
      </span>
    )}
    
    <ChevronRight 
      className={cn(
        'relative z-10 w-4 h-4 transition-all duration-150',
        isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0'
      )} 
    />
  </button>
));
ExpandedMenuItem.displayName = 'ExpandedMenuItem';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

export const Sidebar = memo(function Sidebar({ isExpanded, onToggle, isPinned, onTogglePin }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { data: romaneios = [] } = useRomaneios();
  
  const pendingRomaneios = useMemo(() => 
    romaneios.filter((r) => r.status === 'pendente').length,
    [romaneios]
  );

  // Filter menu items based on admin status
  const filteredMenuItems = useMemo(() => 
    menuItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handlePrefetch = useCallback((path: string) => {
    const prefetchFn = prefetchFunctions[path];
    if (prefetchFn) {
      prefetchFn(queryClient);
    }
  }, [queryClient]);

  const isPathActive = useCallback((path: string) => {
    return location.pathname === path || 
      (path !== '/' && location.pathname.startsWith(path));
  }, [location.pathname]);

  const handleLogoClick = useCallback(() => handleNavigation('/'), [handleNavigation]);

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className="fixed left-0 top-0 h-screen flex flex-col z-50 bg-card/95 backdrop-blur-md border-r border-border/50 transition-all duration-300"
        style={{ width: isExpanded ? 280 : 80 }}
      >
        {/* Logo */}
        <div className={cn(
          "p-4 border-b border-border/50 flex flex-col gap-3",
          !isExpanded && "items-center"
        )}>
          <button 
            onClick={handleLogoClick}
            className={cn(
              "flex items-center gap-3 transition-transform hover:scale-105 active:scale-95",
              !isExpanded && "justify-center"
            )}
          >
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/20 shadow-lg shadow-primary/10">
              <img src={logo} alt="Nexsiles" className="w-8 h-8 object-contain" width={32} height={32} loading="lazy" />
            </div>
            
            {isExpanded && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Nexsiles
                </h1>
                <p className="text-xs text-muted-foreground">Gestão de Semijoias</p>
              </div>
            )}
          </button>
          
          {/* Toggle & Pin Buttons */}
          <div className={cn(
            "flex items-center gap-1",
            isExpanded ? "justify-end" : "justify-center"
          )}>
            {/* Pin Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isPinned ? "secondary" : "ghost"}
                  size="icon"
                  onClick={onTogglePin}
                  className={cn(
                    "h-8 w-8 rounded-lg shrink-0 transition-colors",
                    isPinned && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-card border-border shadow-xl">
                {isPinned 
                  ? (isExpanded ? 'Fixado expandido' : 'Fixado recolhido') 
                  : 'Fixar menu'}
              </TooltipContent>
            </Tooltip>

            {/* Toggle Button (only visible when not pinned) */}
            {!isPinned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="h-8 w-8 rounded-lg shrink-0"
                  >
                    <ChevronLeft className={cn("w-4 h-4 transition-transform duration-200", !isExpanded && "rotate-180")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border shadow-xl">
                  {isExpanded ? 'Recolher menu' : 'Expandir menu'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {filteredMenuItems.map((item) => (
            isExpanded ? (
              <ExpandedMenuItem
                key={item.path}
                item={item}
                isActive={isPathActive(item.path)}
                pendingRomaneios={pendingRomaneios}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={() => handlePrefetch(item.path)}
              />
            ) : (
              <CollapsedMenuItem
                key={item.path}
                item={item}
                isActive={isPathActive(item.path)}
                pendingRomaneios={pendingRomaneios}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={() => handlePrefetch(item.path)}
              />
            )
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border/50">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary/50" />
            {isExpanded && (
              <span className="text-xs text-muted-foreground">
                Nexsiles v1.0.0
              </span>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
});