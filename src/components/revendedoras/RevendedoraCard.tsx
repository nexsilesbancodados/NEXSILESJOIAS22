import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Phone, 
  Mail, 
  Briefcase, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  Copy,
} from 'lucide-react';
import { useMaletas, type Revendedora } from '@/hooks/useSupabaseData';

interface RevendedoraCardProps {
  revendedora: Revendedora;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
}

export function RevendedoraCard({
  revendedora,
  onView,
  onEdit,
  onDelete,
  onCopyLink,
}: RevendedoraCardProps) {
  const { data: maletas = [] } = useMaletas(revendedora.id);

  const maletasAbertas = maletas.filter((m) => m.status === 'aberta').length;

  return (
    <Card
      className="glass-card hover-lift cursor-pointer"
      onClick={onView}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center text-lg font-semibold text-primary-foreground">
              {revendedora.nome.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold">{revendedora.nome}</h3>
              <p className="text-sm text-muted-foreground">
                {revendedora.comissao_percentual || 30}% comissão
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyLink();
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link do Portal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4" />
            {revendedora.telefone || 'Não informado'}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            {revendedora.email || 'Não informado'}
          </div>
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{maletasAbertas}</span> abertas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{maletas.length}</span> maletas
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
