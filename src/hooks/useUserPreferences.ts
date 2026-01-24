import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPreference {
  id: string;
  user_id: string;
  chave: string;
  valor: string | null;
  created_at: string;
  updated_at: string;
}

// Hook para buscar todas as preferências do usuário
export function useUserPreferences() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('chave, valor')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user preferences:', error);
        return {};
      }
      
      // Convert to key-value object
      const prefs: Record<string, string> = {};
      data?.forEach(item => {
        if (item.chave) {
          prefs[item.chave] = item.valor || '';
        }
      });
      
      return prefs;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook para buscar uma preferência específica
export function useUserPreference(key: string, defaultValue: string = '') {
  const { data: preferences, isLoading } = useUserPreferences();
  
  return {
    value: preferences?.[key] ?? defaultValue,
    isLoading,
  };
}

// Hook para salvar preferências
export function useSaveUserPreference() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(
          { user_id: user.id, chave, valor },
          { onConflict: 'user_id,chave' }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] });
    },
  });
}

// Hook para salvar múltiplas preferências de uma vez
export function useSaveUserPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (preferences: Record<string, string>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const upserts = Object.entries(preferences).map(([chave, valor]) => ({
        user_id: user.id,
        chave,
        valor,
      }));
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert(upserts, { onConflict: 'user_id,chave' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] });
    },
  });
}

// Hook para deletar uma preferência
export function useDeleteUserPreference() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (chave: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('chave', chave);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] });
    },
  });
}

// Keys de preferências usadas no app
export const PREFERENCE_KEYS = {
  MENU_MODE: 'menuMode',
  SIDEBAR_EXPANDED: 'sidebarExpanded',
  SIDEBAR_PINNED: 'sidebarPinned',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  REMETENTE_PADRAO: 'remetente_padrao',
  REMETENTE_GALVANICA: 'remetente_galvanica_padrao',
  DESTINATARIO_GALVANICA: 'destinatario_galvanica_padrao',
  EXPORT_TEMPLATES: 'export_templates',
  DICA_BANHOS_VISIBLE: 'dica_banhos_visible',
  DICA_GALVANICA_VISIBLE: 'dica_galvanica_visible',
} as const;
