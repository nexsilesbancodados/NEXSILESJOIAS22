import { memo, useCallback, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-db';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SharePopover } from '@/components/shared/SharePopover';

interface ShareCatalogButtonProps {
  catalogoId: string;
  catalogoNome: string;
  catalogoSlug?: string | null;
  className?: string;
  variant?: 'default' | 'icon';
}

// Generate a friendly slug with app name + catalog name
const generateSlug = (name: string) => {
  const cleanName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);
  
  return `nexsiles-${cleanName}-${Math.random().toString(36).substring(2, 6)}`;
};

export const ShareCatalogButton = memo(function ShareCatalogButton({
  catalogoId,
  catalogoNome,
  catalogoSlug,
  className,
  variant = 'default',
}: ShareCatalogButtonProps) {
  const [currentSlug, setCurrentSlug] = useState(catalogoSlug);
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  // Generate slug on first access if not exists
  useEffect(() => {
    if (!catalogoSlug && !currentSlug && !isGenerating) {
      setIsGenerating(true);
      const newSlug = generateSlug(catalogoNome);
      
      supabase
        .from('catalogos')
        .update({ slug: newSlug })
        .eq('id', catalogoId)
        .then(({ error }) => {
          if (!error) {
            setCurrentSlug(newSlug);
            queryClient.invalidateQueries({ queryKey: ['catalogos'] });
          }
          setIsGenerating(false);
        });
    }
  }, [catalogoId, catalogoNome, catalogoSlug, currentSlug, isGenerating, queryClient]);

  const handleSlugUpdate = useCallback(async (newSlug: string) => {
    // Check uniqueness
    const { data: existing, error: checkError } = await supabase
      .from('catalogos')
      .select('id')
      .eq('slug', newSlug)
      .neq('id', catalogoId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      throw new Error('SLUG_CONFLICT');
    }

    // Update slug
    const { error } = await supabase
      .from('catalogos')
      .update({ slug: newSlug })
      .eq('id', catalogoId);

    if (error) throw error;
    
    setCurrentSlug(newSlug);
    queryClient.invalidateQueries({ queryKey: ['catalogos'] });
  }, [catalogoId, queryClient]);

  return (
    <SharePopover
      itemId={catalogoId}
      itemName={catalogoNome}
      slug={currentSlug || catalogoSlug || null}
      routePrefix="catalogo"
      showPublicToggle={false}
      onSlugUpdate={handleSlugUpdate}
      isPending={isGenerating}
      variant={variant === 'default' ? 'gold' : 'icon'}
      className={className}
    />
  );
});
