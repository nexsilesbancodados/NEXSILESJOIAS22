import { ReactNode, useState, useEffect, memo, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { HeaderNav } from './HeaderNav';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { Button } from '@/components/ui/button';
import { LogOut, PanelLeft, LayoutGrid, Moon, Sun } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import logo from '@/assets/logo.png';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserPreferences, useSaveUserPreference, PREFERENCE_KEYS } from '@/hooks/useUserPreferences';

// Lazy load heavy components
const NotificationBell = lazy(() => import('@/components/notifications/NotificationBell').then(m => ({ default: m.NotificationBell })));

interface MainLayoutProps {
  children: ReactNode;
}

type MenuMode = 'sidebar' | 'floating';

// Memoized user avatar component
const UserAvatar = memo(({ name, gradient }: { name: string; gradient: string }) => {
  const initials = useMemo(() => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [name]);

  return (
    <div 
      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95" 
      style={{ background: gradient }}
    >
      {initials}
    </div>
  );
});
UserAvatar.displayName = 'UserAvatar';

// Memoized header component
const Header = memo(({ 
  menuMode, 
  onToggleMode, 
  user, 
  profile, 
  cargo,
  onSignOut,
  sidebarWidth
}: { 
  menuMode: MenuMode; 
  onToggleMode: () => void;
  user: any;
  profile: any;
  cargo: string | null;
  onSignOut: () => void;
  sidebarWidth: number;
}) => {
  const { theme, setTheme } = useTheme();
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <header 
      className="fixed top-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border/50 z-40 px-4 flex items-center justify-between gap-3 transition-all duration-300"
      style={{ left: menuMode === 'sidebar' ? sidebarWidth : 0 }}
    >
      {/* Left side - Logo + Menu controls */}
      <div className="flex items-center gap-3">
        {/* Logo (only in floating/aerial mode) */}
        {menuMode === 'floating' && (
          <div className="flex items-center gap-3 pr-4 border-r border-border/50">
            <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20">
              <img src={logo} alt="Nexsiles" className="w-6 h-6 object-contain" width={24} height={24} loading="lazy" />
            </div>
            <span className="font-bold text-foreground hidden md:block">Nexsiles</span>
          </div>
        )}
        
        {/* Toggle menu mode button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMode}
              className="h-9 w-9 rounded-xl hover:bg-muted transition-transform hover:scale-105 active:scale-95"
            >
              {menuMode === 'sidebar' ? (
                <LayoutGrid className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-card border-border shadow-xl">
            {menuMode === 'sidebar' ? 'Menu aéreo' : 'Menu lateral'}
          </TooltipContent>
        </Tooltip>

        {/* Horizontal navigation (only in floating/aerial mode) */}
        {menuMode === 'floating' && <HeaderNav />}
      </div>

      {/* Right side - User info */}
      <div className="flex items-center gap-2">
        {user && (
          <>
            {/* Theme toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9 rounded-xl hover:bg-muted transition-transform hover:scale-105 active:scale-95"
                >
                  {theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-card border-border shadow-xl">
                {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              </TooltipContent>
            </Tooltip>

            <Suspense fallback={<div className="w-9 h-9" />}>
              <NotificationBell />
            </Suspense>
            
            <div className="h-8 w-px bg-border/50 mx-1" />
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{profile?.nome || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {cargo || (profile?.role === 'admin' ? 'Administrador' : 'Usuário')}
                </p>
              </div>
              <UserAvatar 
                name={profile?.nome || user.email || 'U'} 
                gradient="linear-gradient(135deg, hsl(270 70% 60%), hsl(300 70% 65%))" 
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSignOut}
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-transform hover:scale-105 active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-card border-border shadow-xl">
                  Sair
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </header>
  );
});
Header.displayName = 'Header';

export function MainLayout({ children }: MainLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const { data: preferences, isLoading: prefsLoading } = useUserPreferences();
  const savePreference = useSaveUserPreference();
  const initializedRef = useRef(false);

  // Fetch cargo from funcionarios table
  const { data: funcionarioData } = useQuery({
    queryKey: ['my-funcionario-cargo', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('funcionarios')
        .select('cargo')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  // Initialize state from preferences or localStorage fallback
  const [menuMode, setMenuMode] = useState<MenuMode>('sidebar');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarPinned, setSidebarPinned] = useState(false);

  // Load preferences once available
  useEffect(() => {
    if (!prefsLoading && preferences && !initializedRef.current) {
      initializedRef.current = true;
      
      // Use DB preferences or fallback to localStorage
      const savedMenuMode = preferences[PREFERENCE_KEYS.MENU_MODE] || localStorage.getItem('menuMode');
      const savedExpanded = preferences[PREFERENCE_KEYS.SIDEBAR_EXPANDED] ?? localStorage.getItem('sidebarExpanded');
      const savedPinned = preferences[PREFERENCE_KEYS.SIDEBAR_PINNED] ?? localStorage.getItem('sidebarPinned');
      
      if (savedMenuMode) setMenuMode(savedMenuMode as MenuMode);
      if (savedExpanded !== null && savedExpanded !== undefined) setSidebarExpanded(savedExpanded !== 'false');
      if (savedPinned !== null && savedPinned !== undefined) setSidebarPinned(savedPinned === 'true');
    }
  }, [preferences, prefsLoading]);

  // Save to database when preferences change
  const saveToDb = useCallback((key: string, value: string) => {
    if (user?.id) {
      savePreference.mutate({ chave: key, valor: value });
    }
    // Also keep localStorage as fallback
    localStorage.setItem(key, value);
  }, [user?.id, savePreference]);

  const toggleMenuMode = useCallback(() => {
    setMenuMode(prev => {
      const newValue = prev === 'sidebar' ? 'floating' : 'sidebar';
      saveToDb(PREFERENCE_KEYS.MENU_MODE, newValue);
      return newValue;
    });
  }, [saveToDb]);

  const toggleSidebar = useCallback(() => {
    if (!sidebarPinned) {
      setSidebarExpanded(prev => {
        const newValue = !prev;
        saveToDb(PREFERENCE_KEYS.SIDEBAR_EXPANDED, String(newValue));
        return newValue;
      });
    }
  }, [sidebarPinned, saveToDb]);

  const toggleSidebarPin = useCallback(() => {
    setSidebarPinned(prev => {
      const newValue = !prev;
      saveToDb(PREFERENCE_KEYS.SIDEBAR_PINNED, String(newValue));
      return newValue;
    });
  }, [saveToDb]);

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);


  const sidebarWidth = menuMode === 'sidebar' ? (sidebarExpanded ? 280 : 80) : 0;

  // Memoize main content style to prevent recalculations
  const mainStyle = useMemo(() => ({ marginLeft: sidebarWidth }), [sidebarWidth]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Sidebar only visible in sidebar mode */}
        {menuMode === 'sidebar' && (
          <Sidebar 
            isExpanded={sidebarExpanded} 
            onToggle={toggleSidebar}
            isPinned={sidebarPinned}
            onTogglePin={toggleSidebarPin}
          />
        )}
        
        <Header 
          menuMode={menuMode}
          onToggleMode={toggleMenuMode}
          user={user}
          profile={profile}
          cargo={funcionarioData?.cargo || null}
          onSignOut={handleSignOut}
          sidebarWidth={sidebarWidth}
        />
        
        {/* Main content with optimized transitions */}
        <main 
          className="pt-16 min-h-screen transition-[margin] duration-200 ease-out"
          style={mainStyle}
        >
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}