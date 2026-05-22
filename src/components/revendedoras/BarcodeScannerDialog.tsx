import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Camera, Keyboard } from 'lucide-react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { toast } from 'sonner';

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDetect: (code: string) => void;
}

export function BarcodeScannerDialog({ open, onOpenChange, onDetect }: BarcodeScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [starting, setStarting] = useState(false);
  const [manual, setManual] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      setCameraError(null);
      return;
    }

    const start = async () => {
      try {
        setStarting(true);
        const reader = new BrowserMultiFormatReader();
        if (!videoRef.current) return;
        controlsRef.current = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result) {
              const code = result.getText();
              controlsRef.current?.stop();
              onDetect(code);
              onOpenChange(false);
            }
          }
        );
      } catch (err) {
        const msg = (err as Error)?.message || 'Não foi possível acessar a câmera';
        setCameraError(msg);
      } finally {
        setStarting(false);
      }
    };
    start();

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onDetect, onOpenChange]);

  const submitManual = () => {
    const code = manual.trim();
    if (!code) {
      toast.error('Digite um código');
      return;
    }
    onDetect(code);
    setManual('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" /> Leitor de código
          </DialogTitle>
          <DialogDescription>
            Aponte a câmera para o código de barras ou digite manualmente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {starting && (
              <div className="absolute inset-0 grid place-items-center text-white">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 grid place-items-center p-4 text-center text-white text-xs bg-black/70">
                {cameraError}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <Keyboard className="w-3.5 h-3.5" /> Ou digite o código
            </label>
            <div className="flex gap-2">
              <Input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitManual()}
                placeholder="Código da peça ou código de barras"
                autoFocus
              />
              <Button onClick={submitManual}>Confirmar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
