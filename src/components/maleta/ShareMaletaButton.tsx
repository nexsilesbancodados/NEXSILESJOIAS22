import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Copy, Share2, MessageCircle, Check, Link, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-db';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ShareMaletaButtonProps {
  maletaId: string;
  maletaNome: string;
  isPublic: boolean;
  sharingSlug: string | null;
  className?: string;
  variant?: 'default' | 'icon';
}

export const ShareMaletaButton = memo(function ShareMaletaButton({
  maletaId,
  maletaNome,
  isPublic,
  sharingSlug,
  className,
  variant = 'default',
}: ShareMaletaButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Generate a slug from the maleta name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .substring(0, 50) // Limit length
      + '-' + Math.random().toString(36).substring(2, 6); // Add random suffix
  };

  // Toggle public status
  const togglePublic = useMutation({
    mutationFn: async (newIsPublic: boolean) => {
      const updateData: { is_public: boolean; sharing_slug?: string } = {
        is_public: newIsPublic,
      };

      // Generate slug if making public and no slug exists
      if (newIsPublic && !sharingSlug) {
        updateData.sharing_slug = generateSlug(maletaNome);
      }

      const { error } = await supabase
        .from('maletas')
        .update(updateData)
        .eq('id', maletaId);

      if (error) throw error;
      return updateData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['maletas'] });
      toast.success(
        data.is_public 
          ? 'Vitrine pública ativada!' 
          : 'Vitrine agora é privada'
      );
    },
    onError: () => {
      toast.error('Erro ao atualizar configuração');
    },
  });

  const currentSlug = sharingSlug || generateSlug(maletaNome);
  const maletaLink = `${window.location.origin}/maleta/${currentSlug}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(maletaLink);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  }, [maletaLink]);

  const handleShareWhatsApp = useCallback(() => {
    const message = encodeURIComponent(
      `🛍️ *${maletaNome}*\n\nConfira as peças disponíveis e escolha as suas favoritas:\n${maletaLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setIsOpen(false);
  }, [maletaLink, maletaNome]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: maletaNome,
          text: `Confira as peças da maleta ${maletaNome}`,
          url: maletaLink,
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
  }, [maletaLink, maletaNome, handleCopyLink]);

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
        <PopoverContent align="end" className="w-80 p-4 bg-popover">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">Compartilhar Vitrine</h4>
              <p className="text-sm text-muted-foreground">
                Envie o link para seus clientes verem as peças
              </p>
            </div>

            {/* Toggle Public */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is-public" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Vitrine pública
              </Label>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={(checked) => togglePublic.mutate(checked)}
                disabled={togglePublic.isPending}
              />
            </div>

            {isPublic && (
              <>
                <div className="flex gap-2">
                  <Input
                    value={maletaLink}
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
              </>
            )}

            {!isPublic && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Ative a vitrine pública para compartilhar
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn('gap-2', className)}
        >
          <Share2 className="w-4 h-4" />
          Compartilhar
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4 bg-popover">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Compartilhar Vitrine</h4>
            <p className="text-sm text-muted-foreground">
              Envie o link para seus clientes verem as peças
            </p>
          </div>

          {/* Toggle Public */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is-public-default" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Vitrine pública
            </Label>
            {togglePublic.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Switch
                id="is-public-default"
                checked={isPublic}
                onCheckedChange={(checked) => togglePublic.mutate(checked)}
              />
            )}
          </div>

          {isPublic && (
            <>
              <div className="flex gap-2">
                <Input
                  value={maletaLink}
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
            </>
          )}

          {!isPublic && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Ative a vitrine pública para compartilhar o link com seus clientes
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
