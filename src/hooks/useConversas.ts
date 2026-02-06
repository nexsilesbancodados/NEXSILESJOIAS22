import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface Conversa {
  id: string;
  session_id: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  status: string | null;
  origem: string | null;
  total_mensagens: number | null;
  nps_rating: number | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface Mensagem {
  id: string;
  conversa_id: string | null;
  role: string;
  content: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface ConversaFilters {
  status?: string;
  origem?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useConversas(filters: ConversaFilters = {}) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['conversas', organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];

      let query = supabase
        .from('agente_conversas')
        .select('*')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false });

      if (filters.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }

      if (filters.origem && filters.origem !== 'todos') {
        query = query.eq('origem', filters.origem);
      }

      if (filters.search) {
        query = query.or(`cliente_nome.ilike.%${filters.search}%,cliente_telefone.ilike.%${filters.search}%`);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Conversa[];
    },
    enabled: !!organizationId,
  });
}

export function useConversaMessages(conversaId: string | null) {
  return useQuery({
    queryKey: ['conversa-messages', conversaId],
    queryFn: async () => {
      if (!conversaId) return [];

      const { data, error } = await supabase
        .from('agente_mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Mensagem[];
    },
    enabled: !!conversaId,
  });
}

export function useConversaStats() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['conversa-stats', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const { data: conversas, error } = await supabase
        .from('agente_conversas')
        .select('status, nps_rating, total_mensagens, created_at')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const total = conversas.length;
      const ativas = conversas.filter(c => c.status === 'ativa').length;
      const aguardandoHumano = conversas.filter(c => c.status === 'aguardando_humano').length;
      const encerradas = conversas.filter(c => c.status === 'encerrada').length;
      
      const npsRatings = conversas.filter(c => c.nps_rating !== null).map(c => c.nps_rating!);
      const npsMedia = npsRatings.length > 0 
        ? npsRatings.reduce((a, b) => a + b, 0) / npsRatings.length 
        : null;
      
      const promotores = npsRatings.filter(r => r >= 9).length;
      const detratores = npsRatings.filter(r => r <= 6).length;
      const npsScore = npsRatings.length > 0
        ? ((promotores - detratores) / npsRatings.length) * 100
        : null;

      // Conversas hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const conversasHoje = conversas.filter(c => new Date(c.created_at) >= hoje).length;

      return {
        total,
        ativas,
        aguardandoHumano,
        encerradas,
        npsMedia,
        npsScore,
        conversasHoje,
        totalMensagens: conversas.reduce((acc, c) => acc + (c.total_mensagens || 0), 0),
      };
    },
    enabled: !!organizationId,
  });
}

export function useUpdateConversa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Conversa> & { id: string }) => {
      const { data, error } = await supabase
        .from('agente_conversas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      queryClient.invalidateQueries({ queryKey: ['conversa-stats'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar conversa: ' + error.message);
    },
  });
}

export function useCloseConversa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversaId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('agente_conversas')
        .update({
          status: 'encerrada',
          closed_at: new Date().toISOString(),
          closed_by: user?.id,
        })
        .eq('id', conversaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      queryClient.invalidateQueries({ queryKey: ['conversa-stats'] });
      toast.success('Conversa encerrada');
    },
    onError: (error) => {
      toast.error('Erro ao encerrar conversa: ' + error.message);
    },
  });
}

export function useAssignConversa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversaId, userId }: { conversaId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('agente_conversas')
        .update({
          assigned_to: userId,
          status: 'em_atendimento',
        })
        .eq('id', conversaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      queryClient.invalidateQueries({ queryKey: ['fila-humana'] });
      toast.success('Conversa atribuída');
    },
    onError: (error) => {
      toast.error('Erro ao atribuir conversa: ' + error.message);
    },
  });
}
