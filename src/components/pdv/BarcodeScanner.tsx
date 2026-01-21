import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Scan, Settings, Check, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  onBarcodeScanned: (code: string) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export function BarcodeScanner({ 
  onBarcodeScanned, 
  enabled, 
  onEnabledChange 
}: BarcodeScannerProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [buffer, setBuffer] = useState('');
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanPrefix, setScanPrefix] = useState('');
  const [scanSuffix, setScanSuffix] = useState('');
  const [minLength, setMinLength] = useState(3);
  const [autoAddToCart, setAutoAddToCart] = useState(true);
  const [lastScanTime, setLastScanTime] = useState(0);

  // Handle keyboard input for barcode scanner
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignore if user is typing in an input field (unless it's the search field)
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && !target.classList.contains('barcode-input')) {
      return;
    }

    const now = Date.now();
    
    // If Enter is pressed and buffer has content
    if (e.key === 'Enter' && buffer.length >= minLength) {
      e.preventDefault();
      let code = buffer;
      
      // Remove prefix and suffix if configured
      if (scanPrefix && code.startsWith(scanPrefix)) {
        code = code.slice(scanPrefix.length);
      }
      if (scanSuffix && code.endsWith(scanSuffix)) {
        code = code.slice(0, -scanSuffix.length);
      }
      
      setLastScan(code);
      onBarcodeScanned(code);
      setBuffer('');
      setLastScanTime(now);
      return;
    }

    // Reset buffer if too much time has passed (barcode scanners are fast)
    if (now - lastScanTime > 100 && buffer.length > 0) {
      setBuffer('');
    }

    // Add character to buffer if it's alphanumeric
    if (e.key.length === 1 && /[a-zA-Z0-9-_.]/.test(e.key)) {
      setBuffer(prev => prev + e.key);
      setLastScanTime(now);
    }
  }, [enabled, buffer, minLength, scanPrefix, scanSuffix, lastScanTime, onBarcodeScanned]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={cn(
              "gap-2",
              enabled && "border-success text-success"
            )}
          >
            {enabled ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            Leitor
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Leitor de Código</Label>
                <p className="text-xs text-muted-foreground">
                  {enabled ? 'Conectado e ativo' : 'Desconectado'}
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={onEnabledChange}
              />
            </div>

            {enabled && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {lastScan ? (
                      <>
                        <Check className="w-4 h-4 text-success" />
                        <span>Último: <span className="font-mono">{lastScan}</span></span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Aguardando leitura...</span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsConfigOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Button>
              </>
            )}

            <div className="text-xs text-muted-foreground border-t pt-3">
              <p className="font-medium mb-1">Como usar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Conecte seu leitor USB</li>
                <li>Ative o leitor acima</li>
                <li>Escaneie o código de barras</li>
                <li>O produto será adicionado automaticamente</li>
              </ol>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Configurações do Leitor</DialogTitle>
            <DialogDescription>
              Configure o comportamento do leitor de código de barras
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Adicionar ao carrinho automaticamente</Label>
                <p className="text-xs text-muted-foreground">
                  Adiciona o produto imediatamente após escanear
                </p>
              </div>
              <Switch
                checked={autoAddToCart}
                onCheckedChange={setAutoAddToCart}
              />
            </div>

            <div className="space-y-2">
              <Label>Comprimento mínimo do código</Label>
              <Input
                type="number"
                value={minLength}
                onChange={(e) => setMinLength(parseInt(e.target.value) || 3)}
                min={1}
                max={20}
              />
              <p className="text-xs text-muted-foreground">
                Códigos menores que isso serão ignorados
              </p>
            </div>

            <div className="space-y-2">
              <Label>Prefixo (opcional)</Label>
              <Input
                value={scanPrefix}
                onChange={(e) => setScanPrefix(e.target.value)}
                placeholder="Ex: PROD"
              />
              <p className="text-xs text-muted-foreground">
                Será removido do início do código escaneado
              </p>
            </div>

            <div className="space-y-2">
              <Label>Sufixo (opcional)</Label>
              <Input
                value={scanSuffix}
                onChange={(e) => setScanSuffix(e.target.value)}
                placeholder="Ex: BR"
              />
              <p className="text-xs text-muted-foreground">
                Será removido do final do código escaneado
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Scan className="w-4 h-4" />
                <span className="font-medium text-sm">Testar Leitor</span>
              </div>
              <Input
                className="barcode-input font-mono"
                placeholder="Escaneie um código para testar..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value;
                    if (value.length >= minLength) {
                      setLastScan(value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              {lastScan && (
                <p className="text-xs text-success mt-2">
                  ✓ Código detectado: {lastScan}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsConfigOpen(false)}>
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
