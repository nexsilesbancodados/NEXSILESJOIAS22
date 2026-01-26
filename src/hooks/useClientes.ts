import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from '@/hooks/use-toast';

const db = supabase;

export interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  observacoes: string | null;
  pontos_fidelidade: number | null;
  ativo: boolean | null;
  whatsapp: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await db
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data as Cliente[];
    },
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      const { data, error } = await db
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Cliente;
    },
    enabled: !!id,
  });
}

export function useAniversariantesDoMes() {
  const mes = new Date().getMonth() + 1;
  
  return useQuery({
    queryKey: ['aniversariantes', mes],
    queryFn: async () => {
      const { data, error } = await db
        .from('clientes')
        .select('*')
        .not('data_nascimento', 'is', null)
        .order('data_nascimento', { ascending: true });
      
      if (error) throw error;
      
      // Filter clients whose birthday is in the current month
      return (data as Cliente[]).filter(cliente => {
        if (!cliente.data_nascimento) return false;
        const birthMonth = new Date(cliente.data_nascimento).getMonth() + 1;
        return birthMonth === mes;
      });
    },
  });
}

export function useVendasCliente(clienteId: string) {
  return useQuery({
    queryKey: ['vendas-cliente', clienteId],
    queryFn: async () => {
      const { data, error } = await db
        .from('vendas')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });
}

export function useAddCliente() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  
  return useMutation({
    mutationFn: async (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => {
      if (!organizationId) throw new Error('Organization not found');
      
      const { data, error } = await db
        .from('clientes')
        .insert({ ...cliente, organization_id: organizationId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async (newCliente) => {
      await queryClient.cancelQueries({ queryKey: ['clientes'] });
      const previousData = queryClient.getQueryData<Cliente[]>(['clientes']);
      
      const tempItem: Cliente = {
        ...newCliente,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Cliente[]>(['clientes'], (old) => 
        old ? [...old, tempItem] : [tempItem]
      );
      
      return { previousData };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['clientes'], context.previousData);
      }
      toast({ title: 'Erro ao cadastrar cliente', variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['aniversariantes'] });
    },
    onSuccess: () => {
      toast({ title: 'Cliente cadastrado com sucesso!' });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...cliente }: Partial<Cliente> & { id: string }) => {
      const { data, error } = await db
        .from('clientes')
        .update(cliente)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['clientes'] });
      const previousData = queryClient.getQueryData<Cliente[]>(['clientes']);
      
      queryClient.setQueryData<Cliente[]>(['clientes'], (old) =>
        old?.map((item) => 
          item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
        ) ?? []
      );
      
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['clientes'], context.previousData);
      }
      toast({ title: 'Erro ao atualizar cliente', variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['aniversariantes'] });
    },
    onSuccess: () => {
      toast({ title: 'Cliente atualizado com sucesso!' });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['clientes'] });
      const previousData = queryClient.getQueryData<Cliente[]>(['clientes']);
      
      queryClient.setQueryData<Cliente[]>(['clientes'], (old) =>
        old?.filter((item) => item.id !== id) ?? []
      );
      
      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['clientes'], context.previousData);
      }
      toast({ title: 'Erro ao remover cliente', variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['aniversariantes'] });
    },
    onSuccess: () => {
      toast({ title: 'Cliente removido com sucesso!' });
    },
  });
}
