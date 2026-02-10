import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Loader2, 
  MessageCircle, 
  Settings, 
  Bot,
  User,
  RefreshCw,
  LayoutDashboard,
  Star,
  Sparkles,
  Mail,
  Calendar,
  Users,
  Instagram,
  Mic,
  SmilePlus,
  FlaskConical,
  FileDown
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { AgentConfigPanel } from '@/components/ai-agent/AgentConfigPanel';
import { ConversasDashboard } from '@/components/ai-agent/ConversasDashboard';
import { NPSDashboard } from '@/components/ai-agent/NPSDashboard';
import { RecommendationsPanel } from '@/components/ai-agent/RecommendationsPanel';
import { EmailManager } from '@/components/ai-agent/EmailManager';
import { AgendamentosPanel } from '@/components/ai-agent/AgendamentosPanel';
import { MultiAgentManager } from '@/components/ai-agent/MultiAgentManager';
import { InstagramConfig } from '@/components/ai-agent/InstagramConfig';
import { AudioConfig } from '@/components/ai-agent/AudioConfig';
import { SentimentDashboard } from '@/components/ai-agent/SentimentDashboard';
import { ABTestingPanel } from '@/components/ai-agent/ABTestingPanel';
import { AgentReportExport } from '@/components/ai-agent/AgentReportExport';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export default function AtendimentoPage() {
  const { organizationId } = useOrganization();
  const { messages, sendMessage, isLoading, clearMessages } = useAIAgent(organizationId || '');
  const { config, isLoading: configLoading } = useAgentConfig(organizationId || '');
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nomeAgente = config?.nome_agente || 'Assistente Virtual';
  const corPrimaria = config?.cor_primaria || '#9b87f5';
  const mensagemBoasVindas = config?.mensagem_boas_vindas || 'Olá! 👋 Como posso ajudar você hoje?';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleNewConversation = () => {
    clearMessages();
    inputRef.current?.focus();
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Central de Atendimento"
        subtitle="Gerencie conversas, FAQs e atendimento virtual"
        icon={MessageCircle}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-auto flex-wrap gap-1">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="nps" className="gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">NPS</span>
            </TabsTrigger>
            <TabsTrigger value="recomendacoes" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Recomendações</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">E-mail</span>
            </TabsTrigger>
            <TabsTrigger value="agendamentos" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="multi-agentes" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Agentes</span>
            </TabsTrigger>
            <TabsTrigger value="instagram" className="gap-2">
              <Instagram className="h-4 w-4" />
              <span className="hidden sm:inline">Instagram</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Áudio</span>
            </TabsTrigger>
            <TabsTrigger value="sentimento" className="gap-2">
              <SmilePlus className="h-4 w-4" />
              <span className="hidden sm:inline">Sentimento</span>
            </TabsTrigger>
            <TabsTrigger value="ab-testing" className="gap-2">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">A/B Test</span>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-2">
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Testar</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-0">
          <ConversasDashboard />
        </TabsContent>

        <TabsContent value="nps" className="space-y-0">
          <NPSDashboard />
        </TabsContent>

        <TabsContent value="recomendacoes" className="space-y-0">
          <RecommendationsPanel />
        </TabsContent>

        <TabsContent value="email" className="space-y-0">
          <EmailManager />
        </TabsContent>

        <TabsContent value="agendamentos" className="space-y-0">
          <AgendamentosPanel />
        </TabsContent>

        <TabsContent value="multi-agentes" className="space-y-0">
          <MultiAgentManager />
        </TabsContent>

        <TabsContent value="instagram" className="space-y-0">
          <InstagramConfig />
        </TabsContent>

        <TabsContent value="audio" className="space-y-0">
          <AudioConfig />
        </TabsContent>

        <TabsContent value="sentimento" className="space-y-0">
          <SentimentDashboard />
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-0">
          <ABTestingPanel />
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-0">
          <AgentReportExport />
        </TabsContent>

        <TabsContent value="chat" className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main chat area */}
            <Card className="lg:col-span-3 flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
              {/* Chat header */}
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{nomeAgente}</CardTitle>
                      <p className="text-sm text-muted-foreground">Modo de teste</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleNewConversation}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Nova conversa
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {/* Welcome message */}
                    {messages.length === 0 && (
                      <div className="flex gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                          style={{ backgroundColor: corPrimaria }}
                        >
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                          <p className="text-sm">{mensagemBoasVindas}</p>
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-3",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                            style={{ backgroundColor: corPrimaria }}
                          >
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 max-w-[80%]",
                            msg.role === 'user'
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm"
                          )}
                          style={msg.role === 'user' ? { backgroundColor: corPrimaria } : undefined}
                        >
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                          style={{ backgroundColor: corPrimaria }}
                        >
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Digitando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    style={{ backgroundColor: corPrimaria }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>

            {/* Sidebar with quick actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setInput('Quais produtos você tem disponíveis?');
                      inputRef.current?.focus();
                    }}
                  >
                    📦 Ver produtos
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setInput('Me envie os catálogos disponíveis');
                      inputRef.current?.focus();
                    }}
                  >
                    📋 Ver catálogos
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setInput('Quero fazer um pedido');
                      inputRef.current?.focus();
                    }}
                  >
                    🛒 Fazer pedido
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setInput('Gerar PIX para pagamento');
                      inputRef.current?.focus();
                    }}
                  >
                    💳 Gerar PIX
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setInput('Quero falar com um atendente humano');
                      inputRef.current?.focus();
                    }}
                  >
                    👤 Falar com humano
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Agente online</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {messages.length} mensagem(ns) na conversa
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="config">
          <AgentConfigPanel organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
