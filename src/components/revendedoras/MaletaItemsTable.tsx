import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MaletaItem, Peca } from '@/hooks/useSupabaseData';

interface MaletaItemsTableProps {
  items: (MaletaItem & { peca?: Peca })[];
  isOpen: boolean;
  onMarcarItem: (
    itemId: string,
    pecaId: string,
    status: 'pendente' | 'vendido' | 'devolvido',
    statusAnterior?: 'pendente' | 'vendido' | 'devolvido'
  ) => void;
  isLoading?: boolean;
}

export function MaletaItemsTable({
  items,
  isOpen,
  onMarcarItem,
  isLoading,
}: MaletaItemsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'vendido':
        return <Badge className="bg-success text-success-foreground">Vendido</Badge>;
      case 'devolvido':
        return <Badge variant="secondary">Devolvido</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">Nenhuma peça na maleta</p>
        <p className="text-sm">Adicione peças usando a busca acima</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "p-4 rounded-lg border",
              item.status === 'vendido' && "bg-success/5 border-success/30",
              item.status === 'devolvido' && "bg-muted/50"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{item.peca?.nome || 'Peça não encontrada'}</p>
                <p className="text-sm text-muted-foreground">{item.peca?.codigo || '-'}</p>
                <p className="text-sm font-medium mt-1">
                  {formatCurrency(item.peca?.preco_venda || 0)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(item.status || 'pendente')}
                {isOpen && item.status === 'pendente' && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-success hover:bg-success hover:text-success-foreground"
                      onClick={() => onMarcarItem(item.id, item.peca_id || '', 'vendido', item.status as any)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => onMarcarItem(item.id, item.peca_id || '', 'devolvido', item.status as any)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Peça</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead>Status</TableHead>
              {isOpen && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                className={cn(
                  item.status === 'vendido' && "bg-success/5",
                  item.status === 'devolvido' && "bg-muted/50"
                )}
              >
                <TableCell className="font-mono text-sm">
                  {item.peca?.codigo || '-'}
                </TableCell>
                <TableCell>{item.peca?.nome || 'Peça não encontrada'}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.peca?.preco_venda || 0)}
                </TableCell>
                <TableCell>{getStatusBadge(item.status || 'pendente')}</TableCell>
                {isOpen && (
                  <TableCell className="text-right">
                    {item.status === 'pendente' && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success hover:bg-success hover:text-success-foreground"
                          onClick={() => onMarcarItem(item.id, item.peca_id || '', 'vendido', item.status as any)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Vendido
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarcarItem(item.id, item.peca_id || '', 'devolvido', item.status as any)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Devolvido
                        </Button>
                      </div>
                    )}
                    {item.status !== 'pendente' && isOpen && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onMarcarItem(item.id, item.peca_id || '', 'pendente', item.status as any)}
                      >
                        Desfazer
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
