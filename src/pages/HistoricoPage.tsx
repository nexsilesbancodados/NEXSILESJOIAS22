import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MiniGradientCard } from '@/components/dashboard/MiniGradientCard';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  History,
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Trash2,
  ShoppingBag,
  Package,
  Users,
  Briefcase,
  BookOpen,
  CreditCard,
  Loader2,
  Eye,
  ArrowRight,
  User,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { useHistorico, type EntidadeFilter, type TipoFilter, type HistoricoAtividade } from '@/hooks/useHistorico';

const ENTIDADE_OPTIONS: { value: EntidadeFilter; label: string; icon: React.ElementType }[] = [
  { value: 'todas', label: 'Todas', icon: History },
  { value: 'vendas', label: 'Vendas', icon: ShoppingBag },
  { value: 'romaneios', label: 'Romaneios', icon: Package },
  { value: 'maletas', label: 'Maletas', icon: Briefcase },
  { value: 'pecas', label: 'Peças', icon: BookOpen },
  { value: 'catalogos', label: 'Catálogos', icon: BookOpen },
  { value: 'pedidos_catalogo', label: 'Pedidos', icon: ShoppingBag },
  { value: 'caixa_sessoes', label: 'Caixa', icon: CreditCard },
  { value: 'profiles', label: 'Usuários', icon: Users },
];

const TIPO_OPTIONS: { value: TipoFilter; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'todos', label: 'Todos', color: 'bg-muted text-muted-foreground', icon: History },
  { value: 'criacao', label: 'Criação', color: 'bg-success/20 text-success', icon: Plus },
  { value: 'atualizacao', label: 'Atualização', color: 'bg-warning/20 text-warning', icon: Edit },
  { value: 'exclusao', label: 'Exclusão', color: 'bg-destructive/20 text-destructive', icon: Trash2 },
];

const getEntidadeLabel = (entidade: string): string => {
  const labels: Record<string, string> = {
    vendas: 'Venda',
    romaneios: 'Romaneio',
    maletas: 'Maleta',
    pecas: 'Peça',
    catalogos: 'Catálogo',
    pedidos_catalogo: 'Pedido do Catálogo',
    caixa_sessoes: 'Sessão de Caixa',
    profiles: 'Perfil de Usuário',
  };
  return labels[entidade] || entidade;
};

const getEntidadeIcon = (entidade: string): React.ElementType => {
  const icons: Record<string, React.ElementType> = {
    vendas: ShoppingBag,
    romaneios: Package,
    maletas: Briefcase,
    pecas: BookOpen,
    catalogos: BookOpen,
    pedidos_catalogo: ShoppingBag,
    caixa_sessoes: CreditCard,
    profiles: Users,
  };
  return icons[entidade] || History;
};

const getTipoInfo = (tipo: string) => {
  const info = TIPO_OPTIONS.find(t => t.value === tipo);
  return info || TIPO_OPTIONS[0];
};

const formatCurrency = (value: number | null) => {
  if (value === null) return null;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getChangeDescription = (item: HistoricoAtividade): string => {
  const dados = item.dados_novos || item.dados_anteriores;
  if (!dados) return item.descricao;
  
  switch (item.entidade) {
    case 'vendas':
      return `Venda ${item.tipo === 'criacao' ? 'registrada' : item.tipo === 'exclusao' ? 'removida' : 'atualizada'} - ${formatCurrency(item.valor) || 'Valor não informado'}`;
    case 'romaneios':
      const resellerNome = (dados as { reseller_nome?: string }).reseller_nome;
      return `Romaneio ${item.tipo === 'criacao' ? 'criado' : item.tipo === 'exclusao' ? 'removido' : 'atualizado'} - ${resellerNome || 'Revendedora'}`;
    case 'maletas':
      const status = (dados as { status?: string }).status;
      return `Maleta ${status === 'fechada' ? 'fechada' : item.tipo === 'criacao' ? 'criada' : 'atualizada'}`;
    case 'pecas':
      const pecaNome = (dados as { nome?: string }).nome;
      return `Peça "${pecaNome || 'Sem nome'}" ${item.tipo === 'criacao' ? 'cadastrada' : item.tipo === 'exclusao' ? 'removida' : 'atualizada'}`;
    case 'catalogos':
      const catalogoNome = (dados as { nome?: string }).nome;
      return `Catálogo "${catalogoNome || 'Sem nome'}" ${item.tipo === 'criacao' ? 'criado' : item.tipo === 'exclusao' ? 'removido' : 'atualizado'}`;
    case 'pedidos_catalogo':
      const clienteNome = (dados as { cliente_nome?: string }).cliente_nome;
      return `Pedido de ${clienteNome || 'Cliente'} ${item.tipo === 'criacao' ? 'recebido' : item.tipo === 'exclusao' ? 'removido' : 'atualizado'}`;
    case 'caixa_sessoes':
      const caixaStatus = (dados as { status?: string }).status;
      return `Caixa ${caixaStatus === 'aberto' ? 'aberto' : 'fechado'}`;
    case 'profiles':
      const profileNome = (dados as { nome?: string }).nome;
      const role = (dados as { role?: string }).role;
      return `${role === 'reseller' ? 'Revendedora' : 'Usuário'} "${profileNome || 'Sem nome'}" ${item.tipo === 'criacao' ? 'cadastrado(a)' : item.tipo === 'exclusao' ? 'removido(a)' : 'atualizado(a)'}`;
    default:
      return item.descricao;
  }
};

export default function HistoricoPage() {
  const [entidade, setEntidade] = useState<EntidadeFilter>('todas');
  const [tipo, setTipo] = useState<TipoFilter>('todos');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedItem, setSelectedItem] = useState<HistoricoAtividade | null>(null);
  
  const { data: historico = [], isLoading } = useHistorico({
    entidade,
    tipo,
    limit: 500,
    dataInicio: dateRange?.from ? startOfDay(dateRange.from) : undefined,
    dataFim: dateRange?.to ? endOfDay(dateRange.to) : undefined,
  });

  const groupedByDate = useMemo(() => {
    const groups: Record<string, HistoricoAtividade[]> = {};
    
    historico.forEach(item => {
      const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [historico]);

  const stats = useMemo(() => {
    return {
      total: historico.length,
      criacoes: historico.filter(h => h.tipo === 'criacao').length,
      atualizacoes: historico.filter(h => h.tipo === 'atualizacao').length,
      exclusoes: historico.filter(h => h.tipo === 'exclusao').length,
    };
  }, [historico]);

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
              <History className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Histórico</h1>
              <p className="text-sm text-muted-foreground">Registro de todas as atividades do sistema</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Entity Filter */}
            <Select value={entidade} onValueChange={(v) => setEntidade(v as EntidadeFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                {ENTIDADE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPO_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                      </>
                    ) : (
                      format(dateRange.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    'Período'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MiniGradientCard
          title="Total"
          value={stats.total}
          icon={History}
          gradient="purple"
        />
        <MiniGradientCard
          title="Criações"
          value={stats.criacoes}
          icon={Plus}
          gradient="teal"
        />
        <MiniGradientCard
          title="Atualizações"
          value={stats.atualizacoes}
          icon={Edit}
          gradient="orange"
        />
        <MiniGradientCard
          title="Exclusões"
          value={stats.exclusoes}
          icon={Trash2}
          gradient="pink"
        />
      </div>

      {/* Timeline */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <History className="w-5 h-5" />
            Timeline de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : historico.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mb-4 opacity-50" />
              <p>Nenhum registro encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou período</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                {groupedByDate.map(([dateKey, items]) => (
                  <div key={dateKey}>
                    <div className="sticky top-0 bg-background/95 backdrop-blur z-10 py-2 mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {format(new Date(dateKey), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        <Badge variant="secondary" className="ml-2">{items.length}</Badge>
                      </h3>
                    </div>
                    
                    <div className="space-y-3 ml-2 border-l-2 border-border pl-4">
                      {items.map((item) => {
                        const tipoInfo = getTipoInfo(item.tipo);
                        const EntidadeIcon = getEntidadeIcon(item.entidade);
                        
                        return (
                          <div
                            key={item.id}
                            className="relative flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                            onClick={() => setSelectedItem(item)}
                          >
                            {/* Timeline dot */}
                            <div className="absolute -left-[1.45rem] top-4 w-3 h-3 rounded-full border-2 border-background bg-border" />
                            
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tipoInfo.color}`}>
                              <tipoInfo.icon className="w-5 h-5" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs gap-1">
                                  <EntidadeIcon className="w-3 h-3" />
                                  {getEntidadeLabel(item.entidade)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(item.created_at), 'HH:mm')}
                                </span>
                              </div>
                              
                              <p className="text-sm font-medium text-foreground truncate">
                                {getChangeDescription(item)}
                              </p>
                              
                              {item.usuario_nome && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <User className="w-3 h-3" />
                                  {item.usuario_nome}
                                </p>
                              )}
                              
                              {item.valor && (
                                <p className="text-sm font-semibold text-primary mt-1">
                                  {formatCurrency(item.valor)}
                                </p>
                              )}
                            </div>
                            
                            {/* View button */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <History className="w-5 h-5" />
              Detalhes da Atividade
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTipoInfo(selectedItem.tipo).color}`}>
                  {(() => {
                    const TipoIcon = getTipoInfo(selectedItem.tipo).icon;
                    return <TipoIcon className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <p className="font-medium">{getChangeDescription(selectedItem)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedItem.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Entidade</p>
                  <Badge variant="outline">{getEntidadeLabel(selectedItem.entidade)}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo de Operação</p>
                  <Badge className={getTipoInfo(selectedItem.tipo).color}>
                    {getTipoInfo(selectedItem.tipo).label}
                  </Badge>
                </div>
                {selectedItem.usuario_nome && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Usuário</p>
                    <p className="text-sm font-medium">{selectedItem.usuario_nome}</p>
                  </div>
                )}
                {selectedItem.valor && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Valor</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(selectedItem.valor)}</p>
                  </div>
                )}
              </div>

              {/* Data Comparison */}
              {(selectedItem.dados_anteriores || selectedItem.dados_novos) && (
                <div>
                  <p className="text-sm font-medium mb-3">Dados</p>
                  
                  {selectedItem.tipo === 'atualizacao' && selectedItem.dados_anteriores && selectedItem.dados_novos ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Antes</p>
                        <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">
                          {JSON.stringify(selectedItem.dados_anteriores, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Depois</p>
                        <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">
                          {JSON.stringify(selectedItem.dados_novos, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">
                      {JSON.stringify(selectedItem.dados_novos || selectedItem.dados_anteriores, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
