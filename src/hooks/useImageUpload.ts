import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, folder: string = 'pecas'): Promise<string | null> => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pecas')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pecas')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extract the path from the URL
      const urlParts = url.split('/pecas/');
      if (urlParts.length < 2) return false;
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from('pecas')
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  return { uploadImage, deleteImage, uploading };
}
