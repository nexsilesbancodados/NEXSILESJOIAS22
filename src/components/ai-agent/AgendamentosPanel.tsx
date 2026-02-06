import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  User,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface Agendamento {
  id: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_email: string | null;
  titulo: string;
  descricao: string | null;
  data_hora: string;
  duracao_minutos: number;
  status: string;
  lembrete_enviado: boolean;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'agendado', label: 'Agendado', color: 'bg-blue-500' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-500' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-500' },
  { value: 'concluido', label: 'Concluído', color: 'bg-gray-500' },
  { value: 'no_show', label: 'Não Compareceu', color: 'bg-orange-500' }
];

export function AgendamentosPanel() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);

  const [formData, setFormData] = useState({
    cliente_nome: '',
    cliente_telefone: '',
    cliente_email: '',
    titulo: '',
    descricao: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    hora: '10:00',
    duracao_minutos: 30,
    status: 'agendado'
  });

  // Fetch agendamentos
  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ['agendamentos', organizationId, format(selectedDate, 'yyyy-MM')],
    queryFn: async () => {
      const startDate = startOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const endDate = endOfDay(addDays(startDate, 40));

      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('organization_id', organizationId!)
        .gte('data_hora', startDate.toISOString())
        .lte('data_hora', endDate.toISOString())
        .order('data_hora', { ascending: true });

      if (error) throw error;
      return (data || []) as Agendamento[];
    },
    enabled: !!organizationId
  });

  // Create/update agendamento
  const saveMutation = useMutation({
    mutationFn: async () => {
      const dataHora = new Date(`${formData.data}T${formData.hora}`);

      const agendamentoData = {
        cliente_nome: formData.cliente_nome,
        cliente_telefone: formData.cliente_telefone || null,
        cliente_email: formData.cliente_email || null,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data_hora: dataHora.toISOString(),
        duracao_minutos: formData.duracao_minutos,
        status: formData.status,
        organization_id: organizationId
      };

      if (editingAgendamento) {
        const { error } = await supabase
          .from('agendamentos')
          .update(agendamentoData)
          .eq('id', editingAgendamento.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agendamentos')
          .insert(agendamentoData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingAgendamento ? 'Agendamento atualizado!' : 'Agendamento criado!');
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      closeDialog();
    },
    onError: (error) => {
      console.error('Error saving agendamento:', error);
      toast.error('Erro ao salvar agendamento');
    }
  });

  // Update status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    }
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Agendamento excluído!');
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    }
  });

  const openEditDialog = (agendamento: Agendamento) => {
    const dataHora = parseISO(agendamento.data_hora);
    setEditingAgendamento(agendamento);
    setFormData({
      cliente_nome: agendamento.cliente_nome,
      cliente_telefone: agendamento.cliente_telefone || '',
      cliente_email: agendamento.cliente_email || '',
      titulo: agendamento.titulo,
      descricao: agendamento.descricao || '',
      data: format(dataHora, 'yyyy-MM-dd'),
      hora: format(dataHora, 'HH:mm'),
      duracao_minutos: agendamento.duracao_minutos,
      status: agendamento.status
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAgendamento(null);
    setFormData({
      cliente_nome: '',
      cliente_telefone: '',
      cliente_email: '',
      titulo: '',
      descricao: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      hora: '10:00',
      duracao_minutos: 30,
      status: 'agendado'
    });
  };

  // Get agendamentos for selected day
  const agendamentosDia = agendamentos.filter(a => 
    isSameDay(parseISO(a.data_hora), selectedDate)
  );

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedDate);
    date.setDate(selectedDate.getDate() - selectedDate.getDay() + i);
    return date;
  });

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge className={option?.color || 'bg-gray-500'}>
        {option?.label || status}
      </Badge>
    );
  };

  const hasAgendamentosOnDay = (date: Date) => {
    return agendamentos.some(a => isSameDay(parseISO(a.data_hora), date));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agendamentos
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => closeDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAgendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cliente_nome">Nome do Cliente *</Label>
                <Input
                  id="cliente_nome"
                  value={formData.cliente_nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente_telefone">Telefone</Label>
                  <Input
                    id="cliente_telefone"
                    value={formData.cliente_telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_telefone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="cliente_email">E-mail</Label>
                  <Input
                    id="cliente_email"
                    type="email"
                    value={formData.cliente_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="titulo">Título do Agendamento *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Consulta, Reunião, Visita..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="hora">Horário *</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="duracao">Duração (min)</Label>
                  <Select
                    value={formData.duracao_minutos.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, duracao_minutos: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h30</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Observações</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Informações adicionais..."
                />
              </div>

              {editingAgendamento && (
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button 
                onClick={() => saveMutation.mutate()} 
                disabled={saveMutation.isPending || !formData.cliente_nome || !formData.titulo}
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Week View */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">
                {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {weekDays.map((date, i) => (
                <Button
                  key={i}
                  variant={isSameDay(date, selectedDate) ? 'default' : 'ghost'}
                  className={`h-12 relative ${hasAgendamentosOnDay(date) ? 'font-bold' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  {format(date, 'd')}
                  {hasAgendamentosOnDay(date) && !isSameDay(date, selectedDate) && (
                    <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </Button>
              ))}
            </div>
            
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedDate(new Date())}
              >
                Hoje
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Day Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : agendamentosDia.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum agendamento para este dia.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {agendamentosDia.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className="p-4 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-bold">
                              {format(parseISO(agendamento.data_hora), 'HH:mm')}
                            </span>
                            <span className="text-muted-foreground">
                              ({agendamento.duracao_minutos} min)
                            </span>
                            {getStatusBadge(agendamento.status)}
                          </div>
                          
                          <h4 className="font-medium">{agendamento.titulo}</h4>
                          
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            {agendamento.cliente_nome}
                          </div>
                          
                          {agendamento.cliente_telefone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {agendamento.cliente_telefone}
                            </div>
                          )}
                          
                          {agendamento.descricao && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              {agendamento.descricao}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          {agendamento.status === 'agendado' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600"
                              onClick={() => updateStatusMutation.mutate({ 
                                id: agendamento.id, 
                                status: 'confirmado' 
                              })}
                              title="Confirmar"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(agendamento)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Excluir este agendamento?')) {
                                deleteMutation.mutate(agendamento.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
