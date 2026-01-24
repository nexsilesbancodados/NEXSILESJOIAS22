import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, supabase } from '@/lib/supabase-db';
import { toast } from 'sonner';

// Types based on actual database schema
export interface Peca {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  categoria: string | null;
  material: string | null;
  peso: number | null;
  estoque: number;
  estoque_minimo: number;
  custo: number;
  preco: number;
  preco_revenda: number;
  preco_custo?: number | null;
  preco_venda?: number | null;
  preco_atacado?: number | null;
  preco_promocional?: number | null;
  qtd_min_atacado?: number | null;
  fornecedor_id: string | null;
  banho_id: string | null;
  imagem_url: string | null;
  ativo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Aliases for backward compatibility
  codigo_barras?: string | null;
  subcategoria?: string | null;
  localizacao?: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  role: string | null;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  // Aliases
  ativo?: boolean | null;
  comissao?: number | null;
}

export interface Fornecedor {
  id: string;
  user_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  contato: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  user_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  data_nascimento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Maleta {
  id: string;
  user_id: string;
  revendedora_id: string | null;
  codigo: string | null;
  status: string;
  data_emprestimo: string | null;
  data_devolucao_prevista: string | null;
  data_devolucao: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Aliases for backward compatibility
  nome?: string | null;
  reseller_id?: string;
  data_envio?: string | null;
  data_retorno?: string | null;
  prazo_retorno?: string | null;
  prazo_devolucao?: number | null;
  valor_total?: number;
  comissao_personalizada?: number | null;
}

export interface MaletaItem {
  id: string;
  maleta_id: string;
  peca_id: string | null;
  quantidade: number;
  preco_unitario: number | null;
  status: string;
  created_at: string;
  peca?: Peca;
}

export interface Venda {
  id: string;
  user_id: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  total: number;
  desconto: number;
  forma_pagamento: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Aliases for backward compatibility
  numero?: number;
  tipo?: 'pdv' | 'revendedora' | 'catalogo';
  revendedora_id?: string | null;
  caixa_sessao_id?: string | null;
  maleta_id?: string | null;
  subtotal?: number;
  data?: string;
  caixa_id?: string | null;
  reseller_id?: string | null;
}

export interface VendaItem {
  id: string;
  venda_id: string;
  peca_id: string | null;
  peca_nome: string | null;
  quantidade: number;
  preco_unitario: number | null;
  created_at: string;
}

export interface Romaneio {
  id: string;
  user_id: string;
  reseller_id: string | null;
  reseller_nome: string | null;
  maleta_id: string | null;
  cliente_nome: string | null;
  total: number;
  comissao: number;
  status: string;
  data: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Aliases for backward compatibility
  numero?: number;
  revendedora_nome?: string | null;
  data_entrega?: string | null;
}

export interface RomaneioItem {
  id: string;
  romaneio_id: string;
  peca_id: string | null;
  peca_nome: string | null;
  quantidade: number;
  preco_unitario: number | null;
  created_at: string;
}

export interface CaixaSessao {
  id: string;
  user_id: string;
  valor_inicial: number;
  valor_final: number | null;
  data_abertura: string | null;
  data_fechamento: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  // Aliases for backward compatibility
  fundo_troco?: number;
}

export interface MovimentoCaixa {
  id: string;
  caixa_sessao_id: string;
  tipo: 'sangria' | 'suprimento';
  valor: number;
  descricao: string | null;
  created_at: string;
  // Alias for backward compatibility
  caixa_id?: string;
  data?: string;
}

export interface Configuracao {
  id: string;
  chave: string;
  valor: string | null;
  created_at: string;
  updated_at: string;
}

// Note: "pagamentos" table doesn't exist in new schema - payments are tracked via forma_pagamento in vendas
export interface Pagamento {
  id: string;
  venda_id: string;
  metodo: 'dinheiro' | 'pix' | 'credito' | 'debito';
  valor: number;
  created_at: string;
}

// ========== PEÇAS ==========
export function usePecas() {
  return useQuery({
    queryKey: ['pecas'],
    queryFn: async () => {
      // Get current user to filter by user_id
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('pecas')
        .select('*')
        .eq('user_id', user?.id)
        .order('nome');
      
      if (error) throw error;
      return data as Peca[];
    },
  });
}

export function useAddPeca() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (peca: Omit<Peca, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('pecas')
        .insert({ ...peca, user_id: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async (newPeca) => {
      await queryClient.cancelQueries({ queryKey: ['pecas'] });
      const previousPecas = queryClient.getQueryData<Peca[]>(['pecas']);
      
      const tempPeca: Peca = {
        ...newPeca,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Peca;
      
      queryClient.setQueryData<Peca[]>(['pecas'], (old) => 
        old ? [...old, tempPeca] : [tempPeca]
      );
      
      return { previousPecas };
    },
    onError: (_err, _newPeca, context) => {
      if (context?.previousPecas) {
        queryClient.setQueryData(['pecas'], context.previousPecas);
      }
      toast.error('Erro ao adicionar peça');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
    },
    onSuccess: () => {
      toast.success('Peça adicionada com sucesso!');
    },
  });
}

export function useUpdatePeca() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Peca> & { id: string }) => {
      const { data, error } = await supabase
        .from('pecas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['pecas'] });
      const previousPecas = queryClient.getQueryData<Peca[]>(['pecas']);
      
      queryClient.setQueryData<Peca[]>(['pecas'], (old) =>
        old?.map((peca) => 
          peca.id === id ? { ...peca, ...updates, updated_at: new Date().toISOString() } : peca
        ) ?? []
      );
      
      return { previousPecas };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPecas) {
        queryClient.setQueryData(['pecas'], context.previousPecas);
      }
      toast.error('Erro ao atualizar peça');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
    },
    onSuccess: () => {
      toast.success('Peça atualizada com sucesso!');
    },
  });
}

export function useDeletePeca() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pecas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['pecas'] });
      const previousPecas = queryClient.getQueryData<Peca[]>(['pecas']);
      
      queryClient.setQueryData<Peca[]>(['pecas'], (old) =>
        old?.filter((peca) => peca.id !== id) ?? []
      );
      
      return { previousPecas };
    },
    onError: (_err, _id, context) => {
      if (context?.previousPecas) {
        queryClient.setQueryData(['pecas'], context.previousPecas);
      }
      toast.error('Erro ao remover peça');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
    },
    onSuccess: () => {
      toast.success('Peça removida com sucesso!');
    },
  });
}

// ========== FORNECEDORES ==========
export function useFornecedores() {
  return useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('user_id', user?.id)
        .order('nome');
      
      if (error) throw error;
      return data as Fornecedor[];
    },
  });
}

export function useAddFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fornecedor: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({ ...fornecedor, user_id: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async (newFornecedor) => {
      await queryClient.cancelQueries({ queryKey: ['fornecedores'] });
      const previousData = queryClient.getQueryData<Fornecedor[]>(['fornecedores']);
      
      const tempItem: Fornecedor = {
        ...newFornecedor,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Fornecedor;
      
      queryClient.setQueryData<Fornecedor[]>(['fornecedores'], (old) => 
        old ? [...old, tempItem] : [tempItem]
      );
      
      return { previousData };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['fornecedores'], context.previousData);
      }
      toast.error('Erro ao adicionar fornecedor');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
    },
    onSuccess: () => {
      toast.success('Fornecedor adicionado com sucesso!');
    },
  });
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Fornecedor> & { id: string }) => {
      const { data, error } = await supabase
        .from('fornecedores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['fornecedores'] });
      const previousData = queryClient.getQueryData<Fornecedor[]>(['fornecedores']);
      
      queryClient.setQueryData<Fornecedor[]>(['fornecedores'], (old) =>
        old?.map((item) => 
          item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
        ) ?? []
      );
      
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['fornecedores'], context.previousData);
      }
      toast.error('Erro ao atualizar fornecedor');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
    },
    onSuccess: () => {
      toast.success('Fornecedor atualizado com sucesso!');
    },
  });
}

export function useDeleteFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['fornecedores'] });
      const previousData = queryClient.getQueryData<Fornecedor[]>(['fornecedores']);
      
      queryClient.setQueryData<Fornecedor[]>(['fornecedores'], (old) =>
        old?.filter((item) => item.id !== id) ?? []
      );
      
      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['fornecedores'], context.previousData);
      }
      toast.error('Erro ao remover fornecedor');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
    },
    onSuccess: () => {
      toast.success('Fornecedor removido com sucesso!');
    },
  });
}

// ========== CLIENTES ==========
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', user?.id)
        .order('nome');
      
      if (error) throw error;
      return data as Cliente[];
    },
  });
}

export function useAddCliente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...cliente, user_id: user?.id })
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
      } as Cliente;
      
      queryClient.setQueryData<Cliente[]>(['clientes'], (old) => 
        old ? [...old, tempItem] : [tempItem]
      );
      
      return { previousData };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['clientes'], context.previousData);
      }
      toast.error('Erro ao adicionar cliente');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['aniversariantes'] });
    },
    onSuccess: () => {
      toast.success('Cliente adicionado com sucesso!');
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cliente> & { id: string }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
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
      toast.error('Erro ao atualizar cliente');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['aniversariantes'] });
    },
    onSuccess: () => {
      toast.success('Cliente atualizado com sucesso!');
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
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
      toast.error('Erro ao remover cliente');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['aniversariantes'] });
    },
    onSuccess: () => {
      toast.success('Cliente removido com sucesso!');
    },
  });
}

// ========== REVENDEDORAS ==========
export interface Revendedora {
  id: string;
  user_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  comissao: number | null;
  ativa: boolean | null;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useRevendedoras() {
  return useQuery({
    queryKey: ['revendedoras'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('revendedoras')
        .select('*')
        .eq('user_id', user?.id)
        .order('nome');
      
      if (error) throw error;
      return data as Revendedora[];
    },
  });
}

export function useAddRevendedora() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (revendedora: Partial<Omit<Revendedora, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('revendedoras')
        .insert({
          nome: revendedora.nome || '',
          telefone: revendedora.telefone || null,
          email: revendedora.email || null,
          cpf: revendedora.cpf || null,
          endereco: revendedora.endereco || null,
          cidade: revendedora.cidade || null,
          estado: revendedora.estado || null,
          comissao: revendedora.comissao ?? 30,
          ativa: revendedora.ativa ?? true,
          profile_id: revendedora.profile_id || null,
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revendedoras'] });
      toast.success('Revendedora adicionada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar revendedora');
    },
  });
}

export function useUpdateRevendedora() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Revendedora> & { id: string }) => {
      const { data, error } = await supabase
        .from('revendedoras')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revendedoras'] });
      toast.success('Revendedora atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar revendedora');
    },
  });
}

export function useDeleteRevendedora() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('revendedoras')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revendedoras'] });
      toast.success('Revendedora removida com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover revendedora');
    },
  });
}

// ========== MALETAS ==========
export function useMaletas(resellerId?: string) {
  return useQuery({
    queryKey: ['maletas', resellerId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('maletas')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (resellerId) {
        query = query.eq('revendedora_id', resellerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Maleta[];
    },
  });
}

export function useMaletaItems(maletaId: string) {
  return useQuery({
    queryKey: ['maleta-items', maletaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maleta_itens')
        .select('*, peca:pecas(*)')
        .eq('maleta_id', maletaId);
      
      if (error) throw error;
      return data as (MaletaItem & { peca: Peca })[];
    },
    enabled: !!maletaId,
  });
}

export function useAddMaleta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (maletaData: { 
      reseller_id: string; 
      nome?: string;
      comissao_personalizada?: number;
      prazo_devolucao?: string;
      observacoes?: string;
    }) => {
      // Get current user id
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('maletas')
        .insert({ 
          revendedora_id: maletaData.reseller_id, 
          codigo: `MAL-${Date.now()}`,
          status: 'aberta',
          observacoes: maletaData.observacoes || null,
          data_devolucao_prevista: maletaData.prazo_devolucao || null,
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas'] });
      toast.success('Maleta criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar maleta');
    },
  });
}

export function useAddMaletaItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ maletaId, pecaId }: { maletaId: string; pecaId: string }) => {
      // Add item to maleta
      const { data, error } = await supabase
        .from('maleta_itens')
        .insert({ maleta_id: maletaId, peca_id: pecaId, status: 'pendente' })
        .select()
        .single();
      
      if (error) throw error;

      // Decrease stock
      const { data: pecaData } = await supabase
        .from('pecas')
        .select('estoque')
        .eq('id', pecaId)
        .single();
      
      if (pecaData) {
        await supabase
          .from('pecas')
          .update({ estoque: pecaData.estoque - 1 })
          .eq('id', pecaId);
      }

      return data;
    },
    onSuccess: (_, { maletaId }) => {
      queryClient.invalidateQueries({ queryKey: ['maleta-items', maletaId] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      toast.success('Peça adicionada à maleta!');
    },
    onError: () => {
      toast.error('Erro ao adicionar peça');
    },
  });
}

export function useUpdateMaletaItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, pecaId, statusAnterior }: { 
      id: string; 
      status: 'pendente' | 'vendido' | 'devolvido'; 
      pecaId: string;
      statusAnterior?: 'pendente' | 'vendido' | 'devolvido';
    }) => {
      const { data, error } = await supabase
        .from('maleta_itens')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // If returned from pendente, increase stock
      if (status === 'devolvido' && statusAnterior !== 'vendido') {
        const { data: pecaData } = await supabase
          .from('pecas')
          .select('estoque')
          .eq('id', pecaId)
          .single();
        
        if (pecaData) {
          await supabase
            .from('pecas')
            .update({ estoque: pecaData.estoque + 1 })
            .eq('id', pecaId);
        }
      }

      // If canceling a sale (vendido -> pendente), item stays out of stock (already removed when added to maleta)
      // No stock change needed - the item is still in the maleta

      // If returning a sold item to stock (vendido -> devolvido), increase stock
      if (status === 'devolvido' && statusAnterior === 'vendido') {
        const { data: pecaData } = await supabase
          .from('pecas')
          .select('estoque')
          .eq('id', pecaId)
          .single();
        
        if (pecaData) {
          await supabase
            .from('pecas')
            .update({ estoque: pecaData.estoque + 1 })
            .eq('id', pecaId);
        }
      }

      return data;
    },
    onSuccess: (_, { status, statusAnterior }) => {
      queryClient.invalidateQueries({ queryKey: ['maleta-items'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      
      if (status === 'pendente' && statusAnterior === 'vendido') {
        toast.success('Venda desfeita! Item voltou para pendente.');
      } else if (status === 'vendido') {
        toast.success('Item marcado como vendido!');
      } else if (status === 'devolvido') {
        toast.success('Item marcado como devolvido e retornado ao estoque!');
      }
    },
    onError: () => {
      toast.error('Erro ao atualizar item');
    },
  });
}

export function useCloseMaleta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ maletaId, returnPendingToStock = true }: { maletaId: string; returnPendingToStock?: boolean }) => {
      // If returnPendingToStock is true, return all pending items to stock
      if (returnPendingToStock) {
        // Get all pending items
        const { data: pendingItems } = await supabase
          .from('maleta_itens')
          .select('id, peca_id')
          .eq('maleta_id', maletaId)
          .eq('status', 'pendente');

        if (pendingItems && pendingItems.length > 0) {
          // Update all pending items to devolvido
          await supabase
            .from('maleta_itens')
            .update({ status: 'devolvido' })
            .eq('maleta_id', maletaId)
            .eq('status', 'pendente');

          // Return each piece to stock
          for (const item of pendingItems) {
            const { data: pecaData } = await supabase
              .from('pecas')
              .select('estoque')
              .eq('id', item.peca_id)
              .single();
            
            if (pecaData) {
              await supabase
                .from('pecas')
                .update({ estoque: pecaData.estoque + 1 })
                .eq('id', item.peca_id);
            }
          }
        }
      }

      // Close the maleta
      const { data, error } = await supabase
        .from('maletas')
        .update({ status: 'fechada', data_fechamento: new Date().toISOString() })
        .eq('id', maletaId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas'] });
      queryClient.invalidateQueries({ queryKey: ['maleta-items'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      toast.success('Maleta fechada! Peças pendentes devolvidas ao estoque.');
    },
    onError: () => {
      toast.error('Erro ao fechar maleta');
    },
  });
}

export function useUpdateMaleta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: { 
      id: string; 
      nome?: string | null;
      comissao_personalizada?: number | null;
      prazo_devolucao?: string | null;
      observacoes?: string | null;
    }) => {
      // Map prazo_devolucao to data_devolucao_prevista (actual DB column)
      const dbData: Record<string, unknown> = {};
      if (updateData.observacoes !== undefined) dbData.observacoes = updateData.observacoes;
      if (updateData.prazo_devolucao !== undefined) dbData.data_devolucao_prevista = updateData.prazo_devolucao;

      const { data, error } = await supabase
        .from('maletas')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas'] });
      toast.success('Maleta atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar maleta');
    },
  });
}

// ========== VENDAS ==========
export function useVendas() {
  return useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Venda[];
    },
  });
}

export function useVendaItems(vendaId: string) {
  return useQuery({
    queryKey: ['venda-items', vendaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venda_itens')
        .select('*')
        .eq('venda_id', vendaId);
      
      if (error) throw error;
      return data as VendaItem[];
    },
    enabled: !!vendaId,
  });
}

// Note: pagamentos table doesn't exist - payment info is in vendas.forma_pagamento
export function useVendaPagamentos(_vendaId: string) {
  return useQuery({
    queryKey: ['venda-pagamentos', _vendaId],
    queryFn: async () => {
      // Pagamentos table doesn't exist in schema - return empty array
      // Payment method is stored in vendas.forma_pagamento
      return [] as Pagamento[];
    },
    enabled: !!_vendaId,
  });
}

export function useAddVenda() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      venda,
      items,
      pagamentos,
    }: {
      venda: Omit<Venda, 'id' | 'created_at'>;
      items: Omit<VendaItem, 'id' | 'created_at' | 'venda_id'>[];
      pagamentos: Omit<Pagamento, 'id' | 'created_at' | 'venda_id'>[];
    }) => {
      // Get current user id
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert venda with user_id
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert({ ...venda, user_id: user?.id })
        .select()
        .single();
      
      if (vendaError) throw vendaError;

      // Insert items
      const itemsWithVendaId = items.map(item => ({
        ...item,
        venda_id: vendaData.id,
      }));
      
      const { error: itemsError } = await supabase
        .from('venda_itens')
        .insert(itemsWithVendaId);
      
      if (itemsError) throw itemsError;

      // Note: pagamentos table doesn't exist in schema
      // Payment info is stored in vendas.forma_pagamento
      // Skip pagamentos insert - the forma_pagamento is already in the venda object

      // Update stock for each item
      for (const item of items) {
        const { data: pecaData } = await supabase
          .from('pecas')
          .select('estoque')
          .eq('id', item.peca_id)
          .single();
        
        if (pecaData) {
          await supabase
            .from('pecas')
            .update({ estoque: pecaData.estoque - item.quantidade })
            .eq('id', item.peca_id);
        }
      }

      return vendaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas-caixa'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      toast.success('Venda registrada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating venda:', error);
      toast.error('Erro ao registrar venda');
    },
  });
}

// ========== ROMANEIOS ==========
export function useRomaneios() {
  return useQuery({
    queryKey: ['romaneios'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('romaneios')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Romaneio[];
    },
  });
}

export function useRomaneioItems(romaneioId: string) {
  return useQuery({
    queryKey: ['romaneio-items', romaneioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('romaneio_itens')
        .select('*')
        .eq('romaneio_id', romaneioId);
      
      if (error) throw error;
      return data as RomaneioItem[];
    },
    enabled: !!romaneioId,
  });
}

export function useAddRomaneio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      romaneio,
      items,
    }: {
      romaneio: Omit<Romaneio, 'id' | 'created_at' | 'user_id'>;
      items: Omit<RomaneioItem, 'id' | 'created_at' | 'romaneio_id'>[];
    }) => {
      // Get current user id for data isolation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data: romaneioData, error: romaneioError } = await supabase
        .from('romaneios')
        .insert({ ...romaneio, user_id: user.id })
        .select()
        .single();
      
      if (romaneioError) throw romaneioError;

      const itemsWithRomaneioId = items.map(item => ({
        ...item,
        romaneio_id: romaneioData.id,
      }));
      
      const { error: itemsError } = await supabase
        .from('romaneio_itens')
        .insert(itemsWithRomaneioId);
      
      if (itemsError) throw itemsError;

      return romaneioData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
      toast.success('Romaneio criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar romaneio');
    },
  });
}

export function useUpdateRomaneioStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Romaneio['status'] }) => {
      const { data, error } = await supabase
        .from('romaneios')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['romaneios'] });
      const previousData = queryClient.getQueryData<Romaneio[]>(['romaneios']);
      
      queryClient.setQueryData<Romaneio[]>(['romaneios'], (old) =>
        old?.map((item) => 
          item.id === id ? { ...item, status, updated_at: new Date().toISOString() } : item
        ) ?? []
      );
      
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['romaneios'], context.previousData);
      }
      toast.error('Erro ao atualizar romaneio');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
    },
    onSuccess: (_, { status }) => {
      toast.success(status === 'confirmado' ? 'Romaneio confirmado!' : 'Romaneio cancelado');
    },
  });
}

export function useDeleteRomaneio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error: itemsError } = await supabase
        .from('romaneio_itens')
        .delete()
        .eq('romaneio_id', id);
      
      if (itemsError) throw itemsError;
      
      const { error } = await supabase
        .from('romaneios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['romaneios'] });
      const previousData = queryClient.getQueryData<Romaneio[]>(['romaneios']);
      
      queryClient.setQueryData<Romaneio[]>(['romaneios'], (old) =>
        old?.filter((item) => item.id !== id) ?? []
      );
      
      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['romaneios'], context.previousData);
      }
      toast.error('Erro ao excluir romaneio');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
    },
    onSuccess: () => {
      toast.success('Romaneio excluído com sucesso!');
    },
  });
}

export function useDeleteRomaneiosBulk() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error: itemsError } = await supabase
        .from('romaneio_itens')
        .delete()
        .in('romaneio_id', ids);
      
      if (itemsError) throw itemsError;
      
      const { error } = await supabase
        .from('romaneios')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['romaneios'] });
      const previousData = queryClient.getQueryData<Romaneio[]>(['romaneios']);
      
      queryClient.setQueryData<Romaneio[]>(['romaneios'], (old) =>
        old?.filter((item) => !ids.includes(item.id)) ?? []
      );
      
      return { previousData };
    },
    onError: (_err, _ids, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['romaneios'], context.previousData);
      }
      toast.error('Erro ao excluir romaneios');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
    },
    onSuccess: (_, ids) => {
      toast.success(`${ids.length} romaneio(s) excluído(s) com sucesso!`);
    },
  });
}

// ========== CAIXA ==========
export function useCaixaAtual() {
  return useQuery({
    queryKey: ['caixa-atual'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('caixa_sessoes')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'aberto')
        .maybeSingle();
      
      if (error) throw error;
      return data as CaixaSessao | null;
    },
  });
}

export function useAbrirCaixa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, fundoTroco }: { userId: string; fundoTroco: number }) => {
      const { data, error } = await supabase
        .from('caixa_sessoes')
        .insert({
          user_id: userId,
          valor_inicial: fundoTroco,
          status: 'aberto',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa-atual'] });
      toast.success('Caixa aberto com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao abrir caixa');
    },
  });
}

export function useFecharCaixa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (caixaId: string) => {
      const { data, error } = await supabase
        .from('caixa_sessoes')
        .update({
          status: 'fechado',
          data_fechamento: new Date().toISOString(),
        })
        .eq('id', caixaId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa-atual'] });
      queryClient.invalidateQueries({ queryKey: ['historico-caixas'] });
      toast.success('Caixa fechado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao fechar caixa');
    },
  });
}

export function useVendasDoCaixa(caixaId: string | undefined) {
  return useQuery({
    queryKey: ['vendas-caixa', caixaId],
    queryFn: async () => {
      if (!caixaId) return [];
      
      const { data, error } = await (supabase as any)
        .from('vendas')
        .select('*')
        .eq('caixa_sessao_id', caixaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Venda[];
    },
    enabled: !!caixaId,
  });
}

export function useMovimentosCaixa(caixaId: string | undefined) {
  return useQuery({
    queryKey: ['movimentos-caixa', caixaId],
    queryFn: async () => {
      const { data, error } = await supabase.from('movimentos_caixa')
        .select('*')
        .eq('caixa_sessao_id', caixaId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as MovimentoCaixa[];
    },
    enabled: !!caixaId,
  });
}

export function useAddMovimento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movimento: Omit<MovimentoCaixa, 'id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.from('movimentos_caixa')
        .insert({
          caixa_sessao_id: movimento.caixa_sessao_id,
          tipo: movimento.tipo,
          valor: movimento.valor,
          descricao: movimento.descricao,
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as MovimentoCaixa;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movimentos-caixa', data.caixa_sessao_id] });
      toast.success(data.tipo === 'sangria' ? 'Sangria registrada!' : 'Suprimento registrado!');
    },
    onError: () => {
      toast.error('Erro ao registrar movimento');
    },
  });
}

// ========== CONFIGURAÇÕES ==========
// Persist configurations to Supabase configuracoes table
export function useConfiguracoes() {
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('configuracoes')
        .select('chave, valor')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching configuracoes:', error);
        // Fallback to localStorage for migration
        try {
          const saved = localStorage.getItem('app_configuracoes');
          return saved ? JSON.parse(saved) : {};
        } catch {
          return {};
        }
      }
      
      // Convert array of {chave, valor} to object
      const configs: Record<string, string> = {};
      data?.forEach(item => {
        if (item.chave) {
          configs[item.chave] = item.valor || '';
        }
      });
      
      return configs;
    },
  });
}

export function useSaveConfiguracoes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (configs: Record<string, string>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Upsert each config key-value pair
      const upserts = Object.entries(configs).map(([chave, valor]) => ({
        user_id: user.id,
        chave,
        valor,
        updated_at: new Date().toISOString(),
      }));
      
      for (const item of upserts) {
        const { error } = await supabase
          .from('configuracoes')
          .upsert(item, { onConflict: 'user_id,chave' });
        
        if (error) throw error;
      }
      
      // Clear localStorage after successful migration
      localStorage.removeItem('app_configuracoes');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving configuracoes:', error);
      toast.error('Erro ao salvar configurações');
    },
  });
}

// ========== CATÁLOGOS ==========
// Aligned with actual database schema (including new migration columns)
export interface Catalogo {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  slug: string | null;
  ativo: boolean;
  status?: string | null;
  observacao?: string | null;
  custo_separacao?: number | null;
  custo_operacional?: number | null;
  taxa_entrega?: number | null;
  logo_url?: string | null;
  cor_primaria?: string | null;
  cor_secundaria?: string | null;
  titulo?: string | null;
  mensagem_boas_vindas?: string | null;
  whatsapp?: string | null;
  email_contato?: string | null;
  banner_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogoItem {
  id: string;
  catalogo_id: string;
  peca_id: string;
  preco_catalogo: number | null;
  destaque: boolean | null;
  ordem?: number | null;
  created_at: string;
  peca?: Peca;
}

export function useCatalogos() {
  return useQuery({
    queryKey: ['catalogos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('catalogos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Catalogo[];
    },
  });
}

export function useAddCatalogo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (catalogo: Partial<Omit<Catalogo, 'id' | 'created_at' | 'updated_at' | 'user_id'>> & { nome: string }) => {
      // Get current user id
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('catalogos')
        .insert({ ...catalogo, user_id: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogos'] });
      toast.success('Catálogo criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar catálogo');
    },
  });
}

export function useUpdateCatalogo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Catalogo> & { id: string }) => {
      const { data, error } = await supabase
        .from('catalogos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogos'] });
      toast.success('Catálogo atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar catálogo');
    },
  });
}

export function useDeleteCatalogo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catalogos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogos'] });
      toast.success('Catálogo removido!');
    },
    onError: () => {
      toast.error('Erro ao remover catálogo');
    },
  });
}

export function useCatalogoItems(catalogoId: string) {
  return useQuery({
    queryKey: ['catalogo-items', catalogoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_pecas')
        .select('*, peca:pecas(*)')
        .eq('catalogo_id', catalogoId)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as (CatalogoItem & { peca: Peca })[];
    },
    enabled: !!catalogoId,
  });
}

export function useAddCatalogoItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<CatalogoItem, 'id' | 'created_at' | 'peca'>) => {
      const { data, error } = await supabase
        .from('catalogo_pecas')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['catalogo-items', variables.catalogo_id] });
      toast.success('Peça adicionada ao catálogo!');
    },
    onError: () => {
      toast.error('Erro ao adicionar peça');
    },
  });
}

export function useDeleteCatalogoItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catalogo_pecas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogo-items'] });
      toast.success('Peça removida do catálogo!');
    },
    onError: () => {
      toast.error('Erro ao remover peça');
    },
  });
}

// ========== BANHOS ==========
// Aligned with actual database schema
export interface Banho {
  id: string;
  user_id: string;
  nome: string;
  cor: string | null;
  custo: number | null;
  descricao: string | null;
  tipo?: string | null;
  preco_por_grama?: number | null;
  ativo?: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useBanhos() {
  return useQuery({
    queryKey: ['banhos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('banhos')
        .select('*')
        .eq('user_id', user?.id)
        .order('nome');
      
      if (error) throw error;
      return data as Banho[];
    },
  });
}

export function useAddBanho() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (banho: Omit<Banho, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('banhos')
        .insert({ ...banho, user_id: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banhos'] });
      toast.success('Banho adicionado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar banho');
    },
  });
}

export function useUpdateBanho() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Banho> & { id: string }) => {
      const { data, error } = await supabase
        .from('banhos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banhos'] });
      toast.success('Banho atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar banho');
    },
  });
}

export function useDeleteBanho() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banhos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banhos'] });
      toast.success('Banho removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover banho');
    },
  });
}

// ========== ENVIOS GALVÂNICA ==========
// Interface para itens do envio
export interface EnvioGalvanicaItem {
  id: string;
  envio_id: string;
  peca_id: string | null;
  quantidade: number;
  peso: number | null;
  banho_id: string | null;
  nome_peca: string | null; // Nome da peça quando cadastrada manualmente
  created_at: string;
  // Relations
  peca?: Peca;
  banho?: Banho;
}

// Interface sincronizada com a tabela real do banco de dados
export interface EnvioGalvanica {
  id: string;
  user_id: string | null;
  data_envio: string;
  data_retorno: string | null;
  peso_total: number | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Campos calculados (para compatibilidade com UI legada)
  banho_id?: string | null;
  valor_total?: number | null;
  banho?: Banho | null;
  // Itens do envio (opcional quando fazemos join)
  itens?: EnvioGalvanicaItem[];
}

export function useEnviosGalvanica() {
  return useQuery({
    queryKey: ['envios-galvanica'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.from('envios_galvanica')
        .select('*')
        .eq('user_id', user?.id)
        .order('data_envio', { ascending: false });
      
      if (error) throw error;
      return (data || []) as EnvioGalvanica[];
    },
  });
}

// Buscar itens de um envio específico
export function useEnvioGalvanicaItens(envioId: string | null) {
  return useQuery({
    queryKey: ['envio-galvanica-itens', envioId],
    queryFn: async () => {
      if (!envioId) return [];
      
      const { data, error } = await supabase.from('envio_galvanica_itens')
        .select('*, peca:pecas(*), banho:banhos(*)')
        .eq('envio_id', envioId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as EnvioGalvanicaItem[];
    },
    enabled: !!envioId,
  });
}

// Buscar itens de todos os envios do usuário
export function useAllEnvioGalvanicaItens() {
  return useQuery({
    queryKey: ['all-envio-galvanica-itens'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Primeiro buscar os IDs dos envios do usuário
      const { data: envios } = await supabase.from('envios_galvanica')
        .select('id')
        .eq('user_id', user?.id);
      
      if (!envios || envios.length === 0) return [];
      
      const envioIds = envios.map((e: { id: string }) => e.id);
      
      const { data, error } = await supabase.from('envio_galvanica_itens')
        .select('*, peca:pecas(*), banho:banhos(*)')
        .in('envio_id', envioIds)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as EnvioGalvanicaItem[];
    },
  });
}

export function useAddEnvioGalvanica() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (envio: Omit<EnvioGalvanica, 'id' | 'user_id' | 'created_at' | 'banho'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.from('envios_galvanica')
        .insert({ ...envio, user_id: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envios-galvanica'] });
      toast.success('Envio cadastrado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao cadastrar envio');
    },
  });
}

export function useUpdateEnvioGalvanica() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EnvioGalvanica> & { id: string }) => {
      const { data, error } = await supabase
        .from('envios_galvanica')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envios-galvanica'] });
      toast.success('Envio atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar envio');
    },
  });
}

export function useDeleteEnvioGalvanica() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('envios_galvanica')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envios-galvanica'] });
      toast.success('Envio removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover envio');
    },
  });
}

// ========== MODELOS DE ETIQUETAS ==========
// Interface completa para UI - campos extras são armazenados no JSON 'campos'
export interface ModeloEtiqueta {
  id: string;
  user_id: string | null;
  nome: string;
  largura: number;
  altura: number;
  ativo: boolean | null;
  campos: unknown;
  created_at: string;
  updated_at: string;
  // Campos virtuais (da UI) - armazenados em 'campos' JSON ou como defaults
  tipo?: string;
  formato?: string;
  tamanho_id?: string | null;
  cor_fundo?: string;
  cor_texto?: string;
  cor_borda?: string;
  fonte?: string;
  tamanho_fonte?: number;
  mostrar_logo?: boolean;
  mostrar_preco?: boolean;
  mostrar_codigo?: boolean;
  mostrar_nome?: boolean;
  mostrar_qrcode?: boolean;
  mostrar_codigo_barras?: boolean;
  mostrar_banho?: boolean;
  mostrar_numeracao?: boolean;
  borda_arredondada?: number;
  margem_interna?: number;
  descricao?: string | null;
}

export function useModelosEtiquetas() {
  return useQuery({
    queryKey: ['modelos-etiquetas'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('modelos_etiquetas')
        .select('*')
        .eq('user_id', user?.id)
        .order('nome');
      
      if (error) throw error;
      
      // Merge campos JSON into model object for UI compatibility
      return (data || []).map(item => ({
        ...item,
        ...(typeof item.campos === 'object' && item.campos !== null ? item.campos : {}),
      })) as ModeloEtiqueta[];
    },
  });
}

export function useAddModeloEtiqueta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (modelo: Partial<ModeloEtiqueta>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Extract fields that go into 'campos' JSON
      const { id, user_id, nome, largura, altura, ativo, campos, created_at, updated_at, ...extraFields } = modelo;
      
      const { data, error } = await supabase
        .from('modelos_etiquetas')
        .insert({
          nome: nome || 'Novo Modelo',
          largura: largura || 50,
          altura: altura || 30,
          ativo: ativo ?? true,
          campos: extraFields,
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-etiquetas'] });
      toast.success('Modelo de etiqueta criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar modelo de etiqueta');
    },
  });
}

export function useUpdateModeloEtiqueta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ModeloEtiqueta> & { id: string }) => {
      // Extract fields that go into 'campos' JSON
      const { user_id, nome, largura, altura, ativo, campos, created_at, updated_at, ...extraFields } = updates;
      
      const updateData: Record<string, unknown> = {};
      if (nome !== undefined) updateData.nome = nome;
      if (largura !== undefined) updateData.largura = largura;
      if (altura !== undefined) updateData.altura = altura;
      if (ativo !== undefined) updateData.ativo = ativo;
      if (Object.keys(extraFields).length > 0) updateData.campos = extraFields;
      
      const { data, error } = await supabase
        .from('modelos_etiquetas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-etiquetas'] });
      toast.success('Modelo de etiqueta atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar modelo de etiqueta');
    },
  });
}

export function useDeleteModeloEtiqueta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('modelos_etiquetas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-etiquetas'] });
      toast.success('Modelo de etiqueta removido!');
    },
    onError: () => {
      toast.error('Erro ao remover modelo de etiqueta');
    },
  });
}
