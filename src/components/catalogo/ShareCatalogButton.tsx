import { memo, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Share2, MessageCircle, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-db';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .substring(0, 40); // Limit length
  
  // Format: nexsiles-nome-do-catalogo-xxxx
  return `nexsiles-${cleanName}-${Math.random().toString(36).substring(2, 6)}`;
};

export const ShareCatalogButton = memo(function ShareCatalogButton({
  catalogoId,
  catalogoNome,
  catalogoSlug,
  className,
  variant = 'default',
}: ShareCatalogButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState(catalogoSlug);
  const queryClient = useQueryClient();

  // Generate slug if needed when popover opens
  const ensureSlug = useMutation({
    mutationFn: async () => {
      if (currentSlug) return currentSlug;
      
      const newSlug = generateSlug(catalogoNome);
      const { error } = await supabase
        .from('catalogos')
        .update({ slug: newSlug })
        .eq('id', catalogoId);
      
      if (error) throw error;
      return newSlug;
    },
    onSuccess: (slug) => {
      setCurrentSlug(slug);
      queryClient.invalidateQueries({ queryKey: ['catalogos'] });
    },
    onError: () => {
      toast.error('Erro ao gerar link');
    },
  });

  // Generate slug when popover opens if not exists
  useEffect(() => {
    if (isOpen && !currentSlug) {
      ensureSlug.mutate();
    }
  }, [isOpen, currentSlug]);

  const catalogLink = `${window.location.origin}/catalogo/${currentSlug || catalogoId}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(catalogLink);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  }, [catalogLink]);

  const handleShareWhatsApp = useCallback(() => {
    const message = encodeURIComponent(
      `🛍️ *${catalogoNome}*\n\nConfira nosso catálogo e faça seu pedido:\n${catalogLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setIsOpen(false);
  }, [catalogLink, catalogoNome]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: catalogoNome,
          text: `Confira o catálogo ${catalogoNome}`,
          url: catalogLink,
        });
        setIsOpen(false);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Erro ao compartilhar');
        }
      }
    } else {
      handleCopyLink();
    }
  }, [catalogLink, catalogoNome, handleCopyLink]);

  if (variant === 'icon') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className={cn('h-8 w-8', className)}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-3 bg-popover">
          <div className="space-y-3">
            <p className="text-sm font-medium">Compartilhar Catálogo</p>
            
            <div className="flex gap-2">
              <Input
                value={catalogLink}
                readOnly
                className="text-xs h-9"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9 text-xs"
                onClick={handleShareWhatsApp}
              >
                <MessageCircle className="w-4 h-4 mr-1.5 text-green-500" />
                WhatsApp
              </Button>
              {'share' in navigator && (
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-xs"
                  onClick={handleNativeShare}
                >
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Mais opções
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button className={cn('btn-gold', className)}>
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4 bg-popover">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Compartilhar Catálogo</h4>
            <p className="text-sm text-muted-foreground">
              Envie o link para seus clientes fazerem pedidos
            </p>
          </div>
          
          <div className="flex gap-2">
            <Input
              value={catalogLink}
              readOnly
              className="text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleShareWhatsApp}
            >
              <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
              WhatsApp
            </Button>
            {'share' in navigator && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleNativeShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Mais opções
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
