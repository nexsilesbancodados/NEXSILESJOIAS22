import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ShoppingBag, 
  Package,
  Truck,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  status: string;
  title: string;
  description?: string;
  date: Date;
  icon: typeof Clock;
  color: string;
  isActive: boolean;
}

interface PedidoTimelineProps {
  status: string;
  createdAt: string;
  confirmedAt?: string;
  canceledAt?: string;
}

const STATUS_STEPS = [
  { 
    status: 'pendente', 
    title: 'Pedido Recebido', 
    description: 'Aguardando confirmação',
    icon: ShoppingBag, 
    color: 'text-yellow-500 bg-yellow-500/20' 
  },
  { 
    status: 'em_separacao', 
    title: 'Em Separação', 
    description: 'Preparando seus itens',
    icon: Package, 
    color: 'text-blue-500 bg-blue-500/20' 
  },
  { 
    status: 'confirmado', 
    title: 'Confirmado/Vendido', 
    description: 'Pedido confirmado e finalizado',
    icon: CheckCircle, 
    color: 'text-green-500 bg-green-500/20' 
  },
];

export const PedidoTimeline = memo(function PedidoTimeline({
  status,
  createdAt,
  confirmedAt,
  canceledAt,
}: PedidoTimelineProps) {
  const timeline = useMemo(() => {
    const events: TimelineEvent[] = [];
    const currentDate = new Date(createdAt);
    
    // Pedido recebido - sempre acontece
    events.push({
      id: 'received',
      status: 'pendente',
      title: 'Pedido Recebido',
      description: 'Cliente fez o pedido via catálogo',
      date: currentDate,
      icon: ShoppingBag,
      color: 'text-primary bg-primary/20',
      isActive: true,
    });

    if (status === 'cancelado') {
      events.push({
        id: 'canceled',
        status: 'cancelado',
        title: 'Pedido Cancelado',
        description: 'O pedido foi cancelado',
        date: canceledAt ? new Date(canceledAt) : currentDate,
        icon: XCircle,
        color: 'text-destructive bg-destructive/20',
        isActive: true,
      });
    } else if (status === 'confirmado') {
      events.push({
        id: 'processing',
        status: 'em_separacao',
        title: 'Em Separação',
        description: 'Itens separados para envio',
        date: currentDate,
        icon: Package,
        color: 'text-primary bg-primary/20',
        isActive: true,
      });

      events.push({
        id: 'confirmed',
        status: 'confirmado',
        title: 'Venda Confirmada',
        description: 'Pedido marcado como vendido e estoque atualizado',
        date: confirmedAt ? new Date(confirmedAt) : currentDate,
        icon: CheckCircle,
        color: 'text-green-500 bg-green-500/20',
        isActive: true,
      });
    } else {
      // Pendente - mostrar próximos passos
      events.push({
        id: 'awaiting',
        status: 'aguardando',
        title: 'Aguardando Ação',
        description: 'Confirme ou cancele o pedido',
        date: currentDate,
        icon: Clock,
        color: 'text-muted-foreground bg-muted',
        isActive: false,
      });
    }

    return events;
  }, [status, createdAt, confirmedAt, canceledAt]);

  return (
    <div className="relative">
      {timeline.map((event, index) => (
        <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
          {/* Connector line */}
          {index < timeline.length - 1 && (
            <div 
              className={cn(
                "absolute left-5 top-10 w-0.5 h-full -ml-px",
                event.isActive ? "bg-primary/30" : "bg-border"
              )}
            />
          )}
          
          {/* Icon */}
          <div 
            className={cn(
              "relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0",
              event.color,
              !event.isActive && "opacity-50"
            )}
          >
            <event.icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className={cn("flex-1 min-w-0 pt-1", !event.isActive && "opacity-50")}>
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-foreground">{event.title}</h4>
              <span className="text-xs text-muted-foreground shrink-0">
                {format(event.date, "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});
