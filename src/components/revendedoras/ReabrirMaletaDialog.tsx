import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Unlock, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ReabrirMaletaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maletaId: string;
  maletaNome: string;
}

export function ReabrirMaletaDialog({ open, onOpenChange, maletaId, maletaNome }: ReabrirMaletaDialogProps) {
  const queryClient = useQueryClient();
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReabrir = async () => {
    if (!motivo.trim()) {
      toast.error('Informe o motivo da reabertura (auditoria)');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc('reabrir_maleta' as any, {
      p_maleta_id: maletaId,
      p_motivo: motivo,
    });
    setSubmitting(false);

    if (error) {
      toast.error('Erro ao reabrir maleta: ' + error.message);
      return;
    }
    toast.success('Maleta reaberta com sucesso. Estoque estornado.');
    queryClient.invalidateQueries({ queryKey: ['maletas'] });
    queryClient.invalidateQueries({ queryKey: ['maleta-items'] });
    queryClient.invalidateQueries({ queryKey: ['pecas'] });
    onOpenChange(false);
    setMotivo('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="w-5 h-5" />
            Reabrir maleta "{maletaNome}"
          </DialogTitle>
          <DialogDescription>
            Esta ação irá estornar todas as devoluções desta maleta e marcá-la como aberta novamente.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="border-amber-500/50 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            As peças que haviam voltado ao estoque serão <strong>devolvidas à maleta</strong> e o estoque será decrementado novamente. A operação ficará registrada no histórico.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>Motivo da reabertura *</Label>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: cliente devolveu peça que tinha sido vendida; correção de conferência incorreta..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleReabrir} disabled={submitting || !motivo.trim()}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
            Reabrir maleta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
