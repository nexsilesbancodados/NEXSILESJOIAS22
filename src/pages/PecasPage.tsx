import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Gem, Package, Loader2, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, Wand2, Keyboard, AlertTriangle, ShoppingBag, Upload } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { usePecas, useAddPeca, useUpdatePeca, useDeletePeca, useFornecedores } from '@/hooks/useSupabaseData';
import { ImageUpload } from '@/components/ImageUpload';
import { toast } from 'sonner';
import { MiniGradientCard } from '@/components/dashboard/MiniGradientCard';
import { MeusPedidosTab } from '@/components/pecas/MeusPedidosTab';
import { ShareCatalogDropdown } from '@/components/catalogo/ShareCatalogDropdown';
import { ImportacaoModal } from '@/components/pecas/ImportacaoModal';
import { ReadOnlyGuard } from '@/components/subscription/ReadOnlyGuard';
import { useSubscriptionSafe } from '@/contexts/SubscriptionContext';

const CATEGORIAS = [
  'Anel', 'Brinco', 'Pulseira', 'Colar', 'Corrente', 'Chocker', 'Gargantilha', 
  'Tornozeleira', 'Bracelete', 'Conjunto', 'Elo', 'Escapulário', 
  'Pingente', 'Tarraxa', 'Outros'
];

const BANHOS = [
  'Prata', 'Ouro', 'Ródio Branco', 'Ródio Negro', 'Grafite', 
  'Prata 925', 'Prata 700', 'Prata 950', 'Aço', 'Aço Dourado', 
  'Couro', 'Níquel', 'Moeda Antiga', 'Rosé', 'Platina', 
  'Bruto', 'Mix de Banho', 'Diamante', 'Ouro Branco'
];

export default function PecasPage() {
  const { data: pecas = [], isLoading } = usePecas();
  const { data: fornecedores = [] } = useFornecedores();
  const { isReadOnly } = useSubscriptionSafe();
  const addPeca = useAddPeca();
  const updatePeca = useUpdatePeca();
  const deletePeca = useDeletePeca();
  
  const [activeTab, setActiveTab] = useState('pecas');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterBanho, setFilterBanho] = useState('');
  const [filterFornecedor, setFilterFornecedor] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<'nome' | 'preco_venda' | 'estoque' | 'created_at'>('nome');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedPeca, setSelectedPeca] = useState<typeof pecas[0] | null>(null);
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  const generateCode = () => {
    const prefix = formData.categoria ? formData.categoria.substring(0, 3).toUpperCase() : 'PCA';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    estoque: '',
    estoque_minimo: '',
    preco_custo: '',
    preco_venda: '',
    preco_promocional: '',
    preco_atacado: '',
    qtd_min_atacado: '',
    categoria: '',
    subcategoria: '',
    material: '',
    fornecedor_id: '',
    imagem_url: '',
    imagem_url_2: '',
    descricao: '',
  });

  const activeFiltersCount = [filterCategoria, filterBanho, filterFornecedor].filter(f => f && f !== 'all').length;

  const clearFilters = () => {
    setFilterCategoria('');
    setFilterBanho('');
    setFilterFornecedor('');
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" /> 
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const filteredPecas = pecas
    .filter((peca) => {
      const matchesSearch =
        peca.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peca.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategoria = !filterCategoria || filterCategoria === 'all' || peca.categoria === filterCategoria;
      const matchesMaterial = !filterBanho || filterBanho === 'all' || peca.material === filterBanho;
      const matchesFornecedor = !filterFornecedor || filterFornecedor === 'all' || peca.fornecedor_id === filterFornecedor;
      
      return matchesSearch && matchesCategoria && matchesMaterial && matchesFornecedor;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'nome':
          comparison = a.nome.localeCompare(b.nome);
          break;
        case 'preco_venda':
          comparison = a.preco_venda - b.preco_venda;
          break;
        case 'estoque':
          comparison = a.estoque - b.estoque;
          break;
        case 'created_at':
          const dateA = a.created_at || '';
          const dateB = b.created_at || '';
          comparison = dateA.localeCompare(dateB);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleOpenForm = (peca?: typeof pecas[0]) => {
    if (peca) {
      setSelectedPeca(peca);
      setFormData({
        nome: peca.nome,
        codigo: peca.codigo,
        estoque: peca.estoque.toString(),
        estoque_minimo: (peca.estoque_minimo || 5).toString(),
        preco_custo: peca.preco_custo.toString(),
        preco_venda: peca.preco_venda.toString(),
        preco_promocional: (peca as any).preco_promocional?.toString() || '',
        preco_atacado: (peca as any).preco_atacado?.toString() || '',
        qtd_min_atacado: (peca as any).qtd_min_atacado?.toString() || '',
        categoria: peca.categoria || '',
        subcategoria: peca.subcategoria || '',
        material: peca.material || '',
        fornecedor_id: peca.fornecedor_id || '',
        imagem_url: peca.imagem_url || '',
        imagem_url_2: (peca as any).imagem_url_2 || '',
        descricao: peca.descricao || '',
      });
    } else {
      setSelectedPeca(null);
      setAutoGenerateCode(true);
      const initialCode = `PCA-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      setFormData({
        nome: '',
        codigo: initialCode,
        estoque: '',
        estoque_minimo: '5',
        preco_custo: '',
        preco_venda: '',
        preco_promocional: '',
        preco_atacado: '',
        qtd_min_atacado: '3',
        categoria: '',
        subcategoria: '',
        material: '',
        fornecedor_id: '',
        imagem_url: '',
        imagem_url_2: '',
        descricao: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!formData.codigo.trim()) {
      toast.error('Código é obrigatório');
      return;
    }

    // Verificar se código já existe (para nova peça)
    if (!selectedPeca) {
      const codigoExiste = pecas.some(p => p.codigo.toLowerCase() === formData.codigo.toLowerCase().trim());
      if (codigoExiste) {
        toast.error('Já existe uma peça com este código. Use um código diferente.');
        return;
      }
    }

    // Verificar se código já existe em outra peça (para edição)
    if (selectedPeca) {
      const codigoExiste = pecas.some(p => 
        p.codigo.toLowerCase() === formData.codigo.toLowerCase().trim() && 
        p.id !== selectedPeca.id
      );
      if (codigoExiste) {
        toast.error('Já existe outra peça com este código. Use um código diferente.');
        return;
      }
    }

    const pecaData = {
      nome: formData.nome.trim(),
      codigo: formData.codigo.trim(),
      estoque: parseInt(formData.estoque) || 0,
      estoque_minimo: parseInt(formData.estoque_minimo) || 5,
      preco_custo: parseFloat(formData.preco_custo) || 0,
      preco_venda: parseFloat(formData.preco_venda) || 0,
      preco_revenda: parseFloat(formData.preco_venda) || 0,
      categoria: formData.categoria || null,
      subcategoria: formData.subcategoria || null,
      material: formData.material || null,
      fornecedor_id: formData.fornecedor_id || null,
      imagem_url: formData.imagem_url || null,
      descricao: formData.descricao || null,
      peso: null,
      ativo: true,
    };

    try {
      if (selectedPeca) {
        await updatePeca.mutateAsync({ id: selectedPeca.id, ...pecaData });
        toast.success('Peça atualizada com sucesso!');
      } else {
        await addPeca.mutateAsync(pecaData);
        toast.success('Peça cadastrada com sucesso!');
      }
      setIsFormOpen(false);
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('Código já existe. Use um código diferente.');
      } else {
        toast.error('Erro ao salvar peça. Tente novamente.');
      }
    }
  };

  const handleDelete = async () => {
    if (selectedPeca) {
      await deletePeca.mutateAsync(selectedPeca.id);
    }
    setIsDeleteOpen(false);
    setSelectedPeca(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
              <Gem className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Peças</h1>
              <p className="text-sm text-muted-foreground">Seu inventário digital de semijoias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="pecas" className="gap-2">
              <Package className="w-4 h-4" />
              Estoque
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Meus Pedidos
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'pedidos' && <ShareCatalogDropdown />}
        </div>

        <TabsContent value="pecas" className="space-y-6 mt-0">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MiniGradientCard
          title="Total de Peças"
          value={pecas.length}
          icon={Package}
          gradient="purple"
        />
        <MiniGradientCard
          title="Em Estoque"
          value={pecas.reduce((acc, p) => acc + p.estoque, 0).toLocaleString('pt-BR')}
          icon={Gem}
          gradient="teal"
        />
        <MiniGradientCard
          title="Estoque Baixo"
          value={pecas.filter((p) => p.estoque <= (p.estoque_minimo || 5)).length}
          icon={AlertTriangle}
          gradient="orange"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-search"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "relative",
              activeFiltersCount > 0 && "border-primary text-primary"
            )}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          <ReadOnlyGuard>
            <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Importar CSV
            </Button>
          </ReadOnlyGuard>
          <ReadOnlyGuard>
            <Button onClick={() => handleOpenForm()} className="btn-gold">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Peça
            </Button>
          </ReadOnlyGuard>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="glass-card rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Filtros Avançados</h3>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Categoria</Label>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Material</Label>
                <Select value={filterBanho} onValueChange={setFilterBanho}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os materiais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os materiais</SelectItem>
                    {BANHOS.map((mat) => (
                      <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Fornecedor</Label>
                <Select value={filterFornecedor} onValueChange={setFilterFornecedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os fornecedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os fornecedores</SelectItem>
                    {fornecedores.map((forn) => (
                      <SelectItem key={forn.id} value={forn.id}>{forn.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium text-foreground">{filteredPecas.length}</span> de <span className="font-medium text-foreground">{pecas.length}</span> peças
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-16">Imagem</TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort('nome')} 
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Nome {getSortIcon('nome')}
                </button>
              </TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">
                <button 
                  onClick={() => handleSort('preco_venda')} 
                  className="flex items-center justify-end hover:text-foreground transition-colors ml-auto"
                >
                  Venda {getSortIcon('preco_venda')}
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button 
                  onClick={() => handleSort('estoque')} 
                  className="flex items-center justify-center hover:text-foreground transition-colors mx-auto"
                >
                  Estoque {getSortIcon('estoque')}
                </button>
              </TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort('created_at')} 
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Cadastro {getSortIcon('created_at')}
                </button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPecas.map((peca) => (
              <TableRow 
                key={peca.id} 
                className="border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <TableCell>
                  <img
                    src={peca.imagem_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'}
                    alt={peca.nome}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium">{peca.nome}</TableCell>
                <TableCell className="text-muted-foreground">{peca.codigo}</TableCell>
                <TableCell className="text-muted-foreground">{peca.categoria || '-'}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(peca.preco_custo)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(peca.preco_venda)}
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(peca.estoque <= (peca.estoque_minimo || 5) ? 'stock-low' : 'stock-ok')}>
                    {peca.estoque}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {peca.created_at ? new Date(peca.created_at).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => handleOpenForm(peca)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedPeca(peca);
                          setIsDeleteOpen(true);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredPecas.length === 0 && (
          <div className="p-12 text-center">
            <Gem className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma peça encontrada</p>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {selectedPeca ? 'Editar Peça' : 'Nova Peça'}
            </DialogTitle>
            <DialogDescription>
              {selectedPeca
                ? 'Atualize as informações da peça'
                : 'Preencha os dados para adicionar uma nova peça ao estoque'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
              <TabsTrigger value="precos" className="flex-1">Preços</TabsTrigger>
              <TabsTrigger value="imagens" className="flex-1">Imagens</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Colar Pérolas"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="codigo">Código/SKU *</Label>
                    {!selectedPeca && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {autoGenerateCode ? (
                            <>
                              <Wand2 className="w-3 h-3" />
                              Auto
                            </>
                          ) : (
                            <>
                              <Keyboard className="w-3 h-3" />
                              Manual
                            </>
                          )}
                        </span>
                        <Switch
                          checked={autoGenerateCode}
                          onCheckedChange={(checked) => {
                            setAutoGenerateCode(checked);
                            if (checked) {
                              setFormData({ ...formData, codigo: generateCode() });
                            } else {
                              setFormData({ ...formData, codigo: '' });
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder={autoGenerateCode ? "Código gerado automaticamente" : "Digite o código"}
                      disabled={autoGenerateCode && !selectedPeca}
                      className={cn(autoGenerateCode && !selectedPeca && "bg-muted")}
                    />
                    {autoGenerateCode && !selectedPeca && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                        onClick={() => setFormData({ ...formData, codigo: generateCode() })}
                      >
                        <Wand2 className="w-3 h-3 mr-1" />
                        Novo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Select
                    value={formData.material}
                    onValueChange={(value) => setFormData({ ...formData, material: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANHOS.map((mat) => (
                        <SelectItem key={mat} value={mat}>
                          {mat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Select
                    value={formData.fornecedor_id}
                    onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição da peça..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estoque">Estoque *</Label>
                  <Input
                    id="estoque"
                    type="number"
                    value={formData.estoque}
                    onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                  <Input
                    id="estoque_minimo"
                    type="number"
                    value={formData.estoque_minimo}
                    onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                    placeholder="5"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="precos" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_custo">Preço de Custo *</Label>
                  <Input
                    id="preco_custo"
                    type="number"
                    step="0.01"
                    value={formData.preco_custo}
                    onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
                    placeholder="45.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco_venda">Preço de Venda *</Label>
                  <Input
                    id="preco_venda"
                    type="number"
                    step="0.01"
                    value={formData.preco_venda}
                    onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                    placeholder="89.90"
                  />
                </div>
              </div>
              
              <div className="border-t border-border/50 pt-4 mt-4">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Preço Promocional
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="preco_promocional">Preço Promocional</Label>
                  <Input
                    id="preco_promocional"
                    type="number"
                    step="0.01"
                    value={formData.preco_promocional}
                    onChange={(e) => setFormData({ ...formData, preco_promocional: e.target.value })}
                    placeholder="69.90"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco se não houver promoção. Este preço aparecerá destacado na etiqueta.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-border/50 pt-4 mt-4">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Preço Atacado
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preco_atacado">Preço Atacado</Label>
                    <Input
                      id="preco_atacado"
                      type="number"
                      step="0.01"
                      value={formData.preco_atacado}
                      onChange={(e) => setFormData({ ...formData, preco_atacado: e.target.value })}
                      placeholder="75.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qtd_min_atacado">Qtd. Mínima p/ Atacado</Label>
                    <Input
                      id="qtd_min_atacado"
                      type="number"
                      min="1"
                      value={formData.qtd_min_atacado}
                      onChange={(e) => setFormData({ ...formData, qtd_min_atacado: e.target.value })}
                      placeholder="3"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  O preço atacado será aplicado quando a quantidade for igual ou maior que a quantidade mínima.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="imagens" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <ImageUpload
                  label="Imagem Principal"
                  value={formData.imagem_url}
                  onChange={(url) => setFormData({ ...formData, imagem_url: url })}
                />
                <ImageUpload
                  label="Segunda Imagem"
                  value={formData.imagem_url_2}
                  onChange={(url) => setFormData({ ...formData, imagem_url_2: url })}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="btn-gold"
              disabled={addPeca.isPending || updatePeca.isPending}
            >
              {(addPeca.isPending || updatePeca.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {selectedPeca ? 'Salvar Alterações' : 'Adicionar Peça'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A peça "{selectedPeca?.nome}" será removida
              permanentemente do seu inventário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </TabsContent>

        <TabsContent value="pedidos" className="mt-0">
          <MeusPedidosTab />
        </TabsContent>
      </Tabs>

      {/* Modal de Importação CSV */}
      <ImportacaoModal open={isImportOpen} onOpenChange={setIsImportOpen} />
    </div>
  );
}
