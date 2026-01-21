import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import '@/types/web-apis.d.ts';
import { ESCPOSEncoder, PrintTemplates } from '@/lib/escpos-encoder';
import { getPrinterAdvancedConfig, PrinterAdvancedConfig } from '@/components/printer/PrinterAdvancedSettings';

export type PrinterConnectionType = 'bluetooth' | 'usb' | 'serial' | 'none';
export type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface PrinterDevice {
  id: string;
  name: string;
  type: PrinterConnectionType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  device?: any; // BluetoothDevice | USBDevice | SerialPort
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  characteristic?: any; // BluetoothRemoteGATTCharacteristic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server?: any; // BluetoothRemoteGATTServer - keep reference for reconnection
  // USB-specific info
  vendorId?: number;
  productId?: number;
  // Serial-specific info
  detectedBaudRate?: number;
}

interface PrinterState {
  status: PrinterStatus;
  connectedPrinter: PrinterDevice | null;
  availableDevices: PrinterDevice[];
  errorMessage: string | null;
}

// Common Bluetooth UUIDs for thermal printers
const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

// Alternative UUIDs (some printers use these)
const ALT_SERVICE_UUIDS = [
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Nordic UART
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic printer service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 module
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service
  '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile
];

// Alternative Characteristic UUIDs
const ALT_CHARACTERISTIC_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3', // Microchip TX
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb', // HM-10 TX
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART TX
  '6e400003-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART RX
];

// USB Endpoint
const USB_ENDPOINT = 1;

// Common baud rates for thermal printers (most common first)
const COMMON_BAUD_RATES = [9600, 115200, 38400, 19200, 57600];

// Get dynamic config from advanced settings
const getConfig = (): PrinterAdvancedConfig => getPrinterAdvancedConfig();

// Error message mapping for better UX
const ERROR_MESSAGES: Record<string, string> = {
  'NetworkError': 'Erro de rede. Verifique a conexão com a impressora.',
  'NotFoundError': 'Dispositivo não encontrado.',
  'SecurityError': 'Permissão negada. Autorize o acesso ao dispositivo.',
  'AbortError': 'Operação cancelada pelo usuário.',
  'InvalidStateError': 'Estado inválido. Tente reconectar.',
  'NotSupportedError': 'Operação não suportada por este dispositivo.',
  'BreakError': 'Erro de comunicação serial. Verifique o cabo.',
  'FramingError': 'Erro de enquadramento. Verifique a taxa de baud.',
  'ParityError': 'Erro de paridade. Verifique as configurações.',
  'BufferOverrunError': 'Buffer cheio. Reduza a velocidade de transmissão.',
};

// Map error to friendly message
const getErrorMessage = (error: any): string => {
  const errorName = error?.name || '';
  const errorMessage = error?.message || 'Erro desconhecido';
  
  if (ERROR_MESSAGES[errorName]) {
    return ERROR_MESSAGES[errorName];
  }
  
  // Check for common error patterns
  if (errorMessage.includes('device is busy')) {
    return 'Dispositivo ocupado. Feche outros programas que possam estar usando a impressora.';
  }
  if (errorMessage.includes('device was disconnected')) {
    return 'Dispositivo desconectado. Reconecte a impressora.';
  }
  if (errorMessage.includes('transfer failed')) {
    return 'Falha na transferência. Verifique a conexão USB.';
  }
  
  return errorMessage;
};

export function usePrinter() {
  const [state, setState] = useState<PrinterState>({
    status: 'disconnected',
    connectedPrinter: null,
    availableDevices: [],
    errorMessage: null,
  });
  
  // Reconnection state
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectionAttempted, setReconnectionAttempted] = useState(false);

  const writerRef = useRef<WritableStreamDefaultWriter | null>(null);
  const characteristicRef = useRef<any>(null);

  // Check browser support
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = typeof navigator !== 'undefined' ? navigator as any : null;
  const isBluetoothSupported = nav && 'bluetooth' in nav;
  const isUSBSupported = nav && 'usb' in nav;
  const isSerialSupported = nav && 'serial' in nav;

  // Get saved printer info from localStorage
  const getSavedPrinter = useCallback(() => {
    try {
      const savedPrinter = localStorage.getItem('connectedPrinter');
      if (savedPrinter) {
        return JSON.parse(savedPrinter);
      }
    } catch (e) {
      console.error('Error loading saved printer:', e);
    }
    return null;
  }, []);

  // Load saved printer info on mount (display only, no auto-connect yet)
  useEffect(() => {
    const savedPrinter = getSavedPrinter();
    if (savedPrinter) {
      setState(prev => ({
        ...prev,
        connectedPrinter: { ...savedPrinter, device: undefined },
      }));
    }
  }, [getSavedPrinter]);

  // Scan for Bluetooth devices
  const scanBluetooth = useCallback(async () => {
    if (!isBluetoothSupported || !nav?.bluetooth) {
      toast.error('Bluetooth não é suportado neste navegador');
      return;
    }

    setState(prev => ({ ...prev, status: 'connecting', errorMessage: null }));

    try {
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [PRINTER_SERVICE_UUID, ...ALT_SERVICE_UUIDS],
      });

      if (device) {
        const newDevice: PrinterDevice = {
          id: device.id,
          name: device.name || 'Impressora Bluetooth',
          type: 'bluetooth',
          device,
        };

        setState(prev => ({
          ...prev,
          availableDevices: [...prev.availableDevices.filter(d => d.id !== device.id), newDevice],
          status: 'disconnected',
        }));

        return newDevice;
      }
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        toast.info('Nenhum dispositivo selecionado');
      } else {
        toast.error('Erro ao buscar dispositivos Bluetooth');
        console.error('Bluetooth scan error:', error);
      }
      setState(prev => ({ ...prev, status: 'disconnected' }));
    }
  }, [isBluetoothSupported, nav]);

  // List previously authorized USB devices
  const listUSBDevices = useCallback(async (): Promise<PrinterDevice[]> => {
    if (!isUSBSupported || !nav?.usb) {
      return [];
    }

    try {
      const devices = await nav.usb.getDevices();
      return devices.map((device: any) => ({
        id: device.serialNumber || `usb-${device.vendorId}-${device.productId}`,
        name: device.productName || `Impressora USB (${device.vendorId?.toString(16)})`,
        type: 'usb' as PrinterConnectionType,
        device,
        vendorId: device.vendorId,
        productId: device.productId,
      }));
    } catch (error) {
      console.error('Error listing USB devices:', error);
      return [];
    }
  }, [isUSBSupported, nav]);

  // List previously authorized Serial ports
  const listSerialPorts = useCallback(async (): Promise<PrinterDevice[]> => {
    if (!isSerialSupported || !nav?.serial) {
      return [];
    }

    try {
      const ports = await nav.serial.getPorts();
      return ports.map((port: any, index: number) => {
        const info = port.getInfo();
        return {
          id: `serial-${info.usbVendorId || 'unknown'}-${info.usbProductId || index}`,
          name: `Porta Serial ${index + 1} (${info.usbVendorId?.toString(16) || 'COM'})`,
          type: 'serial' as PrinterConnectionType,
          device: port,
          vendorId: info.usbVendorId,
          productId: info.usbProductId,
        };
      });
    } catch (error) {
      console.error('Error listing serial ports:', error);
      return [];
    }
  }, [isSerialSupported, nav]);

  // Auto-detect baud rate for serial connection
  const detectBaudRate = useCallback(async (port: any): Promise<number | null> => {
    const config = getConfig();
    
    for (const baudRate of COMMON_BAUD_RATES) {
      try {
        // Try to open with this baud rate
        await port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none' });
        
        // Send ESC/POS status command (DLE EOT n)
        const writer = port.writable?.getWriter();
        if (writer) {
          // DLE EOT 1 - Request printer status
          const statusCmd = new Uint8Array([0x10, 0x04, 0x01]);
          await writer.write(statusCmd);
          writer.releaseLock();
        }
        
        // Try to read response with timeout
        const reader = port.readable?.getReader();
        if (reader) {
          const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 500));
          const readPromise = reader.read().then((result: any) => result.value);
          
          const response = await Promise.race([readPromise, timeout]);
          reader.releaseLock();
          
          // Close and check if we got a response
          await port.close();
          
          if (response && response.length > 0) {
            console.log(`Baud rate ${baudRate} detected successfully`);
            return baudRate;
          }
        }
        
        await port.close();
      } catch (error) {
        // Try to close if open
        try { await port.close(); } catch {}
        continue;
      }
    }
    
    // Fallback to configured baud rate
    console.log(`No response detected, using configured baud rate: ${config.baudRate}`);
    return config.baudRate;
  }, []);

  // Scan for USB devices
  const scanUSB = useCallback(async () => {
    if (!isUSBSupported || !nav?.usb) {
      toast.error('USB não é suportado neste navegador');
      return;
    }

    setState(prev => ({ ...prev, status: 'connecting', errorMessage: null }));

    try {
      const device = await nav.usb.requestDevice({
        filters: [],
      });

      if (device) {
        const newDevice: PrinterDevice = {
          id: device.serialNumber || `usb-${device.vendorId}-${device.productId}`,
          name: device.productName || 'Impressora USB',
          type: 'usb',
          device,
          vendorId: device.vendorId,
          productId: device.productId,
        };

        setState(prev => ({
          ...prev,
          availableDevices: [...prev.availableDevices.filter(d => d.id !== newDevice.id), newDevice],
          status: 'disconnected',
        }));

        // Save USB device info for quick reconnection
        localStorage.setItem('lastUSBDevice', JSON.stringify({
          id: newDevice.id,
          name: newDevice.name,
          vendorId: device.vendorId,
          productId: device.productId,
        }));

        return newDevice;
      }
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        toast.info('Nenhum dispositivo selecionado');
      } else {
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg);
        console.error('USB scan error:', error);
      }
      setState(prev => ({ ...prev, status: 'disconnected' }));
    }
  }, [isUSBSupported, nav]);

  // Scan for Serial devices
  const scanSerial = useCallback(async () => {
    if (!isSerialSupported || !nav?.serial) {
      toast.error('Porta Serial não é suportada neste navegador');
      return;
    }

    setState(prev => ({ ...prev, status: 'connecting', errorMessage: null }));

    try {
      const port = await nav.serial.requestPort();

      if (port) {
        const info = port.getInfo();
        const newDevice: PrinterDevice = {
          id: `serial-${info.usbVendorId || 'unknown'}-${info.usbProductId || 'unknown'}`,
          name: `Impressora Serial (${info.usbVendorId?.toString(16) || 'Porta'})`,
          type: 'serial',
          device: port as any,
          vendorId: info.usbVendorId,
          productId: info.usbProductId,
        };

        setState(prev => ({
          ...prev,
          availableDevices: [...prev.availableDevices.filter(d => d.id !== newDevice.id), newDevice],
          status: 'disconnected',
        }));

        // Save serial port info
        localStorage.setItem('lastSerialPort', JSON.stringify({
          id: newDevice.id,
          name: newDevice.name,
          vendorId: info.usbVendorId,
          productId: info.usbProductId,
        }));

        return newDevice;
      }
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        toast.info('Nenhuma porta selecionada');
      } else {
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg);
        console.error('Serial scan error:', error);
      }
      setState(prev => ({ ...prev, status: 'disconnected' }));
    }
  }, [isSerialSupported, nav]);

  // Find writable characteristic
  const findWritableCharacteristic = async (service: any): Promise<any> => {
    // Try known characteristic UUIDs first
    const allUUIDs = [PRINTER_CHARACTERISTIC_UUID, ...ALT_CHARACTERISTIC_UUIDS];
    
    for (const uuid of allUUIDs) {
      try {
        const char = await service.getCharacteristic(uuid);
        if (char) {
          console.log('Found characteristic by UUID:', uuid);
          return char;
        }
      } catch {
        continue;
      }
    }

    // Enumerate all characteristics and find a writable one
    try {
      const characteristics = await service.getCharacteristics();
      console.log('Available characteristics:', characteristics.length);
      
      for (const char of characteristics) {
        const props = char.properties;
        console.log('Characteristic:', char.uuid, {
          write: props?.write,
          writeWithoutResponse: props?.writeWithoutResponse,
          notify: props?.notify,
        });
        
        if (props?.write || props?.writeWithoutResponse) {
          console.log('Found writable characteristic:', char.uuid);
          return char;
        }
      }
    } catch (e) {
      console.warn('Could not enumerate characteristics:', e);
    }

    return null;
  };

  // Connect to a device
  const connect = useCallback(async (device: PrinterDevice) => {
    setState(prev => ({ ...prev, status: 'connecting', errorMessage: null }));

    try {
      if (device.type === 'bluetooth' && device.device) {
        const btDevice = device.device;
        
        // Connect to GATT server
        console.log('Connecting to GATT server...');
        const server = await btDevice.gatt?.connect();
        
        if (!server) {
          throw new Error('Não foi possível conectar ao servidor GATT');
        }
        
        console.log('GATT server connected');

        // Find printer service
        let service = null;
        const allServiceUUIDs = [PRINTER_SERVICE_UUID, ...ALT_SERVICE_UUIDS];
        
        for (const uuid of allServiceUUIDs) {
          try {
            service = await server.getPrimaryService(uuid);
            console.log('Found service:', uuid);
            break;
          } catch {
            continue;
          }
        }

        // If no known service found, try to get all services
        if (!service) {
          try {
            const services = await server.getPrimaryServices();
            console.log('Available services:', services.map((s: any) => s.uuid));
            
            for (const svc of services) {
              const char = await findWritableCharacteristic(svc);
              if (char) {
                service = svc;
                break;
              }
            }
          } catch (e) {
            console.warn('Could not enumerate services:', e);
          }
        }

        if (!service) {
          throw new Error('Serviço de impressão não encontrado. Verifique se a impressora suporta Bluetooth.');
        }

        // Find writable characteristic
        const characteristic = await findWritableCharacteristic(service);

        if (!characteristic) {
          throw new Error('Característica de escrita não encontrada na impressora.');
        }

        // Store reference for later use
        characteristicRef.current = characteristic;
        device.characteristic = characteristic;
        device.server = server;

        setState(prev => ({
          ...prev,
          status: 'connected',
          connectedPrinter: device,
        }));

        localStorage.setItem('connectedPrinter', JSON.stringify({
          id: device.id,
          name: device.name,
          type: device.type,
        }));

        toast.success(`Conectado a ${device.name}`);
      } else if (device.type === 'usb' && device.device) {
        const usbDevice = device.device;
        await usbDevice.open();
        
        if (usbDevice.configuration === null) {
          await usbDevice.selectConfiguration(1);
        }
        
        await usbDevice.claimInterface(0);

        // Store extended info
        device.vendorId = usbDevice.vendorId;
        device.productId = usbDevice.productId;

        setState(prev => ({
          ...prev,
          status: 'connected',
          connectedPrinter: device,
        }));

        localStorage.setItem('connectedPrinter', JSON.stringify({
          id: device.id,
          name: device.name,
          type: device.type,
          vendorId: usbDevice.vendorId,
          productId: usbDevice.productId,
        }));

        toast.success(`Conectado a ${device.name}`);
      } else if (device.type === 'serial' && device.device) {
        const port = device.device;
        const config = getConfig();
        
        // Use detected or configured baud rate
        const baudRate = device.detectedBaudRate || config.baudRate;
        await port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none' });
        
        const writer = port.writable?.getWriter();
        if (writer) {
          writerRef.current = writer;
        }

        // Store detected baud rate
        device.detectedBaudRate = baudRate;

        setState(prev => ({
          ...prev,
          status: 'connected',
          connectedPrinter: device,
        }));

        localStorage.setItem('connectedPrinter', JSON.stringify({
          id: device.id,
          name: device.name,
          type: device.type,
          vendorId: device.vendorId,
          productId: device.productId,
          detectedBaudRate: baudRate,
        }));

        toast.success(`Conectado a ${device.name} (${baudRate} baud)`);
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      const errorMsg = getErrorMessage(error);
      setState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: errorMsg,
      }));
      toast.error(`Erro ao conectar: ${errorMsg}`);
    }
  }, []);

  // Disconnect from device
  const disconnect = useCallback(async () => {
    const { connectedPrinter } = state;

    if (!connectedPrinter) return;

    try {
      if (connectedPrinter.type === 'bluetooth' && connectedPrinter.device) {
        const btDevice = connectedPrinter.device;
        btDevice.gatt?.disconnect();
        characteristicRef.current = null;
      } else if (connectedPrinter.type === 'usb' && connectedPrinter.device) {
        const usbDevice = connectedPrinter.device;
        await usbDevice.close();
      } else if (connectedPrinter.type === 'serial' && connectedPrinter.device) {
        if (writerRef.current) {
          writerRef.current.releaseLock();
          writerRef.current = null;
        }
        const port = connectedPrinter.device;
        await port.close();
      }

      setState(prev => ({
        ...prev,
        status: 'disconnected',
        connectedPrinter: null,
      }));

      localStorage.removeItem('connectedPrinter');
      toast.success('Impressora desconectada');
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error('Erro ao desconectar');
    }
  }, [state.connectedPrinter]);

  // Write data in chunks (for Bluetooth)
  const writeInChunks = async (characteristic: any, data: Uint8Array) => {
    const config = getConfig();
    const chunkSize = config.chunkSize;
    const chunkDelay = config.chunkDelay;
    
    const supportsWriteWithoutResponse = characteristic.properties?.writeWithoutResponse;
    const supportsWrite = characteristic.properties?.write;
    
    console.log('Writing', data.length, 'bytes in chunks of', chunkSize, 'with delay', chunkDelay, 'ms');
    console.log('Write modes:', { supportsWriteWithoutResponse, supportsWrite });

    for (let offset = 0; offset < data.length; offset += chunkSize) {
      const chunk = data.slice(offset, Math.min(offset + chunkSize, data.length));
      
      let success = false;
      let lastError: Error | null = null;

      // Try writeValueWithoutResponse first (more reliable for printers)
      if (supportsWriteWithoutResponse) {
        try {
          await characteristic.writeValueWithoutResponse(chunk);
          success = true;
        } catch (e: any) {
          lastError = e;
          console.warn('writeValueWithoutResponse failed:', e.message);
        }
      }

      // Fallback to writeValue
      if (!success && supportsWrite) {
        try {
          await characteristic.writeValue(chunk);
          success = true;
        } catch (e: any) {
          lastError = e;
          console.warn('writeValue failed:', e.message);
        }
      }

      // Last resort: try both methods without checking properties
      if (!success) {
        try {
          await characteristic.writeValueWithoutResponse(chunk);
          success = true;
        } catch {
          try {
            await characteristic.writeValue(chunk);
            success = true;
          } catch (e: any) {
            lastError = e;
          }
        }
      }

      if (!success) {
        throw new Error(`Falha ao enviar chunk ${offset}: ${lastError?.message || 'Unknown error'}`);
      }

      // Delay between chunks
      if (offset + chunkSize < data.length) {
        await new Promise(resolve => setTimeout(resolve, chunkDelay));
      }
    }
  };

  // Send raw data to printer
  const sendRawData = useCallback(async (data: Uint8Array) => {
    const { connectedPrinter, status } = state;

    if (!connectedPrinter || status !== 'connected') {
      console.error('Printer state:', { connectedPrinter, status });
      throw new Error('Impressora não conectada');
    }

    console.log('Sending', data.length, 'bytes to printer', connectedPrinter.name);

    try {
      if (connectedPrinter.type === 'bluetooth') {
        // Use ref for most up-to-date characteristic
        const characteristic = characteristicRef.current || connectedPrinter.characteristic;
        
        if (!characteristic) {
          throw new Error('Característica Bluetooth não encontrada. Reconecte a impressora.');
        }

        await writeInChunks(characteristic, data);
        console.log('Bluetooth print completed successfully');
      } else if (connectedPrinter.type === 'usb' && connectedPrinter.device) {
        const usbDevice = connectedPrinter.device;
        await usbDevice.transferOut(USB_ENDPOINT, data);
        console.log('USB print completed successfully');
      } else if (connectedPrinter.type === 'serial') {
        const writer = writerRef.current;
        if (!writer) {
          throw new Error('Writer serial não disponível. Reconecte a impressora.');
        }
        await writer.write(data);
        console.log('Serial print completed successfully');
      } else {
        throw new Error(`Tipo de conexão não suportado: ${connectedPrinter.type}`);
      }
    } catch (error: any) {
      console.error('Print error:', error);
      throw error;
    }
  }, [state]);

  // Print using ESCPOSEncoder
  const printWithEncoder = useCallback(async (encoder: ESCPOSEncoder) => {
    const data = encoder.encode();
    await sendRawData(data);
  }, [sendRawData]);

  // Print text
  const printText = useCallback(async (text: string, options?: {
    bold?: boolean;
    center?: boolean;
    doubleHeight?: boolean;
    doubleWidth?: boolean;
    cut?: boolean;
  }) => {
    const encoder = ESCPOSEncoder.create().init();

    if (options?.center) encoder.align('center');
    if (options?.bold) encoder.bold();
    if (options?.doubleHeight && options?.doubleWidth) {
      encoder.double();
    } else if (options?.doubleHeight) {
      encoder.doubleHeight();
    } else if (options?.doubleWidth) {
      encoder.doubleWidth();
    }

    encoder.text(text).newline();
    encoder.normal().bold(false).align('left');

    if (options?.cut) {
      encoder.cut();
    }

    await sendRawData(encoder.encode());
  }, [sendRawData]);

  // Print receipt
  const printReceipt = useCallback(async (receipt: {
    header?: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    discount?: number;
    footer?: string;
    paymentMethod?: string;
  }) => {
    const data = PrintTemplates.receipt({
      header: receipt.header,
      items: receipt.items,
      total: receipt.total,
      discount: receipt.discount,
      paymentMethod: receipt.paymentMethod,
      footer: receipt.footer,
    });

    await sendRawData(data);
  }, [sendRawData]);

  // Print label
  const printLabel = useCallback(async (label: {
    code: string;
    name: string;
    price?: number;
    barcode?: string;
    qrcode?: string;
    qrcodeSize?: number;
  }) => {
    const config = getConfig();
    // Calculate width based on paper size (32 chars for 58mm, 48 chars for 80mm)
    const width = config.paperWidth === 80 ? 48 : 32;
    
    const encoder = ESCPOSEncoder.create({ 
      width, 
      density: config.density,
      feedBeforeCut: config.feedBeforeCut 
    }).init().align('center');

    // QR Code if provided (at the top)
    if (label.qrcode) {
      encoder.qrcode(label.qrcode, label.qrcodeSize || 5, 'M');
    }

    // Barcode if provided
    if (label.barcode) {
      encoder.barcode(label.barcode, 'CODE128', 60, 2, false);
    }

    // Product code
    encoder.bold().text(label.code).newline().bold(false);

    // Product name
    encoder.text(label.name).newline();

    // Price if provided
    if (label.price !== undefined) {
      encoder.double().text(`R$ ${label.price.toFixed(2).replace('.', ',')}`).newline().normal();
    }

    const data = encoder.cut().encode();
    await sendRawData(data);
  }, [sendRawData]);

  // Test print
  const testPrint = useCallback(async () => {
    try {
      console.log('Starting test print...');
      const data = PrintTemplates.testPage();
      console.log('Test page data size:', data.length, 'bytes');
      
      await sendRawData(data);
      toast.success('Teste de impressão enviado!');
      return true;
    } catch (error: any) {
      console.error('Test print error:', error);
      toast.error(`Erro no teste: ${error.message}`);
      throw error;
    }
  }, [sendRawData]);

  // Diagnostic info
  const getDiagnostics = useCallback(() => {
    return {
      status: state.status,
      printer: state.connectedPrinter ? {
        id: state.connectedPrinter.id,
        name: state.connectedPrinter.name,
        type: state.connectedPrinter.type,
        hasCharacteristic: !!(characteristicRef.current || state.connectedPrinter.characteristic),
        hasDevice: !!state.connectedPrinter.device,
      } : null,
      support: {
        bluetooth: isBluetoothSupported,
        usb: isUSBSupported,
        serial: isSerialSupported,
      },
      isReconnecting,
      reconnectionAttempted,
    };
  }, [state, isBluetoothSupported, isUSBSupported, isSerialSupported, isReconnecting, reconnectionAttempted]);

  // Attempt auto-reconnection to saved Bluetooth device
  const attemptReconnection = useCallback(async () => {
    if (reconnectionAttempted || isReconnecting) return false;
    if (state.status === 'connected') return true;
    
    const savedPrinter = getSavedPrinter();
    if (!savedPrinter) return false;
    
    // Only Bluetooth devices can be auto-reconnected (USB/Serial require user gesture)
    if (savedPrinter.type !== 'bluetooth' || !isBluetoothSupported || !nav?.bluetooth) {
      return false;
    }

    setIsReconnecting(true);
    setReconnectionAttempted(true);
    setState(prev => ({ ...prev, status: 'connecting', errorMessage: null }));

    try {
      // Get paired devices from browser
      const devices = await nav.bluetooth.getDevices();
      console.log('Found paired devices:', devices?.length || 0);
      
      // Find the saved device
      const device = devices?.find((d: any) => d.id === savedPrinter.id);
      
      if (!device) {
        console.log('Saved device not found in paired devices');
        setState(prev => ({ ...prev, status: 'disconnected' }));
        setIsReconnecting(false);
        return false;
      }

      console.log('Found saved device, attempting reconnection:', device.name);
      
      // Create a new PrinterDevice with the found device
      const printerDevice: PrinterDevice = {
        id: device.id,
        name: device.name || savedPrinter.name,
        type: 'bluetooth',
        device,
      };

      // Try to connect
      const server = await device.gatt?.connect();
      
      if (!server) {
        throw new Error('Não foi possível conectar ao servidor GATT');
      }
      
      console.log('GATT server reconnected');

      // Find printer service
      let service = null;
      const allServiceUUIDs = [PRINTER_SERVICE_UUID, ...ALT_SERVICE_UUIDS];
      
      for (const uuid of allServiceUUIDs) {
        try {
          service = await server.getPrimaryService(uuid);
          console.log('Found service:', uuid);
          break;
        } catch {
          continue;
        }
      }

      if (!service) {
        const services = await server.getPrimaryServices();
        for (const svc of services) {
          const char = await findWritableCharacteristic(svc);
          if (char) {
            service = svc;
            break;
          }
        }
      }

      if (!service) {
        throw new Error('Serviço de impressão não encontrado');
      }

      const characteristic = await findWritableCharacteristic(service);
      if (!characteristic) {
        throw new Error('Característica de escrita não encontrada');
      }

      characteristicRef.current = characteristic;
      printerDevice.characteristic = characteristic;
      printerDevice.server = server;

      setState(prev => ({
        ...prev,
        status: 'connected',
        connectedPrinter: printerDevice,
      }));

      toast.success(`Reconectado a ${printerDevice.name}`);
      setIsReconnecting(false);
      return true;
    } catch (error: any) {
      console.log('Auto-reconnection failed:', error.message);
      setState(prev => ({
        ...prev,
        status: 'disconnected',
        errorMessage: null, // Don't show error for auto-reconnect
      }));
      setIsReconnecting(false);
      return false;
    }
  }, [reconnectionAttempted, isReconnecting, state.status, getSavedPrinter, isBluetoothSupported, nav]);

  // Check if has saved printer
  const hasSavedPrinter = useCallback(() => {
    return !!getSavedPrinter();
  }, [getSavedPrinter]);

  // Get saved printer name for display
  const getSavedPrinterName = useCallback(() => {
    const saved = getSavedPrinter();
    return saved?.name || null;
  }, [getSavedPrinter]);

  // Clear saved printer
  const clearSavedPrinter = useCallback(() => {
    localStorage.removeItem('connectedPrinter');
    setReconnectionAttempted(false);
    setState(prev => ({
      ...prev,
      connectedPrinter: null,
    }));
  }, []);

  // Attempt to reconnect USB device
  const attemptUSBReconnection = useCallback(async () => {
    if (!isUSBSupported || !nav?.usb) return false;
    
    try {
      const savedDevice = localStorage.getItem('lastUSBDevice');
      if (!savedDevice) return false;
      
      const saved = JSON.parse(savedDevice);
      const devices = await nav.usb.getDevices();
      
      const matchingDevice = devices.find((d: any) => 
        d.vendorId === saved.vendorId && d.productId === saved.productId
      );
      
      if (matchingDevice) {
        const printerDevice: PrinterDevice = {
          id: saved.id,
          name: saved.name || matchingDevice.productName || 'Impressora USB',
          type: 'usb',
          device: matchingDevice,
          vendorId: matchingDevice.vendorId,
          productId: matchingDevice.productId,
        };
        
        await connect(printerDevice);
        return true;
      }
    } catch (error) {
      console.log('USB reconnection failed:', error);
    }
    return false;
  }, [isUSBSupported, nav, connect]);

  // Attempt to reconnect Serial port
  const attemptSerialReconnection = useCallback(async () => {
    if (!isSerialSupported || !nav?.serial) return false;
    
    try {
      const savedPort = localStorage.getItem('lastSerialPort');
      if (!savedPort) return false;
      
      const saved = JSON.parse(savedPort);
      const ports = await nav.serial.getPorts();
      
      const matchingPort = ports.find((p: any) => {
        const info = p.getInfo();
        return info.usbVendorId === saved.vendorId && info.usbProductId === saved.productId;
      });
      
      if (matchingPort) {
        const printerDevice: PrinterDevice = {
          id: saved.id,
          name: saved.name || 'Impressora Serial',
          type: 'serial',
          device: matchingPort,
          vendorId: saved.vendorId,
          productId: saved.productId,
          detectedBaudRate: saved.detectedBaudRate,
        };
        
        await connect(printerDevice);
        return true;
      }
    } catch (error) {
      console.log('Serial reconnection failed:', error);
    }
    return false;
  }, [isSerialSupported, nav, connect]);

  // Get saved USB device info
  const getSavedUSBDevice = useCallback(() => {
    try {
      const saved = localStorage.getItem('lastUSBDevice');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }, []);

  // Get saved Serial port info
  const getSavedSerialPort = useCallback(() => {
    try {
      const saved = localStorage.getItem('lastSerialPort');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }, []);

  // Clear all saved devices
  const clearAllSavedDevices = useCallback(() => {
    localStorage.removeItem('connectedPrinter');
    localStorage.removeItem('lastUSBDevice');
    localStorage.removeItem('lastSerialPort');
    setReconnectionAttempted(false);
    setState(prev => ({
      ...prev,
      connectedPrinter: null,
    }));
  }, []);

  return {
    // State
    status: state.status,
    connectedPrinter: state.connectedPrinter,
    availableDevices: state.availableDevices,
    errorMessage: state.errorMessage,
    isReconnecting,

    // Support flags
    isBluetoothSupported,
    isUSBSupported,
    isSerialSupported,

    // Actions
    scanBluetooth,
    scanUSB,
    scanSerial,
    connect,
    disconnect,
    testPrint,
    printText,
    printReceipt,
    printLabel,
    sendRawData,
    printWithEncoder,
    getDiagnostics,
    
    // Device listing (for quick reconnect)
    listUSBDevices,
    listSerialPorts,
    detectBaudRate,
    
    // Reconnection
    attemptReconnection,
    attemptUSBReconnection,
    attemptSerialReconnection,
    hasSavedPrinter,
    getSavedPrinterName,
    getSavedUSBDevice,
    getSavedSerialPort,
    clearSavedPrinter,
    clearAllSavedDevices,

    // ESC/POS Encoder access
    ESCPOSEncoder,
    PrintTemplates,
  };
}
