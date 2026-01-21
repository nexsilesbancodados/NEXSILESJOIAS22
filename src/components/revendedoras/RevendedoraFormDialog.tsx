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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Revendedora } from '@/hooks/useSupabaseData';

const revendedoraSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  telefone: z.string().max(20).optional(),
  email: z.string().email('Email inválido').max(100).optional().or(z.literal('')),
  comissao: z.string().refine(
    (val) => !val || (parseFloat(val) >= 0 && parseFloat(val) <= 100),
    'Comissão deve ser entre 0 e 100'
  ),
});

interface RevendedoraFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revendedora?: Revendedora | null;
  onSubmit: (data: {
    nome: string;
    telefone: string | null;
    email: string | null;
    comissao: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function RevendedoraFormDialog({
  open,
  onOpenChange,
  revendedora,
  onSubmit,
  isLoading,
}: RevendedoraFormDialogProps) {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    comissao: '30',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (revendedora) {
      setFormData({
        nome: revendedora.nome,
        telefone: revendedora.telefone || '',
        email: revendedora.email || '',
        comissao: (revendedora.comissao || 30).toString(),
      });
    } else {
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        comissao: '30',
      });
    }
    setErrors({});
  }, [revendedora, open]);

  const handleSubmit = async () => {
    const result = revendedoraSchema.safeParse(formData);
    
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
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim() || null,
        email: formData.email.trim() || null,
        comissao: parseFloat(formData.comissao) || 30,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving revendedora:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {revendedora ? 'Editar Revendedora' : 'Nova Revendedora'}
          </DialogTitle>
          <DialogDescription>
            {revendedora
              ? 'Atualize os dados da revendedora'
              : 'Preencha os dados para cadastrar uma nova revendedora'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => {
                setFormData({ ...formData, nome: e.target.value });
                if (errors.nome) setErrors({ ...errors, nome: '' });
              }}
              placeholder="Nome da revendedora"
              className={errors.nome ? 'border-destructive' : ''}
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="email@exemplo.com"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comissao">Comissão (%)</Label>
            <Input
              id="comissao"
              type="number"
              min="0"
              max="100"
              value={formData.comissao}
              onChange={(e) => {
                setFormData({ ...formData, comissao: e.target.value });
                if (errors.comissao) setErrors({ ...errors, comissao: '' });
              }}
              className={errors.comissao ? 'border-destructive' : ''}
            />
            {errors.comissao && (
              <p className="text-sm text-destructive">{errors.comissao}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {revendedora ? 'Salvar' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
