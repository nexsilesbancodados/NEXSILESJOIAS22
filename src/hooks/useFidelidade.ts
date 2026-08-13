import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, dbRpc } from '@/lib/supabase-db';
import { toast } from 'sonner';
import { translateDatabaseError } from '@/lib/error-utils';

const db = supabase;

/**
 * Organização do usuário atual.
 *
 * O programa de fidelidade é da LOJA, não de cada vendedor. Antes, tudo aqui
 * filtrava e gravava por `user_id`, e o RLS acompanhava
 * (`USING (user_id = auth.uid())`). Numa loja com mais de uma pessoa, isso
 * fragmentava o saldo do cliente: a vendedora A creditava 100 pontos, a
 * vendedora B não enxergava nada e criava um segundo saldo com 50 — e o cliente
 * ficava com dois saldos que ninguém somava.
 *
 * Ver `supabase/migrations/20260812200500_fidelidade_por_organizacao.sql`, que
 * consolida os saldos duplicados e move o RLS para a organização.
 */
async function getOrganizationId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await db
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  return data?.organization_id ?? null;
}

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
      const organizationId = await getOrganizationId();
      if (!organizationId) return [];
      
      const { data, error } = await db
        .from('niveis_fidelidade')
        .select('*')
        .eq('organization_id', organizationId)
        .order('pontos_minimos');
      
      if (error) throw error;
      return (data || []) as NivelFidelidade[];
    },
  });
}

export function useAddNivelFidelidade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nivel: Omit<NivelFidelidade, 'id' | 'user_id' | 'created_at'>) => {
      const organizationId = await getOrganizationId();
      if (!organizationId) throw new Error('Organização não encontrada');
      
      const { data, error } = await db
        .from('niveis_fidelidade')
        .insert({ ...nivel, organization_id: organizationId })
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
      const { data, error } = await db
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
      const { error } = await db
        .from('niveis_fidelidade')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveis-fidelidade'] });
      toast.success('Nível removido!');
    },
    onError: (err) => {
      toast.error(translateDatabaseError(err, 'remover nível'));
    },
  });
}

// Pontos de Clientes
export function usePontosFidelidade(clienteId?: string) {
  return useQuery({
    queryKey: ['pontos-fidelidade', clienteId],
    queryFn: async () => {
      const organizationId = await getOrganizationId();
      if (!organizationId) return clienteId ? null : [];
      
      if (clienteId) {
        const { data, error } = await db
          .from('pontos_fidelidade')
          .select('*, nivel:niveis_fidelidade(*)')
          .eq('organization_id', organizationId)
          .eq('cliente_id', clienteId)
          .maybeSingle();
        
        if (error) throw error;
        return data as PontosFidelidade | null;
      } else {
        const { data, error } = await db
          .from('pontos_fidelidade')
          .select('*, nivel:niveis_fidelidade(*)')
          .eq('organization_id', organizationId)
          .order('pontos_totais', { ascending: false });
        
        if (error) throw error;
        return (data || []) as PontosFidelidade[];
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
      // Saldo, movimento e criação da linha acontecem no banco, numa transação.
      //
      // Antes era SELECT do saldo → cálculo em JavaScript → UPDATE do valor
      // absoluto. Com uma venda no PDV e um resgate no CRM ao mesmo tempo, a
      // segunda gravação sobrescrevia a primeira e o saldo saía errado — o
      // mesmo problema que `ajustar_estoque_peca` já resolve para o estoque.
      const { data, error } = await dbRpc('ajustar_pontos_fidelidade', {
        p_cliente_id: clienteId,
        p_quantidade: quantidade,
        p_tipo: tipo,
        p_venda_id: vendaId || null,
        p_descricao: descricao || null,
      });

      if (error) throw error;

      const saldo = Array.isArray(data) ? data[0] : data;
      return {
        quantidade,
        pontosTotais: saldo?.pontos_totais ?? null,
        pontosDisponiveis: saldo?.pontos_disponiveis ?? null,
      };
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
      const organizationId = await getOrganizationId();
      if (!organizationId) return [];
      
      const { data, error } = await db
        .from('recompensas_fidelidade')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('ativo', true)
        .order('pontos_necessarios');
      
      if (error) throw error;
      return (data || []) as RecompensaFidelidade[];
    },
  });
}

export function useAddRecompensa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (recompensa: Omit<RecompensaFidelidade, 'id' | 'user_id' | 'created_at'>) => {
      const organizationId = await getOrganizationId();
      if (!organizationId) throw new Error('Organização não encontrada');
      
      const { data, error } = await db
        .from('recompensas_fidelidade')
        .insert({ ...recompensa, organization_id: organizationId })
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
      const organizationId = await getOrganizationId();
      if (!organizationId) throw new Error('Organização não encontrada');
      
      // Get reward details
      const { data: recompensa, error: rError } = await db
        .from('recompensas_fidelidade')
        .select('*')
        .eq('id', recompensaId)
        .single();
      
      if (rError) throw rError;
      
      // Get client points
      const { data: pontos, error: pError } = await db
        .from('pontos_fidelidade')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('organization_id', organizationId)
        .single();
      
      if (pError) throw pError;
      
      if (pontos.pontos_disponiveis < recompensa.pontos_necessarios) {
        throw new Error('Pontos insuficientes');
      }
      
      // Debit points
      const { error: updateError } = await db
        .from('pontos_fidelidade')
        .update({
          pontos_disponiveis: pontos.pontos_disponiveis - recompensa.pontos_necessarios,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pontos.id);
      
      if (updateError) throw updateError;
      
      // Add movement
      await db
        .from('movimentos_pontos')
        .insert({
          pontos_fidelidade_id: pontos.id,
          tipo: 'debito',
          quantidade: recompensa.pontos_necessarios,
          descricao: `Resgate: ${recompensa.nome}`,
        });
      
      // Update reward quantity if limited
      if (recompensa.quantidade_disponivel !== null) {
        await db
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
