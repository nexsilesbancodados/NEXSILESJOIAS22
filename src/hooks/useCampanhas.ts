import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Campanha {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  tipo: 'percentual' | 'valor_fixo' | 'frete_gratis';
  valor: number;
  codigo_cupom: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  limite_uso: number | null;
  usos_atuais: number;
  ativo: boolean;
  categorias: string[] | null;
  pecas_ids: string[] | null;
  created_at: string;
  updated_at: string;
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
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campanhas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campanha[];
    },
    enabled: !!user,
  });
}

export function useCampanhasAtivas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campanhas-ativas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .or(`data_inicio.is.null,data_inicio.lte.${now}`)
        .or(`data_fim.is.null,data_fim.gte.${now}`);

      if (error) throw error;
      return data as Campanha[];
    },
    enabled: !!user,
  });
}

export function useAddCampanha() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (campanha: Omit<Campanha, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'usos_atuais'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('campanhas')
        .insert({
          ...campanha,
          user_id: user.id,
          usos_atuais: 0,
        })
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
      const { data, error } = await supabase
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
      const { error } = await supabase
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
      
      const { data, error } = await supabase
        .rpc('validar_cupom', { p_codigo: codigo, p_user_id: user.id });

      if (error) throw error;
      
      if (data && data.length > 0) {
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
      const { error } = await supabase
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
