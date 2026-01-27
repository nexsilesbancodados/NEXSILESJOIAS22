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
import { 
  Copy, 
  Share2, 
  MessageCircle, 
  Check, 
  Link, 
  Loader2, 
  Pencil, 
  Save, 
  QrCode, 
  Download, 
  Eye,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

interface SharePopoverProps {
  /** Unique ID of the item (catalog or maleta) */
  itemId: string;
  /** Display name of the item */
  itemName: string;
  /** Current sharing slug */
  slug: string | null;
  /** Whether the item is publicly accessible */
  isPublic?: boolean;
  /** Route prefix for the public link (e.g., 'catalogo' or 'maleta') */
  routePrefix: 'catalogo' | 'maleta';
  /** Whether to show the public toggle (only for maletas) */
  showPublicToggle?: boolean;
  /** Called when slug is updated */
  onSlugUpdate: (newSlug: string) => Promise<void>;
  /** Called when public status is toggled */
  onPublicToggle?: (isPublic: boolean) => Promise<void>;
  /** Whether an operation is pending */
  isPending?: boolean;
  /** Button variant */
  variant?: 'default' | 'icon' | 'gold';
  /** Additional classes */
  className?: string;
}

// Generate a friendly slug with app name
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

// Sanitize custom slug input
const sanitizeSlug = (input: string) => {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-')
    .substring(0, 60);
};

export const SharePopover = memo(function SharePopover({
  itemId,
  itemName,
  slug,
  isPublic = true,
  routePrefix,
  showPublicToggle = false,
  onSlugUpdate,
  onPublicToggle,
  isPending = false,
  variant = 'default',
  className,
}: SharePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState(slug || '');
  const [showQR, setShowQR] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

  const currentSlug = slug || generateSlug(itemName);
  const publicLink = `${window.location.origin}/${routePrefix}/${currentSlug}`;

  const handleCopyLink = useCallback(async () => {
    try {
      // Auto-enable public if needed
      if (showPublicToggle && !isPublic && onPublicToggle) {
        setIsTogglingPublic(true);
        await onPublicToggle(true);
        setIsTogglingPublic(false);
      }
      
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      toast.success('Link copiado!', {
        icon: <CheckCircle2 className="w-4 h-4 text-success" />,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  }, [publicLink, isPublic, showPublicToggle, onPublicToggle]);

  const handleShareWhatsApp = useCallback(async () => {
    try {
      // Auto-enable public if needed
      if (showPublicToggle && !isPublic && onPublicToggle) {
        setIsTogglingPublic(true);
        await onPublicToggle(true);
        setIsTogglingPublic(false);
      }
      
      const typeLabel = routePrefix === 'catalogo' ? 'catálogo' : 'vitrine';
      const message = encodeURIComponent(
        `🛍️ *${itemName}*\n\nConfira nosso ${typeLabel} e escolha suas peças favoritas:\n${publicLink}`
      );
      window.open(`https://wa.me/?text=${message}`, '_blank');
      setIsOpen(false);
    } catch {
      toast.error('Erro ao compartilhar');
    }
  }, [publicLink, itemName, routePrefix, isPublic, showPublicToggle, onPublicToggle]);

  const handleNativeShare = useCallback(async () => {
    try {
      // Auto-enable public if needed
      if (showPublicToggle && !isPublic && onPublicToggle) {
        setIsTogglingPublic(true);
        await onPublicToggle(true);
        setIsTogglingPublic(false);
      }
      
      if (navigator.share) {
        await navigator.share({
          title: itemName,
          text: `Confira: ${itemName}`,
          url: publicLink,
        });
        setIsOpen(false);
      } else {
        handleCopyLink();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Erro ao compartilhar');
      }
    }
  }, [publicLink, itemName, handleCopyLink, isPublic, showPublicToggle, onPublicToggle]);

  const handleStartEdit = () => {
    setCustomSlug(currentSlug);
    setSlugError(null);
    setIsEditingSlug(true);
  };

  const handleCancelEdit = () => {
    setCustomSlug(slug || '');
    setSlugError(null);
    setIsEditingSlug(false);
  };

  const handleSaveSlug = async () => {
    const sanitized = sanitizeSlug(customSlug);
    if (!sanitized || sanitized.length < 3) {
      setSlugError('Link deve ter pelo menos 3 caracteres');
      return;
    }

    setIsSavingSlug(true);
    setSlugError(null);
    
    try {
      await onSlugUpdate(sanitized);
      setIsEditingSlug(false);
      toast.success('Link personalizado salvo!', {
        icon: <CheckCircle2 className="w-4 h-4 text-success" />,
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'SLUG_CONFLICT') {
        setSlugError('Este link já está em uso. Tente outro.');
      } else {
        setSlugError(message || 'Erro ao salvar link');
      }
    } finally {
      setIsSavingSlug(false);
    }
  };

  const handleTogglePublic = async (checked: boolean) => {
    if (!onPublicToggle) return;
    
    setIsTogglingPublic(true);
    try {
      await onPublicToggle(checked);
      toast.success(checked ? 'Vitrine pública ativada!' : 'Vitrine agora é privada');
    } catch {
      toast.error('Erro ao atualizar configuração');
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const handleDownloadQR = useCallback(() => {
    const svg = document.getElementById(`qr-code-${itemId}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx!.fillStyle = 'white';
      ctx?.fillRect(0, 0, 300, 300);
      ctx?.drawImage(img, 0, 0, 300, 300);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${itemName.replace(/\s+/g, '-').toLowerCase()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast.success('QR Code baixado!');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [itemId, itemName]);

  const handlePreview = () => {
    window.open(publicLink, '_blank');
  };

  const canShare = !showPublicToggle || isPublic;

  const renderContent = () => (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h4 className="font-semibold mb-1">
          Compartilhar {routePrefix === 'catalogo' ? 'Catálogo' : 'Vitrine'}
        </h4>
        <p className="text-sm text-muted-foreground">
          Envie o link para seus clientes
        </p>
      </div>

      {/* Public Toggle (only for maletas) */}
      {showPublicToggle && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <Label htmlFor="public-toggle" className="flex items-center gap-2 cursor-pointer">
            <Link className="w-4 h-4" />
            <span>Vitrine pública</span>
          </Label>
          <Switch
            id="public-toggle"
            checked={isPublic}
            onCheckedChange={handleTogglePublic}
            disabled={isTogglingPublic || isPending}
          />
        </div>
      )}

      {/* Show content only if public or no toggle needed */}
      {canShare ? (
        <>
          {/* Link Editor */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Link personalizado</Label>
            {isEditingSlug ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={customSlug}
                    onChange={(e) => {
                      setCustomSlug(sanitizeSlug(e.target.value));
                      setSlugError(null);
                    }}
                    placeholder="meu-link-personalizado"
                    className={cn(
                      "text-xs h-9 font-mono",
                      slugError && "border-destructive focus-visible:ring-destructive"
                    )}
                    maxLength={60}
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleCancelEdit}
                    disabled={isSavingSlug}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleSaveSlug}
                    disabled={isSavingSlug}
                  >
                    {isSavingSlug ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 text-success" />
                    )}
                  </Button>
                </div>
                {slugError && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    {slugError}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground font-mono">
                  {window.location.origin}/{routePrefix}/
                  <span className="text-primary font-medium">{sanitizeSlug(customSlug) || '...'}</span>
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={publicLink}
                  readOnly
                  className="text-xs h-9 font-mono bg-muted/30"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleStartEdit}
                  title="Personalizar link"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleCopyLink}
                  title="Copiar link"
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

          {/* Preview Button */}
          <Button
            variant="secondary"
            className="w-full h-9 text-xs"
            onClick={handlePreview}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Ver preview
          </Button>

          {/* QR Code Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">QR Code para impressão</Label>
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
                  id={`qr-code-${itemId}`}
                  value={publicLink}
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

          {/* Share Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-9 text-xs hover:bg-success/10"
              onClick={handleShareWhatsApp}
              disabled={isTogglingPublic}
            >
              <MessageCircle className="w-4 h-4 mr-1.5 text-green-500" />
              WhatsApp
            </Button>
            {'share' in navigator && (
              <Button
                variant="outline"
                className="flex-1 h-9 text-xs"
                onClick={handleNativeShare}
                disabled={isTogglingPublic}
              >
                <Share2 className="w-4 h-4 mr-1.5" />
                Mais opções
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Ative a vitrine pública para compartilhar o link com seus clientes
          </p>
        </div>
      )}
    </div>
  );

  const renderTrigger = () => {
    if (variant === 'icon') {
      return (
        <Button 
          variant="ghost" 
          size="icon"
          className={cn('h-8 w-8', className)}
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      );
    }

    if (variant === 'gold') {
      return (
        <Button 
          className={cn('btn-gold gap-2', className)}
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="w-4 h-4" />
          Compartilhar
        </Button>
      );
    }

    return (
      <Button 
        variant="outline" 
        size="sm"
        className={cn('gap-2', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <Share2 className="w-4 h-4" />
        Compartilhar
      </Button>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {renderTrigger()}
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 p-4 bg-popover" 
        onClick={(e) => e.stopPropagation()}
      >
        {isPending ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          renderContent()
        )}
      </PopoverContent>
    </Popover>
  );
});
