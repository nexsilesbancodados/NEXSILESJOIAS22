import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Instagram,
  Link,
  Unlink,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface InstagramConfig {
  instagram_page_id: string | null;
  instagram_access_token: string | null;
  instagram_ativo: boolean;
}

export function InstagramConfig() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [showToken, setShowToken] = useState(false);

  const [formData, setFormData] = useState({
    instagram_page_id: '',
    instagram_access_token: '',
    instagram_ativo: false
  });

  // Fetch current config
  const { data: config, isLoading } = useQuery({
    queryKey: ['instagram-config', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agente_ia_config')
        .select('instagram_page_id, instagram_access_token, instagram_ativo')
        .eq('organization_id', organizationId!)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setFormData({
          instagram_page_id: data.instagram_page_id || '',
          instagram_access_token: data.instagram_access_token || '',
          instagram_ativo: data.instagram_ativo || false
        });
      }
      
      return data as InstagramConfig | null;
    },
    enabled: !!organizationId
  });

  // Save config
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('agente_ia_config')
        .update({
          instagram_page_id: formData.instagram_page_id || null,
          instagram_access_token: formData.instagram_access_token || null,
          instagram_ativo: formData.instagram_ativo
        })
        .eq('organization_id', organizationId!);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configurações do Instagram salvas!');
      queryClient.invalidateQueries({ queryKey: ['instagram-config'] });
    },
    onError: (error) => {
      console.error('Error saving Instagram config:', error);
      toast.error('Erro ao salvar configurações');
    }
  });

  const isConnected = config?.instagram_page_id && config?.instagram_access_token;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Instagram className="h-5 w-5" />
          Instagram Direct
        </h2>
        {isConnected && (
          <Badge variant={config?.instagram_ativo ? 'default' : 'secondary'} className="gap-1">
            {config?.instagram_ativo ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Conectado
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                Desativado
              </>
            )}
          </Badge>
        )}
      </div>

      {/* Info Card */}
      <Alert>
        <Instagram className="h-4 w-4" />
        <AlertTitle>Integração com Instagram</AlertTitle>
        <AlertDescription className="mt-2">
          <p>Para integrar o Instagram Direct com seu agente de IA, você precisa:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Ter uma conta Business/Creator no Instagram</li>
            <li>Conectar a conta a uma Página do Facebook</li>
            <li>Criar um App no Meta for Developers</li>
            <li>Configurar o webhook para mensagens</li>
            <li>Obter o Page ID e Access Token</li>
          </ol>
          <Button variant="link" className="p-0 h-auto mt-2" asChild>
            <a 
              href="https://developers.facebook.com/docs/messenger-platform/instagram" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              Ver documentação da Meta
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações
          </CardTitle>
          <CardDescription>
            Configure as credenciais da API do Instagram/Meta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <>
              <div>
                <Label htmlFor="page_id">Page ID do Instagram</Label>
                <Input
                  id="page_id"
                  value={formData.instagram_page_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram_page_id: e.target.value }))}
                  placeholder="Ex: 123456789012345"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID da página do Instagram conectada ao Facebook
                </p>
              </div>

              <div>
                <Label htmlFor="access_token">Access Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="access_token"
                    type={showToken ? 'text' : 'password'}
                    value={formData.instagram_access_token}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram_access_token: e.target.value }))}
                    placeholder="Token de acesso da API"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Token de acesso com permissões para Instagram Messaging
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Ativar integração</p>
                    <p className="text-sm text-muted-foreground">
                      O agente responderá automaticamente mensagens do Instagram
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.instagram_ativo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, instagram_ativo: checked }))}
                  disabled={!formData.instagram_page_id || !formData.instagram_access_token}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (config) {
                      setFormData({
                        instagram_page_id: config.instagram_page_id || '',
                        instagram_access_token: config.instagram_access_token || '',
                        instagram_ativo: config.instagram_ativo || false
                      });
                    }
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configurações'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Webhook Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração do Webhook</CardTitle>
          <CardDescription>
            Configure este webhook no seu App da Meta para receber mensagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted font-mono text-sm">
            <p className="text-muted-foreground mb-2">URL do Webhook:</p>
            <code className="block p-2 bg-background rounded border break-all">
              https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/webhook-instagram
            </code>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * Você precisará criar a edge function webhook-instagram para processar as mensagens.
          </p>
        </CardContent>
      </Card>

      {/* Status Card */}
      {isConnected && (
        <Card className={config?.instagram_ativo ? 'border-green-500' : 'border-orange-500'}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${config?.instagram_ativo ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                {config?.instagram_ativo ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {config?.instagram_ativo 
                    ? 'Instagram conectado e ativo' 
                    : 'Instagram conectado, mas desativado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Page ID: {config?.instagram_page_id?.slice(0, 8)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
