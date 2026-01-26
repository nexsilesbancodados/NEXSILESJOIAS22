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
import { Loader2, Upload, X, Palette } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { z } from 'zod';
import { supabase } from '@/lib/supabase-db';
import { toast } from 'sonner';
import type { Maleta } from '@/hooks/useSupabaseData';

const maletaSchema = z.object({
  nome: z.string().max(100).optional(),
  comissao_personalizada: z.string().refine(
    (val) => !val || (parseFloat(val) >= 0 && parseFloat(val) <= 100),
    'Comissão deve ser entre 0 e 100'
  ).optional(),
  prazo_devolucao: z.string().optional(),
  observacoes: z.string().max(500).optional(),
  cor_primaria: z.string().optional(),
  cor_secundaria: z.string().optional(),
});

const PRESET_COLORS = [
  { name: 'Roxo', primary: '#8B5CF6', secondary: '#EC4899' },
  { name: 'Azul', primary: '#3B82F6', secondary: '#06B6D4' },
  { name: 'Verde', primary: '#10B981', secondary: '#84CC16' },
  { name: 'Laranja', primary: '#F97316', secondary: '#EAB308' },
  { name: 'Rosa', primary: '#EC4899', secondary: '#F43F5E' },
  { name: 'Dourado', primary: '#D4AF37', secondary: '#C0A062' },
];

interface MaletaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maleta?: Maleta | null;
  onSubmit: (data: {
    nome: string | null;
    comissao_personalizada: number | null;
    prazo_devolucao: string | null;
    observacoes: string | null;
    cor_primaria: string | null;
    cor_secundaria: string | null;
    imagem_capa: string | null;
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
    cor_primaria: '#8B5CF6',
    cor_secundaria: '#EC4899',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (maleta) {
      setFormData({
        nome: maleta.nome || '',
        comissao_personalizada: (maleta as any).comissao_personalizada?.toString() || '',
        prazo_devolucao: String((maleta as any).prazo_devolucao || ''),
        observacoes: maleta.observacoes || '',
        cor_primaria: (maleta as any).cor_primaria || '#8B5CF6',
        cor_secundaria: (maleta as any).cor_secundaria || '#EC4899',
      });
      setImagePreview((maleta as any).imagem_capa || null);
    } else {
      const defaultDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      setFormData({
        nome: '',
        comissao_personalizada: '',
        prazo_devolucao: defaultDate,
        observacoes: '',
        cor_primaria: '#8B5CF6',
        cor_secundaria: '#EC4899',
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setErrors({});
    setShowColorPicker(false);
  }, [maleta, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imagePreview; // Keep existing image if no new file

    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `maleta-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('maletas-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('maletas-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

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
      const imageUrl = await uploadImage();

      await onSubmit({
        nome: formData.nome.trim() || null,
        comissao_personalizada: formData.comissao_personalizada 
          ? parseFloat(formData.comissao_personalizada) 
          : null,
        prazo_devolucao: formData.prazo_devolucao || null,
        observacoes: formData.observacoes.trim() || null,
        cor_primaria: formData.cor_primaria,
        cor_secundaria: formData.cor_secundaria,
        imagem_capa: imageUrl,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving maleta:', error);
    }
  };

  const selectPresetColor = (preset: typeof PRESET_COLORS[0]) => {
    setFormData({
      ...formData,
      cor_primaria: preset.primary,
      cor_secundaria: preset.secondary,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {maleta ? 'Editar Maleta' : 'Nova Maleta'}
          </DialogTitle>
          <DialogDescription>
            {maleta
              ? 'Atualize os dados e personalização da maleta'
              : 'Configure a nova maleta para a revendedora'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Preview da personalização */}
          <div 
            className="relative h-24 rounded-lg overflow-hidden flex items-center justify-center"
            style={{
              background: imagePreview 
                ? `url(${imagePreview}) center/cover`
                : `linear-gradient(135deg, ${formData.cor_primaria}, ${formData.cor_secundaria})`
            }}
          >
            <div className="absolute inset-0 bg-black/20" />
            <span className="relative text-white font-semibold text-lg drop-shadow-lg">
              {formData.nome || 'Preview da Maleta'}
            </span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maleta-nome">Nome da Maleta</Label>
            <Input
              id="maleta-nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Maleta Verão 2024"
            />
          </div>

          {/* Upload de imagem */}
          <div className="grid gap-2">
            <Label>Imagem de Capa (opcional)</Label>
            {imagePreview ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">Clique para enviar</span>
                <span className="text-xs text-muted-foreground">PNG, JPG até 5MB</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* Cores */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Cores do Tema</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                <Palette className="w-4 h-4 mr-1" />
                {showColorPicker ? 'Ocultar' : 'Personalizar'}
              </Button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => selectPresetColor(preset)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    formData.cor_primaria === preset.primary 
                      ? 'border-foreground scale-110' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                  }}
                  title={preset.name}
                />
              ))}
            </div>

            {showColorPicker && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="grid gap-1">
                  <Label className="text-xs">Cor Primária</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.cor_primaria}
                      onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                      className="w-10 h-9 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.cor_primaria}
                      onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                      className="h-9 text-xs font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.cor_secundaria}
                      onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                      className="w-10 h-9 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.cor_secundaria}
                      onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                      className="h-9 text-xs font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            )}
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
          <Button onClick={handleSubmit} disabled={isLoading || isUploading}>
            {(isLoading || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {maleta ? 'Salvar' : 'Criar Maleta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}