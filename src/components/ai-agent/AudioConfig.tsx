import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mic,
  Volume2,
  Settings,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface AudioConfig {
  audio_transcricao_ativo: boolean;
  audio_tts_ativo: boolean;
  audio_voz_preferida: string;
}

const VOZES_DISPONIVEIS = [
  { value: 'alloy', label: 'Alloy', description: 'Voz neutra e versátil' },
  { value: 'echo', label: 'Echo', description: 'Voz masculina profunda' },
  { value: 'fable', label: 'Fable', description: 'Voz narrativa expressiva' },
  { value: 'onyx', label: 'Onyx', description: 'Voz masculina autoritária' },
  { value: 'nova', label: 'Nova', description: 'Voz feminina jovem' },
  { value: 'shimmer', label: 'Shimmer', description: 'Voz feminina suave' }
];

export function AudioConfig() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState(false);

  const [formData, setFormData] = useState({
    audio_transcricao_ativo: false,
    audio_tts_ativo: false,
    audio_voz_preferida: 'alloy'
  });

  // Fetch current config
  const { data: config, isLoading } = useQuery({
    queryKey: ['audio-config', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agente_ia_config')
        .select('audio_transcricao_ativo, audio_tts_ativo, audio_voz_preferida')
        .eq('organization_id', organizationId!)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setFormData({
          audio_transcricao_ativo: data.audio_transcricao_ativo || false,
          audio_tts_ativo: data.audio_tts_ativo || false,
          audio_voz_preferida: data.audio_voz_preferida || 'alloy'
        });
      }
      
      return data as AudioConfig | null;
    },
    enabled: !!organizationId
  });

  // Save config
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('agente_ia_config')
        .update({
          audio_transcricao_ativo: formData.audio_transcricao_ativo,
          audio_tts_ativo: formData.audio_tts_ativo,
          audio_voz_preferida: formData.audio_voz_preferida
        })
        .eq('organization_id', organizationId!);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configurações de áudio salvas!');
      queryClient.invalidateQueries({ queryKey: ['audio-config'] });
    },
    onError: (error) => {
      console.error('Error saving audio config:', error);
      toast.error('Erro ao salvar configurações');
    }
  });

  const playVoiceSample = () => {
    // This would call TTS API to play a sample - for now just simulating
    setIsPlaying(true);
    toast.info(`Reproduzindo amostra da voz "${formData.audio_voz_preferida}"...`);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Áudio & Voz
        </h2>
        <div className="flex gap-2">
          {formData.audio_transcricao_ativo && (
            <Badge variant="default" className="gap-1">
              <Mic className="h-3 w-3" />
              Transcrição
            </Badge>
          )}
          {formData.audio_tts_ativo && (
            <Badge variant="secondary" className="gap-1">
              <Volume2 className="h-3 w-3" />
              TTS
            </Badge>
          )}
        </div>
      </div>

      {/* Info Card */}
      <Alert>
        <Mic className="h-4 w-4" />
        <AlertTitle>Recursos de Áudio</AlertTitle>
        <AlertDescription className="mt-2">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Transcrição:</strong> Converte mensagens de áudio do WhatsApp em texto usando Whisper</li>
            <li><strong>Text-to-Speech (TTS):</strong> Permite que o agente responda com mensagens de áudio</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            * Estes recursos requerem API keys configuradas (OpenAI para Whisper/TTS)
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transcription Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Transcrição de Áudio
            </CardTitle>
            <CardDescription>
              Converta mensagens de voz em texto automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Ativar transcrição</p>
                <p className="text-sm text-muted-foreground">
                  Usa OpenAI Whisper para transcrever áudios
                </p>
              </div>
              <Switch
                checked={formData.audio_transcricao_ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, audio_transcricao_ativo: checked }))}
              />
            </div>

            {formData.audio_transcricao_ativo && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Transcrição ativada</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  Mensagens de áudio serão automaticamente convertidas em texto
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TTS Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Text-to-Speech (TTS)
            </CardTitle>
            <CardDescription>
              Permita que o agente responda com áudio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Ativar TTS</p>
                <p className="text-sm text-muted-foreground">
                  Respostas em áudio quando solicitado
                </p>
              </div>
              <Switch
                checked={formData.audio_tts_ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, audio_tts_ativo: checked }))}
              />
            </div>

            {formData.audio_tts_ativo && (
              <div>
                <Label>Voz Preferida</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value={formData.audio_voz_preferida}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, audio_voz_preferida: value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOZES_DISPONIVEIS.map(voz => (
                        <SelectItem key={voz.value} value={voz.value}>
                          <div className="flex flex-col">
                            <span>{voz.label}</span>
                            <span className="text-xs text-muted-foreground">{voz.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={playVoiceSample}
                    disabled={isPlaying}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
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

      {/* How it Works */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Como funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Mic className="h-4 w-4" />
                Fluxo de Transcrição
              </h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Cliente envia áudio via WhatsApp</li>
                <li>Webhook recebe o arquivo de áudio</li>
                <li>Whisper transcreve para texto</li>
                <li>Agente processa e responde normalmente</li>
                <li>Transcrição é salva junto com a mensagem</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Volume2 className="h-4 w-4" />
                Fluxo de TTS
              </h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Cliente solicita resposta em áudio</li>
                <li>Agente gera a resposta em texto</li>
                <li>TTS converte para áudio MP3</li>
                <li>Áudio é enviado via WhatsApp</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
