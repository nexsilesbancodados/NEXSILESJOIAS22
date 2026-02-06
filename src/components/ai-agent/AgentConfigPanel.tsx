import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Bot, CreditCard, MessageSquare } from 'lucide-react';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { WhatsAppQRConnect } from './WhatsAppQRConnect';

interface AgentConfigPanelProps {
  organizationId: string;
}

export function AgentConfigPanel({ organizationId }: AgentConfigPanelProps) {
  const { config, isLoading, saveConfig } = useAgentConfig(organizationId);
  
  const [formData, setFormData] = useState({
    nome_agente: 'Assistente Virtual',
    prompt_sistema: 'Você é um assistente virtual de uma joalheria. Ajude os clientes com informações sobre produtos, pedidos e pagamentos.',
    cor_primaria: '#9b87f5',
    mensagem_boas_vindas: 'Olá! 👋 Como posso ajudar você hoje?',
    ativo: true,
    pix_chave: '',
    pix_tipo: 'email',
    pix_nome: '',
    whatsapp_numero: '',
    whatsapp_instancia: ''
  });

  useEffect(() => {
    if (config) {
      setFormData({
        nome_agente: config.nome_agente || 'Assistente Virtual',
        prompt_sistema: config.prompt_sistema || '',
        cor_primaria: config.cor_primaria || '#9b87f5',
        mensagem_boas_vindas: config.mensagem_boas_vindas || '',
        ativo: config.ativo ?? true,
        pix_chave: config.pix_chave || '',
        pix_tipo: config.pix_tipo || 'email',
        pix_nome: config.pix_nome || '',
        whatsapp_numero: config.whatsapp_numero || '',
        whatsapp_instancia: config.whatsapp_instancia || ''
      });
    }
  }, [config]);

  const handleSave = () => {
    saveConfig.mutate(formData);
  };

  const handleWhatsAppConnected = (instanceName: string) => {
    setFormData(prev => ({ ...prev, whatsapp_instancia: instanceName }));
    // Auto-save when WhatsApp is connected
    saveConfig.mutate({ ...formData, whatsapp_instancia: instanceName });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* WhatsApp Connection - First and prominent */}
      <div className="md:col-span-2">
        <WhatsAppQRConnect 
          organizationId={organizationId}
          currentInstance={formData.whatsapp_instancia || undefined}
          onConnected={handleWhatsAppConnected}
        />
      </div>

      {/* Identidade do Agente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Identidade do Agente
          </CardTitle>
          <CardDescription>
            Configure o nome e a aparência do seu assistente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_agente">Nome do Agente</Label>
            <Input
              id="nome_agente"
              value={formData.nome_agente}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_agente: e.target.value }))}
              placeholder="Ex: Assistente da Loja"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cor_primaria">Cor Principal</Label>
            <div className="flex gap-2">
              <Input
                id="cor_primaria"
                type="color"
                value={formData.cor_primaria}
                onChange={(e) => setFormData(prev => ({ ...prev, cor_primaria: e.target.value }))}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.cor_primaria}
                onChange={(e) => setFormData(prev => ({ ...prev, cor_primaria: e.target.value }))}
                placeholder="#9b87f5"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem_boas_vindas">Mensagem de Boas-vindas</Label>
            <Textarea
              id="mensagem_boas_vindas"
              value={formData.mensagem_boas_vindas}
              onChange={(e) => setFormData(prev => ({ ...prev, mensagem_boas_vindas: e.target.value }))}
              placeholder="Olá! Como posso ajudar?"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ativo">Agente Ativo</Label>
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Comportamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comportamento
          </CardTitle>
          <CardDescription>
            Defina como o agente deve responder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt_sistema">Prompt do Sistema</Label>
            <Textarea
              id="prompt_sistema"
              value={formData.prompt_sistema}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt_sistema: e.target.value }))}
              placeholder="Descreva como o agente deve se comportar..."
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Este texto define a personalidade e comportamento do agente de IA.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PIX */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamento PIX
          </CardTitle>
          <CardDescription>
            Configure sua chave PIX para receber pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pix_tipo">Tipo de Chave</Label>
            <Select
              value={formData.pix_tipo}
              onValueChange={(value) => setFormData(prev => ({ ...prev, pix_tipo: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="telefone">Telefone</SelectItem>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix_chave">Chave PIX</Label>
            <Input
              id="pix_chave"
              value={formData.pix_chave}
              onChange={(e) => setFormData(prev => ({ ...prev, pix_chave: e.target.value }))}
              placeholder="Sua chave PIX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix_nome">Nome do Beneficiário</Label>
            <Input
              id="pix_nome"
              value={formData.pix_nome}
              onChange={(e) => setFormData(prev => ({ ...prev, pix_nome: e.target.value }))}
              placeholder="Nome que aparece no PIX"
            />
          </div>
        </CardContent>
      </Card>

      {/* Número WhatsApp manual (backup) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 Número WhatsApp
          </CardTitle>
          <CardDescription>
            Número para envio de mensagens (se diferente do conectado)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_numero">Número do WhatsApp</Label>
            <Input
              id="whatsapp_numero"
              value={formData.whatsapp_numero}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_numero: e.target.value }))}
              placeholder="11999999999"
            />
            <p className="text-xs text-muted-foreground">
              Número com DDD, sem espaços ou caracteres especiais.
            </p>
          </div>
          
          {formData.whatsapp_instancia && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ Instância conectada: <strong>{formData.whatsapp_instancia}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="md:col-span-2">
        <Button 
          onClick={handleSave} 
          disabled={saveConfig.isPending}
          className="w-full md:w-auto"
        >
          {saveConfig.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
