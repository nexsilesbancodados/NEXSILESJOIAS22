import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Plus,
  Edit2,
  Trash2,
  Users,
  Settings,
  MessageSquare,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface Agente {
  id: string;
  nome: string;
  departamento: string;
  prompt_sistema: string;
  palavras_chave: string[] | null;
  ativo: boolean;
  avatar_url: string | null;
  cor: string | null;
  ordem_prioridade: number;
  created_at: string;
}

const DEPARTAMENTOS = [
  { value: 'vendas', label: 'Vendas', icon: '💰', cor: '#22c55e' },
  { value: 'suporte', label: 'Suporte', icon: '🛠️', cor: '#3b82f6' },
  { value: 'financeiro', label: 'Financeiro', icon: '💳', cor: '#eab308' },
  { value: 'rh', label: 'RH', icon: '👥', cor: '#a855f7' },
  { value: 'marketing', label: 'Marketing', icon: '📣', cor: '#ec4899' },
  { value: 'tecnico', label: 'Técnico', icon: '⚙️', cor: '#6366f1' },
  { value: 'geral', label: 'Geral', icon: '🤖', cor: '#64748b' }
];

export function MultiAgentManager() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgente, setEditingAgente] = useState<Agente | null>(null);
  const [palavrasChaveInput, setPalavrasChaveInput] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    departamento: 'geral',
    prompt_sistema: '',
    palavras_chave: [] as string[],
    ativo: true,
    cor: '#6366f1',
    ordem_prioridade: 0
  });

  // Fetch agentes
  const { data: agentes = [], isLoading } = useQuery({
    queryKey: ['agentes', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agentes')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('ordem_prioridade', { ascending: true });

      if (error) throw error;
      return (data || []) as Agente[];
    },
    enabled: !!organizationId
  });

  // Create/update agente
  const saveMutation = useMutation({
    mutationFn: async () => {
      const agenteData = {
        ...formData,
        organization_id: organizationId
      };

      if (editingAgente) {
        const { error } = await supabase
          .from('agentes')
          .update(agenteData)
          .eq('id', editingAgente.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agentes')
          .insert(agenteData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingAgente ? 'Agente atualizado!' : 'Agente criado!');
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
      closeDialog();
    },
    onError: (error) => {
      console.error('Error saving agente:', error);
      toast.error('Erro ao salvar agente');
    }
  });

  // Delete agente
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agentes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Agente excluído!');
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
    }
  });

  // Toggle ativo
  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('agentes')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
    }
  });

  const openEditDialog = (agente: Agente) => {
    setEditingAgente(agente);
    setFormData({
      nome: agente.nome,
      departamento: agente.departamento,
      prompt_sistema: agente.prompt_sistema,
      palavras_chave: agente.palavras_chave || [],
      ativo: agente.ativo,
      cor: agente.cor || '#6366f1',
      ordem_prioridade: agente.ordem_prioridade
    });
    setPalavrasChaveInput((agente.palavras_chave || []).join(', '));
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAgente(null);
    setFormData({
      nome: '',
      departamento: 'geral',
      prompt_sistema: '',
      palavras_chave: [],
      ativo: true,
      cor: '#6366f1',
      ordem_prioridade: 0
    });
    setPalavrasChaveInput('');
  };

  const handlePalavrasChaveChange = (value: string) => {
    setPalavrasChaveInput(value);
    const palavras = value.split(',').map(p => p.trim()).filter(p => p.length > 0);
    setFormData(prev => ({ ...prev, palavras_chave: palavras }));
  };

  const getDepartamentoInfo = (departamento: string) => {
    return DEPARTAMENTOS.find(d => d.value === departamento) || DEPARTAMENTOS[6];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Multi-Agentes
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => closeDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAgente ? 'Editar Agente' : 'Novo Agente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Agente *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Atendente de Vendas"
                  />
                </div>
                <div>
                  <Label htmlFor="departamento">Departamento *</Label>
                  <Select
                    value={formData.departamento}
                    onValueChange={(value) => {
                      const dept = getDepartamentoInfo(value);
                      setFormData(prev => ({ 
                        ...prev, 
                        departamento: value,
                        cor: dept.cor
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTAMENTOS.map(d => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.icon} {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="prompt">Prompt do Sistema *</Label>
                <Textarea
                  id="prompt"
                  value={formData.prompt_sistema}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt_sistema: e.target.value }))}
                  placeholder="Descreva o papel e comportamento do agente..."
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Defina a personalidade, tom de voz e instruções específicas deste agente.
                </p>
              </div>

              <div>
                <Label htmlFor="palavras">Palavras-chave para Roteamento</Label>
                <Input
                  id="palavras"
                  value={palavrasChaveInput}
                  onChange={(e) => handlePalavrasChaveChange(e.target.value)}
                  placeholder="vendas, comprar, preço, orçamento (separadas por vírgula)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O sistema usará estas palavras para direcionar automaticamente conversas para este agente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cor">Cor do Agente</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cor"
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                      className="w-14 h-10 p-1"
                    />
                    <Input
                      value={formData.cor}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="prioridade">Prioridade (menor = maior)</Label>
                  <Input
                    id="prioridade"
                    type="number"
                    value={formData.ordem_prioridade}
                    onChange={(e) => setFormData(prev => ({ ...prev, ordem_prioridade: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                />
                <Label>Agente ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button 
                onClick={() => saveMutation.mutate()} 
                disabled={saveMutation.isPending || !formData.nome || !formData.prompt_sistema}
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roteamento Explanation */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium">Como funciona o roteamento automático</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Quando uma mensagem chega, o sistema analisa as palavras-chave e direciona para o agente mais adequado.
                Se nenhum agente específico for identificado, a conversa vai para o agente com maior prioridade (menor número).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : agentes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum agente configurado ainda.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Crie agentes especializados para diferentes departamentos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentes.map((agente) => {
            const dept = getDepartamentoInfo(agente.departamento);
            return (
              <Card 
                key={agente.id}
                className={`relative overflow-hidden ${!agente.ativo ? 'opacity-60' : ''}`}
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: agente.cor || dept.cor }}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                        style={{ backgroundColor: agente.cor || dept.cor }}
                      >
                        {dept.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{agente.nome}</CardTitle>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {dept.label}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={agente.ativo}
                      onCheckedChange={(checked) => 
                        toggleAtivoMutation.mutate({ id: agente.id, ativo: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {agente.prompt_sistema}
                  </p>
                  
                  {agente.palavras_chave && agente.palavras_chave.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {agente.palavras_chave.slice(0, 5).map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                      {agente.palavras_chave.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{agente.palavras_chave.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Prioridade: {agente.ordem_prioridade}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(agente)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Excluir este agente?')) {
                            deleteMutation.mutate(agente.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Routing Preview */}
      {agentes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Fluxo de Roteamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm font-medium">Nova Mensagem</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Settings className="h-5 w-5" />
                <span className="text-sm">Análise de palavras-chave</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 flex-wrap">
                {agentes.filter(a => a.ativo).slice(0, 4).map((agente) => {
                  const dept = getDepartamentoInfo(agente.departamento);
                  return (
                    <div 
                      key={agente.id}
                      className="flex items-center gap-2 p-2 rounded-lg border"
                      style={{ borderColor: agente.cor || dept.cor }}
                    >
                      <span>{dept.icon}</span>
                      <span className="text-sm">{agente.nome}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
