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
  Target,
  Gift,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Loader2,
  BarChart3,
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
  type Campanha,
} from '@/hooks/useCampanhas';
import { ReadOnlyGuard } from '@/components/subscription/ReadOnlyGuard';

type CampanhaTipo = 'desconto' | 'meta' | 'premiacao';

interface FormData {
  nome: string;
  descricao: string;
  tipo: CampanhaTipo;
  desconto_percentual: string;
  meta_valor: string;
  premio: string;
  data_inicio: Date | undefined;
  data_fim: Date | undefined;
  ativa: boolean;
}

const initialFormData: FormData = {
  nome: '',
  descricao: '',
  tipo: 'desconto',
  desconto_percentual: '',
  meta_valor: '',
  premio: '',
  data_inicio: undefined,
  data_fim: undefined,
  ativa: true,
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

  const handleOpenForm = (campanha?: Campanha) => {
    if (campanha) {
      setEditingId(campanha.id);
      setFormData({
        nome: campanha.nome,
        descricao: campanha.descricao || '',
        tipo: (campanha.tipo as CampanhaTipo) || 'desconto',
        desconto_percentual: campanha.desconto_percentual?.toString() || '',
        meta_valor: campanha.meta_valor?.toString() || '',
        premio: campanha.premio || '',
        data_inicio: campanha.data_inicio ? new Date(campanha.data_inicio) : undefined,
        data_fim: campanha.data_fim ? new Date(campanha.data_fim) : undefined,
        ativa: campanha.ativa ?? true,
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

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }

    const campanhaData = {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || null,
      tipo: formData.tipo,
      desconto_percentual: formData.desconto_percentual ? parseFloat(formData.desconto_percentual) : null,
      meta_valor: formData.meta_valor ? parseFloat(formData.meta_valor) : null,
      premio: formData.premio.trim() || null,
      data_inicio: formData.data_inicio?.toISOString().split('T')[0] || null,
      data_fim: formData.data_fim?.toISOString().split('T')[0] || null,
      ativa: formData.ativa,
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
    if (!campanha.ativa) return { label: 'Inativa', color: 'bg-muted text-muted-foreground' };
    
    const now = new Date();
    if (campanha.data_inicio && new Date(campanha.data_inicio) > now) {
      return { label: 'Agendada', color: 'bg-primary/20 text-primary' };
    }
    if (campanha.data_fim && new Date(campanha.data_fim) < now) {
      return { label: 'Expirada', color: 'bg-warning/20 text-warning' };
    }
    return { label: 'Ativa', color: 'bg-success/20 text-success' };
  };

  const getTipoLabel = (tipo: string | null) => {
    switch (tipo) {
      case 'desconto': return 'Desconto';
      case 'meta': return 'Meta';
      case 'premiacao': return 'Premiação';
      default: return tipo || '-';
    }
  };

  const getTipoIcon = (tipo: string | null) => {
    switch (tipo) {
      case 'desconto': return <Percent className="w-4 h-4" />;
      case 'meta': return <Target className="w-4 h-4" />;
      case 'premiacao': return <Gift className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
            <Tag className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Campanhas</h1>
            <p className="text-sm text-muted-foreground">Gerencie promoções e metas</p>
          </div>
        </div>
        <ReadOnlyGuard>
          <Button onClick={() => handleOpenForm()} className="btn-gold gap-2">
            <Plus className="w-4 h-4" />
            Nova Campanha
          </Button>
        </ReadOnlyGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campanhas.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campanhas.filter(c => c.ativa).length}</p>
                <p className="text-sm text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {campanhas.filter(c => c.data_inicio && new Date(c.data_inicio) > new Date()).length}
                </p>
                <p className="text-sm text-muted-foreground">Agendadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campanhas.filter(c => !c.ativa).length}</p>
                <p className="text-sm text-muted-foreground">Inativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      {campanhas.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma campanha cadastrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie sua primeira campanha para oferecer promoções aos clientes.
            </p>
            <ReadOnlyGuard>
              <Button onClick={() => handleOpenForm()} className="btn-gold gap-2">
                <Plus className="w-4 h-4" />
                Criar Campanha
              </Button>
            </ReadOnlyGuard>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campanhas.map((campanha) => {
            const status = getCampanhaStatus(campanha);
            return (
              <Card key={campanha.id} className="glass-card hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getTipoIcon(campanha.tipo)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{campanha.nome}</CardTitle>
                        <Badge className={cn('text-xs mt-1', status.color)}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <ReadOnlyGuard>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenForm(campanha)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </ReadOnlyGuard>
                      <ReadOnlyGuard>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingId(campanha.id);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </ReadOnlyGuard>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {campanha.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{campanha.descricao}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <p className="font-medium">{getTipoLabel(campanha.tipo)}</p>
                    </div>
                    {campanha.desconto_percentual && (
                      <div>
                        <span className="text-muted-foreground">Desconto:</span>
                        <p className="font-medium">{campanha.desconto_percentual}%</p>
                      </div>
                    )}
                    {campanha.meta_valor && (
                      <div>
                        <span className="text-muted-foreground">Meta:</span>
                        <p className="font-medium">{formatCurrency(campanha.meta_valor)}</p>
                      </div>
                    )}
                    {campanha.premio && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Prêmio:</span>
                        <p className="font-medium">{campanha.premio}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    {campanha.data_inicio && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>
                          {format(new Date(campanha.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    {campanha.data_fim && (
                      <div className="flex items-center gap-1">
                        <span>até</span>
                        <span>
                          {format(new Date(campanha.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os dados da campanha' : 'Crie uma nova campanha promocional'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Campanha *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Promoção de Verão"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da campanha..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: CampanhaTipo) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desconto">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Desconto
                      </div>
                    </SelectItem>
                    <SelectItem value="meta">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Meta
                      </div>
                    </SelectItem>
                    <SelectItem value="premiacao">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Premiação
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo === 'desconto' && (
                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto (%)</Label>
                  <Input
                    id="desconto"
                    type="number"
                    value={formData.desconto_percentual}
                    onChange={(e) => setFormData({ ...formData, desconto_percentual: e.target.value })}
                    placeholder="Ex: 10"
                    min="0"
                    max="100"
                  />
                </div>
              )}

              {formData.tipo === 'meta' && (
                <div className="space-y-2">
                  <Label htmlFor="meta">Meta (R$)</Label>
                  <Input
                    id="meta"
                    type="number"
                    value={formData.meta_valor}
                    onChange={(e) => setFormData({ ...formData, meta_valor: e.target.value })}
                    placeholder="Ex: 1000"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="premio">Prêmio / Benefício</Label>
                <Input
                  id="premio"
                  value={formData.premio}
                  onChange={(e) => setFormData({ ...formData, premio: e.target.value })}
                  placeholder="Ex: Brinco de presente"
                />
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
                    <PopoverContent className="w-auto p-0">
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
                    <PopoverContent className="w-auto p-0">
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

              <div className="flex items-center justify-between">
                <Label htmlFor="ativa">Campanha Ativa</Label>
                <Switch
                  id="ativa"
                  checked={formData.ativa}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
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
              className="btn-gold"
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
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A campanha será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCampanha.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
