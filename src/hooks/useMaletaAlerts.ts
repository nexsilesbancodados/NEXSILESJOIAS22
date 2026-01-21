import { useEffect, useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';

interface MaletaAlert {
  id: string;
  revendedora_id: string | null;
  status: string | null;
  data_devolucao_prevista: string | null;
  codigo: string | null;
}

interface Profile {
  id: string;
  nome: string | null;
}

export function useVerificarMaletasVencendo(userId: string | undefined, diasAlerta = 3) {
  const queryClient = useQueryClient();

  const criarNotificacao = useMutation({
    mutationFn: async (data: {
      tipo: string;
      titulo: string;
      mensagem: string;
      user_id: string;
      entidade_tipo?: string;
      entidade_id?: string;
      dados?: Record<string, unknown>;
    }) => {
      // Check if notification already exists for this entity today
      const hoje = new Date().toISOString().split('T')[0];
      const { data: existente } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('user_id', data.user_id)
        .eq('entidade_tipo', data.entidade_tipo || '')
        .eq('entidade_id', data.entidade_id || '')
        .gte('created_at', hoje)
        .limit(1);

      if (existente && existente.length > 0) {
        return null; // Already notified today
      }

      const insertData = {
        tipo: data.tipo,
        titulo: data.titulo,
        mensagem: data.mensagem,
        user_id: data.user_id,
        entidade_tipo: data.entidade_tipo || null,
        entidade_id: data.entidade_id || null,
        dados: data.dados ? JSON.parse(JSON.stringify(data.dados)) : null,
      };

      const { data: notif, error } = await supabase
        .from('notificacoes')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return notif;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] });
    },
  });

  const verificarMaletas = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch open maletas with deadline
      const { data: maletas, error } = await supabase
        .from('maletas')
        .select(`
          id,
          revendedora_id,
          status,
          data_devolucao_prevista,
          codigo
        `)
        .eq('status', 'disponivel')
        .not('data_devolucao_prevista', 'is', null);

      if (error) throw error;
      if (!maletas || maletas.length === 0) return;

      // Get reseller profiles
      const resellerIds = [...new Set(maletas.map(m => m.revendedora_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('revendedoras')
        .select('id, nome')
        .in('id', resellerIds as string[]);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Check each maleta
      for (const maleta of maletas) {
        if (!maleta.data_devolucao_prevista) continue;

        const diasRestantes = differenceInDays(
          new Date(maleta.data_devolucao_prevista),
          new Date()
        );

        const revendedora = maleta.revendedora_id ? profileMap.get(maleta.revendedora_id) : null;
        const nomeMaleta = maleta.codigo || `#${maleta.id.slice(-4)}`;
        const nomeRevendedora = revendedora?.nome || 'Revendedora';

        if (diasRestantes < 0) {
          // Already overdue
          await criarNotificacao.mutateAsync({
            tipo: 'maleta_vencida',
            titulo: '🚨 Maleta Vencida',
            mensagem: `A maleta "${nomeMaleta}" de ${nomeRevendedora} está vencida há ${Math.abs(diasRestantes)} dia(s)!`,
            user_id: userId,
            entidade_tipo: 'maleta',
            entidade_id: maleta.id,
            dados: {
              diasVencida: Math.abs(diasRestantes),
              revendedora_id: maleta.revendedora_id,
              revendedora_nome: nomeRevendedora,
            },
          });
        } else if (diasRestantes <= diasAlerta) {
          // About to expire
          await criarNotificacao.mutateAsync({
            tipo: 'maleta_vencendo',
            titulo: '⚠️ Maleta Vencendo',
            mensagem: diasRestantes === 0 
              ? `A maleta "${nomeMaleta}" de ${nomeRevendedora} vence HOJE!`
              : `A maleta "${nomeMaleta}" de ${nomeRevendedora} vence em ${diasRestantes} dia(s)!`,
            user_id: userId,
            entidade_tipo: 'maleta',
            entidade_id: maleta.id,
            dados: {
              diasRestantes,
              revendedora_id: maleta.revendedora_id,
              revendedora_nome: nomeRevendedora,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error checking maletas:', error);
    }
  }, [userId, diasAlerta, criarNotificacao]);

  // Run on mount and every hour
  useEffect(() => {
    if (!userId) return;

    // Initial check
    verificarMaletas();

    // Check every hour
    const interval = setInterval(verificarMaletas, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, verificarMaletas]);

  return { verificarMaletas };
}

// Hook to get maletas that are expiring soon
export function useMaletasVencendo(diasAlerta = 3) {
  const queryClient = useQueryClient();

  const fetchMaletasVencendo = useCallback(async () => {
    const { data: maletas, error } = await supabase
      .from('maletas')
      .select(`
        id,
        revendedora_id,
        status,
        data_devolucao_prevista,
        codigo,
        created_at
      `)
      .eq('status', 'disponivel')
      .not('data_devolucao_prevista', 'is', null)
      .order('data_devolucao_prevista', { ascending: true });

    if (error) throw error;
    if (!maletas) return [];

    // Filter to only those expiring soon or overdue
    const hoje = new Date();
    return maletas.filter(maleta => {
      if (!maleta.data_devolucao_prevista) return false;
      const diasRestantes = differenceInDays(
        new Date(maleta.data_devolucao_prevista),
        hoje
      );
      return diasRestantes <= diasAlerta;
    }).map(maleta => ({
      ...maleta,
      diasRestantes: differenceInDays(
        new Date(maleta.data_devolucao_prevista!),
        hoje
      ),
    }));
  }, [diasAlerta]);

  return {
    fetchMaletasVencendo,
  };
}
