import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bluetooth, 
  Usb, 
  Cable, 
  Printer, 
  Check, 
  X, 
  Loader2,
  RefreshCw,
  Zap,
  AlertCircle,
  Info,
  History
} from 'lucide-react';
import { usePrinter, PrinterDevice } from '@/hooks/usePrinter';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const CONNECTION_TYPES = [
  { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth, color: 'text-blue-500' },
  { id: 'usb', label: 'USB', icon: Usb, color: 'text-green-500' },
  { id: 'serial', label: 'Cabo Serial', icon: Cable, color: 'text-orange-500' },
] as const;

export function PrinterSettings() {
  const {
    status,
    connectedPrinter,
    availableDevices,
    errorMessage,
    isBluetoothSupported,
    isUSBSupported,
    isSerialSupported,
    isReconnecting,
    scanBluetooth,
    scanUSB,
    scanSerial,
    connect,
    disconnect,
    testPrint,
    listUSBDevices,
    listSerialPorts,
    attemptUSBReconnection,
    attemptSerialReconnection,
    getSavedUSBDevice,
    getSavedSerialPort,
    clearAllSavedDevices,
  } = usePrinter();

  const [scanning, setScanning] = useState<string | null>(null);
  const [previousDevices, setPreviousDevices] = useState<PrinterDevice[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(true);

  // Load previously authorized devices on mount
  useEffect(() => {
    const loadPreviousDevices = async () => {
      setLoadingPrevious(true);
      const devices: PrinterDevice[] = [];
      
      const [usbDevices, serialPorts] = await Promise.all([
        listUSBDevices(),
        listSerialPorts(),
      ]);
      
      devices.push(...usbDevices, ...serialPorts);
      setPreviousDevices(devices);
      setLoadingPrevious(false);
    };
    
    loadPreviousDevices();
  }, [listUSBDevices, listSerialPorts]);

  const handleScan = async (type: 'bluetooth' | 'usb' | 'serial') => {
    setScanning(type);
    try {
      let device: PrinterDevice | undefined;
      
      switch (type) {
        case 'bluetooth':
          device = await scanBluetooth();
          break;
        case 'usb':
          device = await scanUSB();
          break;
        case 'serial':
          device = await scanSerial();
          break;
      }

      if (device) {
        // Auto-connect after scan
        await connect(device);
      }
    } finally {
      setScanning(null);
    }
  };

  const handleQuickReconnect = async (type: 'usb' | 'serial') => {
    setScanning(type);
    try {
      let success = false;
      if (type === 'usb') {
        success = await attemptUSBReconnection();
      } else if (type === 'serial') {
        success = await attemptSerialReconnection();
      }
      
      if (!success) {
        toast.info('Dispositivo não encontrado. Selecione novamente.');
        await handleScan(type);
      }
    } finally {
      setScanning(null);
    }
  };

  const handleTestPrint = async () => {
    try {
      await testPrint();
    } catch (error) {
      console.error('Test print failed:', error);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Conectada</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
          {isReconnecting ? 'Reconectando...' : 'Conectando...'}
        </Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconectada</Badge>;
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'bluetooth':
        return <Bluetooth className="w-4 h-4 text-blue-500" />;
      case 'usb':
        return <Usb className="w-4 h-4 text-green-500" />;
      case 'serial':
        return <Cable className="w-4 h-4 text-orange-500" />;
      default:
        return <Printer className="w-4 h-4" />;
    }
  };

  const getDeviceDetails = (device: PrinterDevice) => {
    const details: string[] = [];
    if (device.type === 'usb' && device.vendorId) {
      details.push(`VID: ${device.vendorId.toString(16).toUpperCase()}`);
      if (device.productId) details.push(`PID: ${device.productId.toString(16).toUpperCase()}`);
    }
    if (device.type === 'serial' && device.detectedBaudRate) {
      details.push(`${device.detectedBaudRate} baud`);
    }
    return details.join(' | ');
  };

  const savedUSBDevice = getSavedUSBDevice();
  const savedSerialPort = getSavedSerialPort();
  const hasQuickReconnect = savedUSBDevice || savedSerialPort;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            <CardTitle className="font-display">Impressora Térmica</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Conecte sua impressora térmica via Bluetooth, USB ou cabo Serial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        {connectedPrinter && status === 'connected' && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getConnectionIcon(connectedPrinter.type)}
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {connectedPrinter.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{connectedPrinter.type}</span>
                    {getDeviceDetails(connectedPrinter) && (
                      <>
                        <span>•</span>
                        <span>{getDeviceDetails(connectedPrinter)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleTestPrint}
                  className="gap-2"
                >
                  <Zap className="w-3 h-3" />
                  Testar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={disconnect}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                  Desconectar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {status === 'error' && errorMessage && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Quick Reconnect Section */}
        {hasQuickReconnect && status !== 'connected' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <History className="w-4 h-4 text-muted-foreground" />
              <span>Reconexão Rápida</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {savedUSBDevice && (
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => handleQuickReconnect('usb')}
                  disabled={scanning !== null}
                >
                  {scanning === 'usb' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Usb className="w-4 h-4 text-green-500" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium">{savedUSBDevice.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      VID: {savedUSBDevice.vendorId?.toString(16).toUpperCase()}
                    </p>
                  </div>
                </Button>
              )}
              {savedSerialPort && (
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => handleQuickReconnect('serial')}
                  disabled={scanning !== null}
                >
                  {scanning === 'serial' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cable className="w-4 h-4 text-orange-500" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium">{savedSerialPort.name}</p>
                    {savedSerialPort.detectedBaudRate && (
                      <p className="text-[10px] text-muted-foreground">
                        {savedSerialPort.detectedBaudRate} baud
                      </p>
                    )}
                  </div>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Connection Options */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Nova Conexão</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CONNECTION_TYPES.map(({ id, label, icon: Icon, color }) => {
              const isSupported = 
                (id === 'bluetooth' && isBluetoothSupported) ||
                (id === 'usb' && isUSBSupported) ||
                (id === 'serial' && isSerialSupported);
              
              const isScanning = scanning === id;
              const isConnected = connectedPrinter?.type === id && status === 'connected';

              return (
                <TooltipProvider key={id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isConnected ? 'default' : 'outline'}
                        className={cn(
                          'h-auto py-4 flex flex-col items-center gap-2 relative',
                          isConnected && 'bg-primary/10 border-primary',
                          !isSupported && 'opacity-50 cursor-not-allowed'
                        )}
                        onClick={() => handleScan(id)}
                        disabled={!isSupported || isScanning || status === 'connecting'}
                      >
                        {isScanning ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Icon className={cn('w-6 h-6', color)} />
                        )}
                        <span className="text-sm">{label}</span>
                        {!isSupported && (
                          <span className="text-[10px] text-muted-foreground absolute bottom-1">
                            Não suportado
                          </span>
                        )}
                        {isConnected && (
                          <Check className="w-4 h-4 absolute top-2 right-2 text-green-500" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    {!isSupported && (
                      <TooltipContent>
                        <p>Este navegador não suporta {label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Previously Authorized Devices */}
        {previousDevices.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Dispositivos Autorizados</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={async () => {
                  const [usb, serial] = await Promise.all([
                    listUSBDevices(),
                    listSerialPorts(),
                  ]);
                  setPreviousDevices([...usb, ...serial]);
                }}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Atualizar
              </Button>
            </div>
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {previousDevices.map((device) => (
                  <div
                    key={device.id}
                    className={cn(
                      'p-3 rounded-lg border flex items-center justify-between',
                      connectedPrinter?.id === device.id && status === 'connected'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {getConnectionIcon(device.type)}
                      <div>
                        <p className="text-sm font-medium">{device.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{device.type}</span>
                          {getDeviceDetails(device) && (
                            <>
                              <span>•</span>
                              <span>{getDeviceDetails(device)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {connectedPrinter?.id === device.id && status === 'connected' ? (
                      <Badge variant="outline" className="text-green-600 border-green-500/30">
                        <Check className="w-3 h-3 mr-1" />
                        Conectada
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => connect(device)}
                        disabled={status === 'connecting'}
                      >
                        Conectar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Available Devices (from current scan) */}
        {availableDevices.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Dispositivos Encontrados</p>
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {availableDevices.map((device) => (
                  <div
                    key={device.id}
                    className={cn(
                      'p-3 rounded-lg border flex items-center justify-between',
                      connectedPrinter?.id === device.id && status === 'connected'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {getConnectionIcon(device.type)}
                      <div>
                        <p className="text-sm font-medium">{device.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{device.type}</span>
                          {getDeviceDetails(device) && (
                            <>
                              <span>•</span>
                              <span>{getDeviceDetails(device)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {connectedPrinter?.id === device.id && status === 'connected' ? (
                      <Badge variant="outline" className="text-green-600 border-green-500/30">
                        <Check className="w-3 h-3 mr-1" />
                        Conectada
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => connect(device)}
                        disabled={status === 'connecting'}
                      >
                        Conectar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Help Text */}
        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            Como conectar:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6">
            <li>• <strong>Bluetooth:</strong> Ligue a impressora e ative o Bluetooth. Clique em "Bluetooth" e selecione sua impressora.</li>
            <li>• <strong>USB:</strong> Conecte o cabo USB. Clique em "USB" e selecione o dispositivo. Reconexão automática disponível.</li>
            <li>• <strong>Cabo Serial:</strong> Conecte o cabo RS232. O sistema detecta automaticamente a taxa de baud.</li>
          </ul>
          <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-3">
            <p className="text-xs text-muted-foreground">
              Funciona melhor no Chrome/Edge.
            </p>
            {hasQuickReconnect && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs text-muted-foreground"
                onClick={clearAllSavedDevices}
              >
                Limpar histórico
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
