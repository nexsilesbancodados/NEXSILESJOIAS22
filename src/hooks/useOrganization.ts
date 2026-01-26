import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  organization?: Organization;
}

export function useOrganization() {
  const { user } = useAuth();
  
  const { data: membership, isLoading, error } = useQuery({
    queryKey: ['membership', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching membership:', error);
        return null;
      }
      
      return data as Membership | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failure
  });

  const organizationId = membership?.organization_id || null;
  const organization = membership?.organization || null;
  const isOwner = membership?.role === 'owner';
  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin';

  return {
    organizationId,
    organization,
    membership,
    isOwner,
    isAdmin,
    isLoading,
    error,
  };
}

export function useEnsureOrganization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Check if user already has an organization
      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('id, organization_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingMembership) {
        return existingMembership.organization_id;
      }
      
      // Create new organization for user
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: user.user_metadata?.nome || user.email || 'Minha Organização',
          owner_id: user.id,
        })
        .select()
        .single();
      
      if (orgError) throw orgError;
      
      // Create membership
      const { error: memberError } = await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          organization_id: newOrg.id,
          role: 'owner',
        });
      
      if (memberError) throw memberError;
      
      return newOrg.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership'] });
    },
  });
}

// Hook to get organization_id for inserts - with fallback
export function useOrganizationId() {
  const { organizationId, isLoading } = useOrganization();
  return { organizationId, isLoading };
}

// Standalone function to get organization_id (for use outside React components)
export async function getOrganizationIdAsync(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();
    
  return data?.organization_id || null;
}
