import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, supabase } from '@/lib/supabase-db';
import { toast } from 'sonner';

// Helper function to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user.id;
}

// Types based on actual database schema
export interface Peca {
  id: string;
  nome: string;
  codigo: string | null;
  codigo_barras?: string | null;
  descricao: string | null;
  categoria: string | null;
  subcategoria: string | null;
  material: string | null;
  peso: number | null;
  estoque: number | null;
  estoque_minimo: number | null;
  preco_custo: number | null;
  preco_venda: number | null;
  preco_revenda: number | null;
  fornecedor_id: string | null;
  imagem_url: string | null;
  ativo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
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
  user_id?: string | null;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  cnpj?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  observacoes?: string | null;
  ativo?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: string;
  user_id?: string | null;
  nome: string;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  cpf?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  data_nascimento?: string | null;
  observacoes?: string | null;
  pontos_fidelidade?: number | null;
  ativo?: boolean | null;
  created_at?: string;
  updated_at?: string;
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
  // Public sharing fields
  is_public?: boolean | null;
  sharing_slug?: string | null;
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
  numero?: string | null;
  cliente_id: string | null;
  revendedora_id?: string | null;
  vendedor_id?: string | null;
  valor_total: number;
  subtotal: number;
  desconto?: number | null;
  desconto_percentual?: number | null;
  forma_pagamento?: string | null;
  parcelas?: number | null;
  status?: string | null;
  observacoes?: string | null;
  cupom_desconto?: string | null;
  pontos_utilizados?: number | null;
  data_venda?: string | null;
  created_at: string;
  updated_at?: string | null;
  // Aliases for backward compatibility
  total?: number; // Maps to valor_total
  data?: string; // Maps to data_venda
  cliente_nome?: string; // Can be derived from cliente relation
  tipo?: 'pdv' | 'revendedora' | 'catalogo'; // Derived from context
}

export interface VendaItem {
  id: string;
  venda_id: string;
  peca_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  desconto?: number | null;
  created_at?: string | null;
}

export interface Romaneio {
  id: string;
  numero?: string | null;
  revendedora_id?: string | null;
  endereco_entrega?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  valor_frete?: number | null;
  data_criacao?: string | null;
  data_previsao?: string | null;
  data_entrega?: string | null;
  status?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at?: string | null;
  // Aliases for backward compatibility
  total?: number;
  reseller_id?: string | null;
  reseller_nome?: string | null;
  revendedora_nome?: string | null;
  cliente_nome?: string | null;
  data?: string | null;
}

export interface RomaneioItem {
  id: string;
  romaneio_id: string;
  peca_id: string;
  quantidade: number;
  created_at?: string;
  peca?: Peca;
  // Aliases for backward compatibility
  peca_nome?: string | null;
  preco_unitario?: number | null;
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
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('pecas')
        .select('*')
        .eq('user_id', userId)
        .order('nome');
      
      if (error) throw error;
      return data as Peca[];
    },
  });
}

export function useAddPeca() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (peca: Omit<Peca, 'id' | 'created_at' | 'updated_at'>) => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('pecas')
        .insert({ ...peca, user_id: userId })
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
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('user_id', userId)
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
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({ ...fornecedor, user_id: userId })
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
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', userId)
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
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...cliente, user_id: userId })
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
  user_id?: string | null;
  nome: string;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  cpf?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  data_nascimento?: string | null;
  comissao_percentual?: number | null;
  saldo_comissao?: number | null;
  ativo?: boolean | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Aliases for backward compatibility
  comissao?: number | null;
  ativa?: boolean | null;
}

export function useRevendedoras() {
  return useQuery({
    queryKey: ['revendedoras'],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('revendedoras')
        .select('*')
        .eq('user_id', userId)
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
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('revendedoras')
        .insert({
          user_id: userId,
          nome: revendedora.nome || '',
          telefone: revendedora.telefone || null,
          whatsapp: revendedora.whatsapp || null,
          email: revendedora.email || null,
          cpf: revendedora.cpf || null,
          endereco: revendedora.endereco || null,
          cidade: revendedora.cidade || null,
          estado: revendedora.estado || null,
          cep: revendedora.cep || null,
          data_nascimento: revendedora.data_nascimento || null,
          comissao_percentual: revendedora.comissao_percentual ?? 30,
          saldo_comissao: revendedora.saldo_comissao ?? 0,
          ativo: revendedora.ativo ?? true,
          observacoes: revendedora.observacoes || null,
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
    onError: (error) => {
      console.error('Error adding revendedora:', error);
      toast.error('Erro ao adicionar revendedora');
    },
  });
}

export function useUpdateRevendedora() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Revendedora> & { id: string }) => {
      // Filter out fields that don't exist in the schema
      const validUpdates: Record<string, unknown> = {};
      const allowedFields = ['nome', 'telefone', 'whatsapp', 'email', 'cpf', 'endereco', 
        'cidade', 'estado', 'cep', 'data_nascimento', 'comissao_percentual', 
        'saldo_comissao', 'ativo', 'observacoes', 'user_id'];
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          validUpdates[key] = value;
        }
      }
      
      const { data, error } = await supabase
        .from('revendedoras')
        .update(validUpdates)
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
    onError: (error) => {
      console.error('Error updating revendedora:', error);
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
      const userId = await getCurrentUserId();
      let query = supabase
        .from('maletas')
        .select('*')
        .eq('user_id', userId)
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
      // Correct table name is 'maletas_pecas' not 'maleta_itens'
      const { data, error } = await supabase
        .from('maletas_pecas')
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
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('maletas')
        .insert({
          user_id: userId,
          revendedora_id: maletaData.reseller_id, 
          codigo: `MAL-${Date.now()}`,
          status: 'aberta',
          observacoes: maletaData.observacoes || null,
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
      // Add item to maleta - correct table name is 'maletas_pecas'
      const { data, error } = await supabase
        .from('maletas_pecas')
        .insert({ maleta_id: maletaId, peca_id: pecaId, quantidade: 1 })
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
      // Correct table name is 'maletas_pecas'
      const { data, error } = await supabase
        .from('maletas_pecas')
        .update({ vendida: status === 'vendido', data_venda: status === 'vendido' ? new Date().toISOString().split('T')[0] : null })
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
        // Get all non-sold items (vendida = false) - correct table name is 'maletas_pecas'
        const { data: pendingItems } = await supabase
          .from('maletas_pecas')
          .select('id, peca_id, quantidade')
          .eq('maleta_id', maletaId)
          .eq('vendida', false);

        if (pendingItems && pendingItems.length > 0) {
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
                .update({ estoque: (pecaData.estoque || 0) + (item.quantidade || 1) })
                .eq('id', item.peca_id);
            }
          }

          // Delete non-sold items from maleta
          await supabase
            .from('maletas_pecas')
            .delete()
            .eq('maleta_id', maletaId)
            .eq('vendida', false);
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
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .eq('user_id', userId)
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
      caixaSessaoId,
    }: {
      venda: {
        valor_total: number;
        subtotal: number;
        desconto?: number | null;
        cliente_id?: string | null;
        revendedora_id?: string | null;
        status?: string;
        observacoes?: string | null;
        forma_pagamento?: string | null;
        parcelas?: number;
      };
      items: {
        peca_id: string;
        quantidade: number;
        preco_unitario: number;
        subtotal: number;
        desconto?: number;
      }[];
      caixaSessaoId?: string;
    }) => {
      const userId = await getCurrentUserId();
      // Insert venda into vendas table (matching actual DB schema)
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          user_id: userId,
          valor_total: venda.valor_total,
          subtotal: venda.subtotal,
          desconto: venda.desconto || 0,
          cliente_id: venda.cliente_id || null,
          revendedora_id: venda.revendedora_id || null,
          status: venda.status || 'finalizada',
          observacoes: venda.observacoes || null,
          forma_pagamento: venda.forma_pagamento || 'dinheiro',
          parcelas: venda.parcelas || 1,
        })
        .select()
        .single();
      
      if (vendaError) throw vendaError;

      // Insert items into vendas_pecas table
      const itemsWithVendaId = items.map(item => ({
        venda_id: vendaData.id,
        peca_id: item.peca_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        desconto: item.desconto || 0,
      }));
      
      const { error: itemsError } = await supabase
        .from('vendas_pecas')
        .insert(itemsWithVendaId);
      
      if (itemsError) throw itemsError;

      // Register cash movement if caixaSessaoId is provided
      if (caixaSessaoId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase
          .from('movimentos_caixa')
          .insert({
            sessao_id: caixaSessaoId,
            tipo: 'venda',
            valor: venda.valor_total,
            venda_id: vendaData.id,
            operador_id: user?.id,
          });
      }

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
            .update({ estoque: Math.max(0, (pecaData.estoque || 0) - item.quantidade) })
            .eq('id', item.peca_id);
        }
      }

      return vendaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas-caixa'] });
      queryClient.invalidateQueries({ queryKey: ['movimentos-caixa'] });
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
      // Table 'romaneios' doesn't have user_id column - fetch all records
      const { data, error } = await supabase
        .from('romaneios')
        .select('*')
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
      // Correct table name is 'romaneios_pecas'
      const { data, error } = await supabase
        .from('romaneios_pecas')
        .select('*, peca:pecas(*)')
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
      romaneio: Omit<Romaneio, 'id' | 'created_at'>;
      items: Omit<RomaneioItem, 'id' | 'created_at' | 'romaneio_id'>[];
    }) => {
      // Table 'romaneios' doesn't have user_id column
      const { data: romaneioData, error: romaneioError } = await supabase
        .from('romaneios')
        .insert(romaneio)
        .select()
        .single();
      
      if (romaneioError) throw romaneioError;

      const itemsWithRomaneioId = items.map(item => ({
        ...item,
        romaneio_id: romaneioData.id,
      }));
      
      // Correct table name is 'romaneios_pecas'
      const { error: itemsError } = await supabase
        .from('romaneios_pecas')
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
      // Correct table name is 'romaneios_pecas'
      const { error: itemsError } = await supabase
        .from('romaneios_pecas')
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
      // Correct table name is 'romaneios_pecas'
      const { error: itemsError } = await supabase
        .from('romaneios_pecas')
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
// Using caixa_sessoes and movimentos_caixa tables in Supabase
export function useCaixaAtual() {
  return useQuery({
    queryKey: ['caixa-atual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caixa_sessoes')
        .select('*')
        .eq('status', 'aberto')
        .order('data_abertura', { ascending: false })
        .limit(1)
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
          operador_id: userId,
          valor_inicial: fundoTroco,
          status: 'aberto',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as CaixaSessao;
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
      // Calculate totals from movimentos
      const { data: movimentos } = await supabase
        .from('movimentos_caixa')
        .select('tipo, valor')
        .eq('sessao_id', caixaId);
      
      let valorVendas = 0;
      let valorSangrias = 0;
      let valorSuprimentos = 0;
      
      movimentos?.forEach(mov => {
        switch (mov.tipo) {
          case 'venda':
            valorVendas += mov.valor;
            break;
          case 'sangria':
            valorSangrias += mov.valor;
            break;
          case 'suprimento':
            valorSuprimentos += mov.valor;
            break;
        }
      });
      
      // Get initial value to calculate final
      const { data: sessao } = await supabase
        .from('caixa_sessoes')
        .select('valor_inicial')
        .eq('id', caixaId)
        .single();
      
      const valorFinal = (sessao?.valor_inicial || 0) + valorVendas + valorSuprimentos - valorSangrias;
      
      const { data, error } = await supabase
        .from('caixa_sessoes')
        .update({
          status: 'fechado',
          data_fechamento: new Date().toISOString(),
          valor_final: valorFinal,
          valor_vendas: valorVendas,
          valor_sangrias: valorSangrias,
          valor_suprimentos: valorSuprimentos,
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
      
      // Get movements of type 'venda' for this session
      const { data: movimentos, error: movError } = await supabase
        .from('movimentos_caixa')
        .select('venda_id')
        .eq('sessao_id', caixaId)
        .eq('tipo', 'venda');
      
      if (movError) throw movError;
      
      const vendaIds = movimentos?.map(m => m.venda_id).filter(Boolean) || [];
      if (vendaIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .in('id', vendaIds)
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
      if (!caixaId) return [];
      
      const { data, error } = await supabase
        .from('movimentos_caixa')
        .select('*')
        .eq('sessao_id', caixaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map to expected interface
      return (data || []).map(m => ({
        ...m,
        caixa_sessao_id: m.sessao_id,
      })) as MovimentoCaixa[];
    },
    enabled: !!caixaId,
  });
}

export function useAddMovimento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movimento: Omit<MovimentoCaixa, 'id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('movimentos_caixa')
        .insert({
          sessao_id: movimento.caixa_sessao_id,
          tipo: movimento.tipo,
          valor: movimento.valor,
          descricao: movimento.descricao,
          operador_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, caixa_sessao_id: data.sessao_id } as MovimentoCaixa;
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

// Hook para histórico de sessões de caixa
export function useHistoricoCaixas() {
  return useQuery({
    queryKey: ['historico-caixas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caixa_sessoes')
        .select('*')
        .eq('status', 'fechado')
        .order('data_fechamento', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as CaixaSessao[];
    },
  });
}

// ========== CONFIGURAÇÕES ==========
// Persist configurations to Supabase configuracoes table (global settings)
export function useConfiguracoes() {
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('chave, valor');
      
      if (error) {
        console.error('Error fetching configuracoes:', error);
        return {};
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
      // Upsert each config key-value pair
      for (const [chave, valor] of Object.entries(configs)) {
        // Check if config exists
        const { data: existing } = await supabase
          .from('configuracoes')
          .select('id')
          .eq('chave', chave)
          .maybeSingle();
        
        if (existing) {
          const { error } = await supabase
            .from('configuracoes')
            .update({ valor, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('configuracoes')
            .insert({ chave, valor });
          if (error) throw error;
        }
      }
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
      // Table 'catalogos' doesn't have user_id column - fetch all records
      const { data, error } = await supabase
        .from('catalogos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Catalogo[];
    },
  });
}

export function useAddCatalogo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (catalogo: Partial<Omit<Catalogo, 'id' | 'created_at' | 'updated_at'>> & { nome: string }) => {
      // Table doesn't have user_id column
      const { data, error } = await supabase
        .from('catalogos')
        .insert(catalogo)
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
      // Correct table name is 'catalogos_pecas'
      const { data, error } = await supabase
        .from('catalogos_pecas')
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
      // Correct table name is 'catalogos_pecas'
      const { data, error } = await supabase
        .from('catalogos_pecas')
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
      // Correct table name is 'catalogos_pecas'
      const { error } = await supabase
        .from('catalogos_pecas')
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
  nome: string;
  tipo: string | null;
  descricao: string | null;
  custo_por_grama: number | null;
  tempo_medio_minutos: number | null;
  ativo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useBanhos() {
  return useQuery({
    queryKey: ['banhos'],
    queryFn: async () => {
      // Table 'banhos' doesn't have user_id column - fetch all records
      const { data, error } = await supabase
        .from('banhos')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Banho[];
    },
  });
}

export function useAddBanho() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (banho: Partial<Omit<Banho, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data, error } = await supabase
        .from('banhos')
        .insert(banho)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banhos'] });
      toast.success('Banho adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Error adding banho:', error);
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
