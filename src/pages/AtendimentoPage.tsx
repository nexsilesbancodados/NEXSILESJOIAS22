import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
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
  History, 
  Trash2,
  Bot,
  User,
  RefreshCw
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { AgentConfigPanel } from '@/components/ai-agent/AgentConfigPanel';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export default function AtendimentoPage() {
  const { organizationId } = useOrganization();
  const { messages, sendMessage, isLoading, clearMessages } = useAIAgent(organizationId || '');
  const { config, isLoading: configLoading } = useAgentConfig(organizationId || '');
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
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
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Atendimento Virtual"
        subtitle="Converse com o agente de IA para atender clientes"
        icon={MessageCircle}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="chat" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

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
                      <p className="text-sm text-muted-foreground">Pronto para ajudar</p>
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
    </MainLayout>
  );
}
