import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mic,
  RefreshCw,
  CheckCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export function AudioConfig() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  const [transcricaoAtivo, setTranscricaoAtivo] = useState(false);

  // Fetch current config
  const { isLoading } = useQuery({
    queryKey: ['audio-config', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agente_ia_config')
        .select('audio_transcricao_ativo')
        .eq('organization_id', organizationId!)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setTranscricaoAtivo(data.audio_transcricao_ativo || false);
      }
      
      return data;
    },
    enabled: !!organizationId
  });

  // Save config
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('agente_ia_config')
        .update({
          audio_transcricao_ativo: transcricaoAtivo,
          audio_tts_ativo: false // TTS disabled
        })
        .eq('organization_id', organizationId!);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuração de transcrição salva!');
      queryClient.invalidateQueries({ queryKey: ['audio-config'] });
    },
    onError: (error) => {
      console.error('Error saving audio config:', error);
      toast.error('Erro ao salvar configuração');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Transcrição de Áudio
        </h2>
        {transcricaoAtivo && (
          <Badge variant="default" className="gap-1">
            <Mic className="h-3 w-3" />
            Ativo
          </Badge>
        )}
      </div>

      {/* Info Card */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como funciona</AlertTitle>
        <AlertDescription className="mt-2">
          Quando ativado, mensagens de áudio recebidas via WhatsApp serão automaticamente 
          transcritas para texto usando OpenAI Whisper, permitindo que o agente entenda 
          e responda ao conteúdo falado.
        </AlertDescription>
      </Alert>

      {/* Transcription Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Transcrição de Áudio (Whisper)
          </CardTitle>
          <CardDescription>
            Converta mensagens de voz do WhatsApp em texto automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Ativar transcrição</p>
              <p className="text-sm text-muted-foreground">
                Usa OpenAI Whisper para transcrever áudios recebidos
              </p>
            </div>
            <Switch
              checked={transcricaoAtivo}
              onCheckedChange={setTranscricaoAtivo}
            />
          </div>

          {transcricaoAtivo && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Transcrição ativada</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mensagens de áudio serão automaticamente convertidas em texto para o agente processar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || isLoading}
        >
          {saveMutation.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configuração'
          )}
        </Button>
      </div>

      {/* How it Works */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Fluxo de Transcrição</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
            <li>Cliente envia mensagem de áudio via WhatsApp</li>
            <li>Webhook recebe o arquivo de áudio</li>
            <li>OpenAI Whisper transcreve o áudio para texto</li>
            <li>Agente de IA processa o texto e gera resposta</li>
            <li>Resposta é enviada em texto ao cliente</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
