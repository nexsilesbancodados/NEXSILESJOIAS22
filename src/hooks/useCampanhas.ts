import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const db = supabase;

export interface Campanha {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: string | null;
  desconto_percentual: number | null;
  meta_valor: number | null;
  premio: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  ativa: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ValidacaoCupom {
  id: string | null;
  nome: string | null;
  tipo: string | null;
  valor: number | null;
  valido: boolean;
  mensagem: string;
}

export function useCampanhas() {
  return useQuery({
    queryKey: ['campanhas'],
    queryFn: async () => {
      // Table 'campanhas' doesn't have user_id column - fetch all records
      const { data, error } = await db
        .from('campanhas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campanha[];
    },
  });
}

export function useCampanhasAtivas() {
  return useQuery({
    queryKey: ['campanhas-ativas'],
    queryFn: async () => {
      const now = new Date().toISOString();
      // Table 'campanhas' doesn't have user_id column
      const { data, error } = await db
        .from('campanhas')
        .select('*')
        .eq('ativa', true)
        .or(`data_inicio.is.null,data_inicio.lte.${now}`)
        .or(`data_fim.is.null,data_fim.gte.${now}`);

      if (error) throw error;
      return data as Campanha[];
    },
  });
}

export function useAddCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campanha: Omit<Campanha, 'id' | 'created_at' | 'updated_at'>) => {
      // Table 'campanhas' doesn't have user_id column
      const { data, error } = await db
        .from('campanhas')
        .insert(campanha)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas'] });
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Este código de cupom já existe');
      } else {
        toast.error('Erro ao criar campanha');
      }
    },
  });
}

export function useUpdateCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campanha> & { id: string }) => {
      const { data, error } = await db
        .from('campanhas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas'] });
      toast.success('Campanha atualizada!');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Este código de cupom já existe');
      } else {
        toast.error('Erro ao atualizar campanha');
      }
    },
  });
}

export function useDeleteCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('campanhas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas'] });
      toast.success('Campanha excluída!');
    },
    onError: () => {
      toast.error('Erro ao excluir campanha');
    },
  });
}

export function useValidarCupom() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (codigo: string): Promise<ValidacaoCupom> => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await db
        .rpc('validar_cupom', { p_codigo: codigo, p_user_id: user.id });

      if (error) throw error;
      
      if (data && Array.isArray(data) && data.length > 0) {
        return data[0] as ValidacaoCupom;
      }
      
      return {
        id: null,
        nome: null,
        tipo: null,
        valor: null,
        valido: false,
        mensagem: 'Cupom não encontrado',
      };
    },
  });
}

export function useUsarCupom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campanhaId: string) => {
      const { error } = await db
        .rpc('usar_cupom', { p_campanha_id: campanhaId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas'] });
    },
  });
}

// Generate random coupon code
export function generateCouponCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
