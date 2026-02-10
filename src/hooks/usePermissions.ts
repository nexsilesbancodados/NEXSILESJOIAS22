import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useAuth } from '@/contexts/AuthContext';

interface ModulePermission {
  modulo: string;
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
}

// Map module IDs to sidebar paths
const MODULE_PATH_MAP: Record<string, string[]> = {
  dashboard: ['/'],
  pecas: ['/pecas'],
  etiquetas: ['/etiquetas'],
  banhos: ['/banhos'],
  vendas: ['/pdv'],
  campanhas: ['/campanhas'],
  clientes: ['/clientes'],
  catalogos: ['/catalogos'],
  revendedoras: ['/revendedoras', '/revendedoras/desempenho'],
  fornecedores: ['/fornecedores'],
  romaneios: ['/romaneios'],
  relatorios: ['/relatorios'],
  historico: ['/historico'],
  atendimento: ['/atendimento'],
  configuracoes: ['/configuracoes'],
};

export function usePermissions() {
  const { user, isAdmin } = useAuth();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['my-permissions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Find funcionario record for this user
      const { data: funcionario } = await supabase
        .from('funcionarios')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!funcionario) return [];

      const { data, error } = await supabase
        .from('funcionario_permissoes')
        .select('*')
        .eq('funcionario_id', funcionario.id);

      if (error) return [];
      return data as ModulePermission[];
    },
    enabled: !!user && !isAdmin,
    staleTime: 1000 * 60 * 10,
  });

  const canAccessPath = (path: string): boolean => {
    if (isAdmin) return true;
    // Tutorial is always accessible
    if (path === '/tutorial') return true;

    for (const [modulo, paths] of Object.entries(MODULE_PATH_MAP)) {
      if (paths.includes(path)) {
        const perm = permissions.find(p => p.modulo === modulo);
        return perm?.pode_ver ?? false;
      }
    }
    return false;
  };

  const canDoAction = (modulo: string, action: 'ver' | 'criar' | 'editar' | 'excluir'): boolean => {
    if (isAdmin) return true;
    const perm = permissions.find(p => p.modulo === modulo);
    if (!perm) return false;
    return perm[`pode_${action}`];
  };

  return { permissions, isLoading, canAccessPath, canDoAction, isAdmin };
}
