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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Shield, Users, DollarSign, Crown, Search, Ban, CheckCircle, Edit,
  TrendingUp, Calendar, AlertTriangle, RefreshCw, Loader2, Eye
} from 'lucide-react';

// Super admin emails - only these can access this page
const SUPER_ADMIN_EMAILS = [
  'beneloahsemijoias@gmail.com',
  // Add more super admin emails here
];

interface AssinaturaRow {
  id: string;
  user_id: string;
  plano: string;
  status: string;
  data_inicio: string;
  data_vencimento: string;
  valor_mensal: number;
  trial_ativo: boolean;
  metodo_pagamento: string | null;
  created_at: string;
  profiles?: { nome: string; email: string } | null;
}

export default function SuperAdminPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [editDialog, setEditDialog] = useState<AssinaturaRow | null>(null);
  const [editForm, setEditForm] = useState({ plano: '', status: '', data_vencimento: '', valor_mensal: '' });
  const [detailDialog, setDetailDialog] = useState<AssinaturaRow | null>(null);

  // Check if current user is super admin
  const isSuperAdmin = profile?.email && SUPER_ADMIN_EMAILS.includes(profile.email);

  // Fetch all subscriptions with profiles
  const { data: assinaturas = [], isLoading, refetch } = useQuery({
    queryKey: ['super-admin-assinaturas'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://ljofnwcvpzqlhagejgbk.supabase.co'}/functions/v1/admin-assinaturas`,
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

  // Fetch all profiles (users without subscription)
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['super-admin-profiles'],
    queryFn: async () => {
      // Profiles are already fetched via the edge function joined data
      // Use assinaturas profiles as base, no separate query needed
      return assinaturas.map((a: any) => ({
        user_id: a.user_id,
        nome: a.profiles?.nome,
        email: a.profiles?.email,
        created_at: a.created_at,
      }));
    },
    enabled: !!isSuperAdmin && assinaturas.length > 0,
  });

  const edgeFnUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://ljofnwcvpzqlhagejgbk.supabase.co'}/functions/v1/admin-assinaturas`;

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    };
  };

  // Update subscription mutation
  const updateAssinatura = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(edgeFnUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, updates }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar');
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

  // Create subscription mutation
  const createAssinatura = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const headers = await getAuthHeaders();
      const res = await fetch(edgeFnUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao criar');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-assinaturas'] });
      toast.success('Assinatura criada!');
    },
    onError: (err: any) => {
      toast.error('Erro: ' + err.message);
    },
  });

  // Calculated stats
  const stats = useMemo(() => {
    const ativos = assinaturas.filter((a: any) => a.status === 'ativo');
    const expirados = assinaturas.filter((a: any) => a.status === 'expirado');
    const bloqueados = assinaturas.filter((a: any) => a.status === 'cancelado');
    const receitaMensal = ativos.reduce((sum: number, a: any) => sum + (a.valor_mensal || 0), 0);
    const trials = assinaturas.filter((a: any) => a.trial_ativo);
    const totalUsers = allProfiles.length;
    const usersWithSub = assinaturas.length;
    const usersWithoutSub = totalUsers - usersWithSub;

    return {
      totalUsers,
      ativos: ativos.length,
      expirados: expirados.length,
      bloqueados: bloqueados.length,
      trials: trials.length,
      receitaMensal,
      usersWithoutSub,
    };
  }, [assinaturas, allProfiles]);

  // Filtered list
  const filtered = useMemo(() => {
    return assinaturas.filter((a: any) => {
      const matchSearch = !search ||
        a.profiles?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        a.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
        a.user_id.includes(search);
      const matchStatus = statusFilter === 'todos' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [assinaturas, search, statusFilter]);

  const openEdit = (a: AssinaturaRow) => {
    setEditForm({
      plano: a.plano,
      status: a.status,
      data_vencimento: a.data_vencimento?.split('T')[0] || '',
      valor_mensal: String(a.valor_mensal || 0),
    });
    setEditDialog(a);
  };

  const handleSaveEdit = () => {
    if (!editDialog) return;
    updateAssinatura.mutate({
      id: editDialog.id,
      updates: {
        plano: editForm.plano,
        status: editForm.status,
        data_vencimento: editForm.data_vencimento,
        valor_mensal: parseFloat(editForm.valor_mensal) || 0,
      },
    });
  };

  const handleBlock = (a: AssinaturaRow) => {
    const newStatus = a.status === 'cancelado' ? 'ativo' : 'cancelado';
    updateAssinatura.mutate({
      id: a.id,
      updates: { status: newStatus },
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
            <p className="text-xs text-muted-foreground">Total Usuários</p>
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
            <Crown className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-foreground">{stats.trials}</p>
            <p className="text-xs text-muted-foreground">Em Trial</p>
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
                  {filtered.map((a: any) => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-foreground">{a.profiles?.nome || '—'}</p>
                          <p className="text-xs text-muted-foreground">{a.profiles?.email || a.user_id.substring(0, 8)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="capitalize">
                          {a.plano === 'nexsiles_max' ? 'Max' : 'Nexsiles'}
                        </Badge>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleBlock(a)}
                            title={a.status === 'cancelado' ? 'Desbloquear' : 'Bloquear'}
                          >
                            {a.status === 'cancelado' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
            <DialogTitle>Editar Assinatura</DialogTitle>
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
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Nome:</span></div>
                <div className="font-medium">{detailDialog.profiles?.nome || '—'}</div>
                <div><span className="text-muted-foreground">Email:</span></div>
                <div className="font-medium">{detailDialog.profiles?.email || '—'}</div>
                <div><span className="text-muted-foreground">User ID:</span></div>
                <div className="font-mono text-xs">{detailDialog.user_id}</div>
                <div><span className="text-muted-foreground">Plano:</span></div>
                <div className="font-medium capitalize">{detailDialog.plano}</div>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
