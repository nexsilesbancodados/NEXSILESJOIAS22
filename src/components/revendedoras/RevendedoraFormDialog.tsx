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
import { Loader2, Eye, EyeOff, Copy, ExternalLink } from 'lucide-react';
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
  senha_portal: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(50).optional().or(z.literal('')),
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
    senha_portal?: string | null;
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
    senha_portal: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSenha, setShowSenha] = useState(false);

  useEffect(() => {
    if (revendedora) {
      setFormData({
        nome: revendedora.nome,
        telefone: revendedora.telefone || '',
        email: revendedora.email || '',
        comissao: (revendedora.comissao_percentual || 30).toString(),
        senha_portal: (revendedora as any).senha_portal || '',
      });
    } else {
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        comissao: '30',
        senha_portal: '',
      });
    }
    setErrors({});
    setShowSenha(false);
  }, [revendedora, open]);

  const handleSubmit = async () => {
    // If senha is filled, email is required for portal access
    if (formData.senha_portal.trim() && !formData.email.trim()) {
      setErrors({ email: 'E-mail é obrigatório para acesso ao portal' });
      return;
    }

    const dataToValidate = {
      ...formData,
      senha_portal: formData.senha_portal.trim() ? formData.senha_portal : '',
    };

    const result = revendedoraSchema.safeParse(dataToValidate);
    
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
        senha_portal: formData.senha_portal.trim() || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving revendedora:', error);
    }
  };

  const copyPortalLink = () => {
    if (revendedora?.id) {
      const link = `${window.location.origin}/portal/${revendedora.id}`;
      navigator.clipboard.writeText(link);
      toast.success('Link do portal copiado!');
    }
  };

  const openPortal = () => {
    if (revendedora?.id) {
      window.open(`/portal/${revendedora.id}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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

        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
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

          <div className="grid grid-cols-2 gap-4">
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

          {/* Portal Access Section */}
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Acesso ao Portal</h4>
              {revendedora?.id && formData.email && (revendedora as any).senha_portal && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={copyPortalLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={openPortal}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Defina uma senha para a revendedora acessar o portal usando o e-mail cadastrado acima.
            </p>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="senha_portal">Senha do Portal</Label>
                <div className="relative">
                  <Input
                    id="senha_portal"
                    type={showSenha ? 'text' : 'password'}
                    value={formData.senha_portal}
                    onChange={(e) => {
                      setFormData({ ...formData, senha_portal: e.target.value });
                      if (errors.senha_portal) setErrors({ ...errors, senha_portal: '' });
                    }}
                    placeholder="Mínimo 6 caracteres"
                    className={errors.senha_portal ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSenha(!showSenha)}
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.senha_portal && (
                  <p className="text-sm text-destructive">{errors.senha_portal}</p>
                )}
              </div>
            </div>
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
