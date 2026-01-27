import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Copy, Share2, MessageCircle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useCatalogos } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';

interface ShareCatalogDropdownProps {
  className?: string;
}

export const ShareCatalogDropdown = memo(function ShareCatalogDropdown({
  className,
}: ShareCatalogDropdownProps) {
  const { data: catalogos = [] } = useCatalogos();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const openCatalogs = catalogos.filter(c => c.ativo !== false);

  const handleCopyLink = useCallback(async (catalogoId: string, catalogoNome: string, slug?: string | null) => {
    const linkId = slug || catalogoId;
    const link = `${window.location.origin}/catalogo/${linkId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(catalogoId);
      toast.success(`Link do catálogo "${catalogoNome}" copiado!`, {
        icon: <CheckCircle2 className="w-4 h-4 text-success" />,
      });
      setTimeout(() => {
        setCopiedId(null);
        setIsOpen(false);
      }, 1000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  }, []);

  const handleShareWhatsApp = useCallback((catalogoId: string, catalogoNome: string, slug?: string | null) => {
    const linkId = slug || catalogoId;
    const link = `${window.location.origin}/catalogo/${linkId}`;
    const message = encodeURIComponent(
      `🛍️ *${catalogoNome}*\n\nConfira nosso catálogo e faça seu pedido:\n${link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setIsOpen(false);
  }, []);

  const handleOpenCatalog = useCallback((catalogoId: string, slug?: string | null) => {
    const linkId = slug || catalogoId;
    window.open(`${window.location.origin}/catalogo/${linkId}`, '_blank');
    setIsOpen(false);
  }, []);

  if (openCatalogs.length === 0) {
    return (
      <Button variant="outline" disabled className={cn('gap-2', className)}>
        <Share2 className="w-4 h-4" />
        Nenhum catálogo aberto
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button className={cn('btn-gold gap-2', className)}>
          <Share2 className="w-4 h-4" />
          Compartilhar Catálogo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-popover">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Selecione um catálogo para compartilhar
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {openCatalogs.map((catalogo, index) => (
          <div key={catalogo.id} className="px-2 py-2">
            <p className="text-sm font-medium mb-2 px-2 truncate" title={catalogo.nome}>
              {catalogo.nome}
            </p>
            <div className="flex gap-1">
              <DropdownMenuItem
                className="flex-1 justify-center cursor-pointer h-8"
                onClick={() => handleCopyLink(catalogo.id, catalogo.nome, catalogo.slug)}
              >
                {copiedId === catalogo.id ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1" />
                )}
                Copiar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex-1 justify-center cursor-pointer h-8"
                onClick={() => handleShareWhatsApp(catalogo.id, catalogo.nome, catalogo.slug)}
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1 text-success" />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex-1 justify-center cursor-pointer h-8"
                onClick={() => handleOpenCatalog(catalogo.id, catalogo.slug)}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Abrir
              </DropdownMenuItem>
            </div>
            {index < openCatalogs.length - 1 && (
              <DropdownMenuSeparator className="mt-2" />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
