import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tag,
  Plus,
  Percent,
  DollarSign,
  Truck,
  Calendar as CalendarIcon,
  Copy,
  RefreshCw,
  Edit,
  Trash2,
  Loader2,
  BarChart3,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useCampanhas,
  useAddCampanha,
  useUpdateCampanha,
  useDeleteCampanha,
  generateCouponCode,
  type Campanha,
} from '@/hooks/useCampanhas';

type CampanhaTipo = 'percentual' | 'valor_fixo' | 'frete_gratis';

interface FormData {
  nome: string;
  descricao: string;
  tipo: CampanhaTipo;
  valor: string;
  codigo_cupom: string;
  data_inicio: Date | undefined;
  data_fim: Date | undefined;
  limite_uso: string;
  ativo: boolean;
}

const initialFormData: FormData = {
  nome: '',
  descricao: '',
  tipo: 'percentual',
  valor: '',
  codigo_cupom: '',
  data_inicio: undefined,
  data_fim: undefined,
  limite_uso: '',
  ativo: true,
};

export default function CampanhasPage() {
  const { data: campanhas = [], isLoading } = useCampanhas();
  const addCampanha = useAddCampanha();
  const updateCampanha = useUpdateCampanha();
  const deleteCampanha = useDeleteCampanha();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleOpenForm = (campanha?: Campanha) => {
    if (campanha) {
      setEditingId(campanha.id);
      setFormData({
        nome: campanha.nome,
        descricao: campanha.descricao || '',
        tipo: campanha.tipo,
        valor: campanha.valor.toString(),
        codigo_cupom: campanha.codigo_cupom || '',
        data_inicio: campanha.data_inicio ? new Date(campanha.data_inicio) : undefined,
        data_fim: campanha.data_fim ? new Date(campanha.data_fim) : undefined,
        limite_uso: campanha.limite_uso?.toString() || '',
        ativo: campanha.ativo,
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleGenerateCoupon = () => {
    setFormData({ ...formData, codigo_cupom: generateCouponCode() });
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }

    const campanhaData = {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || null,
      tipo: formData.tipo,
      valor: parseFloat(formData.valor) || 0,
      codigo_cupom: formData.codigo_cupom.trim().toUpperCase() || null,
      data_inicio: formData.data_inicio?.toISOString() || null,
      data_fim: formData.data_fim?.toISOString() || null,
      limite_uso: formData.limite_uso ? parseInt(formData.limite_uso) : null,
      ativo: formData.ativo,
      categorias: null,
      pecas_ids: null,
    };

    if (editingId) {
      await updateCampanha.mutateAsync({ id: editingId, ...campanhaData });
    } else {
      await addCampanha.mutateAsync(campanhaData);
    }
    handleCloseForm();
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteCampanha.mutateAsync(deletingId);
      setIsDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const getCampanhaStatus = (campanha: Campanha) => {
    if (!campanha.ativo) return { label: 'Inativa', color: 'bg-muted text-muted-foreground' };
    
    const now = new Date();
    if (campanha.data_inicio && new Date(campanha.data_inicio) > now) {
      return { label: 'Agendada', color: 'bg-blue-500/20 text-blue-600' };
    }
    if (campanha.data_fim && new Date(campanha.data_fim) < now) {
      return { label: 'Expirada', color: 'bg-orange-500/20 text-orange-600' };
    }
    if (campanha.limite_uso && campanha.usos_atuais >= campanha.limite_uso) {
      return { label: 'Esgotada', color: 'bg-red-500/20 text-red-600' };
    }
    return { label: 'Ativa', color: 'bg-green-500/20 text-green-600' };
  };

  const getTipoIcon = (tipo: CampanhaTipo) => {
    switch (tipo) {
      case 'percentual':
        return <Percent className="w-4 h-4" />;
      case 'valor_fixo':
        return <DollarSign className="w-4 h-4" />;
      case 'frete_gratis':
        return <Truck className="w-4 h-4" />;
    }
  };

  const getTipoLabel = (tipo: CampanhaTipo, valor: number) => {
    switch (tipo) {
      case 'percentual':
        return `${valor}% OFF`;
      case 'valor_fixo':
        return `${formatCurrency(valor)} OFF`;
      case 'frete_gratis':
        return 'Frete Grátis';
    }
  };

  // Stats
  const campanhasAtivas = campanhas.filter(c => {
    const status = getCampanhaStatus(c);
    return status.label === 'Ativa';
  });
  const totalUsos = campanhas.reduce((acc, c) => acc + c.usos_atuais, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold">Campanhas e Promoções</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie cupons de desconto e promoções
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campanhasAtivas.length}</p>
                <p className="text-sm text-muted-foreground">Campanhas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campanhas.length}</p>
                <p className="text-sm text-muted-foreground">Total de Campanhas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsos}</p>
                <p className="text-sm text-muted-foreground">Cupons Utilizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campanhas.map((campanha) => {
          const status = getCampanhaStatus(campanha);
          return (
            <Card key={campanha.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {getTipoIcon(campanha.tipo)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{campanha.nome}</CardTitle>
                      <Badge className={cn('text-xs mt-1', status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenForm(campanha)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        setDeletingId(campanha.id);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {campanha.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {campanha.descricao}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {getTipoLabel(campanha.tipo, campanha.valor)}
                  </span>
                </div>

                {campanha.codigo_cupom && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-1.5 bg-muted rounded text-sm font-mono">
                      {campanha.codigo_cupom}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopyCoupon(campanha.codigo_cupom!)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {campanha.data_fim && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Até {format(new Date(campanha.data_fim), 'dd/MM/yy', { locale: ptBR })}
                    </span>
                  )}
                  {campanha.limite_uso && (
                    <span>
                      {campanha.usos_atuais}/{campanha.limite_uso} usos
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {campanhas.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Nenhuma campanha</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira campanha promocional
            </p>
            <Button onClick={() => handleOpenForm()} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Criar Campanha
            </Button>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? 'Editar Campanha' : 'Nova Campanha'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da promoção
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Campanha *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Promoção de Verão"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da promoção..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v: CampanhaTipo) => setFormData({ ...formData, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">
                        <span className="flex items-center gap-2">
                          <Percent className="w-4 h-4" /> Percentual
                        </span>
                      </SelectItem>
                      <SelectItem value="valor_fixo">
                        <span className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" /> Valor Fixo
                        </span>
                      </SelectItem>
                      <SelectItem value="frete_gratis">
                        <span className="flex items-center gap-2">
                          <Truck className="w-4 h-4" /> Frete Grátis
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo !== 'frete_gratis' && (
                  <div className="space-y-2">
                    <Label>
                      Valor {formData.tipo === 'percentual' ? '(%)' : '(R$)'}
                    </Label>
                    <Input
                      type="number"
                      step={formData.tipo === 'percentual' ? '1' : '0.01'}
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      placeholder={formData.tipo === 'percentual' ? '10' : '50.00'}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Código do Cupom</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.codigo_cupom}
                    onChange={(e) => setFormData({ ...formData, codigo_cupom: e.target.value.toUpperCase() })}
                    placeholder="VERAO2025"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateCoupon}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para aplicar automaticamente
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.data_inicio && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_inicio
                          ? format(formData.data_inicio, 'dd/MM/yyyy', { locale: ptBR })
                          : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.data_inicio}
                        onSelect={(date) => setFormData({ ...formData, data_inicio: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.data_fim && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_fim
                          ? format(formData.data_fim, 'dd/MM/yyyy', { locale: ptBR })
                          : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.data_fim}
                        onSelect={(date) => setFormData({ ...formData, data_fim: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Limite de Uso</Label>
                <Input
                  type="number"
                  value={formData.limite_uso}
                  onChange={(e) => setFormData({ ...formData, limite_uso: e.target.value })}
                  placeholder="Ilimitado"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para uso ilimitado
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label>Campanha Ativa</Label>
                  <p className="text-xs text-muted-foreground">
                    Desative para pausar a campanha
                  </p>
                </div>
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={addCampanha.isPending || updateCampanha.isPending}
            >
              {(addCampanha.isPending || updateCampanha.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.
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
