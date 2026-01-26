import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, ChevronRight, Pencil, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { useMaletaItems, type Maleta, type Peca } from '@/hooks/useSupabaseData';
import { ShareMaletaButton } from '@/components/maleta/ShareMaletaButton';

interface MaletaCardProps {
  maleta: Maleta;
  comissao: number;
  onClick: () => void;
  onEdit: () => void;
}

export function MaletaCard({ 
  maleta, 
  comissao, 
  onClick,
  onEdit,
}: MaletaCardProps) {
  const { data: items = [] } = useMaletaItems(maleta.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalVendido = items
    .filter((item) => item.status === 'vendido')
    .reduce((acc, item) => acc + ((item.peca as Peca)?.preco_venda || 0), 0);

  const pendentes = items.filter(i => i.status === 'pendente').length;
  const vendidas = items.filter(i => i.status === 'vendido').length;

  const calcularDiasRestantes = (prazo: string | null) => {
    if (!prazo) return null;
    const prazoDate = new Date(prazo);
    return differenceInDays(prazoDate, new Date());
  };

  const diasRestantes = calcularDiasRestantes(maleta.data_devolucao ? String(maleta.data_devolucao) : null);
  const isVencida = diasRestantes !== null && diasRestantes < 0;
  const isVencendo = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 3;

  // Get custom colors with fallbacks
  const corPrimaria = maleta.cor_primaria || '#8B5CF6';
  const corSecundaria = maleta.cor_secundaria || '#EC4899';
  const hasCustomImage = !!maleta.imagem_capa;

  return (
    <Card
      className={cn(
        "glass-card hover-lift cursor-pointer overflow-hidden",
        isVencida && maleta.status === 'aberta' && "border-destructive/50",
        isVencendo && maleta.status === 'aberta' && "border-warning/50"
      )}
      onClick={onClick}
    >
      {/* Custom header with colors/image */}
      <div 
        className="h-2 w-full"
        style={{
          background: hasCustomImage 
            ? `url(${maleta.imagem_capa}) center/cover`
            : `linear-gradient(90deg, ${corPrimaria}, ${corSecundaria})`
        }}
      />
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Custom styled icon with colors or image */}
            <div 
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden',
                !hasCustomImage && 'border border-border/50'
              )}
              style={{
                background: hasCustomImage 
                  ? `url(${maleta.imagem_capa}) center/cover`
                  : `linear-gradient(135deg, ${corPrimaria}20, ${corSecundaria}20)`
              }}
            >
              {hasCustomImage ? (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white/80" />
                </div>
              ) : (
                <Briefcase 
                  className="w-6 h-6"
                  style={{ color: corPrimaria }}
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate">
                  {maleta.nome || `Maleta #${maleta.id.slice(-4)}`}
                </h3>
                <Badge 
                  variant={maleta.status === 'aberta' ? 'default' : 'secondary'}
                  style={maleta.status === 'aberta' ? {
                    background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                  } : undefined}
                >
                  {maleta.status === 'aberta' ? 'Aberta' : 'Fechada'}
                </Badge>
                {maleta.status === 'aberta' && diasRestantes !== null && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      isVencida && "border-destructive text-destructive",
                      isVencendo && "border-warning text-warning",
                      !isVencida && !isVencendo && "border-success text-success"
                    )}
                  >
                    {isVencida 
                      ? `Vencida há ${Math.abs(diasRestantes)}d` 
                      : `${diasRestantes}d restantes`
                    }
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {items.length} peças • {vendidas} vendidas • {pendentes} pendentes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total vendido</p>
              <p className="font-semibold text-lg">{formatCurrency(totalVendido)}</p>
            </div>
            {maleta.status === 'aberta' && (
              <>
                <ShareMaletaButton
                  maletaId={maleta.id}
                  maletaNome={maleta.nome}
                  isPublic={maleta.is_public || false}
                  sharingSlug={maleta.sharing_slug || null}
                  variant="icon"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </>
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
