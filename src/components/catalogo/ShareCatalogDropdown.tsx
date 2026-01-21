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
import { Copy, Share2, MessageCircle, ExternalLink } from 'lucide-react';
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

  const openCatalogs = catalogos.filter(c => c.ativo !== false);

  const handleCopyLink = useCallback(async (catalogoId: string, catalogoNome: string) => {
    const link = `${window.location.origin}/catalogo/${catalogoId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success(`Link do catálogo "${catalogoNome}" copiado!`);
      setIsOpen(false);
    } catch {
      toast.error('Erro ao copiar link');
    }
  }, []);

  const handleShareWhatsApp = useCallback((catalogoId: string, catalogoNome: string) => {
    const link = `${window.location.origin}/catalogo/${catalogoId}`;
    const message = encodeURIComponent(
      `🛍️ *${catalogoNome}*\n\nConfira nosso catálogo e faça seu pedido:\n${link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setIsOpen(false);
  }, []);

  const handleOpenCatalog = useCallback((catalogoId: string) => {
    window.open(`${window.location.origin}/catalogo/${catalogoId}`, '_blank');
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
      <DropdownMenuContent align="end" className="w-64 bg-popover">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Selecione um catálogo para compartilhar
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {openCatalogs.map((catalogo) => (
          <div key={catalogo.id} className="px-2 py-1.5">
            <p className="text-sm font-medium mb-1 px-2">{catalogo.nome}</p>
            <div className="flex gap-1">
              <DropdownMenuItem
                className="flex-1 justify-center cursor-pointer"
                onClick={() => handleCopyLink(catalogo.id, catalogo.nome)}
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copiar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex-1 justify-center cursor-pointer"
                onClick={() => handleShareWhatsApp(catalogo.id, catalogo.nome)}
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1 text-green-500" />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex-1 justify-center cursor-pointer"
                onClick={() => handleOpenCatalog(catalogo.id)}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Abrir
              </DropdownMenuItem>
            </div>
            {openCatalogs.indexOf(catalogo) < openCatalogs.length - 1 && (
              <DropdownMenuSeparator className="mt-2" />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
