import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Smartphone, QrCode, CheckCircle2, XCircle, RefreshCw, Unplug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WhatsAppQRConnectProps {
  organizationId: string;
  currentInstance?: string | null;
  onConnected?: (instanceName: string) => void;
}

export function WhatsAppQRConnect({ organizationId, currentInstance, onConnected }: WhatsAppQRConnectProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'connecting' | 'connected' | 'error'>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(currentInstance || null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check connection status
  const checkStatus = useCallback(async () => {
    if (!instanceName) return;
    
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: { 
          action: 'status', 
          organizationId,
          instanceName 
        }
      });

      if (error) throw error;

      if (data.connected) {
        setStatus('connected');
        setQrCode(null);
        onConnected?.(instanceName);
      } else if (status === 'connecting') {
        // Still waiting for connection
      }
    } catch (err) {
      console.error('Error checking status:', err);
    } finally {
      setCheckingStatus(false);
    }
  }, [instanceName, organizationId, status, onConnected]);

  // Poll for connection status when connecting
  useEffect(() => {
    if (status !== 'connecting') return;

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [status, checkStatus]);

  // Check status on mount if instance exists
  useEffect(() => {
    if (currentInstance) {
      setInstanceName(currentInstance);
      checkStatus();
    }
  }, [currentInstance]);

  const handleConnect = async () => {
    setStatus('loading');
    setQrCode(null);
    setPairingCode(null);

    try {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: { 
          action: 'create', 
          organizationId 
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setInstanceName(data.instanceName);
      
      if (data.status === 'open') {
        setStatus('connected');
        toast.success('WhatsApp já está conectado!');
        onConnected?.(data.instanceName);
      } else if (data.qrcode) {
        setQrCode(data.qrcode);
        setPairingCode(data.pairingCode);
        setStatus('connecting');
        toast.info('Escaneie o QR Code no WhatsApp');
      } else {
        // Try to get QR code
        const qrResult = await supabase.functions.invoke('evolution-instance', {
          body: { 
            action: 'qrcode', 
            organizationId,
            instanceName: data.instanceName 
          }
        });

        if (qrResult.data?.qrcode) {
          setQrCode(qrResult.data.qrcode);
          setPairingCode(qrResult.data.pairingCode);
          setStatus('connecting');
        } else {
          throw new Error('Não foi possível obter o QR Code');
        }
      }
    } catch (err) {
      console.error('Error connecting:', err);
      setStatus('error');
      toast.error(err instanceof Error ? err.message : 'Erro ao conectar');
    }
  };

  const handleRefreshQR = async () => {
    if (!instanceName) return;
    
    setStatus('loading');
    try {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: { 
          action: 'qrcode', 
          organizationId,
          instanceName 
        }
      });

      if (error) throw error;

      if (data.status === 'open') {
        setStatus('connected');
        setQrCode(null);
        toast.success('WhatsApp conectado!');
        onConnected?.(instanceName);
      } else if (data.qrcode) {
        setQrCode(data.qrcode);
        setPairingCode(data.pairingCode);
        setStatus('connecting');
      }
    } catch (err) {
      console.error('Error refreshing QR:', err);
      toast.error('Erro ao atualizar QR Code');
      setStatus('connecting');
    }
  };

  const handleDisconnect = async () => {
    if (!instanceName) return;
    
    setStatus('loading');
    try {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: { 
          action: 'disconnect', 
          organizationId,
          instanceName 
        }
      });

      if (error) throw error;

      setStatus('idle');
      setQrCode(null);
      setInstanceName(null);
      toast.success('WhatsApp desconectado');
    } catch (err) {
      console.error('Error disconnecting:', err);
      toast.error('Erro ao desconectar');
      setStatus('connected');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Conexão WhatsApp
        </CardTitle>
        <CardDescription>
          Conecte seu WhatsApp para receber e responder mensagens automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'idle' && (
          <div className="text-center py-6">
            <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Clique para conectar seu WhatsApp via QR Code
            </p>
            <Button onClick={handleConnect}>
              <Smartphone className="h-4 w-4 mr-2" />
              Conectar WhatsApp
            </Button>
          </div>
        )}

        {status === 'loading' && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Preparando conexão...</p>
          </div>
        )}

        {status === 'connecting' && qrCode && (
          <div className="text-center py-4">
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <img 
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp" 
                className="w-64 h-64"
              />
            </div>
            
            {pairingCode && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Ou use o código:</p>
                <p className="font-mono text-2xl font-bold tracking-wider">{pairingCode}</p>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mb-4">
              Abra o WhatsApp no celular → Menu (⋮) → Aparelhos conectados → Conectar
            </p>
            
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleRefreshQR}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar QR
              </Button>
              <Button variant="ghost" onClick={() => setStatus('idle')}>
                Cancelar
              </Button>
            </div>
            
            {checkingStatus && (
              <p className="text-xs text-muted-foreground mt-2 animate-pulse">
                Verificando conexão...
              </p>
            )}
          </div>
        )}

        {status === 'connected' && (
          <div className="text-center py-6">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <p className="font-medium text-green-600 mb-2">WhatsApp Conectado!</p>
            <p className="text-sm text-muted-foreground mb-4">
              Instância: <code className="bg-muted px-2 py-1 rounded">{instanceName}</code>
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              O agente de IA agora pode responder mensagens automaticamente.
            </p>
            <Button variant="destructive" size="sm" onClick={handleDisconnect}>
              <Unplug className="h-4 w-4 mr-2" />
              Desconectar
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-6">
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <p className="text-destructive mb-4">Erro ao conectar</p>
            <Button onClick={handleConnect}>
              Tentar Novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
