import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  ExternalLink,
  Copy,
  MoreHorizontal,
  Loader2,
  Eye,
  RefreshCw,
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MiniGradientCard } from '@/components/dashboard/MiniGradientCard';
import {
  useEnvios,
  useEnvio,
  useRastreioEventos,
  useAddEnvio,
  useUpdateEnvio,
  useAddRastreioEvento,
  Envio,
} from '@/hooks/useEnvios';
import { useOrganization } from '@/hooks/useOrganization';

type EnvioStatus = 'preparando' | 'postado' | 'em_transito' | 'entregue' | 'devolvido';
type TipoEnvio = 'sedex' | 'pac' | 'transportadora' | 'motoboy' | 'retirada';

const statusConfig: Record<EnvioStatus, { label: string; color: string; icon: typeof Clock }> = {
  preparando: { label: 'Preparando', color: 'bg-yellow-500', icon: Package },
  postado: { label: 'Postado', color: 'bg-blue-500', icon: Truck },
  em_transito: { label: 'Em Trânsito', color: 'bg-purple-500', icon: MapPin },
  entregue: { label: 'Entregue', color: 'bg-green-500', icon: CheckCircle2 },
  devolvido: { label: 'Devolvido', color: 'bg-red-500', icon: AlertCircle },
};

const tipoEnvioLabels: Record<TipoEnvio, string> = {
  sedex: 'SEDEX',
  pac: 'PAC',
  transportadora: 'Transportadora',
  motoboy: 'Motoboy',
  retirada: 'Retirada',
};

export default function EntregasPage() {
  const { organizationId } = useOrganization();
  const { data: envios = [], isLoading } = useEnvios();
  const addEnvioMutation = useAddEnvio();
  const updateEnvioMutation = useUpdateEnvio();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState<Envio | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    destinatario_nome: '',
    destinatario_telefone: '',
    destinatario_endereco: '',
    destinatario_cidade: '',
    destinatario_estado: '',
    destinatario_cep: '',
    codigo_rastreio: '',
    transportadora: '',
    tipo_envio: 'sedex' as Envio['tipo_envio'],
    valor_frete: '',
    peso: '',
    observacoes: '',
  });
  
  // Filter envios
  const enviosFiltrados = envios.filter((e) => {
    const matchSearch = 
      e.destinatario_nome.toLowerCase().includes(search.toLowerCase()) ||
      e.codigo_rastreio?.toLowerCase().includes(search.toLowerCase()) ||
      e.destinatario_cidade?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === 'todos' || e.status === statusFilter;
    
    return matchSearch && matchStatus;
  });
  
  // Stats
  const stats = {
    total: envios.length,
    preparando: envios.filter(e => e.status === 'preparando').length,
    emTransito: envios.filter(e => e.status === 'em_transito' || e.status === 'postado').length,
    entregues: envios.filter(e => e.status === 'entregue').length,
  };
  
  const handleOpenForm = () => {
    setFormData({
      destinatario_nome: '',
      destinatario_telefone: '',
      destinatario_endereco: '',
      destinatario_cidade: '',
      destinatario_estado: '',
      destinatario_cep: '',
      codigo_rastreio: '',
      transportadora: '',
      tipo_envio: 'sedex',
      valor_frete: '',
      peso: '',
      observacoes: '',
    });
    setIsFormOpen(true);
  };
  
  const handleSubmit = async () => {
    if (!formData.destinatario_nome.trim()) {
      toast.error('Nome do destinatário é obrigatório');
      return;
    }
    
    if (!organizationId) {
      toast.error('Organização não encontrada');
      return;
    }
    
    try {
      await addEnvioMutation.mutateAsync({
        organization_id: organizationId,
        destinatario_nome: formData.destinatario_nome,
        destinatario_telefone: formData.destinatario_telefone || null,
        destinatario_endereco: formData.destinatario_endereco || null,
        destinatario_cidade: formData.destinatario_cidade || null,
        destinatario_estado: formData.destinatario_estado || null,
        destinatario_cep: formData.destinatario_cep || null,
        codigo_rastreio: formData.codigo_rastreio || null,
        transportadora: formData.transportadora || null,
        tipo_envio: formData.tipo_envio,
        valor_frete: parseFloat(formData.valor_frete) || 0,
        peso: parseFloat(formData.peso) || null,
        observacoes: formData.observacoes || null,
        status: 'preparando',
        romaneio_id: null,
        maleta_id: null,
        data_postagem: null,
        data_entrega: null,
        previsao_entrega: null,
      });
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error creating envio:', error);
    }
  };
  
  const handleUpdateStatus = async (envio: Envio, novoStatus: Envio['status']) => {
    try {
      const updates: Partial<Envio> = { status: novoStatus };
      
      if (novoStatus === 'postado' && !envio.data_postagem) {
        updates.data_postagem = new Date().toISOString();
      }
      if (novoStatus === 'entregue' && !envio.data_entrega) {
        updates.data_entrega = new Date().toISOString();
      }
      
      await updateEnvioMutation.mutateAsync({ id: envio.id, ...updates });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  
  const handleCopyRastreio = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast.success('Código copiado!');
  };
  
  const handleOpenDetails = (envio: Envio) => {
    setSelectedEnvio(envio);
    setIsDetailsOpen(true);
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
          <h1 className="text-3xl font-bold tracking-tight">Controle de Entregas</h1>
          <p className="text-muted-foreground">Gerencie envios e rastreie entregas</p>
        </div>
        <Button onClick={handleOpenForm} className="btn-gold">
          <Plus className="w-4 h-4 mr-2" />
          Novo Envio
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MiniGradientCard
          icon={Package}
          label="Total de Envios"
          value={stats.total}
          gradient="blue"
        />
        <MiniGradientCard
          icon={Clock}
          label="Preparando"
          value={stats.preparando}
          gradient="amber"
        />
        <MiniGradientCard
          icon={Truck}
          label="Em Trânsito"
          value={stats.emTransito}
          gradient="purple"
        />
        <MiniGradientCard
          icon={CheckCircle2}
          label="Entregues"
          value={stats.entregues}
          gradient="green"
        />
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por destinatário, código ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="preparando">Preparando</SelectItem>
            <SelectItem value="postado">Postado</SelectItem>
            <SelectItem value="em_transito">Em Trânsito</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="devolvido">Devolvido</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Envios List */}
      <div className="grid gap-4">
        {enviosFiltrados.length === 0 ? (
          <Card className="p-12 text-center">
            <Truck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum envio encontrado</p>
          </Card>
        ) : (
          enviosFiltrados.map((envio) => {
            const statusInfo = statusConfig[envio.status];
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={envio.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white', statusInfo.color)}>
                      <StatusIcon className="w-6 h-6" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{envio.destinatario_nome}</h3>
                        <Badge variant="outline">{tipoEnvioLabels[envio.tipo_envio]}</Badge>
                        <Badge className={cn('text-white', statusInfo.color)}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {envio.destinatario_cidade && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {envio.destinatario_cidade}/{envio.destinatario_estado}
                          </span>
                        )}
                        {envio.codigo_rastreio && (
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                            onClick={() => handleCopyRastreio(envio.codigo_rastreio!)}
                          >
                            <Copy className="w-3 h-3" />
                            {envio.codigo_rastreio}
                          </button>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(envio.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDetails(envio)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {envio.status === 'preparando' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(envio, 'postado')}>
                              <Truck className="w-4 h-4 mr-2" />
                              Marcar como Postado
                            </DropdownMenuItem>
                          )}
                          {envio.status === 'postado' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(envio, 'em_transito')}>
                              <MapPin className="w-4 h-4 mr-2" />
                              Em Trânsito
                            </DropdownMenuItem>
                          )}
                          {(envio.status === 'postado' || envio.status === 'em_transito') && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(envio, 'entregue')}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Marcar como Entregue
                            </DropdownMenuItem>
                          )}
                          {envio.codigo_rastreio && (
                            <DropdownMenuItem 
                              onClick={() => window.open(`https://www.linkcorreios.com.br/?id=${envio.codigo_rastreio}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Rastrear nos Correios
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      {/* New Envio Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Envio</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Destinatário *</Label>
                <Input
                  value={formData.destinatario_nome}
                  onChange={(e) => setFormData({ ...formData, destinatario_nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={formData.destinatario_telefone}
                  onChange={(e) => setFormData({ ...formData, destinatario_telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label>CEP</Label>
                <Input
                  value={formData.destinatario_cep}
                  onChange={(e) => setFormData({ ...formData, destinatario_cep: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.destinatario_endereco}
                  onChange={(e) => setFormData({ ...formData, destinatario_endereco: e.target.value })}
                  placeholder="Rua, número, complemento"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.destinatario_cidade}
                  onChange={(e) => setFormData({ ...formData, destinatario_cidade: e.target.value })}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={formData.destinatario_estado}
                  onChange={(e) => setFormData({ ...formData, destinatario_estado: e.target.value })}
                  maxLength={2}
                  placeholder="UF"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Envio</Label>
                <Select
                  value={formData.tipo_envio}
                  onValueChange={(v) => setFormData({ ...formData, tipo_envio: v as Envio['tipo_envio'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedex">SEDEX</SelectItem>
                    <SelectItem value="pac">PAC</SelectItem>
                    <SelectItem value="transportadora">Transportadora</SelectItem>
                    <SelectItem value="motoboy">Motoboy</SelectItem>
                    <SelectItem value="retirada">Retirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Código de Rastreio</Label>
                <Input
                  value={formData.codigo_rastreio}
                  onChange={(e) => setFormData({ ...formData, codigo_rastreio: e.target.value.toUpperCase() })}
                  placeholder="AA123456789BR"
                />
              </div>
              <div>
                <Label>Valor do Frete (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_frete}
                  onChange={(e) => setFormData({ ...formData, valor_frete: e.target.value })}
                />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={addEnvioMutation.isPending} className="btn-gold">
              {addEnvioMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Details Dialog */}
      <EnvioDetailsDialog 
        envio={selectedEnvio} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}

// Separate component for details to keep main component cleaner
function EnvioDetailsDialog({ 
  envio, 
  open, 
  onOpenChange,
  onUpdateStatus,
}: { 
  envio: Envio | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (envio: Envio, status: Envio['status']) => Promise<void>;
}) {
  const { data: eventos = [], isLoading: isLoadingEventos } = useRastreioEventos(envio?.id);
  const addEventoMutation = useAddRastreioEvento();
  const [novoEvento, setNovoEvento] = useState({ descricao: '', local: '' });
  
  if (!envio) return null;
  
  const statusInfo = statusConfig[envio.status];
  
  const handleAddEvento = async () => {
    if (!novoEvento.descricao.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }
    
    await addEventoMutation.mutateAsync({
      envio_id: envio.id,
      data: new Date().toISOString(),
      descricao: novoEvento.descricao,
      local: novoEvento.local || null,
    });
    
    setNovoEvento({ descricao: '', local: '' });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white', statusInfo.color)}>
              <statusInfo.icon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>{envio.destinatario_nome}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {tipoEnvioLabels[envio.tipo_envio]} • {statusInfo.label}
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="rastreio">Rastreio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4 flex-1 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Destinatário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Nome:</strong> {envio.destinatario_nome}</p>
                {envio.destinatario_telefone && (
                  <p><strong>Telefone:</strong> {envio.destinatario_telefone}</p>
                )}
                {envio.destinatario_endereco && (
                  <p><strong>Endereço:</strong> {envio.destinatario_endereco}</p>
                )}
                {envio.destinatario_cidade && (
                  <p><strong>Cidade:</strong> {envio.destinatario_cidade}/{envio.destinatario_estado}</p>
                )}
                {envio.destinatario_cep && (
                  <p><strong>CEP:</strong> {envio.destinatario_cep}</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Envio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Tipo:</strong> {tipoEnvioLabels[envio.tipo_envio]}</p>
                {envio.codigo_rastreio && (
                  <p><strong>Rastreio:</strong> {envio.codigo_rastreio}</p>
                )}
                {envio.transportadora && (
                  <p><strong>Transportadora:</strong> {envio.transportadora}</p>
                )}
                <p><strong>Frete:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(envio.valor_frete)}</p>
                {envio.peso && <p><strong>Peso:</strong> {envio.peso} kg</p>}
                <p><strong>Criado em:</strong> {format(new Date(envio.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                {envio.data_postagem && (
                  <p><strong>Postado em:</strong> {format(new Date(envio.data_postagem), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                )}
                {envio.data_entrega && (
                  <p><strong>Entregue em:</strong> {format(new Date(envio.data_entrega), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                )}
              </CardContent>
            </Card>
            
            {envio.observacoes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{envio.observacoes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="rastreio" className="flex-1 overflow-hidden flex flex-col">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Descrição do evento..."
                value={novoEvento.descricao}
                onChange={(e) => setNovoEvento({ ...novoEvento, descricao: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="Local"
                value={novoEvento.local}
                onChange={(e) => setNovoEvento({ ...novoEvento, local: e.target.value })}
                className="w-32"
              />
              <Button onClick={handleAddEvento} disabled={addEventoMutation.isPending}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              {isLoadingEventos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : eventos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Nenhum evento de rastreio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventos.map((evento, index) => (
                    <div key={evento.id} className="relative pl-6">
                      <div className={cn(
                        'absolute left-0 top-2 w-3 h-3 rounded-full',
                        index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                      )} />
                      {index < eventos.length - 1 && (
                        <div className="absolute left-[5px] top-5 w-0.5 h-full bg-border" />
                      )}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="font-medium text-sm">{evento.descricao}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{format(new Date(evento.data), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                          {evento.local && (
                            <>
                              <span>•</span>
                              <span>{evento.local}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          {envio.codigo_rastreio && (
            <Button
              variant="outline"
              onClick={() => window.open(`https://www.linkcorreios.com.br/?id=${envio.codigo_rastreio}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Rastrear Online
            </Button>
          )}
          {envio.status !== 'entregue' && envio.status !== 'devolvido' && (
            <Button
              onClick={() => {
                const nextStatus: Record<string, Envio['status']> = {
                  preparando: 'postado',
                  postado: 'em_transito',
                  em_transito: 'entregue',
                };
                onUpdateStatus(envio, nextStatus[envio.status]);
              }}
              className="btn-gold"
            >
              Avançar Status
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
