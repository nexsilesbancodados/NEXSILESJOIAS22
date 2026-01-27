import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, ChevronRight, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { useMaletaItems, type Maleta, type Peca } from '@/hooks/useSupabaseData';

interface MaletaListRowProps {
  maleta: Maleta;
  onClick: () => void;
  onEdit: () => void;
}

export function MaletaListRow({ maleta, onClick, onEdit }: MaletaListRowProps) {
  const { data: items = [], isLoading } = useMaletaItems(maleta.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calcularDiasRestantes = (prazo: string | null) => {
    if (!prazo) return null;
    const prazoDate = new Date(prazo);
    return differenceInDays(prazoDate, new Date());
  };

  const diasRestantes = maleta.data_devolucao 
    ? calcularDiasRestantes(String(maleta.data_devolucao)) 
    : null;
  const isVencida = diasRestantes !== null && diasRestantes < 0;
  const isVencendo = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 3;

  // Calculate totals from items
  const totalPecas = items.reduce((acc, item) => acc + (item.quantidade || 1), 0);
  const vendidas = items.filter(i => i.status === 'vendido').reduce((acc, i) => acc + (i.quantidade || 1), 0);
  const pendentes = items.filter(i => i.status === 'pendente').reduce((acc, i) => acc + (i.quantidade || 1), 0);
  
  const totalVendido = items
    .filter((item) => item.status === 'vendido')
    .reduce((acc, item) => acc + ((item.peca as Peca)?.preco_venda || 0) * (item.quantidade || 1), 0);

  return (
    <tr 
      className={cn(
        "hover:bg-muted/30 cursor-pointer transition-colors",
        isVencida && maleta.status === 'aberta' && "bg-destructive/5",
        isVencendo && maleta.status === 'aberta' && "bg-warning/5"
      )}
      onClick={onClick}
    >
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${maleta.cor_primaria || '#8B5CF6'}20, ${maleta.cor_secundaria || '#EC4899'}20)`
            }}
          >
            <Briefcase 
              className="w-4 h-4"
              style={{ color: maleta.cor_primaria || '#8B5CF6' }}
            />
          </div>
          <span className="font-medium">
            {maleta.nome || `Maleta #${maleta.id.slice(-4)}`}
          </span>
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Badge 
            variant={maleta.status === 'aberta' ? 'default' : 'secondary'}
            className={maleta.status === 'aberta' ? 'bg-success' : ''}
          >
            {maleta.status === 'aberta' ? 'Aberta' : 'Fechada'}
          </Badge>
          {maleta.status === 'aberta' && diasRestantes !== null && (
            <span className={cn(
              "text-xs",
              isVencida && "text-destructive",
              isVencendo && "text-warning",
              !isVencida && !isVencendo && "text-muted-foreground"
            )}>
              {isVencida 
                ? `Vencida há ${Math.abs(diasRestantes)}d` 
                : `${diasRestantes}d`
              }
            </span>
          )}
        </div>
      </td>
      <td className="p-3 text-center">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
        ) : (
          <div className="flex flex-col items-center">
            <span className="font-medium">{totalPecas}</span>
            <span className="text-xs text-muted-foreground">
              {vendidas} vend. • {pendentes} pend.
            </span>
          </div>
        )}
      </td>
      <td className="p-3 text-right">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin ml-auto text-muted-foreground" />
        ) : (
          <span className={cn(
            "font-medium",
            totalVendido > 0 && "text-success"
          )}>
            {formatCurrency(totalVendido)}
          </span>
        )}
      </td>
      <td className="p-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {maleta.status === 'aberta' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </td>
    </tr>
  );
}
