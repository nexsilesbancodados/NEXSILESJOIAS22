import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Zap, AlertTriangle, Cake, Briefcase, FileText, ArrowRight, CheckCircle2, Package,
  ShoppingCart, Heart,
} from 'lucide-react';
import {
  usePecas, useRomaneios, useClientes, useMaletas, useVendas,
} from '@/hooks/useSupabaseData';

function isBirthdayThisWeek(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  const start = new Date(today); start.setHours(0, 0, 0, 0);
  const end = new Date(today); end.setDate(end.getDate() + 7); end.setHours(23, 59, 59, 999);
  for (let i = 0; i <= 7; i++) {
    const check = new Date(start); check.setDate(check.getDate() + i);
    if (check.getMonth() === d.getMonth() && check.getDate() === d.getDate()) return true;
  }
  return false;
}

interface ActionItem {
  key: string;
  icon: any;
  label: string;
  count: number;
  tone: 'destructive' | 'warning' | 'primary' | 'pink' | 'success';
  href: string;
  cta: string;
  hint?: string;
}

export function AcoesDeHojeCard() {
  const { data: pecas = [] } = usePecas();
  const { data: romaneios = [] } = useRomaneios();
  const { data: clientes = [] } = useClientes();
  const { data: maletas = [] } = useMaletas();
  const { data: vendas = [] } = useVendas();

  const items = useMemo<ActionItem[]>(() => {
    const safePecas = Array.isArray(pecas) ? pecas : [];
    const safeRomaneios = Array.isArray(romaneios) ? romaneios : [];
    const safeClientes = Array.isArray(clientes) ? clientes : [];
    const safeMaletas = Array.isArray(maletas) ? maletas : [];
    const safeVendas = Array.isArray(vendas) ? vendas : [];

    const estoqueCritico = safePecas.filter((p: any) => {
      const estoque = Number(p?.estoque ?? 0);
      return estoque > 0 && estoque <= 3;
    }).length;
    const estoqueZero = safePecas.filter((p: any) => Number(p?.estoque ?? 0) === 0).length;
    const romaneiosPendentes = safeRomaneios.filter((r: any) => r?.status === 'pendente').length;
    const aniversariantes = safeClientes.filter((c: any) => isBirthdayThisWeek(c?.aniversario || c?.data_nascimento)).length;

    const hoje = new Date();
    const maletasVencendo = safeMaletas.filter((m: any) => {
      if (!m?.prazo_devolucao || m?.status === 'fechada') return false;
      const prazo = new Date(m.prazo_devolucao);
      if (isNaN(prazo.getTime())) return false;
      const diff = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 3;
    }).length;

    const hojeStr = hoje.toDateString();
    const vendasHoje = safeVendas.filter((v: any) => v?.created_at && new Date(v.created_at).toDateString() === hojeStr).length;

    const list: ActionItem[] = [];
    if (estoqueZero > 0) list.push({
      key: 'estoque-zero', icon: AlertTriangle, label: 'Peças sem estoque',
      count: estoqueZero, tone: 'destructive', href: '/pecas',
      cta: 'Repor agora', hint: 'Reponha para não perder venda',
    });
    if (estoqueCritico > 0) list.push({
      key: 'estoque-critico', icon: Package, label: 'Estoque crítico (≤3)',
      count: estoqueCritico, tone: 'warning', href: '/pecas',
      cta: 'Revisar peças',
    });
    if (romaneiosPendentes > 0) list.push({
      key: 'romaneios', icon: FileText, label: 'Romaneios pendentes',
      count: romaneiosPendentes, tone: 'warning', href: '/romaneios',
      cta: 'Confirmar', hint: 'Vendas aguardando confirmação',
    });
    if (maletasVencendo > 0) list.push({
      key: 'maletas', icon: Briefcase, label: 'Maletas vencendo (3 dias)',
      count: maletasVencendo, tone: 'primary', href: '/revendedoras',
      cta: 'Cobrar retorno',
    });
    if (aniversariantes > 0) list.push({
      key: 'aniversarios', icon: Cake, label: 'Aniversariantes da semana',
      count: aniversariantes, tone: 'pink', href: '/clientes',
      cta: 'Parabenizar', hint: 'Envie WhatsApp e cupom',
    });
    if (vendasHoje > 0) list.push({
      key: 'vendas-hoje', icon: ShoppingCart, label: 'Vendas registradas hoje',
      count: vendasHoje, tone: 'success', href: '/pdv',
      cta: 'Ver PDV',
    });
    return list;
  }, [pecas, romaneios, clientes, maletas, vendas]);

  const toneStyles: Record<ActionItem['tone'], { icon: string; badge: string; ring: string }> = {
    destructive: { icon: 'text-destructive bg-destructive/10', badge: 'bg-destructive text-destructive-foreground', ring: 'border-destructive/30' },
    warning: { icon: 'text-warning bg-warning/10', badge: 'bg-warning text-warning-foreground', ring: 'border-warning/30' },
    primary: { icon: 'text-primary bg-primary/10', badge: 'bg-primary text-primary-foreground', ring: 'border-primary/30' },
    pink: { icon: 'text-pink-500 bg-pink-500/10', badge: 'bg-pink-500 text-white', ring: 'border-pink-500/30' },
    success: { icon: 'text-success bg-success/10', badge: 'bg-success text-success-foreground', ring: 'border-success/30' },
  };

  const actionable = items.filter((i) => i.tone !== 'success');

  return (
    <Card className="border border-border/60 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Ações de hoje</h3>
            <p className="text-xs text-muted-foreground">
              {actionable.length === 0
                ? 'Tudo em dia — bom trabalho!'
                : `${actionable.length} ${actionable.length === 1 ? 'ponto de atenção' : 'pontos de atenção'}`}
            </p>
          </div>
        </div>
        {actionable.length === 0 && (
          <Badge variant="outline" className="gap-1 border-success/40 text-success">
            <CheckCircle2 className="w-3 h-3" /> OK
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <Heart className="w-7 h-7 text-success" />
            </div>
            <p className="text-sm font-medium">Nada urgente por aqui</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Nenhum alerta ativo. Ótimo momento para planejar campanhas ou revisar metas.
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((item) => {
              const s = toneStyles[item.tone];
              const Icon = item.icon;
              return (
                <Link key={item.key} to={item.href} className="group">
                  <div className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-all',
                    'hover:border-foreground/20',
                    s.ring
                  )}>
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', s.icon)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <Badge className={cn('h-5 px-1.5 text-[10px] flex-shrink-0', s.badge)}>
                          {item.count}
                        </Badge>
                      </div>
                      {item.hint && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.hint}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 gap-1 flex-shrink-0"
                    >
                      {item.cta}
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
