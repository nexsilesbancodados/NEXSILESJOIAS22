import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  History,
  Search,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  DollarSign,
  Percent,
  Filter,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MiniGradientCard } from '@/components/dashboard/MiniGradientCard';
import {
  useHistoricoPrecos,
  useAtualizarPrecosEmMassa,
  HistoricoPreco,
} from '@/hooks/useHistoricoPrecos';
import { usePecas } from '@/hooks/useSupabaseData';

const tipoPrecoLabels: Record<HistoricoPreco['tipo_preco'], string> = {
  custo: 'Custo',
  venda: 'Venda',
  revenda: 'Revenda',
  atacado: 'Atacado',
  promocional: 'Promocional',
};

const tipoPrecoColors: Record<HistoricoPreco['tipo_preco'], string> = {
  custo: 'bg-orange-500',
  venda: 'bg-green-500',
  revenda: 'bg-blue-500',
  atacado: 'bg-purple-500',
  promocional: 'bg-pink-500',
};

export default function HistoricoPrecosPage() {
  const { data: historico = [], isLoading } = useHistoricoPrecos();
  const { data: pecas = [] } = usePecas();
  const atualizarPrecosEmMassa = useAtualizarPrecosEmMassa();
  
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [selectedPecas, setSelectedPecas] = useState<string[]>([]);
  const [bulkForm, setBulkForm] = useState({
    tipoPreco: 'venda' as HistoricoPreco['tipo_preco'],
    percentual: '',
    motivo: '',
  });
  
  // Filter historico
  const historicoFiltrado = historico.filter((h) => {
    const matchSearch = 
      h.peca?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      h.peca?.codigo?.toLowerCase().includes(search.toLowerCase());
    
    const matchTipo = tipoFilter === 'todos' || h.tipo_preco === tipoFilter;
    
    return matchSearch && matchTipo;
  });
  
  // Stats
  const totalAlteracoes = historico.length;
  const aumentos = historico.filter(h => h.preco_novo > h.preco_anterior).length;
  const reducoes = historico.filter(h => h.preco_novo < h.preco_anterior).length;
  
  // Calculate average variation
  const variacaoMedia = historico.length > 0
    ? historico.reduce((acc, h) => {
        const variacao = ((h.preco_novo - h.preco_anterior) / h.preco_anterior) * 100;
        return acc + variacao;
      }, 0) / historico.length
    : 0;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  const calcVariacao = (anterior: number, novo: number) => {
    if (anterior === 0) return 0;
    return ((novo - anterior) / anterior) * 100;
  };
  
  const handleTogglePeca = (pecaId: string) => {
    setSelectedPecas(prev => 
      prev.includes(pecaId) 
        ? prev.filter(id => id !== pecaId)
        : [...prev, pecaId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedPecas.length === pecas.length) {
      setSelectedPecas([]);
    } else {
      setSelectedPecas(pecas.map(p => p.id));
    }
  };
  
  const handleBulkUpdate = async () => {
    if (selectedPecas.length === 0) {
      toast.error('Selecione pelo menos uma peça');
      return;
    }
    
    const percentual = parseFloat(bulkForm.percentual);
    if (isNaN(percentual) || percentual === 0) {
      toast.error('Informe um percentual válido');
      return;
    }
    
    try {
      await atualizarPrecosEmMassa.mutateAsync({
        pecaIds: selectedPecas,
        tipoPreco: bulkForm.tipoPreco,
        percentualAjuste: percentual,
        motivo: bulkForm.motivo || `Ajuste em massa: ${percentual > 0 ? '+' : ''}${percentual}%`,
      });
      setIsBulkUpdateOpen(false);
      setSelectedPecas([]);
      setBulkForm({ tipoPreco: 'venda', percentual: '', motivo: '' });
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Preços</h1>
          <p className="text-muted-foreground">Acompanhe todas as alterações de preço</p>
        </div>
        <Button onClick={() => setIsBulkUpdateOpen(true)} className="btn-gold">
          <Percent className="w-4 h-4 mr-2" />
          Ajuste em Massa
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MiniGradientCard
          icon={History}
          label="Total de Alterações"
          value={totalAlteracoes}
          gradient="from-blue-500 to-cyan-500"
        />
        <MiniGradientCard
          icon={TrendingUp}
          label="Aumentos"
          value={aumentos}
          gradient="from-green-500 to-emerald-500"
        />
        <MiniGradientCard
          icon={TrendingDown}
          label="Reduções"
          value={reducoes}
          gradient="from-red-500 to-orange-500"
        />
        <MiniGradientCard
          icon={Percent}
          label="Variação Média"
          value={`${variacaoMedia >= 0 ? '+' : ''}${variacaoMedia.toFixed(1)}%`}
          gradient="from-purple-500 to-pink-500"
        />
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por peça..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo de Preço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="custo">Custo</SelectItem>
            <SelectItem value="venda">Venda</SelectItem>
            <SelectItem value="revenda">Revenda</SelectItem>
            <SelectItem value="atacado">Atacado</SelectItem>
            <SelectItem value="promocional">Promocional</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Historico List */}
      <div className="space-y-4">
        {historicoFiltrado.length === 0 ? (
          <Card className="p-12 text-center">
            <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum histórico de preços</p>
            <p className="text-sm text-muted-foreground/60">
              As alterações serão registradas automaticamente
            </p>
          </Card>
        ) : (
          historicoFiltrado.map((item) => {
            const variacao = calcVariacao(item.preco_anterior, item.preco_novo);
            const isAumento = item.preco_novo > item.preco_anterior;
            
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Variation Icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      isAumento ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    )}>
                      {isAumento ? (
                        <ArrowUpRight className="w-6 h-6" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6" />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {item.peca?.nome || 'Peça removida'}
                        </h3>
                        <Badge className={cn('text-white', tipoPrecoColors[item.tipo_preco])}>
                          {tipoPrecoLabels[item.tipo_preco]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {item.peca?.codigo && (
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {item.peca.codigo}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                        {item.motivo && (
                          <span className="text-xs italic">"{item.motivo}"</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Prices */}
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-muted-foreground line-through text-sm">
                          {formatCurrency(item.preco_anterior)}
                        </span>
                        <span className="text-lg font-semibold">
                          {formatCurrency(item.preco_novo)}
                        </span>
                      </div>
                      <span className={cn(
                        'text-sm font-medium',
                        isAumento ? 'text-green-500' : 'text-red-500'
                      )}>
                        {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Bulk Update Dialog */}
      <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Ajuste de Preços em Massa</DialogTitle>
            <DialogDescription>
              Selecione as peças e defina o percentual de ajuste
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Tipo de Preço</Label>
              <Select
                value={bulkForm.tipoPreco}
                onValueChange={(v) => setBulkForm({ ...bulkForm, tipoPreco: v as HistoricoPreco['tipo_preco'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custo">Custo</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="revenda">Revenda</SelectItem>
                  <SelectItem value="atacado">Atacado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Percentual (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={bulkForm.percentual}
                onChange={(e) => setBulkForm({ ...bulkForm, percentual: e.target.value })}
                placeholder="-10 ou +15"
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <Input
                value={bulkForm.motivo}
                onChange={(e) => setBulkForm({ ...bulkForm, motivo: e.target.value })}
                placeholder="Reajuste anual..."
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <Label>Peças ({selectedPecas.length} selecionadas)</Label>
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedPecas.length === pecas.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </Button>
          </div>
          
          <ScrollArea className="flex-1 border rounded-lg p-4">
            <div className="space-y-2">
              {pecas.map((peca) => (
                <div
                  key={peca.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
                    selectedPecas.includes(peca.id) && 'bg-primary/10'
                  )}
                  onClick={() => handleTogglePeca(peca.id)}
                >
                  <Checkbox
                    checked={selectedPecas.includes(peca.id)}
                    onCheckedChange={() => handleTogglePeca(peca.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{peca.nome}</p>
                    <p className="text-xs text-muted-foreground">{peca.codigo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{formatCurrency(peca.preco_venda || peca.preco || 0)}</p>
                    {bulkForm.percentual && (
                      <p className={cn(
                        'text-xs',
                        parseFloat(bulkForm.percentual) > 0 ? 'text-green-500' : 'text-red-500'
                      )}>
                        → {formatCurrency((peca.preco_venda || peca.preco || 0) * (1 + parseFloat(bulkForm.percentual) / 100))}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsBulkUpdateOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkUpdate} 
              disabled={atualizarPrecosEmMassa.isPending || selectedPecas.length === 0}
              className="btn-gold"
            >
              {atualizarPrecosEmMassa.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Aplicar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
