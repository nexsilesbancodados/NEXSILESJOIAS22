import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { z } from 'zod';
import type { Maleta } from '@/hooks/useSupabaseData';

const maletaSchema = z.object({
  nome: z.string().max(100).optional(),
  comissao_personalizada: z.string().refine(
    (val) => !val || (parseFloat(val) >= 0 && parseFloat(val) <= 100),
    'Comissão deve ser entre 0 e 100'
  ).optional(),
  prazo_devolucao: z.string().optional(),
  observacoes: z.string().max(500).optional(),
});

interface MaletaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maleta?: Maleta | null;
  onSubmit: (data: {
    nome: string | null;
    comissao_personalizada: number | null;
    prazo_devolucao: string | null;
    observacoes: string | null;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function MaletaFormDialog({
  open,
  onOpenChange,
  maleta,
  onSubmit,
  isLoading,
}: MaletaFormDialogProps) {
  const [formData, setFormData] = useState({
    nome: '',
    comissao_personalizada: '',
    prazo_devolucao: '',
    observacoes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (maleta) {
      setFormData({
        nome: maleta.nome || '',
        comissao_personalizada: (maleta as any).comissao_personalizada?.toString() || '',
        prazo_devolucao: String((maleta as any).prazo_devolucao || ''),
        observacoes: maleta.observacoes || '',
      });
    } else {
      const defaultDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      setFormData({
        nome: '',
        comissao_personalizada: '',
        prazo_devolucao: defaultDate,
        observacoes: '',
      });
    }
    setErrors({});
  }, [maleta, open]);

  const handleSubmit = async () => {
    const result = maletaSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await onSubmit({
        nome: formData.nome.trim() || null,
        comissao_personalizada: formData.comissao_personalizada 
          ? parseFloat(formData.comissao_personalizada) 
          : null,
        prazo_devolucao: formData.prazo_devolucao || null,
        observacoes: formData.observacoes.trim() || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving maleta:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {maleta ? 'Editar Maleta' : 'Nova Maleta'}
          </DialogTitle>
          <DialogDescription>
            {maleta
              ? 'Atualize os dados da maleta'
              : 'Configure a nova maleta para a revendedora'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="maleta-nome">Nome da Maleta (opcional)</Label>
            <Input
              id="maleta-nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Maleta Verão 2024"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maleta-comissao">Comissão Personalizada (%)</Label>
            <Input
              id="maleta-comissao"
              type="number"
              min="0"
              max="100"
              value={formData.comissao_personalizada}
              onChange={(e) => {
                setFormData({ ...formData, comissao_personalizada: e.target.value });
                if (errors.comissao_personalizada) setErrors({ ...errors, comissao_personalizada: '' });
              }}
              placeholder="Deixe em branco para usar a comissão padrão"
              className={errors.comissao_personalizada ? 'border-destructive' : ''}
            />
            {errors.comissao_personalizada && (
              <p className="text-sm text-destructive">{errors.comissao_personalizada}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maleta-prazo">Prazo de Devolução</Label>
            <Input
              id="maleta-prazo"
              type="date"
              value={formData.prazo_devolucao}
              onChange={(e) => setFormData({ ...formData, prazo_devolucao: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maleta-obs">Observações</Label>
            <Textarea
              id="maleta-obs"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Notas sobre esta maleta..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {maleta ? 'Salvar' : 'Criar Maleta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
