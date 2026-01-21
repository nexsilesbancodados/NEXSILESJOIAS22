import { memo, useMemo, useCallback, useState, forwardRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  FileText,
  LayoutDashboard,
  Link2,
  History,
  Package,
  UserCircle,
  Tag,
  Droplets,
  Truck,
  ChevronDown,
  Box,
  Store,
  UsersRound,
  ClipboardList,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRomaneios } from '@/hooks/useSupabaseData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: boolean;
  color?: string;
}

interface MenuGroup {
  icon: LucideIcon;
  label: string;
  items: MenuItem[];
  color: string;
}

type MenuEntry = MenuItem | MenuGroup;

const menuStructure: MenuEntry[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', color: 'from-violet-500 to-purple-600' },
  {
    icon: Box,
    label: 'Estoque',
    color: 'from-amber-500 to-orange-600',
    items: [
      { icon: Package, label: 'Peças', path: '/pecas', color: 'from-amber-500 to-orange-600' },
      { icon: Tag, label: 'Etiquetas', path: '/etiquetas', color: 'from-teal-500 to-emerald-600' },
      { icon: Droplets, label: 'Banhos', path: '/banhos', color: 'from-blue-500 to-cyan-600' },
    ]
  },
  {
    icon: Store,
    label: 'Vendas',
    color: 'from-green-500 to-emerald-600',
    items: [
      { icon: ShoppingCart, label: 'Caixa / PDV', path: '/pdv', color: 'from-green-500 to-emerald-600' },
      { icon: Link2, label: 'Catálogos', path: '/catalogos', color: 'from-indigo-500 to-blue-600' },
    ]
  },
  {
    icon: UsersRound,
    label: 'Pessoas',
    color: 'from-pink-500 to-rose-600',
    items: [
      { icon: UserCircle, label: 'Clientes', path: '/clientes', color: 'from-pink-500 to-rose-600' },
      { icon: Users, label: 'Revendedoras', path: '/revendedoras', color: 'from-fuchsia-500 to-pink-600' },
      { icon: Truck, label: 'Fornecedores', path: '/fornecedores', color: 'from-slate-500 to-gray-600' },
    ]
  },
  {
    icon: ClipboardList,
    label: 'Gestão',
    color: 'from-cyan-500 to-blue-600',
    items: [
      { icon: FileText, label: 'Romaneios', path: '/romaneios', badge: true, color: 'from-orange-500 to-red-600' },
      { icon: BarChart3, label: 'Relatórios', path: '/relatorios', color: 'from-cyan-500 to-blue-600' },
      { icon: History, label: 'Histórico', path: '/historico', color: 'from-gray-500 to-slate-600' },
    ]
  },
  { icon: Settings, label: 'Configurações', path: '/configuracoes', color: 'from-zinc-500 to-neutral-600' },
];

function isGroup(entry: MenuEntry): entry is MenuGroup {
  return 'items' in entry;
}

// Memoized dropdown menu item
const NavDropdownItem = memo(({ 
  item, 
  isActive, 
  pendingRomaneios,
  onClick 
}: { 
  item: MenuItem; 
  isActive: boolean;
  pendingRomaneios: number;
  onClick: () => void;
}) => (
  <DropdownMenuItem
    onClick={onClick}
    className={cn(
      'flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-lg transition-all duration-200',
      isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
    )}
  >
    <div className={cn(
      'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
      isActive 
        ? cn('bg-gradient-to-br text-white', item.color) 
        : 'bg-muted'
    )}>
      <item.icon className="w-4 h-4" />
    </div>
    <span className="flex-1 font-medium">{item.label}</span>
    {item.badge && pendingRomaneios > 0 && (
      <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
        {pendingRomaneios}
      </span>
    )}
  </DropdownMenuItem>
));
NavDropdownItem.displayName = 'NavDropdownItem';

// Memoized nav button
const NavButton = memo(({ 
  entry, 
  isActive, 
  onClick 
}: { 
  entry: MenuItem; 
  isActive: boolean;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      'relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 group',
      isActive 
        ? 'text-white shadow-lg' 
        : 'text-muted-foreground hover:text-foreground'
    )}
  >
    {/* Active background */}
    {isActive && (
      <motion.div 
        layoutId="activeNavItem"
        className={cn('absolute inset-0 rounded-xl bg-gradient-to-r', entry.color)}
        initial={false}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    )}
    
    {/* Hover background */}
    {!isActive && (
      <div className="absolute inset-0 rounded-xl bg-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    )}
    
    <entry.icon className={cn("w-4 h-4 relative z-10", isActive && "text-white")} />
    <span className="relative z-10 hidden sm:inline">{entry.label}</span>
  </motion.button>
));
NavButton.displayName = 'NavButton';

// Dropdown trigger button with forwardRef for Radix UI compatibility
interface DropdownTriggerButtonProps {
  entry: MenuGroup;
  groupActive: boolean;
  hasBadge: boolean;
  isOpen: boolean;
}

const DropdownTriggerButton = forwardRef<HTMLButtonElement, DropdownTriggerButtonProps>(
  function DropdownTriggerButton({ entry, groupActive, hasBadge, isOpen, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          'relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 group',
          groupActive 
            ? 'text-white shadow-lg' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        {...props}
      >
        {/* Active background */}
        {groupActive && (
          <div className={cn('absolute inset-0 rounded-xl bg-gradient-to-r', entry.color)} />
        )}
        
        <entry.icon className={cn("w-4 h-4 relative z-10")} />
        <span className="relative z-10 hidden sm:inline">{entry.label}</span>
        <ChevronDown className={cn(
          "w-3 h-3 relative z-10 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
        
        {/* Badge indicator */}
        {hasBadge && !groupActive && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full shadow-lg animate-pulse z-20" />
        )}
      </button>
    );
  }
);

export const HeaderNav = memo(function HeaderNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: romaneios = [] } = useRomaneios();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  
  const pendingRomaneios = useMemo(() => 
    romaneios.filter((r) => r.status === 'pendente').length,
    [romaneios]
  );

  const isPathActive = useCallback((path: string) => {
    return location.pathname === path || 
      (path !== '/' && location.pathname.startsWith(path));
  }, [location.pathname]);

  const isGroupActive = useCallback((group: MenuGroup) => {
    return group.items.some(item => isPathActive(item.path));
  }, [isPathActive]);

  const hasBadgeInGroup = useCallback((group: MenuGroup) => {
    return group.items.some(item => item.badge && pendingRomaneios > 0);
  }, [pendingRomaneios]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setOpenDropdown(null);
  }, [navigate]);

  return (
    <nav className="flex items-center gap-1">
      {menuStructure.map((entry, index) => {
        if (isGroup(entry)) {
          const groupActive = isGroupActive(entry);
          const hasBadge = hasBadgeInGroup(entry);

          return (
            <DropdownMenu 
              key={index} 
              open={openDropdown === index}
              onOpenChange={(open) => setOpenDropdown(open ? index : null)}
            >
              <DropdownMenuTrigger asChild>
                <DropdownTriggerButton
                  entry={entry}
                  groupActive={groupActive}
                  hasBadge={hasBadge}
                  isOpen={openDropdown === index}
                />
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="start" 
                sideOffset={8}
                className="min-w-[220px] p-2 bg-card/95 backdrop-blur-md border-border/50 shadow-xl rounded-xl"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-2">
                  {entry.label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                {entry.items.map((item) => (
                  <NavDropdownItem
                    key={item.path}
                    item={item}
                    isActive={isPathActive(item.path)}
                    pendingRomaneios={pendingRomaneios}
                    onClick={() => handleNavigate(item.path)}
                  />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        // Single item (not a group)
        return (
          <NavButton
            key={entry.path}
            entry={entry as MenuItem}
            isActive={isPathActive((entry as MenuItem).path)}
            onClick={() => handleNavigate((entry as MenuItem).path)}
          />
        );
      })}
    </nav>
  );
});
