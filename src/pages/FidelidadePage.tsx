import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Star,
  Gift,
  Users,
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Crown,
  Medal,
  Award,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MiniGradientCard } from '@/components/dashboard/MiniGradientCard';
import {
  useNiveisFidelidade,
  useAddNivelFidelidade,
  useUpdateNivelFidelidade,
  useDeleteNivelFidelidade,
  usePontosFidelidade,
  useRecompensas,
  useAddRecompensa,
  useResgatarRecompensa,
  NivelFidelidade,
  PontosFidelidade,
  RecompensaFidelidade,
} from '@/hooks/useFidelidade';
import { useClientes } from '@/hooks/useSupabaseData';

const nivelIcons: Record<string, typeof Crown> = {
  crown: Crown,
  medal: Medal,
  award: Award,
  star: Star,
  trophy: Trophy,
};

const defaultNiveis = [
  { nome: 'Bronze', pontos_minimos: 0, cor: '#CD7F32', desconto_percentual: 0, icone: 'medal' },
  { nome: 'Prata', pontos_minimos: 500, cor: '#C0C0C0', desconto_percentual: 5, icone: 'award' },
  { nome: 'Ouro', pontos_minimos: 1500, cor: '#FFD700', desconto_percentual: 10, icone: 'trophy' },
  { nome: 'Diamante', pontos_minimos: 5000, cor: '#B9F2FF', desconto_percentual: 15, icone: 'crown' },
];

export default function FidelidadePage() {
  const { data: niveis = [], isLoading: isLoadingNiveis } = useNiveisFidelidade();
  const { data: pontosClientes = [], isLoading: isLoadingPontos } = usePontosFidelidade() as { data: PontosFidelidade[]; isLoading: boolean };
  const { data: recompensas = [], isLoading: isLoadingRecompensas } = useRecompensas();
  const { data: clientes = [] } = useClientes();
  
  const addNivelMutation = useAddNivelFidelidade();
  const updateNivelMutation = useUpdateNivelFidelidade();
  const deleteNivelMutation = useDeleteNivelFidelidade();
  const addRecompensaMutation = useAddRecompensa();
  const resgatarMutation = useResgatarRecompensa();
  
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [search, setSearch] = useState('');
  
  // Nivel form state
  const [isNivelFormOpen, setIsNivelFormOpen] = useState(false);
  const [selectedNivel, setSelectedNivel] = useState<NivelFidelidade | null>(null);
  const [isDeleteNivelOpen, setIsDeleteNivelOpen] = useState(false);
  const [nivelForm, setNivelForm] = useState({
    nome: '',
    pontos_minimos: '',
    cor: '#FFD700',
    icone: 'star',
    desconto_percentual: '',
    beneficios: '',
  });
  
  // Recompensa form state
  const [isRecompensaFormOpen, setIsRecompensaFormOpen] = useState(false);
  const [recompensaForm, setRecompensaForm] = useState({
    nome: '',
    descricao: '',
    pontos_necessarios: '',
    tipo: 'desconto' as RecompensaFidelidade['tipo'],
    valor_desconto: '',
    quantidade_disponivel: '',
  });
  
  // Stats
  const totalPontos = pontosClientes.reduce((acc, p) => acc + p.pontos_totais, 0);
  const clientesComPontos = pontosClientes.length;
  
  // Filter clients by search
  const clientesFiltrados = pontosClientes.filter((p) => {
    const cliente = clientes.find((c) => c.id === p.cliente_id);
    return cliente?.nome.toLowerCase().includes(search.toLowerCase());
  });
  
  // Get nivel for a client
  const getNivelCliente = (pontosTotais: number) => {
    if (niveis.length === 0) return null;
    const niveisOrdenados = [...niveis].sort((a, b) => b.pontos_minimos - a.pontos_minimos);
    return niveisOrdenados.find((n) => pontosTotais >= n.pontos_minimos) || niveisOrdenados[niveisOrdenados.length - 1];
  };
  
  // Get next nivel
  const getProximoNivel = (pontosTotais: number) => {
    if (niveis.length === 0) return null;
    const niveisOrdenados = [...niveis].sort((a, b) => a.pontos_minimos - b.pontos_minimos);
    return niveisOrdenados.find((n) => n.pontos_minimos > pontosTotais);
  };
  
  const handleOpenNivelForm = (nivel?: NivelFidelidade) => {
    if (nivel) {
      setSelectedNivel(nivel);
      setNivelForm({
        nome: nivel.nome,
        pontos_minimos: nivel.pontos_minimos.toString(),
        cor: nivel.cor,
        icone: nivel.icone || 'star',
        desconto_percentual: nivel.desconto_percentual.toString(),
        beneficios: nivel.beneficios || '',
      });
    } else {
      setSelectedNivel(null);
      setNivelForm({
        nome: '',
        pontos_minimos: '',
        cor: '#FFD700',
        icone: 'star',
        desconto_percentual: '',
        beneficios: '',
      });
    }
    setIsNivelFormOpen(true);
  };
  
  const handleSubmitNivel = async () => {
    if (!nivelForm.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    const data = {
      nome: nivelForm.nome,
      pontos_minimos: parseInt(nivelForm.pontos_minimos) || 0,
      cor: nivelForm.cor,
      icone: nivelForm.icone,
      desconto_percentual: parseFloat(nivelForm.desconto_percentual) || 0,
      beneficios: nivelForm.beneficios || null,
    };
    
    try {
      if (selectedNivel) {
        await updateNivelMutation.mutateAsync({ id: selectedNivel.id, ...data });
      } else {
        await addNivelMutation.mutateAsync(data);
      }
      setIsNivelFormOpen(false);
    } catch (error) {
      console.error('Error saving nivel:', error);
    }
  };
  
  const handleDeleteNivel = async () => {
    if (selectedNivel) {
      try {
        await deleteNivelMutation.mutateAsync(selectedNivel.id);
        setIsDeleteNivelOpen(false);
        setSelectedNivel(null);
      } catch (error) {
        console.error('Error deleting nivel:', error);
      }
    }
  };
  
  const handleCreateDefaultNiveis = async () => {
    try {
      for (const nivel of defaultNiveis) {
        await addNivelMutation.mutateAsync(nivel);
      }
      toast.success('Níveis padrão criados!');
    } catch (error) {
      console.error('Error creating default niveis:', error);
    }
  };
  
  const handleSubmitRecompensa = async () => {
    if (!recompensaForm.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    try {
      await addRecompensaMutation.mutateAsync({
        nome: recompensaForm.nome,
        descricao: recompensaForm.descricao || null,
        pontos_necessarios: parseInt(recompensaForm.pontos_necessarios) || 0,
        tipo: recompensaForm.tipo,
        valor_desconto: recompensaForm.tipo === 'desconto' ? parseFloat(recompensaForm.valor_desconto) || null : null,
        produto_id: null,
        ativo: true,
        quantidade_disponivel: recompensaForm.quantidade_disponivel ? parseInt(recompensaForm.quantidade_disponivel) : null,
      });
      setIsRecompensaFormOpen(false);
      setRecompensaForm({
        nome: '',
        descricao: '',
        pontos_necessarios: '',
        tipo: 'desconto',
        valor_desconto: '',
        quantidade_disponivel: '',
      });
    } catch (error) {
      console.error('Error creating recompensa:', error);
    }
  };
  
  const isLoading = isLoadingNiveis || isLoadingPontos || isLoadingRecompensas;
  
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
          <h1 className="text-3xl font-bold tracking-tight">Programa de Fidelidade</h1>
          <p className="text-muted-foreground">Gerencie pontos, níveis e recompensas</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MiniGradientCard
          icon={Users}
          label="Clientes Participantes"
          value={clientesComPontos}
          gradient="from-blue-500 to-cyan-500"
        />
        <MiniGradientCard
          icon={Star}
          label="Total de Pontos"
          value={totalPontos.toLocaleString('pt-BR')}
          gradient="from-yellow-500 to-orange-500"
        />
        <MiniGradientCard
          icon={Trophy}
          label="Níveis Cadastrados"
          value={niveis.length}
          gradient="from-purple-500 to-pink-500"
        />
        <MiniGradientCard
          icon={Gift}
          label="Recompensas Ativas"
          value={recompensas.length}
          gradient="from-green-500 to-emerald-500"
        />
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="niveis">Níveis</TabsTrigger>
          <TabsTrigger value="recompensas">Recompensas</TabsTrigger>
        </TabsList>
        
        {/* Visão Geral Tab */}
        <TabsContent value="visao-geral" className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Clients List */}
          <div className="grid gap-4">
            {clientesFiltrados.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum cliente com pontos</p>
                <p className="text-sm text-muted-foreground/60">
                  Os pontos serão creditados automaticamente nas vendas
                </p>
              </Card>
            ) : (
              clientesFiltrados.map((pontos) => {
                const cliente = clientes.find((c) => c.id === pontos.cliente_id);
                const nivelAtual = getNivelCliente(pontos.pontos_totais);
                const proximoNivel = getProximoNivel(pontos.pontos_totais);
                const IconeNivel = nivelAtual?.icone ? nivelIcons[nivelAtual.icone] || Star : Star;
                
                const progressoNivel = proximoNivel
                  ? ((pontos.pontos_totais - (nivelAtual?.pontos_minimos || 0)) /
                     (proximoNivel.pontos_minimos - (nivelAtual?.pontos_minimos || 0))) * 100
                  : 100;
                
                return (
                  <Card key={pontos.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Nivel Icon */}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: nivelAtual?.cor || '#888' }}
                        >
                          <IconeNivel className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{cliente?.nome || 'Cliente'}</h3>
                            {nivelAtual && (
                              <Badge style={{ backgroundColor: nivelAtual.cor, color: '#fff' }}>
                                {nivelAtual.nome}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {pontos.pontos_disponiveis.toLocaleString('pt-BR')} disponíveis
                            </span>
                            <span>
                              {pontos.pontos_totais.toLocaleString('pt-BR')} total
                            </span>
                          </div>
                          
                          {/* Progress to next level */}
                          {proximoNivel && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>Próximo: {proximoNivel.nome}</span>
                                <span>{proximoNivel.pontos_minimos - pontos.pontos_totais} pontos restantes</span>
                              </div>
                              <Progress value={progressoNivel} className="h-1.5" />
                            </div>
                          )}
                        </div>
                        
                        {/* Discount Badge */}
                        {nivelAtual && nivelAtual.desconto_percentual > 0 && (
                          <div className="text-right">
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              {nivelAtual.desconto_percentual}% OFF
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
        
        {/* Níveis Tab */}
        <TabsContent value="niveis" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Configure os níveis do programa</p>
            <div className="flex gap-2">
              {niveis.length === 0 && (
                <Button variant="outline" onClick={handleCreateDefaultNiveis}>
                  Criar Níveis Padrão
                </Button>
              )}
              <Button onClick={() => handleOpenNivelForm()} className="btn-gold">
                <Plus className="w-4 h-4 mr-2" />
                Novo Nível
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {niveis.length === 0 ? (
              <Card className="col-span-full p-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum nível cadastrado</p>
                <p className="text-sm text-muted-foreground/60">
                  Crie níveis para recompensar seus clientes
                </p>
              </Card>
            ) : (
              [...niveis].sort((a, b) => a.pontos_minimos - b.pontos_minimos).map((nivel) => {
                const IconeNivel = nivel.icone ? nivelIcons[nivel.icone] || Star : Star;
                
                return (
                  <Card key={nivel.id} className="relative overflow-hidden">
                    <div
                      className="absolute top-0 left-0 right-0 h-2"
                      style={{ backgroundColor: nivel.cor }}
                    />
                    <CardHeader className="pt-6">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: nivel.cor }}
                        >
                          <IconeNivel className="w-6 h-6 text-white" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenNivelForm(nivel)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setSelectedNivel(nivel);
                                setIsDeleteNivelOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-lg">{nivel.nome}</CardTitle>
                      <CardDescription>
                        A partir de {nivel.pontos_minimos.toLocaleString('pt-BR')} pontos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {nivel.desconto_percentual > 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {nivel.desconto_percentual}% de desconto
                        </Badge>
                      )}
                      {nivel.beneficios && (
                        <p className="text-sm text-muted-foreground mt-2">{nivel.beneficios}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
        
        {/* Recompensas Tab */}
        <TabsContent value="recompensas" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Recompensas disponíveis para resgate</p>
            <Button onClick={() => setIsRecompensaFormOpen(true)} className="btn-gold">
              <Plus className="w-4 h-4 mr-2" />
              Nova Recompensa
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recompensas.length === 0 ? (
              <Card className="col-span-full p-12 text-center">
                <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma recompensa cadastrada</p>
                <p className="text-sm text-muted-foreground/60">
                  Crie recompensas para seus clientes resgatarem
                </p>
              </Card>
            ) : (
              recompensas.map((recompensa) => (
                <Card key={recompensa.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <Badge variant="outline">
                        {recompensa.pontos_necessarios.toLocaleString('pt-BR')} pts
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{recompensa.nome}</CardTitle>
                    {recompensa.descricao && (
                      <CardDescription>{recompensa.descricao}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {recompensa.tipo === 'desconto' && recompensa.valor_desconto && (
                          <>Desconto de R$ {recompensa.valor_desconto.toFixed(2)}</>
                        )}
                        {recompensa.tipo === 'frete_gratis' && 'Frete Grátis'}
                        {recompensa.tipo === 'brinde' && 'Brinde Especial'}
                        {recompensa.tipo === 'produto' && 'Produto Grátis'}
                      </span>
                      {recompensa.quantidade_disponivel !== null && (
                        <span className="text-xs text-muted-foreground">
                          {recompensa.quantidade_disponivel} restantes
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Nivel Form Dialog */}
      <Dialog open={isNivelFormOpen} onOpenChange={setIsNivelFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNivel ? 'Editar Nível' : 'Novo Nível'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nome do Nível *</Label>
              <Input
                value={nivelForm.nome}
                onChange={(e) => setNivelForm({ ...nivelForm, nome: e.target.value })}
                placeholder="Ex: Ouro, Diamante..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pontos Mínimos</Label>
                <Input
                  type="number"
                  value={nivelForm.pontos_minimos}
                  onChange={(e) => setNivelForm({ ...nivelForm, pontos_minimos: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Desconto (%)</Label>
                <Input
                  type="number"
                  value={nivelForm.desconto_percentual}
                  onChange={(e) => setNivelForm({ ...nivelForm, desconto_percentual: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={nivelForm.cor}
                    onChange={(e) => setNivelForm({ ...nivelForm, cor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={nivelForm.cor}
                    onChange={(e) => setNivelForm({ ...nivelForm, cor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Ícone</Label>
                <Select
                  value={nivelForm.icone}
                  onValueChange={(v) => setNivelForm({ ...nivelForm, icone: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="star">⭐ Estrela</SelectItem>
                    <SelectItem value="medal">🥉 Medalha</SelectItem>
                    <SelectItem value="award">🏅 Prêmio</SelectItem>
                    <SelectItem value="trophy">🏆 Troféu</SelectItem>
                    <SelectItem value="crown">👑 Coroa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Benefícios</Label>
              <Textarea
                value={nivelForm.beneficios}
                onChange={(e) => setNivelForm({ ...nivelForm, beneficios: e.target.value })}
                placeholder="Descreva os benefícios deste nível..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNivelFormOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitNivel} 
              disabled={addNivelMutation.isPending || updateNivelMutation.isPending}
              className="btn-gold"
            >
              {(addNivelMutation.isPending || updateNivelMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Nivel Dialog */}
      <AlertDialog open={isDeleteNivelOpen} onOpenChange={setIsDeleteNivelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nível?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o nível "{selectedNivel?.nome}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNivel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Recompensa Form Dialog */}
      <Dialog open={isRecompensaFormOpen} onOpenChange={setIsRecompensaFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Recompensa</DialogTitle>
            <DialogDescription>
              Crie uma recompensa para seus clientes resgatarem
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={recompensaForm.nome}
                onChange={(e) => setRecompensaForm({ ...recompensaForm, nome: e.target.value })}
                placeholder="Ex: Desconto de R$ 50"
              />
            </div>
            
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={recompensaForm.descricao}
                onChange={(e) => setRecompensaForm({ ...recompensaForm, descricao: e.target.value })}
                placeholder="Detalhes da recompensa..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pontos Necessários</Label>
                <Input
                  type="number"
                  value={recompensaForm.pontos_necessarios}
                  onChange={(e) => setRecompensaForm({ ...recompensaForm, pontos_necessarios: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={recompensaForm.tipo}
                  onValueChange={(v) => setRecompensaForm({ ...recompensaForm, tipo: v as RecompensaFidelidade['tipo'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desconto">Desconto em R$</SelectItem>
                    <SelectItem value="frete_gratis">Frete Grátis</SelectItem>
                    <SelectItem value="brinde">Brinde</SelectItem>
                    <SelectItem value="produto">Produto Grátis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {recompensaForm.tipo === 'desconto' && (
              <div>
                <Label>Valor do Desconto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={recompensaForm.valor_desconto}
                  onChange={(e) => setRecompensaForm({ ...recompensaForm, valor_desconto: e.target.value })}
                  placeholder="50.00"
                />
              </div>
            )}
            
            <div>
              <Label>Quantidade Disponível (opcional)</Label>
              <Input
                type="number"
                value={recompensaForm.quantidade_disponivel}
                onChange={(e) => setRecompensaForm({ ...recompensaForm, quantidade_disponivel: e.target.value })}
                placeholder="Ilimitado se vazio"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecompensaFormOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitRecompensa} 
              disabled={addRecompensaMutation.isPending}
              className="btn-gold"
            >
              {addRecompensaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Recompensa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
