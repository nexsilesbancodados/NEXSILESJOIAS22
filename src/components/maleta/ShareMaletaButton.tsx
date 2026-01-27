import { memo, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase-db';
import { useQueryClient } from '@tanstack/react-query';
import { SharePopover } from '@/components/shared/SharePopover';

interface ShareMaletaButtonProps {
  maletaId: string;
  maletaNome: string;
  isPublic: boolean;
  sharingSlug: string | null;
  className?: string;
  variant?: 'default' | 'icon';
}

// Generate a friendly slug with app name + maleta name
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

export const ShareMaletaButton = memo(function ShareMaletaButton({
  maletaId,
  maletaNome,
  isPublic,
  sharingSlug,
  className,
  variant = 'default',
}: ShareMaletaButtonProps) {
  const [currentSlug, setCurrentSlug] = useState(sharingSlug);
  const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
  const queryClient = useQueryClient();

  const handleSlugUpdate = useCallback(async (newSlug: string) => {
    // Check uniqueness
    const { data: existing, error: checkError } = await supabase
      .from('maletas')
      .select('id')
      .eq('sharing_slug', newSlug)
      .neq('id', maletaId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      throw new Error('SLUG_CONFLICT');
    }

    // Update slug
    const { error } = await supabase
      .from('maletas')
      .update({ sharing_slug: newSlug })
      .eq('id', maletaId);

    if (error) throw error;
    
    setCurrentSlug(newSlug);
    queryClient.invalidateQueries({ queryKey: ['maletas'] });
  }, [maletaId, queryClient]);

  const handlePublicToggle = useCallback(async (newIsPublic: boolean) => {
    const updateData: { is_public: boolean; sharing_slug?: string } = {
      is_public: newIsPublic,
    };

    // Generate slug if making public and no slug exists
    if (newIsPublic && !currentSlug) {
      const newSlug = generateSlug(maletaNome);
      updateData.sharing_slug = newSlug;
      setCurrentSlug(newSlug);
    }

    const { error } = await supabase
      .from('maletas')
      .update(updateData)
      .eq('id', maletaId);

    if (error) throw error;
    
    setCurrentIsPublic(newIsPublic);
    queryClient.invalidateQueries({ queryKey: ['maletas'] });
  }, [maletaId, maletaNome, currentSlug, queryClient]);

  return (
    <SharePopover
      itemId={maletaId}
      itemName={maletaNome}
      slug={currentSlug || sharingSlug}
      isPublic={currentIsPublic}
      routePrefix="maleta"
      showPublicToggle={true}
      onSlugUpdate={handleSlugUpdate}
      onPublicToggle={handlePublicToggle}
      variant={variant}
      className={className}
    />
  );
});
