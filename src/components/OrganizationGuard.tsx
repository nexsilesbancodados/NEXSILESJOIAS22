import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase-db';
import { Loader2 } from 'lucide-react';

interface OrganizationGuardProps {
  children: React.ReactNode;
}

export function OrganizationGuard({ children }: OrganizationGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (authLoading || !user) {
      setIsChecking(false);
      setIsReady(true);
      return;
    }

    // Prevent multiple checks
    if (hasChecked.current) return;

    const checkAndCreateOrganization = async () => {
      hasChecked.current = true;
      setIsChecking(true);

      try {
        // Check if user already has a membership
        const { data: membership, error: membershipError } = await supabase
          .from('memberships')
          .select('id, organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (membershipError) {
          console.error('Error checking membership:', membershipError);
          setIsReady(true);
          setIsChecking(false);
          return;
        }

        // If user already has a membership, we're good
        if (membership) {
          setIsReady(true);
          setIsChecking(false);
          return;
        }

        // Check if user is an employee (funcionario) - they should NOT create a new org
        // Their membership should have been created by the criar-funcionario edge function
        const { data: funcionario } = await supabase
          .from('funcionarios')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (funcionario) {
          // Employee without membership - this is an edge case, don't create a new org
          console.warn('Employee without membership found, skipping org creation');
          setIsReady(true);
          setIsChecking(false);
          return;
        }

        // Only create org for new standalone users (owners)
        console.log('Creating organization for user:', user.id);
        
        // Create organization
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: user.user_metadata?.nome || user.email || 'Minha Organização',
            owner_id: user.id,
          })
          .select()
          .single();

        if (orgError) {
          console.error('Error creating organization:', orgError);
          // Still continue - maybe triggered by another process
          setIsReady(true);
          setIsChecking(false);
          return;
        }

        // Create membership
        const { error: memberError } = await supabase
          .from('memberships')
          .insert({
            user_id: user.id,
            organization_id: newOrg.id,
            role: 'owner',
          });

        if (memberError) {
          console.error('Error creating membership:', memberError);
        }

        setIsReady(true);
        setIsChecking(false);
      } catch (error) {
        console.error('Error in organization guard:', error);
        setIsReady(true);
        setIsChecking(false);
      }
    };

    checkAndCreateOrganization();
  }, [user, authLoading]);

  // Reset check when user changes
  useEffect(() => {
    if (!user) {
      hasChecked.current = false;
      setIsReady(false);
    }
  }, [user]);

  // Show loading only during initial check
  if (authLoading || (isChecking && !isReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Configurando ambiente...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
