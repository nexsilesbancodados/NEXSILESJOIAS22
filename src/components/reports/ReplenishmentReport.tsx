import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Search,
  Loader2,
  PackageX,
  TrendingDown,
  ShoppingCart,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { exportToCSV, exportToPDF, formatCurrency } from '@/lib/export';
import { cn } from '@/lib/utils';
import type { Peca, Fornecedor } from '@/hooks/useSupabaseData';

interface ReplenishmentReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pecas: Peca[];
  fornecedores: Fornecedor[];
}

type ReplenishmentStatus = 'esgotado' | 'baixo';

interface ReplenishmentItem {
  id: string;
  codigo: string | null;
  nome: string;
  categoria: string | null;
  fornecedor_id: string | null;
  estoque: number;
  estoque_minimo: number;
  preco_custo: number | null;
  status: ReplenishmentStatus;
  quantidadeRepor: number;
  fornecedorNome: string;
}

export function ReplenishmentReport({
  open,
  onOpenChange,
  pecas,
  fornecedores,
}: ReplenishmentReportProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'esgotado' | 'baixo'>('all');
  const [filterFornecedor, setFilterFornecedor] = useState<string>('all');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Get unique categories
  const categorias = useMemo(() => {
    const cats = new Set<string>();
    pecas.forEach(p => {
      if (p.categoria) cats.add(p.categoria);
    });
    return Array.from(cats).sort();
  }, [pecas]);

  // Calculate replenishment items
  const replenishmentItems = useMemo((): ReplenishmentItem[] => {
    return pecas
      .filter(peca => {
        const estoque = peca.estoque ?? 0;
        const estoqueMinimo = peca.estoque_minimo ?? 5;
        // Include if out of stock or below minimum
        return estoque === 0 || estoque < estoqueMinimo;
      })
      .map(peca => {
        const estoque = peca.estoque ?? 0;
        const estoqueMinimo = peca.estoque_minimo ?? 5;
        const fornecedor = fornecedores.find(f => f.id === peca.fornecedor_id);
        
        // Calculate quantity to replenish (up to double the minimum to avoid frequent reorders)
        const quantidadeIdeal = Math.max(estoqueMinimo * 2, 10);
        const quantidadeRepor = Math.max(quantidadeIdeal - estoque, 1);

        const status: ReplenishmentStatus = estoque === 0 ? 'esgotado' : 'baixo';

        return {
          id: peca.id,
          codigo: peca.codigo,
          nome: peca.nome,
          categoria: peca.categoria,
          fornecedor_id: peca.fornecedor_id,
          estoque,
          estoque_minimo: estoqueMinimo,
          preco_custo: peca.preco_custo,
          status,
          quantidadeRepor,
          fornecedorNome: fornecedor?.nome ?? '',
        };
      })
      .sort((a, b) => {
        // Sort by status (out of stock first), then by stock level
        if (a.status !== b.status) {
          return a.status === 'esgotado' ? -1 : 1;
        }
        return a.estoque - b.estoque;
      });
  }, [pecas, fornecedores]);

  // Apply filters
  const filteredItems = useMemo(() => {
    return replenishmentItems.filter(item => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          item.nome?.toLowerCase().includes(search) ||
          item.codigo?.toLowerCase().includes(search) ||
          item.categoria?.toLowerCase().includes(search) ||
          item.fornecedorNome?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;

      // Fornecedor filter
      if (filterFornecedor !== 'all' && item.fornecedor_id !== filterFornecedor) return false;

      // Categoria filter
      if (filterCategoria !== 'all' && item.categoria !== filterCategoria) return false;

      return true;
    });
  }, [replenishmentItems, searchTerm, filterStatus, filterFornecedor, filterCategoria]);

  // Summary stats
  const stats = useMemo(() => {
    const esgotados = filteredItems.filter(i => i.status === 'esgotado').length;
    const baixos = filteredItems.filter(i => i.status === 'baixo').length;
    const custoTotal = filteredItems.reduce((acc, item) => {
      return acc + (item.preco_custo ?? 0) * item.quantidadeRepor;
    }, 0);
    return { esgotados, baixos, total: esgotados + baixos, custoTotal };
  }, [filteredItems]);

  // Toggle item selection
  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Toggle all items
  const toggleAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(i => i.id)));
    }
  };

  // Get items to export (selected or all filtered)
  const getExportItems = () => {
    if (selectedItems.size > 0) {
      return filteredItems.filter(i => selectedItems.has(i.id));
    }
    return filteredItems;
  };

  // Export to CSV
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const items = getExportItems();
      
      // Add calculated field and convert to exportable format
      const dataWithCusto = items.map(item => ({
        codigo: item.codigo ?? '',
        nome: item.nome,
        categoria: item.categoria ?? '-',
        fornecedorNome: item.fornecedorNome || '-',
        status: item.status === 'esgotado' ? 'ESGOTADO' : 'ESTOQUE BAIXO',
        estoque: item.estoque,
        estoque_minimo: item.estoque_minimo,
        quantidadeRepor: item.quantidadeRepor,
        preco_custo: item.preco_custo ?? 0,
        custoReposicao: (item.preco_custo ?? 0) * item.quantidadeRepor,
      }));

      const columns = [
        { header: 'Código', accessor: 'codigo', format: (v: unknown) => String(v ?? '') },
        { header: 'Nome', accessor: 'nome', format: (v: unknown) => String(v ?? '') },
        { header: 'Categoria', accessor: 'categoria', format: (v: unknown) => String(v ?? '-') },
        { header: 'Fornecedor', accessor: 'fornecedorNome', format: (v: unknown) => String(v ?? '-') },
        { header: 'Status', accessor: 'status', format: (v: unknown) => String(v ?? '') },
        { header: 'Estoque Atual', accessor: 'estoque', format: (v: unknown) => String(v ?? 0) },
        { header: 'Estoque Mínimo', accessor: 'estoque_minimo', format: (v: unknown) => String(v ?? 5) },
        { header: 'Qtd. Repor', accessor: 'quantidadeRepor', format: (v: unknown) => String(v ?? 0) },
        { header: 'Preço Custo', accessor: 'preco_custo', format: (v: unknown) => formatCurrency(v) },
        { header: 'Custo Total Reposição', accessor: 'custoReposicao', format: (v: unknown) => formatCurrency(v) },
      ];

      const filename = `reposicao-estoque-${format(new Date(), 'yyyy-MM-dd')}`;
      exportToCSV(dataWithCusto, columns, filename);
      toast.success(`${items.length} itens exportados para CSV!`);
    } catch (error) {
      toast.error('Erro ao exportar CSV');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const items = getExportItems();
      
      // Convert to exportable format
      const dataForPdf = items.map(item => ({
        codigo: item.codigo ?? '',
        nome: item.nome,
        fornecedorNome: item.fornecedorNome || '-',
        status: item.status === 'esgotado' ? 'ESGOTADO' : 'BAIXO',
        estoque: item.estoque,
        quantidadeRepor: item.quantidadeRepor,
        preco_custo: item.preco_custo ?? 0,
      }));

      const columns = [
        { header: 'Código', accessor: 'codigo', format: (v: unknown) => String(v ?? '') },
        { header: 'Nome', accessor: 'nome', format: (v: unknown) => String(v ?? '') },
        { header: 'Fornecedor', accessor: 'fornecedorNome', format: (v: unknown) => String(v ?? '-') },
        { header: 'Status', accessor: 'status', format: (v: unknown) => String(v ?? '') },
        { header: 'Estoque', accessor: 'estoque', format: (v: unknown) => String(v ?? 0) },
        { header: 'Repor', accessor: 'quantidadeRepor', format: (v: unknown) => String(v ?? 0) },
        { header: 'Custo Unit.', accessor: 'preco_custo', format: (v: unknown) => formatCurrency(v) },
      ];

      const filename = `reposicao-estoque-${format(new Date(), 'yyyy-MM-dd')}`;
      exportToPDF(dataForPdf, columns, filename, 'Relatório de Reposição de Estoque');
      toast.success(`${items.length} itens exportados para PDF!`);
    } catch (error) {
      toast.error('Erro ao exportar PDF');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Relatório de Reposição de Estoque
          </DialogTitle>
          <DialogDescription>
            Peças esgotadas ou com estoque abaixo do mínimo que precisam de reposição
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-3 flex items-center gap-3">
              <PackageX className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Esgotados</p>
                <p className="text-xl font-bold text-destructive">{stats.esgotados}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-warning/10 border-warning/20">
            <CardContent className="p-3 flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-warning" />
              <div>
                <p className="text-xs text-muted-foreground">Estoque Baixo</p>
                <p className="text-xl font-bold text-warning">{stats.baixos}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Itens</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-3 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Custo Estimado</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(stats.custoTotal)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, nome, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="esgotado">Esgotados</SelectItem>
              <SelectItem value="baixo">Estoque Baixo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterFornecedor} onValueChange={setFilterFornecedor}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Fornecedores</SelectItem>
              {fornecedores.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categorias.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <ScrollArea className="flex-1 border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead className="text-center">Mínimo</TableHead>
                <TableHead className="text-center">Repor</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma peça precisa de reposição</p>
                    <p className="text-sm">Todos os itens estão com estoque adequado</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      selectedItems.has(item.id) && 'bg-primary/5',
                      item.status === 'esgotado' && 'bg-destructive/5'
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.codigo || '-'}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{item.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{item.categoria || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{item.fornecedorNome || '-'}</TableCell>
                    <TableCell className="text-center">
                      {item.status === 'esgotado' ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Esgotado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                          Baixo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{item.estoque}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{item.estoque_minimo}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-bold">
                        +{item.quantidadeRepor}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.preco_custo ?? 0)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedItems.size > 0 ? (
              <span><strong>{selectedItems.size}</strong> itens selecionados para exportação</span>
            ) : (
              <span><strong>{filteredItems.length}</strong> itens serão exportados</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isExporting || filteredItems.length === 0}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-success" />
              )}
              Exportar CSV
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={isExporting || filteredItems.length === 0}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Exportar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
