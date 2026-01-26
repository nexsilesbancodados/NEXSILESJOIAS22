import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization, useEnsureOrganization } from '@/hooks/useOrganization';
import { Loader2 } from 'lucide-react';

interface OrganizationGuardProps {
  children: React.ReactNode;
}

export function OrganizationGuard({ children }: OrganizationGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { organizationId, isLoading: orgLoading } = useOrganization();
  const ensureOrg = useEnsureOrganization();
  const [isEnsuring, setIsEnsuring] = useState(false);

  useEffect(() => {
    // If user is logged in but has no organization, create one
    if (user && !authLoading && !orgLoading && !organizationId && !isEnsuring && !ensureOrg.isPending) {
      setIsEnsuring(true);
      ensureOrg.mutate(undefined, {
        onSettled: () => setIsEnsuring(false),
      });
    }
  }, [user, authLoading, orgLoading, organizationId, isEnsuring, ensureOrg]);

  // Show loading while checking/creating organization
  if (authLoading || orgLoading || isEnsuring || ensureOrg.isPending) {
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
