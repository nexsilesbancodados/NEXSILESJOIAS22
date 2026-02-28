import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Shield, Users, DollarSign, Crown, Search, Ban, CheckCircle, Edit,
  TrendingUp, Calendar, AlertTriangle, RefreshCw, Loader2, Eye, Trash2,
  ChevronDown, ChevronRight, UserCheck
} from 'lucide-react';

interface Funcionario {
  user_id: string;
  nome: string;
  email: string;
  cargo: string;
}

interface AssinaturaRow {
  id: string | null;
  user_id: string;
  plano: string | null;
  status: string;
  data_inicio: string | null;
  data_vencimento: string | null;
  valor_mensal: number;
  trial_ativo: boolean;
  metodo_pagamento: string | null;
  created_at: string;
  has_subscription: boolean;
  auth_created_at: string;
  profiles?: { nome: string | null; email: string | null } | null;
  funcionarios?: Funcionario[];
}

export default function SuperAdminPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [editDialog, setEditDialog] = useState<AssinaturaRow | null>(null);
  const [editForm, setEditForm] = useState({ plano: '', status: '', data_vencimento: '', valor_mensal: '' });
  const [detailDialog, setDetailDialog] = useState<AssinaturaRow | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<AssinaturaRow | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const isSuperAdmin = profile?.is_super_admin === true;

  const { data: assinaturas = [], isLoading, refetch } = useQuery({
    queryKey: ['super-admin-assinaturas'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/admin-assinaturas`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error('Erro ao buscar assinaturas');
      return await res.json() as AssinaturaRow[];
    },
    enabled: !!isSuperAdmin,
  });

  const edgeFnUrl = `https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/admin-assinaturas`;

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    };
  };

  const updateAssinatura = useMutation({
    mutationFn: async ({ id, user_id, updates }: { id: string | null; user_id: string; updates: Record<string, any> }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(edgeFnUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, user_id, updates }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-assinaturas'] });
      toast.success('Assinatura atualizada com sucesso!');
      setEditDialog(null);
    },
    onError: (err: any) => {
      toast.error('Erro ao atualizar: ' + err.message);
    },
  });

  const deleteAssinatura = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(edgeFnUrl, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao excluir');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-assinaturas'] });
      toast.success('Assinatura excluída com sucesso!');
      setDeleteDialog(null);
    },
    onError: (err: any) => {
      toast.error('Erro ao excluir: ' + err.message);
    },
  });

  const stats = useMemo(() => {
    const ativos = assinaturas.filter((a: any) => a.status === 'ativo');
    const expirados = assinaturas.filter((a: any) => a.status === 'expirado');
    const bloqueados = assinaturas.filter((a: any) => a.status === 'cancelado');
    const receitaMensal = ativos.reduce((sum: number, a: any) => sum + (a.valor_mensal || 0), 0);
    const trials = assinaturas.filter((a: any) => a.trial_ativo);
    const semPlano = assinaturas.filter((a: any) => !a.has_subscription);
    const totalFuncionarios = assinaturas.reduce((sum: number, a: any) => sum + (a.funcionarios?.length || 0), 0);

    return {
      totalUsers: assinaturas.length,
      totalFuncionarios,
      ativos: ativos.length,
      expirados: expirados.length,
      bloqueados: bloqueados.length,
      trials: trials.length,
      receitaMensal,
      usersWithoutSub: semPlano.length,
    };
  }, [assinaturas]);

  const filtered = useMemo(() => {
    return assinaturas.filter((a: any) => {
      const matchSearch = !search ||
        a.profiles?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        a.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
        a.user_id.includes(search) ||
        a.funcionarios?.some((f: Funcionario) =>
          f.nome.toLowerCase().includes(search.toLowerCase()) ||
          f.email.toLowerCase().includes(search.toLowerCase())
        );
      const matchStatus = statusFilter === 'todos' || a.status === statusFilter || (statusFilter === 'sem_plano' && !a.has_subscription);
      return matchSearch && matchStatus;
    });
  }, [assinaturas, search, statusFilter]);

  const openEdit = (a: AssinaturaRow) => {
    setEditForm({
      plano: a.plano || 'nexsiles',
      status: a.status === 'sem_plano' ? 'ativo' : a.status,
      data_vencimento: a.data_vencimento?.split('T')[0] || '',
      valor_mensal: String(a.valor_mensal || 0),
    });
    setEditDialog(a);
  };

  const handleSaveEdit = () => {
    if (!editDialog) return;
    updateAssinatura.mutate({
      id: editDialog.id,
      user_id: editDialog.user_id,
      updates: {
        plano: editForm.plano,
        status: editForm.status,
        data_vencimento: editForm.data_vencimento,
        valor_mensal: parseFloat(editForm.valor_mensal) || 0,
      },
    });
  };

  const handleBlock = (a: AssinaturaRow) => {
    if (!a.id) {
      toast.error('Usuário sem assinatura. Edite primeiro para criar uma.');
      return;
    }
    const newStatus = a.status === 'cancelado' ? 'ativo' : 'cancelado';
    updateAssinatura.mutate({
      id: a.id,
      user_id: a.user_id,
      updates: { status: newStatus },
    });
  };

  const toggleExpand = (userId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativo</Badge>;
      case 'expirado': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Expirado</Badge>;
      case 'cancelado': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Bloqueado</Badge>;
      case 'pendente': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pendente</Badge>;
      case 'sem_plano': return <Badge variant="outline" className="text-muted-foreground">Sem Plano</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDaysRemaining = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return <span className="text-destructive font-medium">Expirado há {Math.abs(days)}d</span>;
    if (days <= 7) return <span className="text-amber-400 font-medium">{days}d restantes</span>;
    return <span className="text-muted-foreground">{days}d restantes</span>;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Super Admin</h1>
          <p className="text-sm text-muted-foreground">Gestão de assinaturas e faturamento</p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto gap-2" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Responsáveis</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <UserCheck className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <p className="text-2xl font-bold text-foreground">{stats.totalFuncionarios}</p>
            <p className="text-xs text-muted-foreground">Funcionários</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
            <p className="text-2xl font-bold text-foreground">{stats.ativos}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-400" />
            <p className="text-2xl font-bold text-foreground">{stats.expirados}</p>
            <p className="text-xs text-muted-foreground">Expirados</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Ban className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold text-foreground">{stats.bloqueados}</p>
            <p className="text-xs text-muted-foreground">Bloqueados</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
            <p className="text-2xl font-bold text-foreground">R$ {stats.receitaMensal.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Receita/mês</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <p className="text-2xl font-bold text-foreground">{stats.usersWithoutSub}</p>
            <p className="text-xs text-muted-foreground">Sem Plano</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="expirado">Expirados</SelectItem>
                <SelectItem value="cancelado">Bloqueados</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="sem_plano">Sem Plano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Assinaturas ({filtered.length})
          </CardTitle>
          <CardDescription>Gerencie todas as assinaturas do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma assinatura encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium w-8"></th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Usuário</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Plano</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Vencimento</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Valor</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Pagamento</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: AssinaturaRow) => {
                    const hasEmployees = (a.funcionarios?.length || 0) > 0;
                    const isExpanded = expandedRows.has(a.user_id);

                    return (
                      <>
                        <tr key={a.user_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2">
                            {hasEmployees && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleExpand(a.user_id)}
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </Button>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium text-foreground">{a.profiles?.nome || '—'}</p>
                              <p className="text-xs text-muted-foreground">{a.profiles?.email || a.user_id.substring(0, 8)}</p>
                              {hasEmployees && (
                                <p className="text-xs text-primary mt-0.5">{a.funcionarios!.length} funcionário(s)</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            {a.plano ? (
                              <Badge variant="outline" className="capitalize">
                                {a.plano === 'nexsiles_max' ? 'Max' : 'Nexsiles'}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 px-2">{getStatusBadge(a.status)}</td>
                          <td className="py-3 px-2">
                            <div>
                              <p className="text-foreground text-xs">
                                {a.data_vencimento ? format(new Date(a.data_vencimento), 'dd/MM/yyyy') : '—'}
                              </p>
                              {a.data_vencimento && getDaysRemaining(a.data_vencimento)}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-foreground font-medium">
                              {a.valor_mensal > 0 ? `R$ ${a.valor_mensal.toFixed(2)}` : 'Cortesia'}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-muted-foreground capitalize text-xs">
                              {a.metodo_pagamento || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDetailDialog(a)}
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(a)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {a.has_subscription && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteDialog(a)}
                                  title="Excluir assinatura"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleBlock(a)}
                                title={a.status === 'cancelado' ? 'Desbloquear' : 'Bloquear'}
                              >
                                {a.status === 'cancelado' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Ban className="w-4 h-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {/* Employee rows */}
                        {hasEmployees && isExpanded && a.funcionarios!.map((f) => (
                          <tr key={f.user_id} className="bg-muted/20 border-b border-border/30">
                            <td className="py-2 px-2"></td>
                            <td className="py-2 px-2" colSpan={7}>
                              <div className="flex items-center gap-3 pl-4">
                                <UserCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div className="flex items-center gap-4">
                                  <span className="font-medium text-foreground text-sm">{f.nome}</span>
                                  <span className="text-xs text-muted-foreground">{f.email}</span>
                                  <Badge variant="secondary" className="text-xs">{f.cargo}</Badge>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editDialog?.has_subscription ? 'Editar Assinatura' : 'Criar Assinatura'}</DialogTitle>
            <DialogDescription>
              {editDialog?.profiles?.nome} — {editDialog?.profiles?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={editForm.plano} onValueChange={(v) => setEditForm({ ...editForm, plano: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nexsiles">Nexsiles (R$ 189)</SelectItem>
                  <SelectItem value="nexsiles_max">Nexsiles Max (R$ 249)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="expirado">Expirado</SelectItem>
                  <SelectItem value="cancelado">Bloqueado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={editForm.data_vencimento}
                onChange={(e) => setEditForm({ ...editForm, data_vencimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.valor_mensal}
                onChange={(e) => setEditForm({ ...editForm, valor_mensal: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateAssinatura.isPending}>
              {updateAssinatura.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={(open) => !open && setDetailDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Assinatura</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Nome:</span></div>
                <div className="font-medium">{detailDialog.profiles?.nome || '—'}</div>
                <div><span className="text-muted-foreground">Email:</span></div>
                <div className="font-medium">{detailDialog.profiles?.email || '—'}</div>
                <div><span className="text-muted-foreground">User ID:</span></div>
                <div className="font-mono text-xs">{detailDialog.user_id}</div>
                <div><span className="text-muted-foreground">Plano:</span></div>
                <div className="font-medium capitalize">{detailDialog.plano || '—'}</div>
                <div><span className="text-muted-foreground">Status:</span></div>
                <div>{getStatusBadge(detailDialog.status)}</div>
                <div><span className="text-muted-foreground">Valor:</span></div>
                <div className="font-medium">R$ {detailDialog.valor_mensal?.toFixed(2)}</div>
                <div><span className="text-muted-foreground">Início:</span></div>
                <div>{detailDialog.data_inicio ? format(new Date(detailDialog.data_inicio), 'dd/MM/yyyy HH:mm') : '—'}</div>
                <div><span className="text-muted-foreground">Vencimento:</span></div>
                <div>{detailDialog.data_vencimento ? format(new Date(detailDialog.data_vencimento), 'dd/MM/yyyy HH:mm') : '—'}</div>
                <div><span className="text-muted-foreground">Pagamento:</span></div>
                <div className="capitalize">{detailDialog.metodo_pagamento || '—'}</div>
                <div><span className="text-muted-foreground">Trial:</span></div>
                <div>{detailDialog.trial_ativo ? 'Sim' : 'Não'}</div>
                <div><span className="text-muted-foreground">Criado em:</span></div>
                <div>{detailDialog.created_at ? format(new Date(detailDialog.created_at), 'dd/MM/yyyy HH:mm') : '—'}</div>
              </div>

              {/* Funcionarios section in detail */}
              {detailDialog.funcionarios && detailDialog.funcionarios.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    Funcionários ({detailDialog.funcionarios.length})
                  </p>
                  <div className="space-y-2">
                    {detailDialog.funcionarios.map((f) => (
                      <div key={f.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{f.nome}</p>
                          <p className="text-xs text-muted-foreground">{f.email}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">{f.cargo}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a assinatura de <strong>{deleteDialog?.profiles?.nome}</strong>?
              Esta ação não pode ser desfeita. O usuário ficará sem plano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDialog?.id && deleteAssinatura.mutate(deleteDialog.id)}
            >
              {deleteAssinatura.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
