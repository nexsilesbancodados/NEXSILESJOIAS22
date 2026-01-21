import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
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
import { Plus, Users, Shield, Edit, Trash2, Loader2 } from 'lucide-react';

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
];

interface Funcionario {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  created_at: string;
}

interface Permissao {
  id: string;
  profile_id: string;
  modulo: string;
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
}

export default function FuncionariosPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissoesDialogOpen, setPermissoesDialogOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState('user');

  // Fetch funcionários (users with role != admin)
  const { data: funcionarios = [], isLoading } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Funcionario[];
    },
  });

  // Fetch permissões do funcionário selecionado
  const { data: permissoes = [] } = useQuery({
    queryKey: ['permissoes', selectedFuncionario?.id],
    queryFn: async () => {
      if (!selectedFuncionario) return [];
      const { data, error } = await supabase
        .from('permissoes')
        .select('*')
        .eq('profile_id', selectedFuncionario.id);

      if (error) throw error;
      return data as Permissao[];
    },
    enabled: !!selectedFuncionario,
  });

  // Create funcionário
  const handleCreateFuncionario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Criar usuário via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome,
            role,
          },
        },
      });

      if (error) throw error;

      toast.success('Funcionário criado com sucesso!');
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
    } catch (error: any) {
      console.error('Error creating funcionario:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error('Erro ao criar funcionário');
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle ativo
  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast.success('Status atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  // Update permissão
  const updatePermissao = useMutation({
    mutationFn: async (permissao: Partial<Permissao> & { profile_id: string; modulo: string }) => {
      const { data: existing } = await supabase
        .from('permissoes')
        .select('id')
        .eq('profile_id', permissao.profile_id)
        .eq('modulo', permissao.modulo)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('permissoes')
          .update(permissao)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('permissoes')
          .insert(permissao);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissoes', selectedFuncionario?.id] });
    },
    onError: () => {
      toast.error('Erro ao atualizar permissão');
    },
  });

  const resetForm = () => {
    setNome('');
    setEmail('');
    setSenha('');
    setRole('user');
  };

  const getPermissaoForModulo = (modulo: string) => {
    return permissoes.find((p) => p.modulo === modulo) || {
      pode_ver: false,
      pode_criar: false,
      pode_editar: false,
      pode_excluir: false,
    };
  };

  const handlePermissaoChange = (modulo: string, campo: keyof Permissao, valor: boolean) => {
    if (!selectedFuncionario) return;

    updatePermissao.mutate({
      profile_id: selectedFuncionario.id,
      modulo,
      [campo]: valor,
    });
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                Acesso Negado
              </CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Funcionários
            </h1>
            <p className="text-muted-foreground">
              Gerencie funcionários e suas permissões
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateFuncionario}>
                <DialogHeader>
                  <DialogTitle>Novo Funcionário</DialogTitle>
                  <DialogDescription>
                    Crie uma conta para um novo funcionário
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Nome do funcionário"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Funcionário</SelectItem>
                        <SelectItem value="revendedora">Revendedora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="btn-gold" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Funcionário'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Funcionários */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Funcionários</CardTitle>
            <CardDescription>
              {funcionarios.length} funcionário(s) cadastrado(s)
            </CardDescription>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcionarios.map((func) => (
                    <TableRow key={func.id}>
                      <TableCell className="font-medium">{func.nome}</TableCell>
                      <TableCell>{func.email}</TableCell>
                      <TableCell>
                        <Badge variant={func.role === 'revendedora' ? 'secondary' : 'outline'}>
                          {func.role === 'revendedora' ? 'Revendedora' : 'Funcionário'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={func.ativo}
                          onCheckedChange={(checked) =>
                            toggleAtivo.mutate({ id: func.id, ativo: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissões - {selectedFuncionario?.nome}
              </DialogTitle>
              <DialogDescription>
                Configure o que este funcionário pode fazer em cada módulo
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-auto">
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
    </MainLayout>
  );
}
