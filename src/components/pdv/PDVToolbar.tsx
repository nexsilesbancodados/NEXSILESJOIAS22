import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calculator,
  Percent,
  Gift,
  Users,
  FileText,
  MoreVertical,
  RefreshCw,
  Pause,
  Play,
  Clock,
  Tag,
  Package,
} from 'lucide-react';

interface PDVToolbarProps {
  onCalculator: () => void;
  onDesconto: () => void;
  onClienteFiel: () => void;
  onConsultaPreco: () => void;
  onReimprimirUltimo: () => void;
  onPausarVenda: () => void;
  onRecuperarVenda: () => void;
  onTrocaDevolucao: () => void;
  vendaPausada: boolean;
  ultimaVendaId?: string;
}

export function PDVToolbar({
  onCalculator,
  onDesconto,
  onClienteFiel,
  onConsultaPreco,
  onReimprimirUltimo,
  onPausarVenda,
  onRecuperarVenda,
  onTrocaDevolucao,
  vendaPausada,
  ultimaVendaId,
}: PDVToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 flex-wrap">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onCalculator}>
              <Calculator className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Calculadora (F3)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onDesconto}>
              <Percent className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Aplicar Desconto (F5)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onClienteFiel}>
              <Users className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cliente Fiel (F7)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onConsultaPreco}>
              <Tag className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Consulta de Preço (F8)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={vendaPausada ? onRecuperarVenda : onPausarVenda}
              className={vendaPausada ? "text-warning" : ""}
            >
              {vendaPausada ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {vendaPausada ? 'Recuperar Venda (F9)' : 'Pausar Venda (F9)'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onTrocaDevolucao}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Troca/Devolução (F10)</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mais Opções</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReimprimirUltimo} disabled={!ultimaVendaId}>
              <FileText className="w-4 h-4 mr-2" />
              Reimprimir Último Cupom
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onConsultaPreco}>
              <Package className="w-4 h-4 mr-2" />
              Consultar Estoque
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRecuperarVenda}>
              <Clock className="w-4 h-4 mr-2" />
              Vendas Pendentes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
