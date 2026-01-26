import { Bell, Check, Trash2, Package, ShoppingCart, FileText, Cake, Target, Briefcase, Filter, Heart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useNotificacoesNaoLidas, 
  useMarcarComoLida, 
  useMarcarTodasComoLidas,
  useDeletarNotificacao,
  useNotificacoesRealtime,
  Notificacao 
} from '@/hooks/useNotificacoes';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const iconMap: Record<string, typeof Bell> = {
  estoque_baixo: Package,
  novo_pedido: ShoppingCart,
  romaneio_pendente: FileText,
  aniversario: Cake,
  meta_proxima: Target,
  maleta_vencendo: Briefcase,
  interesse_maleta: Heart,
};

const categoryLabels: Record<string, string> = {
  all: 'Todas',
  estoque_baixo: 'Estoque',
  novo_pedido: 'Pedidos',
  romaneio_pendente: 'Romaneios',
  aniversario: 'Aniversários',
  meta_proxima: 'Metas',
  maleta_vencendo: 'Maletas',
  interesse_maleta: 'Interesses',
};

export function NotificationBell() {
  const [filter, setFilter] = useState<string>('all');
  const { data: notificacoes = [] } = useNotificacoesNaoLidas();
  const { mutate: marcarComoLida } = useMarcarComoLida();
  const { mutate: marcarTodasComoLidas } = useMarcarTodasComoLidas();
  const { mutate: deletarNotificacao } = useDeletarNotificacao();
  
  // Enable realtime updates
  useNotificacoesRealtime();

  const filteredNotificacoes = filter === 'all' 
    ? notificacoes 
    : notificacoes.filter(n => n.tipo === filter);

  // Get unique categories from notifications
  const categories = ['all', ...new Set(notificacoes.map(n => n.tipo).filter(Boolean))];

  const getIcon = (tipo: string) => {
    const Icon = iconMap[tipo] || Bell;
    return Icon;
  };

  const getIconColor = (tipo: string) => {
    switch (tipo) {
      case 'estoque_baixo':
        return 'text-destructive';
      case 'novo_pedido':
        return 'text-success';
      case 'romaneio_pendente':
        return 'text-warning';
      case 'aniversario':
        return 'text-pink-500';
      case 'meta_proxima':
        return 'text-primary';
      case 'maleta_vencendo':
        return 'text-orange-500';
      case 'interesse_maleta':
        return 'text-rose-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleNotificationClick = (notificacao: Notificacao) => {
    marcarComoLida(notificacao.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notificacoes.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive"
            >
              {notificacoes.length > 9 ? '9+' : notificacoes.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 bg-popover">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {notificacoes.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-1 text-xs"
              onClick={() => marcarTodasComoLidas()}
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        
        {/* Category filters */}
        {categories.length > 2 && (
          <div className="px-2 pb-2">
            <ScrollArea className="w-full">
              <div className="flex gap-1">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={filter === cat ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2 text-xs whitespace-nowrap"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFilter(cat);
                    }}
                  >
                    {categoryLabels[cat] || cat}
                    {cat !== 'all' && (
                      <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                        {notificacoes.filter(n => n.tipo === cat).length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        <DropdownMenuSeparator />
        
        {filteredNotificacoes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {filter === 'all' ? 'Nenhuma notificação' : `Nenhuma notificação de ${categoryLabels[filter]?.toLowerCase() || filter}`}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            {filteredNotificacoes.map((notificacao) => {
              const Icon = getIcon(notificacao.tipo);
              return (
                <DropdownMenuItem 
                  key={notificacao.id}
                  className="flex items-start gap-3 p-3 cursor-pointer group"
                  onClick={() => handleNotificationClick(notificacao)}
                >
                  <div className={`mt-0.5 ${getIconColor(notificacao.tipo)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{notificacao.titulo}</p>
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        {categoryLabels[notificacao.tipo] || notificacao.tipo}
                      </Badge>
                    </div>
                    {notificacao.mensagem && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {notificacao.mensagem}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notificacao.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletarNotificacao(notificacao.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
