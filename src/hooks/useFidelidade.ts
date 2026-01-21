import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NivelFidelidade {
  id: string;
  user_id: string;
  nome: string;
  pontos_minimos: number;
  beneficios: string | null;
  cor: string;
  icone: string | null;
  desconto_percentual: number;
  created_at: string;
}

export interface PontosFidelidade {
  id: string;
  user_id: string;
  cliente_id: string;
  pontos_totais: number;
  pontos_disponiveis: number;
  nivel_atual_id: string | null;
  created_at: string;
  updated_at: string;
  nivel?: NivelFidelidade;
}

export interface MovimentoPontos {
  id: string;
  pontos_fidelidade_id: string;
  venda_id: string | null;
  tipo: 'credito' | 'debito' | 'expiracao' | 'bonus';
  quantidade: number;
  descricao: string | null;
  created_at: string;
}

export interface RecompensaFidelidade {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  pontos_necessarios: number;
  tipo: 'desconto' | 'produto' | 'frete_gratis' | 'brinde';
  valor_desconto: number | null;
  produto_id: string | null;
  ativo: boolean;
  quantidade_disponivel: number | null;
  created_at: string;
}

// Níveis de Fidelidade
export function useNiveisFidelidade() {
  return useQuery({
    queryKey: ['niveis-fidelidade'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('niveis_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .order('pontos_minimos');
      
      if (error) throw error;
      return data as NivelFidelidade[];
    },
  });
}

export function useAddNivelFidelidade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nivel: Omit<NivelFidelidade, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('niveis_fidelidade')
        .insert({ ...nivel, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveis-fidelidade'] });
      toast.success('Nível criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar nível');
    },
  });
}

export function useUpdateNivelFidelidade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<NivelFidelidade> & { id: string }) => {
      const { data, error } = await supabase
        .from('niveis_fidelidade')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveis-fidelidade'] });
      toast.success('Nível atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar nível');
    },
  });
}

export function useDeleteNivelFidelidade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('niveis_fidelidade')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveis-fidelidade'] });
      toast.success('Nível removido!');
    },
    onError: () => {
      toast.error('Erro ao remover nível');
    },
  });
}

// Pontos de Clientes
export function usePontosFidelidade(clienteId?: string) {
  return useQuery({
    queryKey: ['pontos-fidelidade', clienteId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return clienteId ? null : [];
      
      let query = supabase
        .from('pontos_fidelidade')
        .select('*, nivel:niveis_fidelidade(*)')
        .eq('user_id', user.id);
      
      if (clienteId) {
        query = query.eq('cliente_id', clienteId).single();
        const { data, error } = await query;
        if (error && error.code !== 'PGRST116') throw error;
        return data as PontosFidelidade | null;
      } else {
        const { data, error } = await query.order('pontos_totais', { ascending: false });
        if (error) throw error;
        return data as PontosFidelidade[];
      }
    },
    enabled: clienteId ? !!clienteId : true,
  });
}

export function useAddPontos() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clienteId, 
      quantidade, 
      vendaId, 
      descricao,
      tipo = 'credito'
    }: { 
      clienteId: string; 
      quantidade: number; 
      vendaId?: string;
      descricao?: string;
      tipo?: 'credito' | 'debito' | 'bonus';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Check if client has points record
      const { data: existingPontos } = await supabase
        .from('pontos_fidelidade')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('user_id', user.id)
        .single();
      
      let pontosId = existingPontos?.id;
      
      if (!existingPontos) {
        // Create new points record
        const { data: newPontos, error: createError } = await supabase
          .from('pontos_fidelidade')
          .insert({
            user_id: user.id,
            cliente_id: clienteId,
            pontos_totais: tipo === 'credito' || tipo === 'bonus' ? quantidade : 0,
            pontos_disponiveis: tipo === 'credito' || tipo === 'bonus' ? quantidade : 0,
          })
          .select()
          .single();
        
        if (createError) throw createError;
        pontosId = newPontos.id;
      } else {
        // Update existing points
        const novoTotal = tipo === 'debito' 
          ? existingPontos.pontos_disponiveis - quantidade
          : existingPontos.pontos_disponiveis + quantidade;
        
        const { error: updateError } = await supabase
          .from('pontos_fidelidade')
          .update({
            pontos_totais: tipo !== 'debito' 
              ? existingPontos.pontos_totais + quantidade 
              : existingPontos.pontos_totais,
            pontos_disponiveis: Math.max(0, novoTotal),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPontos.id);
        
        if (updateError) throw updateError;
      }
      
      // Add movement record
      const { error: movError } = await supabase
        .from('movimentos_pontos')
        .insert({
          pontos_fidelidade_id: pontosId,
          venda_id: vendaId || null,
          tipo,
          quantidade,
          descricao: descricao || null,
        });
      
      if (movError) throw movError;
      
      return { pontosId, quantidade };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pontos-fidelidade'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-fidelidade', variables.clienteId] });
      const msg = variables.tipo === 'debito' 
        ? `${variables.quantidade} pontos debitados!`
        : `${variables.quantidade} pontos adicionados!`;
      toast.success(msg);
    },
    onError: () => {
      toast.error('Erro ao movimentar pontos');
    },
  });
}

// Recompensas
export function useRecompensas() {
  return useQuery({
    queryKey: ['recompensas-fidelidade'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('recompensas_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('pontos_necessarios');
      
      if (error) throw error;
      return data as RecompensaFidelidade[];
    },
  });
}

export function useAddRecompensa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (recompensa: Omit<RecompensaFidelidade, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('recompensas_fidelidade')
        .insert({ ...recompensa, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recompensas-fidelidade'] });
      toast.success('Recompensa criada!');
    },
    onError: () => {
      toast.error('Erro ao criar recompensa');
    },
  });
}

export function useResgatarRecompensa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clienteId, 
      recompensaId 
    }: { 
      clienteId: string; 
      recompensaId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get reward details
      const { data: recompensa, error: rError } = await supabase
        .from('recompensas_fidelidade')
        .select('*')
        .eq('id', recompensaId)
        .single();
      
      if (rError) throw rError;
      
      // Get client points
      const { data: pontos, error: pError } = await supabase
        .from('pontos_fidelidade')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('user_id', user.id)
        .single();
      
      if (pError) throw pError;
      
      if (pontos.pontos_disponiveis < recompensa.pontos_necessarios) {
        throw new Error('Pontos insuficientes');
      }
      
      // Debit points
      const { error: updateError } = await supabase
        .from('pontos_fidelidade')
        .update({
          pontos_disponiveis: pontos.pontos_disponiveis - recompensa.pontos_necessarios,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pontos.id);
      
      if (updateError) throw updateError;
      
      // Add movement
      await supabase
        .from('movimentos_pontos')
        .insert({
          pontos_fidelidade_id: pontos.id,
          tipo: 'debito',
          quantidade: recompensa.pontos_necessarios,
          descricao: `Resgate: ${recompensa.nome}`,
        });
      
      // Update reward quantity if limited
      if (recompensa.quantidade_disponivel !== null) {
        await supabase
          .from('recompensas_fidelidade')
          .update({ quantidade_disponivel: recompensa.quantidade_disponivel - 1 })
          .eq('id', recompensaId);
      }
      
      return { recompensa, pontos };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pontos-fidelidade'] });
      queryClient.invalidateQueries({ queryKey: ['recompensas-fidelidade'] });
      toast.success(`Recompensa "${data.recompensa.nome}" resgatada!`);
    },
    onError: (error: Error) => {
      if (error.message === 'Pontos insuficientes') {
        toast.error('Pontos insuficientes para esta recompensa');
      } else {
        toast.error('Erro ao resgatar recompensa');
      }
    },
  });
}

// Calculate points for a sale
export function calcularPontosPorVenda(valorVenda: number, pontoPorReal: number = 1): number {
  return Math.floor(valorVenda * pontoPorReal);
}
