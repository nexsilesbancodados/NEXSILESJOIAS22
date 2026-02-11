import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useOrganizationId } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Users, Shield, Loader2, KeyRound } from 'lucide-react';
import { ReadOnlyGuard } from '@/components/subscription/ReadOnlyGuard';

const MODULOS = [
  { id: 'dashboard', nome: 'Dashboard' },
  { id: 'pecas', nome: 'Peças' },
  { id: 'clientes', nome: 'Clientes' },
  { id: 'vendas', nome: 'Vendas/PDV' },
  { id: 'revendedoras', nome: 'Revendedoras' },
  { id: 'romaneios', nome: 'Romaneios' },
  { id: 'catalogos', nome: 'Catálogos' },
  { id: 'fornecedores', nome: 'Fornecedores' },
  { id: 'banhos', nome: 'Banhos' },
  { id: 'relatorios', nome: 'Relatórios' },
  { id: 'configuracoes', nome: 'Configurações' },
  { id: 'campanhas', nome: 'Campanhas' },
  { id: 'atendimento', nome: 'Atendimento IA' },
  { id: 'etiquetas', nome: 'Etiquetas' },
  { id: 'historico', nome: 'Histórico' },
];

interface Funcionario {
  id: string;
  nome: string;
  email: string | null;
  cargo: string | null;
  telefone: string | null;
  ativo: boolean | null;
  created_at: string | null;
}

interface FuncionarioPermissao {
  id: string;
  funcionario_id: string;
  modulo: string;
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
}

export function FuncionariosTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissoesDialogOpen, setPermissoesDialogOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(false);
  const { organizationId } = useOrganizationId();

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('vendedor');

  // Fetch funcionários
  const { data: funcionarios = [], isLoading } = useQuery({
    queryKey: ['funcionarios-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Funcionario[];
    },
  });

  // Fetch permissões do funcionário selecionado
  const { data: permissoes = [] } = useQuery({
    queryKey: ['funcionario-permissoes', selectedFuncionario?.id],
    queryFn: async () => {
      if (!selectedFuncionario) return [];
      const { data, error } = await supabase
        .from('funcionario_permissoes')
        .select('*')
        .eq('funcionario_id', selectedFuncionario.id);
      if (error) {
        // Table might not exist yet, return empty
        console.warn('Permissoes table not found:', error.message);
        return [];
      }
      return data as FuncionarioPermissao[];
    },
    enabled: !!selectedFuncionario,
  });

  // Create funcionário
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email é obrigatório para criar acesso');
      return;
    }
    if (!senha || senha.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/criar-funcionario`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ nome, email, senha, telefone, cargo }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar funcionário');
      }
      toast.success('Funcionário criado com acesso ao sistema!');
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['funcionarios-config'] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  // Toggle ativo
  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('funcionarios').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios-config'] });
      toast.success('Status atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  // Delete funcionário
  const deleteFuncionario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('funcionarios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios-config'] });
      toast.success('Funcionário removido');
    },
    onError: () => toast.error('Erro ao remover'),
  });

  // Update permissão
  const updatePermissao = useMutation({
    mutationFn: async (permissao: Partial<FuncionarioPermissao> & { funcionario_id: string; modulo: string }) => {
      const { data: existing } = await supabase
        .from('funcionario_permissoes')
        .select('id')
        .eq('funcionario_id', permissao.funcionario_id)
        .eq('modulo', permissao.modulo)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('funcionario_permissoes')
          .update(permissao)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('funcionario_permissoes')
          .insert({
            funcionario_id: permissao.funcionario_id,
            modulo: permissao.modulo,
            pode_ver: permissao.pode_ver ?? false,
            pode_criar: permissao.pode_criar ?? false,
            pode_editar: permissao.pode_editar ?? false,
            pode_excluir: permissao.pode_excluir ?? false,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionario-permissoes', selectedFuncionario?.id] });
      toast.success('Permissão atualizada');
    },
    onError: () => toast.error('Erro ao atualizar permissão'),
  });

  const resetForm = () => {
    setNome('');
    setEmail('');
    setSenha('');
    setTelefone('');
    setCargo('vendedor');
  };

  const getPermissaoForModulo = (modulo: string) => {
    return permissoes.find((p) => p.modulo === modulo) || {
      pode_ver: false,
      pode_criar: false,
      pode_editar: false,
      pode_excluir: false,
    };
  };

  const handlePermissaoChange = (modulo: string, campo: string, valor: boolean) => {
    if (!selectedFuncionario) return;
    updatePermissao.mutate({
      funcionario_id: selectedFuncionario.id,
      modulo,
      [campo]: valor,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Funcionários
          </h3>
          <p className="text-sm text-muted-foreground">
            Cadastre funcionários e defina suas permissões por módulo
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <ReadOnlyGuard>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
          </ReadOnlyGuard>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Novo Funcionário</DialogTitle>
                <DialogDescription>
                  Cadastre um novo funcionário e depois configure suas permissões
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="func-nome">Nome *</Label>
                  <Input
                    id="func-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do funcionário"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="func-email">Email *</Label>
                  <Input
                    id="func-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Este será o login do funcionário</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="func-senha">Senha *</Label>
                  <Input
                    id="func-senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="func-telefone">Telefone</Label>
                  <Input
                    id="func-telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="func-cargo">Cargo</Label>
                  <Select value={cargo} onValueChange={setCargo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                      <SelectItem value="vendedor">Vendedor(a)</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="caixa">Caixa</SelectItem>
                      <SelectItem value="estoquista">Estoquista</SelectItem>
                      <SelectItem value="atendente">Atendente</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {cargo === 'admin' && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                      ⚠️ Administradores terão acesso total a todas as funções do sistema
                    </p>
                  )}
                  {cargo !== 'admin' && (
                    <p className="text-xs text-muted-foreground">
                      Após cadastrar, configure as permissões deste funcionário
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="btn-gold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Cadastrar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Lista de Funcionários</CardTitle>
          <CardDescription>{funcionarios.length} funcionário(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : funcionarios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum funcionário cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((func) => (
                  <TableRow key={func.id}>
                    <TableCell className="font-medium">{func.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {func.cargo || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {func.email || func.telefone || '—'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={func.ativo ?? true}
                        onCheckedChange={(checked) =>
                          toggleAtivo.mutate({ id: func.id, ativo: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFuncionario(func);
                          setPermissoesDialogOpen(true);
                        }}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Permissões
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!func.email) {
                            toast.error('Funcionário sem email cadastrado');
                            return;
                          }
                          try {
                            const { error } = await supabase.auth.resetPasswordForEmail(func.email, {
                              redirectTo: `${window.location.origin}/reset-password`,
                            });
                            if (error) throw error;
                            toast.success(`Email de recuperação enviado para ${func.email}`);
                          } catch (err: any) {
                            toast.error(err.message || 'Erro ao enviar email');
                          }
                        }}
                      >
                        <KeyRound className="h-4 w-4 mr-1" />
                        Resetar Senha
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Remover este funcionário?')) {
                            deleteFuncionario.mutate(func.id);
                          }
                        }}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Permissões */}
      <Dialog open={permissoesDialogOpen} onOpenChange={setPermissoesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Permissões — {selectedFuncionario?.nome}
            </DialogTitle>
            <DialogDescription>
              Defina o que este funcionário pode acessar em cada módulo
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead className="text-center">Ver</TableHead>
                  <TableHead className="text-center">Criar</TableHead>
                  <TableHead className="text-center">Editar</TableHead>
                  <TableHead className="text-center">Excluir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MODULOS.map((modulo) => {
                  const perm = getPermissaoForModulo(modulo.id);
                  return (
                    <TableRow key={modulo.id}>
                      <TableCell className="font-medium">{modulo.nome}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={perm.pode_ver}
                          onCheckedChange={(checked) =>
                            handlePermissaoChange(modulo.id, 'pode_ver', checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={perm.pode_criar}
                          onCheckedChange={(checked) =>
                            handlePermissaoChange(modulo.id, 'pode_criar', checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={perm.pode_editar}
                          onCheckedChange={(checked) =>
                            handlePermissaoChange(modulo.id, 'pode_editar', checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={perm.pode_excluir}
                          onCheckedChange={(checked) =>
                            handlePermissaoChange(modulo.id, 'pode_excluir', checked as boolean)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissoesDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
