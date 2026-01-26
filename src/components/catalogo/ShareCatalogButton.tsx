import { memo, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Share2, MessageCircle, Check, Loader2, Pencil, Save, QrCode, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-db';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';

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

// Sanitize custom slug input
const sanitizeSlug = (input: string) => {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9-]+/g, '-') // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .replace(/--+/g, '-') // Replace multiple dashes with single
    .substring(0, 60); // Limit length
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
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState(catalogoSlug || '');
  const [showQR, setShowQR] = useState(false);
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
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
      setCustomSlug(slug);
      queryClient.invalidateQueries({ queryKey: ['catalogos'] });
    },
    onError: () => {
      toast.error('Erro ao gerar link');
    },
  });

  // Generate alternative slug suggestions
  const generateAlternatives = async (baseSlug: string): Promise<string[]> => {
    const alternatives: string[] = [];
    for (let i = 2; i <= 5; i++) {
      const candidate = `${baseSlug}-${i}`;
      const { data } = await supabase
        .from('catalogos')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();
      if (!data) {
        alternatives.push(candidate);
        if (alternatives.length >= 3) break;
      }
    }
    return alternatives;
  };

  // Update custom slug
  const updateSlug = useMutation({
    mutationFn: async (newSlug: string) => {
      const sanitized = sanitizeSlug(newSlug);
      if (!sanitized || sanitized.length < 3) {
        throw new Error('Slug deve ter pelo menos 3 caracteres');
      }

      // Verificar unicidade do slug
      const { data: existing, error: checkError } = await supabase
        .from('catalogos')
        .select('id')
        .eq('slug', sanitized)
        .neq('id', catalogoId)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        // Generate suggestions
        const suggestions = await generateAlternatives(sanitized);
        setSlugSuggestions(suggestions);
        throw new Error('SLUG_CONFLICT');
      }

      setSlugSuggestions([]);
      const { error } = await supabase
        .from('catalogos')
        .update({ slug: sanitized })
        .eq('id', catalogoId);

      if (error) throw error;
      return sanitized;
    },
    onSuccess: (slug) => {
      setCurrentSlug(slug);
      queryClient.invalidateQueries({ queryKey: ['catalogos'] });
      setIsEditingSlug(false);
      setSlugSuggestions([]);
      toast.success('Link personalizado salvo!');
    },
    onError: (error: Error) => {
      if (error.message !== 'SLUG_CONFLICT') {
        toast.error(error.message || 'Erro ao salvar link');
      }
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

  const handleStartEdit = () => {
    setCustomSlug(currentSlug || '');
    setIsEditingSlug(true);
  };

  const handleSaveSlug = () => {
    if (customSlug.trim()) {
      updateSlug.mutate(customSlug);
    }
  };

  const handleDownloadQR = useCallback(() => {
    const svg = document.getElementById('qr-code-catalogo');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx?.fillRect(0, 0, 300, 300);
      ctx!.fillStyle = 'white';
      ctx?.fillRect(0, 0, 300, 300);
      ctx?.drawImage(img, 0, 0, 300, 300);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${catalogoNome.replace(/\s+/g, '-').toLowerCase()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [catalogoNome]);

  const renderQRCode = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">QR Code</Label>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowQR(!showQR)}
        >
          <QrCode className="w-3 h-3 mr-1" />
          {showQR ? 'Ocultar' : 'Mostrar'}
        </Button>
      </div>
      {showQR && (
        <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border">
          <QRCodeSVG
            id="qr-code-catalogo"
            value={catalogLink}
            size={150}
            level="H"
            includeMargin
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleDownloadQR}
          >
            <Download className="w-3 h-3 mr-1" />
            Baixar QR Code
          </Button>
        </div>
      )}
    </div>
  );

  const renderSlugEditor = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Personalizar link</Label>
      {isEditingSlug ? (
        <>
          <div className="flex gap-2">
            <Input
              value={customSlug}
              onChange={(e) => {
                setCustomSlug(sanitizeSlug(e.target.value));
                setSlugSuggestions([]);
              }}
              placeholder="meu-catalogo-personalizado"
              className={cn("text-xs h-9", slugSuggestions.length > 0 && "border-destructive")}
              maxLength={60}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSaveSlug}
              disabled={updateSlug.isPending}
            >
              {updateSlug.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-success" />
              )}
            </Button>
          </div>
          {slugSuggestions.length > 0 && (
            <div className="space-y-2 p-2 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-xs text-destructive font-medium">Este link já está em uso. Sugestões:</p>
              <div className="flex flex-wrap gap-1">
                {slugSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-background hover:bg-primary hover:text-primary-foreground"
                    onClick={() => {
                      setCustomSlug(suggestion);
                      setSlugSuggestions([]);
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            URL: {window.location.origin}/catalogo/<span className="text-primary font-medium">{sanitizeSlug(customSlug) || '...'}</span>
          </p>
        </>
      ) : (
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
            onClick={handleStartEdit}
            title="Editar slug"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );

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
              <h4 className="font-semibold mb-1">Compartilhar Catálogo</h4>
              <p className="text-sm text-muted-foreground">
                Envie o link para seus clientes fazerem pedidos
              </p>
            </div>
            
            {ensureSlug.isPending ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {renderSlugEditor()}
                
                {/* Preview Button */}
                <Button
                  variant="secondary"
                  className="w-full h-9 text-xs"
                  onClick={() => window.open(catalogLink, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  Ver preview do catálogo
                </Button>
                
                {renderQRCode()}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-9 text-xs"
                    onClick={handleShareWhatsApp}
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5 text-success" />
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
          
          {ensureSlug.isPending ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {renderSlugEditor()}
              
              {/* Preview Button */}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.open(catalogLink, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver preview do catálogo
              </Button>
              
              {renderQRCode()}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShareWhatsApp}
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-success" />
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
        </div>
      </PopoverContent>
    </Popover>
  );
});
