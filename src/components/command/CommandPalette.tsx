import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Package, ShoppingCart, Users, FileText, BarChart3, History,
  DollarSign, Truck, Star, MessageCircle, UserCog, ShoppingBag, Settings, Shield,
  Activity, TrendingUp, Sparkles, Tag, Droplets, HandCoins, UserCircle, Link2,
  Briefcase, Search, Sun, Moon, LogOut, Gem,
} from 'lucide-react';
import { usePecas, useClientes, useRevendedoras } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const ROUTES: { label: string; path: string; icon: any; keywords?: string }[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, keywords: 'home início painel' },
  { label: 'Peças / Estoque', path: '/pecas', icon: Package, keywords: 'inventario produto sku' },
  { label: 'Etiquetas', path: '/etiquetas', icon: Tag },
  { label: 'Banhos', path: '/banhos', icon: Droplets, keywords: 'galvanica' },
  { label: 'Caixa / PDV', path: '/pdv', icon: ShoppingCart, keywords: 'venda balcao pagamento' },
  { label: 'Fiado', path: '/fiado', icon: HandCoins, keywords: 'credito devedor' },
  { label: 'Campanhas', path: '/campanhas', icon: Sparkles, keywords: 'marketing whatsapp' },
  { label: 'Clientes', path: '/clientes', icon: UserCircle, keywords: 'consumidor cliente crm' },
  { label: 'Catálogos', path: '/catalogos', icon: Link2, keywords: 'catalogo pedido online' },
  { label: 'Revendedoras', path: '/revendedoras', icon: Users, keywords: 'parceira maleta consignado' },
  { label: 'Desempenho Revendedoras', path: '/revendedoras/desempenho', icon: TrendingUp },
  { label: 'Fornecedores', path: '/fornecedores', icon: Truck },
  { label: 'Romaneios', path: '/romaneios', icon: FileText, keywords: 'vendas revendedora' },
  { label: 'Relatórios', path: '/relatorios', icon: BarChart3 },
  { label: 'Histórico', path: '/historico', icon: History, keywords: 'auditoria log timeline' },
  { label: 'Histórico de Preços', path: '/historico-precos', icon: DollarSign },
  { label: 'Entregas', path: '/entregas', icon: Truck, keywords: 'envio rastreio correio' },
  { label: 'Fidelidade', path: '/fidelidade', icon: Star },
  { label: 'Atendimento IA', path: '/atendimento', icon: MessageCircle, keywords: 'bella agente whatsapp' },
  { label: 'Funcionários', path: '/funcionarios', icon: UserCog },
  { label: 'Loja Virtual', path: '/loja-virtual', icon: ShoppingBag, keywords: 'ecommerce site' },
  { label: 'Configurações', path: '/configuracoes', icon: Settings },
  { label: 'Minha Assinatura', path: '/minha-assinatura', icon: Gem },
  { label: 'CRM', path: '/crm', icon: TrendingUp },
  { label: 'Super Admin', path: '/super-admin', icon: Shield },
  { label: 'Observabilidade', path: '/observabilidade', icon: Activity },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const { data: pecas = [] } = usePecas();
  const { data: clientes = [] } = useClientes();
  const { data: revendedoras = [] } = useRevendedoras();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const run = (fn: () => void) => {
    setOpen(false);
    setTimeout(fn, 0);
  };

  const pecasResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return (pecas as any[])
      .filter((p) =>
        (p?.nome || '').toLowerCase().includes(q) ||
        (p?.codigo || '').toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [pecas, query]);

  const clientesResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return (clientes as any[])
      .filter((c) =>
        (c?.nome || '').toLowerCase().includes(q) ||
        (c?.telefone || '').toLowerCase().includes(q) ||
        (c?.email || '').toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [clientes, query]);

  const revendedorasResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return (revendedoras as any[])
      .filter((r) => (r?.nome || '').toLowerCase().includes(q))
      .slice(0, 5);
  }, [revendedoras, query]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar página, cliente, peça, revendedora..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>

        {pecasResults.length > 0 && (
          <CommandGroup heading="Peças">
            {pecasResults.map((p) => (
              <CommandItem
                key={`p-${p.id}`}
                value={`peca ${p.nome} ${p.codigo}`}
                onSelect={() => run(() => navigate(`/pecas?highlight=${p.id}`))}
              >
                <Package className="mr-2 h-4 w-4 text-amber-500" />
                <span className="flex-1 truncate">{p.nome}</span>
                <span className="text-xs text-muted-foreground ml-2">{p.codigo}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {clientesResults.length > 0 && (
          <CommandGroup heading="Clientes">
            {clientesResults.map((c) => (
              <CommandItem
                key={`c-${c.id}`}
                value={`cliente ${c.nome} ${c.telefone || ''}`}
                onSelect={() => run(() => navigate(`/clientes?highlight=${c.id}`))}
              >
                <UserCircle className="mr-2 h-4 w-4 text-pink-500" />
                <span className="flex-1 truncate">{c.nome}</span>
                {c.telefone && <span className="text-xs text-muted-foreground ml-2">{c.telefone}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {revendedorasResults.length > 0 && (
          <CommandGroup heading="Revendedoras">
            {revendedorasResults.map((r) => (
              <CommandItem
                key={`r-${r.id}`}
                value={`revendedora ${r.nome}`}
                onSelect={() => run(() => navigate(`/revendedoras?highlight=${r.id}`))}
              >
                <Users className="mr-2 h-4 w-4 text-fuchsia-500" />
                <span className="flex-1 truncate">{r.nome}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(pecasResults.length + clientesResults.length + revendedorasResults.length) > 0 && (
          <CommandSeparator />
        )}

        <CommandGroup heading="Navegar">
          {ROUTES.map((r) => (
            <CommandItem
              key={r.path}
              value={`${r.label} ${r.keywords || ''}`}
              onSelect={() => run(() => navigate(r.path))}
            >
              <r.icon className="mr-2 h-4 w-4" />
              <span>{r.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações rápidas">
          <CommandItem value="nova venda pdv" onSelect={() => run(() => navigate('/pdv'))}>
            <ShoppingCart className="mr-2 h-4 w-4 text-emerald-500" />
            <span>Nova venda no PDV</span>
          </CommandItem>
          <CommandItem value="cadastrar peca" onSelect={() => run(() => navigate('/pecas?new=1'))}>
            <Package className="mr-2 h-4 w-4 text-amber-500" />
            <span>Cadastrar nova peça</span>
          </CommandItem>
          <CommandItem value="cadastrar cliente" onSelect={() => run(() => navigate('/clientes?new=1'))}>
            <UserCircle className="mr-2 h-4 w-4 text-pink-500" />
            <span>Cadastrar novo cliente</span>
          </CommandItem>
          <CommandItem value="nova maleta consignado" onSelect={() => run(() => navigate('/revendedoras?tab=maletas&new=1'))}>
            <Briefcase className="mr-2 h-4 w-4 text-orange-500" />
            <span>Nova maleta / consignado</span>
          </CommandItem>
          <CommandItem
            value={theme === 'dark' ? 'tema claro light' : 'tema escuro dark'}
            onSelect={() => run(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            <span>Alternar tema</span>
          </CommandItem>
          <CommandItem value="sair logout" onSelect={() => run(() => signOut())}>
            <LogOut className="mr-2 h-4 w-4 text-destructive" />
            <span>Sair da conta</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
      <div className="px-3 py-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
        <span className="flex items-center gap-1"><Search className="h-3 w-3" /> Busca global</span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted border">⌘</kbd>
          <span className="mx-1">+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted border">K</kbd>
        </span>
      </div>
    </CommandDialog>
  );
}
