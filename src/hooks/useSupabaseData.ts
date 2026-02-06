import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, supabase } from '@/lib/supabase-db';
import { toast } from 'sonner';

// Helper function to translate database errors to user-friendly messages
function translateDatabaseError(error: unknown, context?: string): string {
  const err = error as { message?: string; code?: string; details?: string };
  const message = err?.message?.toLowerCase() || '';
  const code = err?.code || '';
  const details = err?.details?.toLowerCase() || '';
  
  // Foreign key constraint violations
  if (code === '23503' || message.includes('foreign key') || message.includes('violates foreign key')) {
    if (message.includes('maletas_pecas') || details.includes('maletas_pecas')) {
      return 'Esta peça está em uma maleta. Remova-a da maleta primeiro.';
    }
    if (message.includes('vendas_pecas') || details.includes('vendas_pecas')) {
      return 'Esta peça está vinculada a vendas e não pode ser removida.';
    }
    if (message.includes('catalogos_pecas') || details.includes('catalogos_pecas')) {
      return 'Esta peça está em um catálogo. Remova-a do catálogo primeiro.';
    }
    if (message.includes('romaneios_pecas') || details.includes('romaneios_pecas')) {
      return 'Esta peça está em um romaneio e não pode ser removida.';
    }
    if (message.includes('maletas') || details.includes('maletas')) {
      return 'Este registro está vinculado a maletas e não pode ser removido.';
    }
    if (message.includes('vendas') || details.includes('vendas')) {
      return 'Este registro está vinculado a vendas e não pode ser removido.';
    }
    if (message.includes('metas') || details.includes('metas')) {
      return 'Este registro está vinculado a metas e não pode ser removido.';
    }
    return `Não é possível remover: existem registros dependentes. ${context || ''}`;
  }
  
  // RLS policy violations
  if (code === '42501' || message.includes('policy') || message.includes('row-level security')) {
    return 'Você não tem permissão para realizar esta ação.';
  }
  
  // Not found
  if (code === 'PGRST116' || message.includes('no rows')) {
    return 'Registro não encontrado.';
  }
  
  // Unique constraint violations
  if (code === '23505' || message.includes('duplicate') || message.includes('unique')) {
    return 'Já existe um registro com estes dados.';
  }
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
    return 'Erro de conexão. Verifique sua internet.';
  }
  
  // JWT/Auth errors
  if (message.includes('jwt') || message.includes('token')) {
    return 'Sessão expirada. Faça login novamente.';
  }
  
  // Generic fallback with context
  console.error('Database error:', error);
  return context ? `Erro ao ${context}. Tente novamente.` : 'Erro inesperado. Tente novamente.';
}

// Helper function to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user.id;
}

// Helper function to get organization_id from membership - throws if not found
async function getOrganizationId(): Promise<string> {
  const userId = await getCurrentUserId();
  const { data } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (!data?.organization_id) {
    throw new Error('Organização não encontrada. Por favor, faça login novamente.');
  }
  
  return data.organization_id;
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
  catalogo_only?: boolean | null;
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
  organization_id: string | null;
  revendedora_id: string | null;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  status: string | null;
  data_entrega: string | null;
  data_devolucao: string | null;
  observacoes: string | null;
  valor_total: number | null;
  is_public: boolean | null;
  sharing_slug: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  imagem_capa: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MaletaItem {
  id: string;
  maleta_id: string;
  peca_id: string | null;
  quantidade: number;
  quantidade_vendida?: number;
  preco_unitario: number | null;
  status: string;
  vendida: boolean | null;
  data_venda: string | null;
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
  // Tracking fields
  codigo_rastreio?: string | null;
  transportadora?: string | null;
  data_envio?: string | null;
  // Customer contact
  cliente_telefone?: string | null;
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
export function usePecas(options?: { includeCatalogOnly?: boolean }) {
  const includeCatalogOnly = options?.includeCatalogOnly ?? false;
  
  return useQuery({
    queryKey: ['pecas', { includeCatalogOnly }],
    queryFn: async () => {
      // RLS handles organization filtering automatically
      let query = supabase
        .from('pecas')
        .select('*');
      
      // By default, exclude catalog-only pieces from main stock view
      if (!includeCatalogOnly) {
        query = query.or('catalogo_only.is.null,catalogo_only.eq.false');
      }
      
      const { data, error } = await query.order('nome');
      
      if (error) throw error;
      return data as Peca[];
    },
  });
}

export function useAddPeca() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (peca: Omit<Peca, 'id' | 'created_at' | 'updated_at'>) => {
      const organizationId = await getOrganizationId();
      const { data, error } = await supabase
        .from('pecas')
        .insert({ ...peca, organization_id: organizationId })
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
    onError: (err, _id, context) => {
      if (context?.previousPecas) {
        queryClient.setQueryData(['pecas'], context.previousPecas);
      }
      toast.error(translateDatabaseError(err, 'remover peça'));
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
      // RLS handles organization filtering automatically
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
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
      const organizationId = await getOrganizationId();
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({ ...fornecedor, organization_id: organizationId })
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
    onError: (err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['fornecedores'], context.previousData);
      }
      toast.error(translateDatabaseError(err, 'remover fornecedor'));
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
      // RLS handles organization filtering automatically
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
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
      const organizationId = await getOrganizationId();
      const { data, error } = await supabase
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
    onError: (err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['clientes'], context.previousData);
      }
      toast.error(translateDatabaseError(err, 'remover cliente'));
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
  usuario_portal?: string | null;
  senha_portal?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useRevendedoras() {
  return useQuery({
    queryKey: ['revendedoras'],
    queryFn: async () => {
      // RLS handles organization filtering automatically
      const { data, error } = await supabase
        .from('revendedoras')
        .select('*')
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
      const organizationId = await getOrganizationId();
      const { data, error } = await supabase
        .from('revendedoras')
        .insert({
          organization_id: organizationId,
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
          usuario_portal: revendedora.usuario_portal || null,
          senha_portal: revendedora.senha_portal || null,
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
        'saldo_comissao', 'ativo', 'observacoes', 'user_id', 'usuario_portal', 'senha_portal'];
      
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
    mutationFn: async ({ id, force = false }: { id: string; force?: boolean }) => {
      // Check for dependencies first
      const { data: maletas, error: maletasError } = await supabase
        .from('maletas')
        .select('id, nome')
        .eq('revendedora_id', id);
      
      if (maletasError) throw maletasError;
      
      if (maletas && maletas.length > 0 && !force) {
        throw new Error(`DEPENDENCY:Esta revendedora possui ${maletas.length} maleta(s) associada(s). Remova as maletas primeiro ou desassocie-as.`);
      }
      
      // If force is true, first unlink maletas
      if (force && maletas && maletas.length > 0) {
        const { error: unlinkError } = await supabase
          .from('maletas')
          .update({ revendedora_id: null })
          .eq('revendedora_id', id);
        
        if (unlinkError) throw unlinkError;
      }
      
      // Check for vendas
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('id')
        .eq('revendedora_id', id);
      
      if (vendasError) throw vendasError;
      
      if (vendas && vendas.length > 0 && !force) {
        throw new Error(`DEPENDENCY:Esta revendedora possui ${vendas.length} venda(s) registrada(s). O histórico será mantido, mas a associação será removida.`);
      }
      
      // If force, unlink vendas
      if (force && vendas && vendas.length > 0) {
        const { error: unlinkVendasError } = await supabase
          .from('vendas')
          .update({ revendedora_id: null })
          .eq('revendedora_id', id);
        
        if (unlinkVendasError) throw unlinkVendasError;
      }
      
      // Check for metas
      const { data: metas, error: metasError } = await supabase
        .from('metas')
        .select('id')
        .eq('revendedora_id', id);
      
      if (metasError) throw metasError;
      
      if (metas && metas.length > 0) {
        const { error: deleteMetasError } = await supabase
          .from('metas')
          .delete()
          .eq('revendedora_id', id);
        
        if (deleteMetasError) throw deleteMetasError;
      }
      
      // Now delete the revendedora
      const { error } = await supabase
        .from('revendedoras')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revendedoras'] });
      queryClient.invalidateQueries({ queryKey: ['maletas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast.success('Revendedora removida com sucesso!');
    },
    onError: (error: Error) => {
      if (error.message.startsWith('DEPENDENCY:')) {
        toast.error(error.message.replace('DEPENDENCY:', ''));
      } else {
        toast.error(translateDatabaseError(error, 'remover revendedora'));
      }
    },
  });
}

// ========== MALETAS ==========
export function useMaletas(resellerId?: string) {
  return useQuery({
    queryKey: ['maletas', resellerId],
    queryFn: async () => {
      // RLS handles organization filtering automatically
      let query = supabase
        .from('maletas')
        .select('*')
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
      
      // Derive 'status' from 'vendida' field since DB doesn't have status column
      // vendida: true = 'vendido', vendida: false = 'pendente' (devolvido is transient - item is deleted)
      const itemsWithStatus = (data || []).map(item => ({
        ...item,
        status: item.vendida ? 'vendido' : 'pendente'
      }));
      
      return itemsWithStatus as (MaletaItem & { peca: Peca })[];
    },
    enabled: !!maletaId,
  });
}

export function useAddMaleta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (maletaData: { 
      revendedora_id: string; 
      nome?: string;
      data_devolucao?: string;
      observacoes?: string;
      cor_primaria?: string;
      cor_secundaria?: string;
      imagem_capa?: string;
    }) => {
      const organizationId = await getOrganizationId();
      const { data, error } = await supabase
        .from('maletas')
        .insert({
          organization_id: organizationId,
          revendedora_id: maletaData.revendedora_id, 
          nome: maletaData.nome || `Maleta ${Date.now()}`,
          codigo: `MAL-${Date.now()}`,
          status: 'aberta',
          data_devolucao: maletaData.data_devolucao || null,
          observacoes: maletaData.observacoes || null,
          cor_primaria: maletaData.cor_primaria || '#8B5CF6',
          cor_secundaria: maletaData.cor_secundaria || '#EC4899',
          imagem_capa: maletaData.imagem_capa || null,
          is_public: true,
          sharing_slug: `nexsiles-maleta-${Date.now().toString(36)}`,
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
    mutationFn: async ({ maletaId, pecaId, quantidade = 1 }: { maletaId: string; pecaId: string; quantidade?: number }) => {
      // Check if item already exists in maleta
      const { data: existingItem } = await supabase
        .from('maletas_pecas')
        .select('id, quantidade')
        .eq('maleta_id', maletaId)
        .eq('peca_id', pecaId)
        .maybeSingle();
      
      let result;
      
      if (existingItem) {
        // Update quantity if item already exists
        const { data, error } = await supabase
          .from('maletas_pecas')
          .update({ quantidade: existingItem.quantidade + quantidade })
          .eq('id', existingItem.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Add new item to maleta
        const { data, error } = await supabase
          .from('maletas_pecas')
          .insert({ maleta_id: maletaId, peca_id: pecaId, quantidade })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      // Decrease stock (only if available)
      const { data: pecaData } = await supabase
        .from('pecas')
        .select('estoque')
        .eq('id', pecaId)
        .single();
      
      if (pecaData && (pecaData.estoque || 0) > 0) {
        await supabase
          .from('pecas')
          .update({ estoque: Math.max(0, (pecaData.estoque || 0) - quantidade) })
          .eq('id', pecaId);
      }

      return result;
    },
    onSuccess: (_, { maletaId, quantidade = 1 }) => {
      queryClient.invalidateQueries({ queryKey: ['maleta-items', maletaId] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      toast.success(quantidade > 1 ? `${quantidade} peças adicionadas à maleta!` : 'Peça adicionada à maleta!');
    },
    onError: (error: any) => {
      console.error('Erro ao adicionar peça à maleta:', error);
      const message = error?.message || 'Erro ao adicionar peça';
      if (message.includes('policy')) {
        toast.error('Sem permissão para adicionar peça a esta maleta');
      } else {
        toast.error(message);
      }
    },
  });
}

export function useUpdateMaletaItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      pecaId, 
      statusAnterior, 
      quantidade = 1,
      quantidadeVendida,
      quantidadeTotal
    }: { 
      id: string; 
      status: 'pendente' | 'vendido' | 'devolvido'; 
      pecaId: string;
      statusAnterior?: 'pendente' | 'vendido' | 'devolvido';
      quantidade?: number;
      quantidadeVendida?: number;
      quantidadeTotal?: number;
    }) => {
      // For 'devolvido' status, we need to delete the item and return to stock
      if (status === 'devolvido') {
        // First return to stock
        const { data: pecaData } = await supabase
          .from('pecas')
          .select('estoque')
          .eq('id', pecaId)
          .single();
        
        if (pecaData) {
          await supabase
            .from('pecas')
            .update({ estoque: (pecaData.estoque || 0) + quantidade })
            .eq('id', pecaId);
        }

        // Then delete the item from maleta
        const { error: deleteError } = await supabase
          .from('maletas_pecas')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;
        return { id, deleted: true };
      }

      // For 'vendido' status with partial quantity (selling part of a multi-quantity item)
      // We track sold quantity in quantidade_vendida column and reduce quantidade (pending)
      if (status === 'vendido' && quantidadeVendida && quantidadeTotal) {
        // Get the current item info
        const { data: currentItem, error: fetchError } = await supabase
          .from('maletas_pecas')
          .select('maleta_id, preco_unitario, peca_id, quantidade_vendida')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          console.error('Error fetching current item:', fetchError);
          throw new Error('Erro ao buscar item da maleta');
        }

        // Calculate new values
        const remainingQuantity = quantidadeTotal - quantidadeVendida;
        const newQuantidadeVendida = (currentItem.quantidade_vendida || 0) + quantidadeVendida;
        const isFullySold = remainingQuantity <= 0;
        
        // Update the item: reduce pending quantity and increase sold quantity
        const { data, error: updateError } = await supabase
          .from('maletas_pecas')
          .update({ 
            quantidade: Math.max(0, remainingQuantity),
            quantidade_vendida: newQuantidadeVendida,
            vendida: isFullySold,
            data_venda: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (updateError) {
          console.error('Error updating quantity after sale:', updateError);
          throw new Error('Erro ao registrar venda');
        }
        
        return { id, partialSale: !isFullySold, quantidadeSold: quantidadeVendida, remainingQuantity, data };
      }

      // For 'vendido' and 'pendente' status with full quantity, update the record
      const { data, error } = await supabase
        .from('maletas_pecas')
        .update({ 
          vendida: status === 'vendido', 
          data_venda: status === 'vendido' ? new Date().toISOString().split('T')[0] : null 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { status, statusAnterior, quantidadeVendida, quantidadeTotal }) => {
      queryClient.invalidateQueries({ queryKey: ['maleta-items'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      
      if (status === 'pendente' && statusAnterior === 'vendido') {
        toast.success('Venda desfeita! Item voltou para pendente.');
      } else if (status === 'vendido') {
        if (quantidadeVendida && quantidadeTotal && quantidadeVendida < quantidadeTotal) {
          toast.success(`${quantidadeVendida} unidade(s) marcada(s) como vendida(s)!`);
        } else {
          toast.success('Item marcado como vendido!');
        }
      } else if (status === 'devolvido') {
        toast.success('Item devolvido ao estoque!');
      }
    },
    onError: (err: Error) => {
      console.error('Error updating maleta item:', err);
      toast.error(err.message || 'Erro ao atualizar item');
    },
  });
}

export function useDeleteMaletaItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, pecaId, returnToStock = true, quantidade }: { id: string; pecaId: string; returnToStock?: boolean; quantidade?: number }) => {
      // First, get the item to know the quantity if not provided
      let quantidadeToReturn = quantidade || 1;
      
      if (returnToStock && !quantidade) {
        const { data: itemData } = await supabase
          .from('maletas_pecas')
          .select('quantidade')
          .eq('id', id)
          .single();
        
        if (itemData) {
          quantidadeToReturn = itemData.quantidade || 1;
        }
      }
      
      // Delete the item from maleta
      const { error } = await supabase
        .from('maletas_pecas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      // Return item to stock if requested
      if (returnToStock) {
        const { data: pecaData } = await supabase
          .from('pecas')
          .select('estoque')
          .eq('id', pecaId)
          .single();
        
        if (pecaData) {
          await supabase
            .from('pecas')
            .update({ estoque: (pecaData.estoque || 0) + quantidadeToReturn })
            .eq('id', pecaId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maleta-items'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      toast.success('Peça removida da maleta!');
    },
    onError: (err) => {
      toast.error(translateDatabaseError(err, 'remover peça da maleta'));
    },
  });
}
export function useCloseMaleta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ maletaId, returnPendingToStock = true }: { maletaId: string; returnPendingToStock?: boolean }) => {
      // If returnPendingToStock is true, return all pending items to stock
      if (returnPendingToStock) {
        // Get all non-sold items (vendida = false)
        const { data: pendingItems, error: fetchError } = await supabase
          .from('maletas_pecas')
          .select('id, peca_id, quantidade')
          .eq('maleta_id', maletaId)
          .eq('vendida', false);

        if (fetchError) {
          console.error('Error fetching pending items:', fetchError);
          throw new Error('Erro ao buscar itens pendentes da maleta');
        }

        if (pendingItems && pendingItems.length > 0) {
          // Return each piece to stock
          for (const item of pendingItems) {
            if (!item.peca_id) continue;
            
            const { data: pecaData, error: pecaError } = await supabase
              .from('pecas')
              .select('estoque')
              .eq('id', item.peca_id)
              .single();
            
            if (pecaError) {
              console.error(`Error fetching piece ${item.peca_id}:`, pecaError);
              continue; // Skip this item but continue with others
            }
            
            if (pecaData) {
              const { error: updateError } = await supabase
                .from('pecas')
                .update({ estoque: (pecaData.estoque || 0) + (item.quantidade || 1) })
                .eq('id', item.peca_id);
              
              if (updateError) {
                console.error(`Error updating stock for piece ${item.peca_id}:`, updateError);
              }
            }
          }

          // Delete non-sold items from maleta
          const { error: deleteError } = await supabase
            .from('maletas_pecas')
            .delete()
            .eq('maleta_id', maletaId)
            .eq('vendida', false);
          
          if (deleteError) {
            console.error('Error deleting pending items:', deleteError);
            // Continue to close the maleta even if deletion fails
          }
        }
      }

      // Close the maleta (updated_at is auto-updated by trigger)
      const { data, error } = await supabase
        .from('maletas')
        .update({ status: 'fechada' })
        .eq('id', maletaId)
        .select()
        .single();
      
      if (error) {
        console.error('Error closing maleta:', error);
        throw new Error('Erro ao fechar maleta: ' + (error.message || 'Erro desconhecido'));
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas'] });
      queryClient.invalidateQueries({ queryKey: ['maleta-items'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      toast.success('Maleta fechada! Peças pendentes devolvidas ao estoque.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao fechar maleta');
    },
  });
}

export function useDeleteMaleta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ maletaId, returnToStock = true }: { maletaId: string; returnToStock?: boolean }) => {
      console.log('useDeleteMaleta: Starting deletion for maletaId:', maletaId);
      
      // If returnToStock is true, return all items to stock before deleting
      if (returnToStock) {
        const { data: items, error: itemsError } = await supabase
          .from('maletas_pecas')
          .select('id, peca_id, quantidade, vendida')
          .eq('maleta_id', maletaId);

        if (itemsError) {
          console.error('Error fetching maleta items:', itemsError);
          throw new Error(`Erro ao buscar itens da maleta: ${itemsError.message}`);
        }

        console.log('useDeleteMaleta: Found items:', items?.length || 0);

        if (items && items.length > 0) {
          // Return non-sold items to stock
          for (const item of items) {
            if (!item.vendida) {
              const { data: pecaData, error: pecaError } = await supabase
                .from('pecas')
                .select('estoque')
                .eq('id', item.peca_id)
                .maybeSingle();
              
              if (pecaError) {
                console.error('Error fetching peca:', pecaError);
                // Continue even if we can't find the piece
              }
              
              if (pecaData) {
                const { error: updateError } = await supabase
                  .from('pecas')
                  .update({ estoque: (pecaData.estoque || 0) + (item.quantidade || 1) })
                  .eq('id', item.peca_id);
                
                if (updateError) {
                  console.error('Error updating stock:', updateError);
                }
              }
            }
          }
        }
      }

      // Delete all items from maleta
      const { error: deleteItemsError } = await supabase
        .from('maletas_pecas')
        .delete()
        .eq('maleta_id', maletaId);

      if (deleteItemsError) {
        console.error('Error deleting maleta items:', deleteItemsError);
        throw new Error(`Erro ao excluir itens da maleta: ${deleteItemsError.message}`);
      }

      console.log('useDeleteMaleta: Items deleted successfully');

      // Delete all interests from maleta
      const { data: interesses, error: interessesError } = await supabase
        .from('maleta_interesses')
        .select('id')
        .eq('maleta_id', maletaId);

      if (interessesError) {
        console.error('Error fetching interesses:', interessesError);
        // Continue even if we can't find interests
      }

      if (interesses && interesses.length > 0) {
        for (const interesse of interesses) {
          const { error: deleteInteresseItensError } = await supabase
            .from('maleta_interesse_itens')
            .delete()
            .eq('interesse_id', interesse.id);
          
          if (deleteInteresseItensError) {
            console.error('Error deleting interesse itens:', deleteInteresseItensError);
          }
        }
        
        const { error: deleteInteressesError } = await supabase
          .from('maleta_interesses')
          .delete()
          .eq('maleta_id', maletaId);
        
        if (deleteInteressesError) {
          console.error('Error deleting interesses:', deleteInteressesError);
        }
      }

      console.log('useDeleteMaleta: Interests deleted, now deleting maleta');

      // Now delete the maleta
      const { error } = await supabase
        .from('maletas')
        .delete()
        .eq('id', maletaId);
      
      if (error) {
        console.error('Error deleting maleta:', error);
        throw new Error(`Erro ao excluir maleta: ${error.message}`);
      }

      console.log('useDeleteMaleta: Maleta deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas'] });
      queryClient.invalidateQueries({ queryKey: ['maleta-items'] });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      toast.success('Maleta excluída com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Delete maleta error:', error);
      toast.error(`Erro ao excluir maleta: ${error.message}`);
    },
  });
}

export function useUpdateMaleta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: { 
      id: string; 
      nome?: string | null;
      data_devolucao?: string | null;
      data_entrega?: string | null;
      observacoes?: string | null;
      status?: string | null;
      cor_primaria?: string | null;
      cor_secundaria?: string | null;
      imagem_capa?: string | null;
    }) => {
      const dbData: Record<string, unknown> = {};
      if (updateData.nome !== undefined) dbData.nome = updateData.nome;
      if (updateData.observacoes !== undefined) dbData.observacoes = updateData.observacoes;
      if (updateData.data_devolucao !== undefined) dbData.data_devolucao = updateData.data_devolucao;
      if (updateData.data_entrega !== undefined) dbData.data_entrega = updateData.data_entrega;
      if (updateData.status !== undefined) dbData.status = updateData.status;
      if (updateData.cor_primaria !== undefined) dbData.cor_primaria = updateData.cor_primaria;
      if (updateData.cor_secundaria !== undefined) dbData.cor_secundaria = updateData.cor_secundaria;
      if (updateData.imagem_capa !== undefined) dbData.imagem_capa = updateData.imagem_capa;

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
      // Table 'vendas' doesn't have user_id column - fetch all records
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
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
        .from('vendas_pecas')
        .select('*')
        .eq('venda_id', vendaId);
      
      if (error) throw error;
      return data as VendaItem[];
    },
    enabled: !!vendaId,
  });
}

// Hook para buscar todos os itens vendidos (para relatórios)
export function useVendasPecas() {
  return useQuery({
    queryKey: ['vendas-pecas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas_pecas')
        .select(`
          *,
          peca:pecas(id, nome, codigo, categoria)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    },
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
      // Insert venda into vendas table with organization_id
      const organizationId = await getOrganizationId();
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          organization_id: organizationId,
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
      // Table 'romaneios' has RLS by organization_id
      const { data, error } = await supabase
        .from('romaneios')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching romaneios:', error);
        throw error;
      }
      console.log('Romaneios fetched:', data?.length || 0, 'records');
      return data as Romaneio[];
    },
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch
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
      // Insert romaneio with organization_id
      const organizationId = await getOrganizationId();
      const { data: romaneioData, error: romaneioError } = await supabase
        .from('romaneios')
        .insert({ ...romaneio, organization_id: organizationId })
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

export interface RomaneioTrackingData {
  codigo_rastreio?: string | null;
  transportadora?: string | null;
  data_envio?: string | null;
}

export function useUpdateRomaneioTracking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...trackingData }: { id: string } & RomaneioTrackingData) => {
      const { data, error } = await supabase
        .from('romaneios')
        .update(trackingData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...trackingData }) => {
      await queryClient.cancelQueries({ queryKey: ['romaneios'] });
      const previousData = queryClient.getQueryData<Romaneio[]>(['romaneios']);
      
      queryClient.setQueryData<Romaneio[]>(['romaneios'], (old) =>
        old?.map((item) => 
          item.id === id ? { ...item, ...trackingData, updated_at: new Date().toISOString() } : item
        ) ?? []
      );
      
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['romaneios'], context.previousData);
      }
      toast.error('Erro ao atualizar rastreamento');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
    },
    onSuccess: () => {
      toast.success('Dados de envio atualizados!');
    },
  });
}

export function useUpdateRomaneioPhone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, cliente_telefone }: { id: string; cliente_telefone: string | null }) => {
      const { data, error } = await supabase
        .from('romaneios')
        .update({ cliente_telefone })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, cliente_telefone }) => {
      await queryClient.cancelQueries({ queryKey: ['romaneios'] });
      const previousData = queryClient.getQueryData<Romaneio[]>(['romaneios']);
      
      queryClient.setQueryData<Romaneio[]>(['romaneios'], (old) =>
        old?.map((item) => 
          item.id === id ? { ...item, cliente_telefone, updated_at: new Date().toISOString() } : item
        ) ?? []
      );
      
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['romaneios'], context.previousData);
      }
      toast.error('Erro ao atualizar telefone');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
    },
    onSuccess: () => {
      toast.success('Telefone atualizado!');
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
    onError: (err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['romaneios'], context.previousData);
      }
      toast.error(translateDatabaseError(err, 'excluir romaneio'));
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
    onError: (err, _ids, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['romaneios'], context.previousData);
      }
      toast.error(translateDatabaseError(err, 'excluir romaneios'));
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
      const organizationId = await getOrganizationId();
      const { data, error } = await supabase
        .from('caixa_sessoes')
        .insert({
          organization_id: organizationId,
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
// Persist configurations to Supabase configuracoes table (per organization)
export function useConfiguracoes() {
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      // Get current organization to filter configs
      const organizationId = await getOrganizationId().catch(() => null);
      
      if (!organizationId) {
        // No organization yet - return empty config for new users
        return {};
      }
      
      const { data, error } = await supabase
        .from('configuracoes')
        .select('chave, valor')
        .eq('organization_id', organizationId);
      
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
      const organizationId = await getOrganizationId();
      
      // Upsert each config key-value pair
      for (const [chave, valor] of Object.entries(configs)) {
        // Check if config exists for this organization
        const { data: existing } = await supabase
          .from('configuracoes')
          .select('id')
          .eq('chave', chave)
          .eq('organization_id', organizationId)
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
            .insert({ chave, valor, organization_id: organizationId });
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
  quantidade: number;
  quantidade_minima?: number;
  destaque: boolean | null;
  ordem?: number | null;
  created_at: string | null;
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
      const organizationId = await getOrganizationId();
      if (!organizationId) throw new Error('Organization not found');
      
      const { data, error } = await supabase
        .from('catalogos')
        .insert({ ...catalogo, organization_id: organizationId })
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
    onError: (err) => {
      toast.error(translateDatabaseError(err, 'remover catálogo'));
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

export function useUpdateCatalogoItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quantidade, quantidade_minima }: { id: string; quantidade?: number; quantidade_minima?: number }) => {
      const updateData: { quantidade?: number; quantidade_minima?: number } = {};
      if (quantidade !== undefined) updateData.quantidade = quantidade;
      if (quantidade_minima !== undefined) updateData.quantidade_minima = quantidade_minima;
      
      const { data, error } = await supabase
        .from('catalogos_pecas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogo-items'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar item');
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
    onError: (err) => {
      toast.error(translateDatabaseError(err, 'remover peça do catálogo'));
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
      const organizationId = await getOrganizationId();
      const { data, error } = await supabase
        .from('banhos')
        .insert({ ...banho, organization_id: organizationId })
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
    onError: (err) => {
      toast.error(translateDatabaseError(err, 'remover banho'));
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
  organization_id: string | null;
  data_envio: string;
  data_retorno?: string | null;
  status: string;
  fornecedor_id: string | null;
  peso_total: number | null;
  peso_cobrado: number | null;
  valor_total: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Campos calculados (para compatibilidade com UI legada)
  banho_id?: string | null;
  banho?: Banho | null;
  // Itens do envio (opcional quando fazemos join)
  itens?: EnvioGalvanicaItem[];
}

export function useEnviosGalvanica() {
  return useQuery({
    queryKey: ['envios-galvanica'],
    queryFn: async () => {
      // RLS handles organization filtering
      const { data, error } = await supabase.from('envios_galvanica')
        .select('*')
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
      // Primeiro buscar os IDs dos envios da organização (RLS filtra)
      const { data: envios } = await supabase.from('envios_galvanica')
        .select('id');
      
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
    mutationFn: async (envio: Omit<EnvioGalvanica, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'banho' | 'itens'>) => {
      const organizationId = await getOrganizationId();
      
      if (!organizationId) {
        throw new Error('Organização não encontrada');
      }
      
      const { data, error } = await supabase.from('envios_galvanica')
        .insert({ ...envio, organization_id: organizationId })
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
    onError: (err) => {
      toast.error(translateDatabaseError(err, 'remover envio'));
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
      // RLS handles organization filtering via organization_id
      const { data, error } = await supabase
        .from('modelos_etiquetas')
        .select('*')
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
      const organizationId = await getOrganizationId();
      
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
          organization_id: organizationId,
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
    onError: (err) => {
      toast.error(translateDatabaseError(err, 'remover modelo de etiqueta'));
    },
  });
}

// Maleta Interests
export interface MaletaInteresse {
  id: string;
  maleta_id: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_email: string | null;
  observacoes: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useMaletaInteresses(maletaId: string | undefined) {
  return useQuery({
    queryKey: ['maleta-interesses', maletaId],
    queryFn: async () => {
      if (!maletaId) return [];
      
      const { data, error } = await supabase
        .from('maleta_interesses')
        .select('*')
        .eq('maleta_id', maletaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MaletaInteresse[];
    },
    enabled: !!maletaId,
  });
}

export function useMaletaInteressesPendentes(maletaId: string | undefined) {
  return useQuery({
    queryKey: ['maleta-interesses-pendentes', maletaId],
    queryFn: async () => {
      if (!maletaId) return [];
      
      const { data, error } = await supabase
        .from('maleta_interesses')
        .select('*')
        .eq('maleta_id', maletaId)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MaletaInteresse[];
    },
    enabled: !!maletaId,
  });
}
