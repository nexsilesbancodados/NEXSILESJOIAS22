import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Bot, CreditCard, MessageSquare, Settings2, Wrench, Clock, Shield, Zap, Sparkles, Crown, Bell, Phone, Mail } from 'lucide-react';
import { useAgentConfig, AgentConfig, AlertasConfig } from '@/hooks/useAgentConfig';
import { WhatsAppQRConnect } from './WhatsAppQRConnect';
import { NotificationSettings } from './NotificationSettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AgentConfigPanelProps {
  organizationId: string;
}

const FERRAMENTAS_INFO = {
  consultar_estoque: { nome: 'Consultar Estoque', descricao: 'Verificar quantidade disponível de produtos', icon: '📦' },
  buscar_pecas: { nome: 'Buscar Peças', descricao: 'Pesquisar produtos por nome, código ou categoria', icon: '🔍' },
  gerar_pix: { nome: 'Gerar PIX', descricao: 'Criar QR Code PIX para pagamento', icon: '💳' },
  enviar_whatsapp: { nome: 'Enviar WhatsApp', descricao: 'Enviar mensagens via WhatsApp', icon: '📱' },
  listar_catalogos: { nome: 'Listar Catálogos', descricao: 'Mostrar catálogos disponíveis', icon: '📚' },
  criar_pedido: { nome: 'Criar Pedido', descricao: 'Registrar novos pedidos de clientes', icon: '🛒' },
  verificar_pedido: { nome: 'Verificar Pedido', descricao: 'Consultar status de pedidos', icon: '📋' },
  transferir_humano: { nome: 'Transferir para Humano', descricao: 'Encaminhar conversa para atendente humano', icon: '👤' },
  buscar_faq: { nome: 'Buscar FAQ', descricao: 'Consultar respostas rápidas cadastradas', icon: '❓' },
  enviar_nps: { nome: 'Pesquisa NPS', descricao: 'Enviar pesquisa de satisfação ao cliente', icon: '⭐' }
};

const TONS_RESPOSTA = [
  { value: 'profissional', label: 'Profissional', descricao: 'Formal e objetivo' },
  { value: 'amigavel', label: 'Amigável', descricao: 'Casual e acolhedor' },
  { value: 'entusiasmado', label: 'Entusiasmado', descricao: 'Animado e expressivo' },
  { value: 'tecnico', label: 'Técnico', descricao: 'Detalhado e preciso' },
  { value: 'minimalista', label: 'Minimalista', descricao: 'Respostas curtas e diretas' }
];

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' }
];

const AGENT_TEMPLATES: { id: string; nome: string; icon: string; descricao: string; config: Partial<AgentConfig> }[] = [
  {
    id: 'joalheria',
    nome: 'Joalheria / Semijoias',
    icon: '💎',
    descricao: 'Especialista em joias, semijoias e acessórios. Conhece materiais, banhos e cuidados.',
    config: {
      nome_agente: 'Consultora de Joias',
      prompt_sistema: `Você é uma consultora especializada em joias e semijoias. Seu papel é:
- Ajudar clientes a escolher peças ideais para cada ocasião
- Explicar sobre materiais (ouro, prata, banho de ouro, ródio, etc.)
- Informar sobre cuidados e conservação das peças
- Sugerir combinações e presentes
- Auxiliar com pedidos, preços e formas de pagamento
- Ser elegante, atenciosa e criar uma experiência premium de atendimento
Sempre pergunte a ocasião e preferências do cliente para personalizar sugestões.`,
      mensagem_boas_vindas: '✨ Olá! Sou sua consultora de joias. Posso ajudar você a encontrar a peça perfeita! Qual a ocasião especial?',
      tom_resposta: 'amigavel',
      temperatura: 0.7,
      cor_primaria: '#D4AF37',
    }
  },
  {
    id: 'vendas',
    nome: 'Vendas Agressivo',
    icon: '🚀',
    descricao: 'Focado em conversão e fechamento de vendas com técnicas persuasivas.',
    config: {
      nome_agente: 'Especialista em Vendas',
      prompt_sistema: `Você é um especialista em vendas de alto desempenho. Seu objetivo é:
- Identificar a necessidade do cliente rapidamente
- Apresentar produtos relevantes com foco nos benefícios
- Usar gatilhos de urgência e escassez quando apropriado
- Oferecer condições especiais para fechar a venda
- Sugerir upsell e cross-sell naturalmente
- Nunca ser agressivo demais, mas sempre direcionar para o fechamento
Use emojis moderadamente e seja direto nas respostas.`,
      mensagem_boas_vindas: '🔥 Oi! Que bom ter você aqui! Temos novidades incríveis. O que você está procurando hoje?',
      tom_resposta: 'entusiasmado',
      temperatura: 0.8,
      cor_primaria: '#ef4444',
    }
  },
  {
    id: 'suporte',
    nome: 'Suporte Técnico',
    icon: '🛠️',
    descricao: 'Atendimento focado em resolver problemas e tirar dúvidas técnicas.',
    config: {
      nome_agente: 'Suporte ao Cliente',
      prompt_sistema: `Você é um agente de suporte técnico dedicado. Suas diretrizes são:
- Ouvir atentamente o problema do cliente
- Fazer perguntas objetivas para diagnosticar a situação
- Fornecer soluções passo a passo claras
- Verificar status de pedidos e entregas quando solicitado
- Escalar para atendimento humano quando necessário
- Manter tom calmo, empático e profissional
- Sempre confirmar se o problema foi resolvido antes de encerrar
Priorize a resolução no primeiro contato.`,
      mensagem_boas_vindas: '👋 Olá! Sou do suporte. Como posso ajudar você hoje? Descreva sua dúvida ou problema.',
      tom_resposta: 'profissional',
      temperatura: 0.5,
      cor_primaria: '#3b82f6',
    }
  },
  {
    id: 'concierge',
    nome: 'Concierge Premium',
    icon: '🎩',
    descricao: 'Atendimento VIP e personalizado para clientes de alto valor.',
    config: {
      nome_agente: 'Concierge Exclusivo',
      prompt_sistema: `Você é um concierge exclusivo de atendimento premium. Seu papel é:
- Tratar cada cliente como VIP, com máxima personalização
- Conhecer profundamente o catálogo e fazer recomendações sofisticadas
- Oferecer experiências exclusivas: pré-lançamentos, peças especiais, gravações
- Lembrar preferências e histórico do cliente
- Sugerir embalagens para presente e mensagens personalizadas
- Usar linguagem elegante e refinada, sem ser artificial
- Antecipar necessidades do cliente
Cada interação deve ser memorável e criar fidelização.`,
      mensagem_boas_vindas: '🌟 Bem-vindo(a)! É um prazer atendê-lo(a) pessoalmente. Em que posso tornar sua experiência especial hoje?',
      tom_resposta: 'profissional',
      temperatura: 0.6,
      cor_primaria: '#1a1a2e',
    }
  },
  {
    id: 'minimalista',
    nome: 'Rápido e Direto',
    icon: '⚡',
    descricao: 'Respostas curtas e objetivas, sem enrolação.',
    config: {
      nome_agente: 'Assistente Rápido',
      prompt_sistema: `Você é um assistente ultra-eficiente. Regras:
- Respostas curtas e diretas (máximo 2-3 frases)
- Vá direto ao ponto sem rodeios
- Use listas quando necessário
- Confirme ações com uma frase
- Só elabore se o cliente pedir
- Sem emojis excessivos (máximo 1 por mensagem)`,
      mensagem_boas_vindas: 'Oi! Como posso ajudar?',
      tom_resposta: 'minimalista',
      temperatura: 0.3,
      max_tokens: 512,
      cor_primaria: '#64748b',
    }
  }
];

export function AgentConfigPanel({ organizationId }: AgentConfigPanelProps) {
  const { config, isLoading, saveConfig, defaultConfig } = useAgentConfig(organizationId);
  const [formData, setFormData] = useState<Partial<AgentConfig>>({});
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    } else {
      setFormData(defaultConfig);
    }
  }, [config, defaultConfig]);

  const handleSave = () => {
    saveConfig.mutate(formData);
  };

  const applyTemplate = (template: typeof AGENT_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      ...template.config,
    }));
    setShowTemplates(false);
  };

  const updateField = <K extends keyof AgentConfig>(field: K, value: AgentConfig[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateFerramenta = (key: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      ferramentas_ativas: {
        ...prev.ferramentas_ativas,
        [key]: enabled
      }
    }));
  };

  const updateHorario = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      horario_funcionamento: {
        ...prev.horario_funcionamento,
        [key]: value
      }
    }));
  };

  const toggleDia = (dia: number) => {
    const dias = formData.horario_funcionamento?.dias || [];
    const newDias = dias.includes(dia) 
      ? dias.filter(d => d !== dia)
      : [...dias, dia].sort();
    updateHorario('dias', newDias);
  };

  const handleWhatsAppConnected = (instanceName: string) => {
    updateField('whatsapp_instancia', instanceName);
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
    <div className="space-y-6">
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="dono" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Dono</span>
          </TabsTrigger>
          <TabsTrigger value="ferramentas" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Ferramentas</span>
          </TabsTrigger>
          <TabsTrigger value="comportamento" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Comportamento</span>
          </TabsTrigger>
          <TabsTrigger value="horario" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Horário</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="geral" className="space-y-6 mt-6">
          {/* Template Selector */}
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">Modelos Pré-definidos</h4>
                    <p className="text-xs text-muted-foreground">Comece com um modelo pronto e personalize depois</p>
                  </div>
                </div>
                <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Usar Modelo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Escolha um Modelo de Agente
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 mt-4">
                      {AGENT_TEMPLATES.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                          onClick={() => applyTemplate(template)}
                        >
                          <span className="text-3xl">{template.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-semibold">{template.nome}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{template.descricao}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">{template.config.tom_resposta}</Badge>
                              <Badge variant="outline" className="text-xs">Temp: {template.config.temperatura}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      ⚠️ Aplicar um modelo substituirá o nome, prompt, tom e parâmetros atuais. Suas configurações de PIX, WhatsApp e horários serão mantidas.
                    </p>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
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
                    value={formData.nome_agente || ''}
                    onChange={(e) => updateField('nome_agente', e.target.value)}
                    placeholder="Ex: Assistente da Loja"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cor_primaria">Cor Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cor_primaria"
                      type="color"
                      value={formData.cor_primaria || '#9b87f5'}
                      onChange={(e) => updateField('cor_primaria', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.cor_primaria || ''}
                      onChange={(e) => updateField('cor_primaria', e.target.value)}
                      placeholder="#9b87f5"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensagem_boas_vindas">Mensagem de Boas-vindas</Label>
                  <Textarea
                    id="mensagem_boas_vindas"
                    value={formData.mensagem_boas_vindas || ''}
                    onChange={(e) => updateField('mensagem_boas_vindas', e.target.value)}
                    placeholder="Olá! Como posso ajudar?"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="ativo">Agente Ativo</Label>
                  <Switch
                    id="ativo"
                    checked={formData.ativo ?? true}
                    onCheckedChange={(checked) => updateField('ativo', checked)}
                  />
                </div>
              </CardContent>
            </Card>

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
                    value={formData.pix_tipo || 'email'}
                    onValueChange={(value) => updateField('pix_tipo', value)}
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
                    value={formData.pix_chave || ''}
                    onChange={(e) => updateField('pix_chave', e.target.value)}
                    placeholder="Sua chave PIX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pix_nome">Nome do Beneficiário</Label>
                  <Input
                    id="pix_nome"
                    value={formData.pix_nome || ''}
                    onChange={(e) => updateField('pix_nome', e.target.value)}
                    placeholder="Nome que aparece no PIX"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Prompt do Sistema
              </CardTitle>
              <CardDescription>
                Defina a personalidade e instruções base do agente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.prompt_sistema || ''}
                onChange={(e) => updateField('prompt_sistema', e.target.value)}
                placeholder="Descreva como o agente deve se comportar..."
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Este texto define a personalidade e comportamento base do agente de IA.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Dono */}
        <TabsContent value="dono" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Dados do Proprietário
              </CardTitle>
              <CardDescription>
                Receba alertas em tempo real sobre tudo que acontece no seu atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dono_nome">Seu Nome</Label>
                <Input
                  id="dono_nome"
                  value={(formData as any).dono_nome || ''}
                  onChange={(e) => updateField('dono_nome' as any, e.target.value)}
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dono_whatsapp" className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    WhatsApp para Alertas
                  </Label>
                  <Input
                    id="dono_whatsapp"
                    value={(formData as any).dono_whatsapp || ''}
                    onChange={(e) => updateField('dono_whatsapp' as any, e.target.value)}
                    placeholder="11999999999"
                  />
                  <p className="text-xs text-muted-foreground">
                    Número com DDD, sem espaços
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dono_email" className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    E-mail para Alertas
                  </Label>
                  <Input
                    id="dono_email"
                    type="email"
                    value={(formData as any).dono_email || ''}
                    onChange={(e) => updateField('dono_email' as any, e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {(formData as any).dono_whatsapp || (formData as any).dono_email ? (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span>Alertas serão enviados para: {[
                      (formData as any).dono_whatsapp && `WhatsApp (${(formData as any).dono_whatsapp})`,
                      (formData as any).dono_email && `E-mail (${(formData as any).dono_email})`
                    ].filter(Boolean).join(' e ')}</span>
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    ⚠️ Preencha pelo menos um canal (WhatsApp ou E-mail) para receber alertas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertas Ativos
              </CardTitle>
              <CardDescription>
                Escolha quais eventos devem gerar notificação para você
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'nova_venda', label: '💰 Nova Venda Realizada', desc: 'Quando o agente fecha uma venda pelo WhatsApp' },
                { key: 'novo_pedido', label: '🛒 Novo Pedido', desc: 'Quando um cliente faz um pedido via catálogo ou agente' },
                { key: 'atendimento_humano', label: '👤 Solicitação de Atendimento Humano', desc: 'Quando o cliente pede para falar com uma pessoa' },
                { key: 'nps_negativo', label: '⭐ Avaliação Negativa (NPS)', desc: 'Quando um cliente dá nota baixa no atendimento' },
                { key: 'lead_quente', label: '🔥 Lead Quente Detectado', desc: 'Quando o agente identifica um lead com alta intenção de compra' },
                { key: 'erro_agente', label: '🚨 Erro no Agente', desc: 'Quando o agente falha ao processar uma mensagem' },
                { key: 'estoque_baixo', label: '📦 Estoque Baixo', desc: 'Quando um produto consultado está com estoque crítico' },
                { key: 'conversa_encerrada', label: '✅ Conversa Encerrada', desc: 'Quando uma conversa é finalizada' },
                { key: 'follow_up_pendente', label: '⏰ Follow-up Pendente', desc: 'Quando há follow-ups que precisam de atenção' },
              ].map((alerta) => {
                const alertasConfig = (formData as any).alertas_config || {};
                return (
                  <div key={alerta.key} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium">{alerta.label}</p>
                      <p className="text-xs text-muted-foreground">{alerta.desc}</p>
                    </div>
                    <Switch
                      checked={alertasConfig[alerta.key] ?? true}
                      onCheckedChange={(checked) => {
                        const current = (formData as any).alertas_config || {};
                        updateField('alertas_config' as any, { ...current, [alerta.key]: checked });
                      }}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Ferramentas */}
        <TabsContent value="ferramentas" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Ferramentas Disponíveis
              </CardTitle>
              <CardDescription>
                Escolha quais ações o agente pode executar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(FERRAMENTAS_INFO).map(([key, info]) => (
                  <div 
                    key={key}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      formData.ferramentas_ativas?.[key as keyof typeof formData.ferramentas_ativas]
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <p className="font-medium">{info.nome}</p>
                        <p className="text-xs text-muted-foreground">{info.descricao}</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.ferramentas_ativas?.[key as keyof typeof formData.ferramentas_ativas] ?? true}
                      onCheckedChange={(checked) => updateFerramenta(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Restrições
              </CardTitle>
              <CardDescription>
                Configure limites e palavras proibidas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Limite de Mensagens por Sessão</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[formData.limite_mensagens_sessao || 50]}
                    onValueChange={([value]) => updateField('limite_mensagens_sessao', value)}
                    min={10}
                    max={200}
                    step={10}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="w-16 justify-center">
                    {formData.limite_mensagens_sessao || 50}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Número máximo de mensagens por conversa antes de encerrar a sessão.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="palavras_proibidas">Palavras Proibidas (uma por linha)</Label>
                <Textarea
                  id="palavras_proibidas"
                  value={(formData.palavras_proibidas || []).join('\n')}
                  onChange={(e) => updateField('palavras_proibidas', e.target.value.split('\n').filter(p => p.trim()))}
                  placeholder="Digite palavras que o agente não deve usar..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Comportamento */}
        <TabsContent value="comportamento" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Estilo de Resposta
                </CardTitle>
                <CardDescription>
                  Ajuste como o agente se comunica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tom de Resposta</Label>
                  <div className="grid gap-2">
                    {TONS_RESPOSTA.map((tom) => (
                      <div
                        key={tom.value}
                        onClick={() => updateField('tom_resposta', tom.value)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.tom_resposta === tom.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium">{tom.label}</p>
                        <p className="text-xs text-muted-foreground">{tom.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select
                    value={formData.idioma || 'pt-BR'}
                    onValueChange={(value) => updateField('idioma', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Parâmetros da IA
                </CardTitle>
                <CardDescription>
                  Ajustes técnicos do modelo de IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Criatividade (Temperatura)</Label>
                    <Badge variant="secondary">{formData.temperatura || 0.7}</Badge>
                  </div>
                  <Slider
                    value={[formData.temperatura || 0.7]}
                    onValueChange={([value]) => updateField('temperatura', value)}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Menor = respostas mais consistentes. Maior = respostas mais criativas.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Tamanho Máximo da Resposta</Label>
                    <Badge variant="secondary">{formData.max_tokens || 1024} tokens</Badge>
                  </div>
                  <Slider
                    value={[formData.max_tokens || 1024]}
                    onValueChange={([value]) => updateField('max_tokens', value)}
                    min={256}
                    max={4096}
                    step={256}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Instruções Especiais</CardTitle>
              <CardDescription>
                Adicione instruções específicas que complementam o prompt do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.instrucoes_especiais || ''}
                onChange={(e) => updateField('instrucoes_especiais', e.target.value)}
                placeholder="Ex: Sempre mencione nossa promoção de frete grátis acima de R$200..."
                rows={4}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Horário */}
        <TabsContent value="horario" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horário de Funcionamento
              </CardTitle>
              <CardDescription>
                Configure quando o agente deve responder automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ativar Horário de Funcionamento</Label>
                  <p className="text-xs text-muted-foreground">
                    Fora do horário, o agente enviará uma mensagem automática
                  </p>
                </div>
                <Switch
                  checked={formData.horario_funcionamento?.ativo ?? false}
                  onCheckedChange={(checked) => {
                    updateHorario('ativo', checked);
                    if (checked) {
                      updateHorario('modo_24h', false);
                    }
                  }}
                />
              </div>

              {!formData.horario_funcionamento?.ativo && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-200 dark:border-green-800">
                  <Zap className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <span className="font-medium">Modo 24 horas ativo</span> — O agente responde a qualquer hora, todos os dias.
                  </p>
                </div>
              )}

              {formData.horario_funcionamento?.ativo && (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <div>
                        <Label className="cursor-pointer">Ligado 24 horas</Label>
                        <p className="text-xs text-muted-foreground">Responder todos os dias, sem restrição de horário</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.horario_funcionamento?.modo_24h ?? false}
                      onCheckedChange={(checked) => {
                        updateHorario('modo_24h', checked);
                        if (checked) {
                          updateHorario('dias', [0, 1, 2, 3, 4, 5, 6]);
                          updateHorario('inicio', '00:00');
                          updateHorario('fim', '23:59');
                        }
                      }}
                    />
                  </div>

                  {!formData.horario_funcionamento?.modo_24h && (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Início</Label>
                          <Input
                            type="time"
                            value={formData.horario_funcionamento?.inicio || '09:00'}
                            onChange={(e) => updateHorario('inicio', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fim</Label>
                          <Input
                            type="time"
                            value={formData.horario_funcionamento?.fim || '18:00'}
                            onChange={(e) => updateHorario('fim', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Dias de Funcionamento</Label>
                        <div className="flex gap-2 flex-wrap">
                          {DIAS_SEMANA.map((dia) => (
                            <Button
                              key={dia.value}
                              type="button"
                              variant={formData.horario_funcionamento?.dias?.includes(dia.value) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleDia(dia.value)}
                            >
                              {dia.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Mensagem Fora do Horário</Label>
                        <Textarea
                          value={formData.horario_funcionamento?.mensagem_fora || ''}
                          onChange={(e) => updateHorario('mensagem_fora', e.target.value)}
                          placeholder="Nosso atendimento funciona de segunda a sexta, das 9h às 18h."
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Notificações */}
        <TabsContent value="notificacoes" className="space-y-6 mt-6">
          <NotificationSettings />
        </TabsContent>

        {/* Aba WhatsApp */}
        <TabsContent value="whatsapp" className="space-y-6 mt-6">
          <WhatsAppQRConnect 
            organizationId={organizationId}
            currentInstance={formData.whatsapp_instancia || undefined}
            onConnected={handleWhatsAppConnected}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 Chave da IA (Gemini)
              </CardTitle>
              <CardDescription>
                Insira sua chave de API do Google Gemini para que o agente responda automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini_api_key">API Key do Gemini</Label>
                <Input
                  id="gemini_api_key"
                  type="password"
                  value={formData.gemini_api_key || ''}
                  onChange={(e) => updateField('gemini_api_key', e.target.value)}
                  placeholder="AIzaSy..."
                />
                <p className="text-xs text-muted-foreground">
                  Obtenha sua chave em{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Google AI Studio
                  </a>. 
                  Ela será usada para o agente processar mensagens do WhatsApp.
                </p>
              </div>
              {formData.gemini_api_key && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary">
                    ✅ Chave Gemini configurada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📱 Número WhatsApp</CardTitle>
              <CardDescription>
                Número para envio de mensagens (se diferente do conectado)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp_numero">Número do WhatsApp</Label>
                <Input
                  id="whatsapp_numero"
                  value={formData.whatsapp_numero || ''}
                  onChange={(e) => updateField('whatsapp_numero', e.target.value)}
                  placeholder="11999999999"
                />
                <p className="text-xs text-muted-foreground">
                  Número com DDD, sem espaços ou caracteres especiais.
                </p>
              </div>
              
              {formData.whatsapp_instancia && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary">
                    ✅ Instância conectada: <strong>{formData.whatsapp_instancia}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button - Always visible */}
      <div className="sticky bottom-4 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saveConfig.isPending}
          size="lg"
          className="shadow-lg"
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
