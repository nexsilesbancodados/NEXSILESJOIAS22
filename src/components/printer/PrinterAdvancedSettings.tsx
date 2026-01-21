import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, RotateCcw, Save, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface PrinterAdvancedConfig {
  chunkSize: number;        // Bytes per packet (default: 20)
  chunkDelay: number;       // Delay between packets in ms (default: 50)
  density: number;          // Print density 0-15 (default: 8)
  paperWidth: 58 | 80;      // Paper width in mm
  baudRate: number;         // Serial baud rate
  feedBeforeCut: number;    // Lines to feed before cut
}

const DEFAULT_CONFIG: PrinterAdvancedConfig = {
  chunkSize: 20,
  chunkDelay: 50,
  density: 8,
  paperWidth: 58,
  baudRate: 9600,
  feedBeforeCut: 4,
};

const STORAGE_KEY = 'printerAdvancedConfig';

interface Props {
  onConfigChange?: (config: PrinterAdvancedConfig) => void;
}

export function PrinterAdvancedSettings({ onConfigChange }: Props) {
  const [config, setConfig] = useState<PrinterAdvancedConfig>(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch (e) {
      console.error('Error loading printer config:', e);
    }
  }, []);

  // Notify parent of config changes
  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const updateConfig = <K extends keyof PrinterAdvancedConfig>(
    key: K,
    value: PrinterAdvancedConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveConfig = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setHasChanges(false);
      toast.success('Configurações salvas com sucesso');
    } catch (e) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
    toast.info('Configurações restauradas para padrão');
  };

  const InfoTooltip = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px]">
          <p className="text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <CardTitle className="font-display text-base">Configurações Avançadas</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Padrão
            </Button>
            <Button
              size="sm"
              onClick={saveConfig}
              disabled={!hasChanges}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Ajuste fino para otimizar a comunicação com sua impressora
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Paper Width */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Largura do Papel</Label>
            <InfoTooltip content="Selecione a largura do papel da sua impressora. 58mm é comum em impressoras portáteis, 80mm em impressoras de mesa." />
          </div>
          <Select
            value={String(config.paperWidth)}
            onValueChange={(v) => updateConfig('paperWidth', Number(v) as 58 | 80)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="58">58mm (32 caracteres)</SelectItem>
              <SelectItem value="80">80mm (48 caracteres)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Print Density */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Densidade de Impressão</Label>
              <InfoTooltip content="Controla a quantidade de tinta/calor aplicada. Valores mais altos produzem impressões mais escuras, mas podem reduzir a vida útil da cabeça de impressão." />
            </div>
            <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
              {config.density}
            </span>
          </div>
          <Slider
            value={[config.density]}
            onValueChange={([v]) => updateConfig('density', v)}
            min={0}
            max={15}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Claro (0)</span>
            <span>Padrão (8)</span>
            <span>Escuro (15)</span>
          </div>
        </div>

        {/* Chunk Size */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Tamanho do Pacote (bytes)</Label>
              <InfoTooltip content="Quantidade de bytes enviados por pacote Bluetooth. O padrão de 20 bytes é compatível com a maioria das impressoras BLE. Aumente para impressões mais rápidas ou diminua se houver erros." />
            </div>
            <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
              {config.chunkSize}
            </span>
          </div>
          <Slider
            value={[config.chunkSize]}
            onValueChange={([v]) => updateConfig('chunkSize', v)}
            min={10}
            max={512}
            step={2}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>10</span>
            <span>Padrão (20)</span>
            <span>512</span>
          </div>
        </div>

        {/* Chunk Delay */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Delay entre Pacotes (ms)</Label>
              <InfoTooltip content="Tempo de espera entre envio de pacotes. Aumente se a impressora estiver perdendo dados ou imprimindo incorretamente. Diminua para impressões mais rápidas." />
            </div>
            <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
              {config.chunkDelay}ms
            </span>
          </div>
          <Slider
            value={[config.chunkDelay]}
            onValueChange={([v]) => updateConfig('chunkDelay', v)}
            min={10}
            max={200}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Rápido (10ms)</span>
            <span>Padrão (50ms)</span>
            <span>Lento (200ms)</span>
          </div>
        </div>

        {/* Baud Rate (Serial only) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Baud Rate (Serial)</Label>
            <InfoTooltip content="Taxa de comunicação para conexões via cabo serial. Consulte o manual da sua impressora para o valor correto." />
          </div>
          <Select
            value={String(config.baudRate)}
            onValueChange={(v) => updateConfig('baudRate', Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4800">4800 bps</SelectItem>
              <SelectItem value="9600">9600 bps (padrão)</SelectItem>
              <SelectItem value="19200">19200 bps</SelectItem>
              <SelectItem value="38400">38400 bps</SelectItem>
              <SelectItem value="57600">57600 bps</SelectItem>
              <SelectItem value="115200">115200 bps</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Feed Before Cut */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Linhas antes do Corte</Label>
              <InfoTooltip content="Quantidade de linhas em branco antes do corte automático. Ajuste para que o texto não fique cortado." />
            </div>
            <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
              {config.feedBeforeCut}
            </span>
          </div>
          <Slider
            value={[config.feedBeforeCut]}
            onValueChange={([v]) => updateConfig('feedBeforeCut', v)}
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>Dica:</strong> Se a impressora estiver falhando ou imprimindo caracteres estranhos, 
            tente reduzir o tamanho do pacote para 20 bytes e aumentar o delay para 100ms.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Export function to get current config
export function getPrinterAdvancedConfig(): PrinterAdvancedConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading printer config:', e);
  }
  return DEFAULT_CONFIG;
}

export { DEFAULT_CONFIG as DEFAULT_PRINTER_CONFIG };
