import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Link2, 
  Package,
  Settings,
  Copy,
  ExternalLink,
  Loader2,
  ChevronRight,
  X,
  ShoppingBag,
  ImageIcon,
  Check,
  PlusCircle,
  Wand2,
  Keyboard
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { MiniGradientCard } from '@/components/dashboard/MiniGradientCard';
import { useCatalogos, useAddCatalogo, useUpdateCatalogo, useDeleteCatalogo, useCatalogoItems, useAddCatalogoItem, useDeleteCatalogoItem, usePecas, useAddPeca, useFornecedores } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import { PedidosCatalogoList } from '@/components/catalogo/PedidosCatalogoList';
import { ShareCatalogButton } from '@/components/catalogo/ShareCatalogButton';
import { ImageUpload } from '@/components/ImageUpload';
import { ReadOnlyGuard } from '@/components/subscription/ReadOnlyGuard';

const STATUS_OPTIONS = [
  { value: 'em_preparacao', label: 'Em Preparação', color: 'bg-yellow-500/20 text-yellow-600' },
  { value: 'aberto', label: 'Aberto e Pronto', color: 'bg-green-500/20 text-green-600' },
  { value: 'em_fabricacao', label: 'Em Fabricação', color: 'bg-blue-500/20 text-blue-600' },
  { value: 'fechado', label: 'Fechado', color: 'bg-gray-500/20 text-gray-600' },
  { value: 'separacao', label: 'Separação de Peças', color: 'bg-purple-500/20 text-purple-600' },
  { value: 'envio_liberado', label: 'Envio Liberado', color: 'bg-teal-500/20 text-teal-600' },
  { value: 'bloqueado', label: 'Bloqueado', color: 'bg-red-500/20 text-red-600' },
  { value: 'finalizado', label: 'Finalizado', color: 'bg-emerald-500/20 text-emerald-600' },
];

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

export default function CatalogosPage() {
  const { data: catalogos = [], isLoading } = useCatalogos();
  const { data: pecas = [] } = usePecas({ includeCatalogOnly: true });
  const { data: fornecedores = [] } = useFornecedores();
  const addCatalogo = useAddCatalogo();
  const updateCatalogo = useUpdateCatalogo();
  const deleteCatalogo = useDeleteCatalogo();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [isPedidosOpen, setIsPedidosOpen] = useState(false);
  const [selectedCatalogo, setSelectedCatalogo] = useState<typeof catalogos[0] | null>(null);
  const [searchPeca, setSearchPeca] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    status: 'em_preparacao',
    observacao: '',
    custo_separacao: '',
    custo_operacional: '',
    taxa_entrega: '',
    imagem_url: '',
    pedido_minimo_pecas: '0',
    // Customization fields
    logo_url: '',
    cor_primaria: '#D4AF37',
    cor_secundaria: '#1a1a2e',
    titulo: '',
    descricao: '',
    mensagem_boas_vindas: '',
    whatsapp: '',
    email_contato: '',
    banner_url: '',
  });

  const filteredCatalogos = catalogos.filter(
    (cat) => cat.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenForm = (catalogo?: typeof catalogos[0]) => {
    if (catalogo) {
      setSelectedCatalogo(catalogo);
      setFormData({
        nome: catalogo.nome,
        status: catalogo.status,
        observacao: catalogo.observacao || '',
        custo_separacao: (catalogo.custo_separacao || 0).toString(),
        custo_operacional: (catalogo.custo_operacional || 0).toString(),
        taxa_entrega: (catalogo.taxa_entrega || 0).toString(),
        imagem_url: (catalogo as any).imagem_url || '',
        pedido_minimo_pecas: ((catalogo as any).pedido_minimo_pecas || 0).toString(),
        logo_url: catalogo.logo_url || '',
        cor_primaria: catalogo.cor_primaria || '#D4AF37',
        cor_secundaria: catalogo.cor_secundaria || '#1a1a2e',
        titulo: catalogo.titulo || '',
        descricao: catalogo.descricao || '',
        mensagem_boas_vindas: catalogo.mensagem_boas_vindas || '',
        whatsapp: catalogo.whatsapp || '',
        email_contato: catalogo.email_contato || '',
        banner_url: catalogo.banner_url || '',
      });
    } else {
      setSelectedCatalogo(null);
      setFormData({
        nome: '',
        status: 'em_preparacao',
        observacao: '',
        custo_separacao: '0',
        custo_operacional: '0',
        taxa_entrega: '0',
        imagem_url: '',
        pedido_minimo_pecas: '0',
        logo_url: '',
        cor_primaria: '#D4AF37',
        cor_secundaria: '#1a1a2e',
        titulo: '',
        descricao: '',
        mensagem_boas_vindas: '',
        whatsapp: '',
        email_contato: '',
        banner_url: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    const data = {
      nome: formData.nome,
      status: formData.status,
      observacao: formData.observacao || null,
      custo_separacao: parseFloat(formData.custo_separacao) || 0,
      custo_operacional: parseFloat(formData.custo_operacional) || 0,
      taxa_entrega: parseFloat(formData.taxa_entrega) || 0,
      imagem_url: formData.imagem_url || null,
      pedido_minimo_pecas: parseInt(formData.pedido_minimo_pecas) || 0,
    };

    if (selectedCatalogo) {
      await updateCatalogo.mutateAsync({ id: selectedCatalogo.id, ...data });
    } else {
      await addCatalogo.mutateAsync(data);
    }
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (selectedCatalogo) {
      await deleteCatalogo.mutateAsync(selectedCatalogo.id);
    }
    setIsDeleteOpen(false);
    setSelectedCatalogo(null);
  };

  const handleOpenConfig = (catalogo: typeof catalogos[0]) => {
    setSelectedCatalogo(catalogo);
    setFormData({
      nome: catalogo.nome,
      status: catalogo.status,
      observacao: catalogo.observacao || '',
      custo_separacao: (catalogo.custo_separacao || 0).toString(),
      custo_operacional: (catalogo.custo_operacional || 0).toString(),
      taxa_entrega: (catalogo.taxa_entrega || 0).toString(),
      imagem_url: (catalogo as any).imagem_url || '',
      pedido_minimo_pecas: ((catalogo as any).pedido_minimo_pecas || 0).toString(),
      logo_url: catalogo.logo_url || '',
      cor_primaria: catalogo.cor_primaria || '#D4AF37',
      cor_secundaria: catalogo.cor_secundaria || '#1a1a2e',
      titulo: catalogo.titulo || '',
      descricao: catalogo.descricao || '',
      mensagem_boas_vindas: catalogo.mensagem_boas_vindas || '',
      whatsapp: catalogo.whatsapp || '',
      email_contato: catalogo.email_contato || '',
      banner_url: catalogo.banner_url || '',
    });
    setIsConfigOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedCatalogo) return;
    
    await updateCatalogo.mutateAsync({
      id: selectedCatalogo.id,
      custo_separacao: parseFloat(formData.custo_separacao) || 0,
      custo_operacional: parseFloat(formData.custo_operacional) || 0,
      taxa_entrega: parseFloat(formData.taxa_entrega) || 0,
      observacao: formData.observacao || null,
      logo_url: formData.logo_url || null,
      cor_primaria: formData.cor_primaria || '#D4AF37',
      cor_secundaria: formData.cor_secundaria || '#1a1a2e',
      titulo: formData.titulo || null,
      descricao: formData.descricao || null,
      mensagem_boas_vindas: formData.mensagem_boas_vindas || null,
      whatsapp: formData.whatsapp || null,
      email_contato: formData.email_contato || null,
      banner_url: formData.banner_url || null,
    });
    setIsConfigOpen(false);
  };

  const handleStatusChange = async (catalogoId: string, newStatus: string) => {
    await updateCatalogo.mutateAsync({ id: catalogoId, status: newStatus });
  };

  const handleCopyLink = (catalogoId: string) => {
    const link = `${window.location.origin}/catalogo/${catalogoId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
            <Link2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Catálogos</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus links de compra</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MiniGradientCard
          title="Em Preparação"
          value={catalogos.filter(c => c.status === 'em_preparacao').length}
          icon={Package}
          gradient="orange"
        />
        <MiniGradientCard
          title="Aberto"
          value={catalogos.filter(c => c.status === 'aberto').length}
          icon={Package}
          gradient="teal"
        />
        <MiniGradientCard
          title="Em Fabricação"
          value={catalogos.filter(c => c.status === 'em_fabricacao').length}
          icon={Package}
          gradient="cyan"
        />
        <MiniGradientCard
          title="Finalizado"
          value={catalogos.filter(c => c.status === 'fechado' || c.status === 'finalizado').length}
          icon={Package}
          gradient="purple"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar catálogo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-search"
          />
        </div>
        <ReadOnlyGuard>
          <Button onClick={() => handleOpenForm()} className="btn-gold">
            <Plus className="w-4 h-4 mr-2" />
            Novo Catálogo
          </Button>
        </ReadOnlyGuard>
      </div>

      {/* Catalogos Grid */}
      <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
        {filteredCatalogos.length === 0 ? (
          <div className="col-span-full p-12 text-center glass-card rounded-xl">
            <Link2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum catálogo encontrado</p>
          </div>
        ) : (
          filteredCatalogos.map((catalogo) => {
            const statusInfo = getStatusInfo(catalogo.status);
            return (
              <Card key={catalogo.id} className="glass-card hover-lift overflow-hidden">
                {(catalogo as any).imagem_url && (
                  <div className="relative h-32 w-full">
                    <img 
                      src={(catalogo as any).imagem_url} 
                      alt={catalogo.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold">
                        {catalogo.nome}
                      </CardTitle>
                      <Badge className={cn('text-xs', statusInfo.color)}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShareCatalogButton 
                        catalogoId={catalogo.id} 
                        catalogoNome={catalogo.nome}
                        catalogoSlug={catalogo.slug}
                        variant="icon" 
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleOpenForm(catalogo)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenConfig(catalogo)}>
                            <Settings className="w-4 h-4 mr-2" />
                            Configurações
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedCatalogo(catalogo);
                            setIsItemsOpen(true);
                          }}>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Adicionar Peças
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedCatalogo(catalogo);
                            setIsItemsOpen(true);
                          }}>
                            <Package className="w-4 h-4 mr-2" />
                            Romaneio de Compras
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedCatalogo(catalogo);
                            setIsPedidosOpen(true);
                          }}>
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Pedidos Recebidos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(catalogo.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCatalogo(catalogo);
                              setIsDeleteOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {catalogo.observacao && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {catalogo.observacao}
                    </p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Custo Separação</span>
                      <span>{formatCurrency(catalogo.custo_separacao || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Custo Operacional</span>
                      <span>{formatCurrency(catalogo.custo_operacional || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa Entrega</span>
                      <span>{formatCurrency(catalogo.taxa_entrega || 0)}</span>
                    </div>
                  </div>

                  {/* Status Select */}
                  <Select
                    value={catalogo.status}
                    onValueChange={(value) => handleStatusChange(catalogo.id, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <span className={cn('w-2 h-2 rounded-full', status.color.replace('/20', ''))} />
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            );
          })
        )}
        </div>
      </ScrollArea>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-display text-xl">
              {selectedCatalogo ? 'Editar Catálogo' : 'Novo Catálogo'}
            </DialogTitle>
            <DialogDescription>
              {selectedCatalogo ? 'Atualize as informações' : 'Crie um novo link de catálogo'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Link *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Catálogo Janeiro 2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ImageUpload
                value={formData.imagem_url}
                onChange={(url) => setFormData({ ...formData, imagem_url: url })}
                label="Foto do Catálogo"
              />
              <div className="space-y-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  placeholder="Observações do catálogo..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custo_separacao">Custo Separação</Label>
                  <Input
                    id="custo_separacao"
                    type="number"
                    step="0.01"
                    value={formData.custo_separacao}
                    onChange={(e) => setFormData({ ...formData, custo_separacao: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custo_operacional">Custo Operacional</Label>
                  <Input
                    id="custo_operacional"
                    type="number"
                    step="0.01"
                    value={formData.custo_operacional}
                    onChange={(e) => setFormData({ ...formData, custo_operacional: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxa_entrega">Taxa Entrega</Label>
                  <Input
                    id="taxa_entrega"
                    type="number"
                    step="0.01"
                    value={formData.taxa_entrega}
                    onChange={(e) => setFormData({ ...formData, taxa_entrega: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pedido_minimo_pecas">Mínimo de Peças</Label>
                  <Input
                    id="pedido_minimo_pecas"
                    type="number"
                    min="0"
                    value={formData.pedido_minimo_pecas}
                    onChange={(e) => setFormData({ ...formData, pedido_minimo_pecas: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Quantidade mínima para fechar pedido (0 = sem mínimo)</p>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="btn-gold"
              disabled={addCatalogo.isPending || updateCatalogo.isPending}
            >
              {(addCatalogo.isPending || updateCatalogo.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {selectedCatalogo ? 'Salvar' : 'Criar Catálogo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog - Enhanced with customization */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-display text-xl">
              Configurações do Catálogo
            </DialogTitle>
            <DialogDescription>
              Personalize a aparência e configure os custos
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            <Tabs defaultValue="visual" className="w-full">
              <TabsList className="grid w-full grid-cols-3 sticky top-0 z-10 bg-background">
                <TabsTrigger value="visual">Visual</TabsTrigger>
                <TabsTrigger value="texto">Texto</TabsTrigger>
                <TabsTrigger value="custos">Custos</TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL do Logo</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banner_url">URL do Banner</Label>
                    <Input
                      id="banner_url"
                      value={formData.banner_url}
                      onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cor_primaria">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cor_primaria"
                        type="color"
                        value={formData.cor_primaria}
                        onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={formData.cor_primaria}
                        onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                        placeholder="#D4AF37"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cor_secundaria">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cor_secundaria"
                        type="color"
                        value={formData.cor_secundaria}
                        onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={formData.cor_secundaria}
                        onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                        placeholder="#1a1a2e"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                {(formData.logo_url || formData.banner_url) && (
                  <div className="border rounded-lg p-4 bg-secondary/30">
                    <p className="text-sm text-muted-foreground mb-2">Pré-visualização:</p>
                    <div className="flex gap-4 items-center">
                      {formData.logo_url && (
                        <img src={formData.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
                      )}
                      {formData.banner_url && (
                        <img src={formData.banner_url} alt="Banner" className="h-16 w-auto object-cover rounded" />
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="texto" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título do Catálogo</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Catálogo de Joias Exclusivas"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do catálogo que aparece na página pública..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensagem_boas_vindas">Mensagem de Boas-vindas</Label>
                  <Textarea
                    id="mensagem_boas_vindas"
                    value={formData.mensagem_boas_vindas}
                    onChange={(e) => setFormData({ ...formData, mensagem_boas_vindas: e.target.value })}
                    placeholder="Bem-vindo(a) ao nosso catálogo exclusivo!"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="5511999999999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_contato">Email de Contato</Label>
                    <Input
                      id="email_contato"
                      type="email"
                      value={formData.email_contato}
                      onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
                      placeholder="contato@exemplo.com"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="custos" className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="config_separacao">Custo Separação</Label>
                    <Input
                      id="config_separacao"
                      type="number"
                      step="0.01"
                      value={formData.custo_separacao}
                      onChange={(e) => setFormData({ ...formData, custo_separacao: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="config_operacional">Custo Operacional</Label>
                    <Input
                      id="config_operacional"
                      type="number"
                      step="0.01"
                      value={formData.custo_operacional}
                      onChange={(e) => setFormData({ ...formData, custo_operacional: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="config_entrega">Taxa Entrega</Label>
                    <Input
                      id="config_entrega"
                      type="number"
                      step="0.01"
                      value={formData.taxa_entrega}
                      onChange={(e) => setFormData({ ...formData, taxa_entrega: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="config_obs">Observações Internas</Label>
                  <Textarea
                    id="config_obs"
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    placeholder="Observações internas (não aparecem no catálogo público)..."
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <DialogFooter className="shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveConfig} 
              className="btn-gold"
              disabled={updateCatalogo.isPending}
            >
              {updateCatalogo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Items Dialog (Romaneio) */}
      <CatalogoItemsDialog
        catalogo={selectedCatalogo}
        isOpen={isItemsOpen}
        onClose={() => setIsItemsOpen(false)}
        pecas={pecas}
      />

      {/* Pedidos Dialog */}
      <PedidosDialog
        catalogo={selectedCatalogo}
        isOpen={isPedidosOpen}
        onClose={() => setIsPedidosOpen(false)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O catálogo "{selectedCatalogo?.nome}" será 
              removido permanentemente.
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
    </div>
  );
}

// Separate component for items management
function CatalogoItemsDialog({ 
  catalogo, 
  isOpen, 
  onClose, 
  pecas 
}: { 
  catalogo: any; 
  isOpen: boolean; 
  onClose: () => void;
  pecas: any[];
}) {
  const { data: items = [], isLoading } = useCatalogoItems(catalogo?.id || '');
  const { data: fornecedores = [] } = useFornecedores();
  const addItem = useAddCatalogoItem();
  const deleteItem = useDeleteCatalogoItem();
  const addPeca = useAddPeca();
  const [searchPeca, setSearchPeca] = useState('');
  const [searchEstoque, setSearchEstoque] = useState('');
  const [selectedPecas, setSelectedPecas] = useState<Set<string>>(new Set());
  const [isAddingBulk, setIsAddingBulk] = useState(false);
  const [newPecaData, setNewPecaData] = useState({
    nome: '',
    codigo: '',
    preco_custo: '',
    preco_venda: '',
    categoria: '',
    material: '',
    fornecedor_id: '',
    descricao: '',
    estoque: '',
    estoque_minimo: '',
    imagem_url: '',
  });
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  const generateCode = () => {
    const prefix = 'CAT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  // IDs das peças já no catálogo
  const pecasNoCatalogo = new Set(items.map(i => i.peca_id));

  // Peças disponíveis para busca individual
  const pecasDisponiveis = pecas.filter(
    (p) =>
      (p.nome.toLowerCase().includes(searchPeca.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchPeca.toLowerCase()))
  );

  // Peças para seleção múltipla (filtra as já adicionadas)
  const pecasEstoqueDisponiveis = pecas
    .filter(p => !pecasNoCatalogo.has(p.id))
    .filter(p => 
      !searchEstoque || 
      p.nome.toLowerCase().includes(searchEstoque.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchEstoque.toLowerCase()) ||
      (p.categoria?.toLowerCase().includes(searchEstoque.toLowerCase()))
    );

  const togglePecaSelection = (pecaId: string) => {
    setSelectedPecas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pecaId)) {
        newSet.delete(pecaId);
      } else {
        newSet.add(pecaId);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    setSelectedPecas(new Set(pecasEstoqueDisponiveis.map(p => p.id)));
  };

  const clearSelection = () => {
    setSelectedPecas(new Set());
  };

  const handleAddBulkPecas = async () => {
    if (!catalogo || selectedPecas.size === 0) return;
    
    setIsAddingBulk(true);
    try {
      const promises = Array.from(selectedPecas).map((pecaId, index) => {
        return addItem.mutateAsync({
          catalogo_id: catalogo.id,
          peca_id: pecaId,
          ordem: items.length + index,
          destaque: false,
        });
      });
      
      await Promise.all(promises);
      toast.success(`${selectedPecas.size} peças adicionadas ao catálogo!`);
      setSelectedPecas(new Set());
    } catch (error) {
      console.error('Error adding bulk pecas:', error);
      toast.error('Erro ao adicionar peças');
    } finally {
      setIsAddingBulk(false);
    }
  };

  const handleAddPeca = async (peca: any) => {
    if (!catalogo) return;
    await addItem.mutateAsync({
      catalogo_id: catalogo.id,
      peca_id: peca.id,
      ordem: items.length,
      destaque: false,
    });
    setSearchPeca('');
  };

  const handleRemoveItem = async (itemId: string) => {
    await deleteItem.mutateAsync(itemId);
  };

  const handleCreateAndAddPeca = async () => {
    if (!catalogo || !newPecaData.nome || !newPecaData.codigo || !newPecaData.preco_venda) {
      toast.error('Preencha nome, código e preço de venda');
      return;
    }

    try {
      // Peças criadas pelo catálogo são exclusivas do catálogo (catalogo_only = true)
      const newPeca = await addPeca.mutateAsync({
        nome: newPecaData.nome,
        codigo: newPecaData.codigo,
        preco_custo: parseFloat(newPecaData.preco_custo) || 0,
        preco_venda: parseFloat(newPecaData.preco_venda) || 0,
        preco_revenda: parseFloat(newPecaData.preco_venda) || 0,
        estoque: parseInt(newPecaData.estoque) || 0,
        estoque_minimo: parseInt(newPecaData.estoque_minimo) || 0,
        categoria: newPecaData.categoria || null,
        subcategoria: null,
        fornecedor_id: newPecaData.fornecedor_id || null,
        imagem_url: newPecaData.imagem_url || null,
        descricao: newPecaData.descricao || null,
        material: newPecaData.material || null,
        peso: null,
        ativo: true,
        catalogo_only: true, // Mark as catalog-only piece
      });

      // Add to catalog
      await addItem.mutateAsync({
        catalogo_id: catalogo.id,
        peca_id: newPeca.id,
        ordem: items.length,
        destaque: false,
      });

      // Reset form
      setNewPecaData({
        nome: '',
        codigo: autoGenerateCode ? generateCode() : '',
        preco_custo: '',
        preco_venda: '',
        categoria: '',
        material: '',
        fornecedor_id: '',
        descricao: '',
        estoque: '',
        estoque_minimo: '',
        imagem_url: '',
      });
      toast.success('Peça criada e adicionada ao catálogo!');
    } catch (error) {
      console.error('Error creating peca:', error);
      toast.error('Erro ao criar peça');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalRomaneio = items.reduce((acc, item) => acc + (item.peca?.preco_venda || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Romaneio de Compras
          </DialogTitle>
          <DialogDescription>
            {catalogo?.nome} - Gerencie as peças do catálogo
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="estoque" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="estoque">Selecionar do Estoque</TabsTrigger>
            <TabsTrigger value="search">Buscar Peça</TabsTrigger>
            <TabsTrigger value="create">Criar Nova</TabsTrigger>
          </TabsList>

          {/* Aba de Seleção Múltipla do Estoque */}
          <TabsContent value="estoque" className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Filtrar por nome, código ou categoria..."
                    value={searchEstoque}
                    onChange={(e) => setSearchEstoque(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {pecasEstoqueDisponiveis.length} peças disponíveis • {selectedPecas.size} selecionadas
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllVisible}
                    disabled={pecasEstoqueDisponiveis.length === 0}
                  >
                    Selecionar Tudo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSelection}
                    disabled={selectedPecas.size === 0}
                  >
                    Limpar
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[250px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {pecasEstoqueDisponiveis.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhuma peça disponível</p>
                    </div>
                  ) : (
                    pecasEstoqueDisponiveis.map((peca) => (
                      <div
                        key={peca.id}
                        onClick={() => togglePecaSelection(peca.id)}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                          selectedPecas.has(peca.id) 
                            ? "bg-primary/20 border border-primary/30" 
                            : "hover:bg-secondary/50"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                          selectedPecas.has(peca.id) 
                            ? "bg-primary border-primary" 
                            : "border-muted-foreground/30"
                        )}>
                          {selectedPecas.has(peca.id) && (
                            <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <img
                          src={peca.imagem_url || '/placeholder.svg'}
                          alt={peca.nome}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{peca.nome}</p>
                          <p className="text-xs text-muted-foreground">{peca.codigo} {peca.categoria && `• ${peca.categoria}`}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-sm">{formatCurrency(peca.preco_venda || 0)}</p>
                          <p className="text-xs text-muted-foreground">Est: {peca.estoque || 0}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {selectedPecas.size > 0 && (
                <Button 
                  onClick={handleAddBulkPecas} 
                  className="w-full btn-gold"
                  disabled={isAddingBulk}
                >
                  {isAddingBulk && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar {selectedPecas.size} Peça{selectedPecas.size > 1 ? 's' : ''} ao Catálogo
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4 py-4">
            {/* Search Peca */}
            <div className="relative">
              <Label>Buscar peça existente</Label>
              <Input
                className="mt-2"
                placeholder="Buscar peça por nome ou código..."
                value={searchPeca}
                onChange={(e) => setSearchPeca(e.target.value)}
              />
              {searchPeca && pecasDisponiveis.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {pecasDisponiveis.slice(0, 5).map((peca) => (
                    <div
                      key={peca.id}
                      className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer"
                      onClick={() => handleAddPeca(peca)}
                    >
                      <img
                        src={peca.imagem_url || '/placeholder.svg'}
                        alt={peca.nome}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{peca.nome}</p>
                        <p className="text-xs text-muted-foreground">{peca.codigo}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(peca.preco_venda)}</p>
                        <p className="text-xs text-muted-foreground">Estoque: {peca.estoque}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchPeca && pecasDisponiveis.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Nenhuma peça encontrada</p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setNewPecaData(prev => ({ ...prev, nome: searchPeca }));
                      setSearchPeca('');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar "{searchPeca}"
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="create" className="py-4">
            {/* Create New Peca Form - Complete like PecasPage */}
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="precos">Preços</TabsTrigger>
                <TabsTrigger value="imagem">Imagem</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_nome">Nome *</Label>
                    <Input
                      id="new_nome"
                      value={newPecaData.nome}
                      onChange={(e) => setNewPecaData({ ...newPecaData, nome: e.target.value })}
                      placeholder="Nome da peça"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="new_codigo">Código *</Label>
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
                              setNewPecaData({ ...newPecaData, codigo: generateCode() });
                            } else {
                              setNewPecaData({ ...newPecaData, codigo: '' });
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        id="new_codigo"
                        value={newPecaData.codigo}
                        onChange={(e) => setNewPecaData({ ...newPecaData, codigo: e.target.value })}
                        placeholder={autoGenerateCode ? "Código gerado automaticamente" : "Digite o código"}
                        disabled={autoGenerateCode}
                        className={cn(autoGenerateCode && "bg-muted")}
                      />
                      {autoGenerateCode && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                          onClick={() => setNewPecaData({ ...newPecaData, codigo: generateCode() })}
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
                    <Label htmlFor="new_categoria">Categoria</Label>
                    <Select
                      value={newPecaData.categoria}
                      onValueChange={(value) => setNewPecaData({ ...newPecaData, categoria: value })}
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
                    <Label htmlFor="new_material">Material</Label>
                    <Select
                      value={newPecaData.material}
                      onValueChange={(value) => setNewPecaData({ ...newPecaData, material: value })}
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
                    <Label htmlFor="new_fornecedor">Fornecedor</Label>
                    <Select
                      value={newPecaData.fornecedor_id}
                      onValueChange={(value) => setNewPecaData({ ...newPecaData, fornecedor_id: value })}
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
                    <Label htmlFor="new_descricao">Descrição</Label>
                    <Input
                      id="new_descricao"
                      value={newPecaData.descricao}
                      onChange={(e) => setNewPecaData({ ...newPecaData, descricao: e.target.value })}
                      placeholder="Descrição da peça..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_estoque">Estoque</Label>
                    <Input
                      id="new_estoque"
                      type="number"
                      value={newPecaData.estoque}
                      onChange={(e) => setNewPecaData({ ...newPecaData, estoque: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_estoque_minimo">Estoque Mínimo</Label>
                    <Input
                      id="new_estoque_minimo"
                      type="number"
                      value={newPecaData.estoque_minimo}
                      onChange={(e) => setNewPecaData({ ...newPecaData, estoque_minimo: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="precos" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_preco_custo">Preço de Custo</Label>
                    <Input
                      id="new_preco_custo"
                      type="number"
                      step="0.01"
                      value={newPecaData.preco_custo}
                      onChange={(e) => setNewPecaData({ ...newPecaData, preco_custo: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_preco_venda">Preço de Venda *</Label>
                    <Input
                      id="new_preco_venda"
                      type="number"
                      step="0.01"
                      value={newPecaData.preco_venda}
                      onChange={(e) => setNewPecaData({ ...newPecaData, preco_venda: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  O preço de venda será usado como preço no catálogo.
                </p>
              </TabsContent>

              <TabsContent value="imagem" className="space-y-4 mt-4">
                <ImageUpload
                  label="Imagem da Peça"
                  value={newPecaData.imagem_url}
                  onChange={(url) => setNewPecaData({ ...newPecaData, imagem_url: url })}
                />
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleCreateAndAddPeca} 
              className="w-full btn-gold mt-4"
              disabled={addPeca.isPending || addItem.isPending}
            >
              {(addPeca.isPending || addItem.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Plus className="w-4 h-4 mr-2" />
              Criar e Adicionar ao Catálogo
            </Button>
          </TabsContent>
        </Tabs>

        {/* Items List */}
        <div className="space-y-2 border-t pt-4">
          <Label>Peças no Romaneio ({items.length})</Label>
          {isLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma peça adicionada</p>
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                  >
                    <img
                      src={item.peca?.imagem_url || '/placeholder.svg'}
                      alt={item.peca?.nome}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.peca?.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.peca?.preco_venda || 0)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(item.peca?.preco_venda || 0)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Total */}
        {items.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <span className="font-semibold">Total do Romaneio</span>
              <span className="font-semibold text-lg">{formatCurrency(totalRomaneio)}</span>
            </div>
            {catalogo && (
              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>+ Custo Separação</span>
                  <span>{formatCurrency(catalogo.custo_separacao || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Custo Operacional</span>
                  <span>{formatCurrency(catalogo.custo_operacional || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Taxa Entrega</span>
                  <span>{formatCurrency(catalogo.taxa_entrega || 0)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground pt-2 border-t">
                  <span>Total Final</span>
                  <span>
                    {formatCurrency(
                      totalRomaneio + 
                      (catalogo.custo_separacao || 0) + 
                      (catalogo.custo_operacional || 0) + 
                      (catalogo.taxa_entrega || 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PedidosDialog({ 
  catalogo, 
  isOpen, 
  onClose 
}: { 
  catalogo: { id: string; nome: string } | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!catalogo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Pedidos - {catalogo.nome}
          </DialogTitle>
          <DialogDescription>
            Pedidos recebidos através do catálogo público
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <PedidosCatalogoList catalogoId={catalogo.id} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
