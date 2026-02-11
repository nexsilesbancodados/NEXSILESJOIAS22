import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  SmilePlus,
  FlaskConical,
  FileDown,
  ShoppingCart,
  CheckCircle2,
  Smartphone,
  ArrowLeft,
  Zap,
  BarChart3,
  TestTube,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { useAutoSetupAgent } from '@/hooks/useAutoSetupAgent';
import { AgentConfigPanel } from '@/components/ai-agent/AgentConfigPanel';
import { ConversasDashboard } from '@/components/ai-agent/ConversasDashboard';
import { NPSDashboard } from '@/components/ai-agent/NPSDashboard';
import { SentimentDashboard } from '@/components/ai-agent/SentimentDashboard';
import { ABTestingPanel } from '@/components/ai-agent/ABTestingPanel';
import { AgentReportExport } from '@/components/ai-agent/AgentReportExport';
import { VendasAgenteDashboard } from '@/components/ai-agent/VendasAgenteDashboard';
import { WhatsAppQRConnect } from '@/components/ai-agent/WhatsAppQRConnect';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

type Section = 'dashboard' | 'vendas' | 'nps' | 'sentimento' | 'ab-testing' | 'relatorios' | 'chat' | 'config';

const NAV_ITEMS: { id: Section; label: string; icon: typeof LayoutDashboard; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Conversas e visão geral' },
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart, description: 'Performance comercial' },
  { id: 'nps', label: 'NPS', icon: Star, description: 'Avaliações de atendimento' },
  { id: 'sentimento', label: 'Sentimento', icon: SmilePlus, description: 'Análise emocional' },
  { id: 'ab-testing', label: 'A/B Test', icon: FlaskConical, description: 'Testes de prompt' },
  { id: 'relatorios', label: 'Relatórios', icon: FileDown, description: 'Exportar dados' },
  { id: 'chat', label: 'Testar', icon: TestTube, description: 'Simular conversa' },
  { id: 'config', label: 'Config', icon: Settings, description: 'Configurações do agente' },
];

export default function AtendimentoPage() {
  const navigate = useNavigate();
  const { organizationId } = useOrganization();
  const { messages, sendMessage, isLoading, clearMessages } = useAIAgent(organizationId || '');
  const { config, isLoading: configLoading } = useAgentConfig(organizationId || '');
  const { isReady: agentReady, isLoading: setupLoading } = useAutoSetupAgent(organizationId || '');
  const [input, setInput] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const whatsappConnected = !!config?.whatsapp_instancia;

  if (setupLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Zap className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Preparando seu agente</h2>
            <p className="text-sm text-muted-foreground mt-1">Configurando IA de vendas...</p>
          </div>
        </div>
      </div>
    );
  }

  const activeNav = NAV_ITEMS.find(n => n.id === activeSection);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r bg-card transition-all duration-300 ease-in-out flex-shrink-0",
        sidebarCollapsed ? "w-[68px]" : "w-[240px]"
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b h-[60px]">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          </button>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold truncate">Agente IA</h1>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            const button = (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg transition-all duration-200 text-sm",
                  sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-muted-foreground">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return button;
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-[60px] border-b bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            {activeNav && (
              <>
                <activeNav.icon className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold leading-tight">{activeNav.label}</h2>
                  <p className="text-xs text-muted-foreground">{activeNav.description}</p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!whatsappConnected && !configLoading && agentReady && (
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-1.5 border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                onClick={() => setActiveSection('config')}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Conectar WhatsApp</span>
              </Button>
            )}
            {whatsappConnected && (
              <Badge variant="secondary" className="gap-1.5 bg-green-500/10 text-green-600 border-green-200">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                WhatsApp conectado
              </Badge>
            )}
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Onboarding Banner */}
          {agentReady && !whatsappConnected && !configLoading && activeSection === 'dashboard' && (
            <div className="mx-6 mt-4">
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium text-green-600">Agente pronto!</span>
                      </div>
                      <p className="text-sm font-medium">Conecte o WhatsApp para começar a vender no automático</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Badge variant="secondary" className="text-[10px]">✅ 5 Agentes</Badge>
                        <Badge variant="secondary" className="text-[10px]">✅ FAQs</Badge>
                        <Badge variant="secondary" className="text-[10px]">✅ Vendas ativo</Badge>
                      </div>
                    </div>
                    <Button size="sm" className="gap-1.5 flex-shrink-0" onClick={() => setActiveSection('config')}>
                      <Smartphone className="h-3.5 w-3.5" />
                      Conectar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="p-6">
            {activeSection === 'dashboard' && <ConversasDashboard />}
            {activeSection === 'vendas' && <VendasAgenteDashboard />}
            {activeSection === 'nps' && <NPSDashboard />}
            {activeSection === 'sentimento' && <SentimentDashboard />}
            {activeSection === 'ab-testing' && <ABTestingPanel />}
            {activeSection === 'relatorios' && <AgentReportExport />}
            {activeSection === 'config' && <AgentConfigPanel organizationId={organizationId} />}
            
            {activeSection === 'chat' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-3 flex flex-col h-[calc(100vh-160px)] min-h-[500px]">
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

                  <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-4" ref={scrollRef}>
                      <div className="space-y-4">
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

                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { emoji: '📦', text: 'Quais produtos você tem disponíveis?', label: 'Ver produtos' },
                        { emoji: '📋', text: 'Me envie os catálogos disponíveis', label: 'Ver catálogos' },
                        { emoji: '🛒', text: 'Quero fazer um pedido', label: 'Fazer pedido' },
                        { emoji: '💳', text: 'Gerar PIX para pagamento', label: 'Gerar PIX' },
                        { emoji: '👤', text: 'Quero falar com um atendente humano', label: 'Falar com humano' },
                      ].map(action => (
                        <Button 
                          key={action.label}
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start"
                          onClick={() => {
                            setInput(action.text);
                            inputRef.current?.focus();
                          }}
                        >
                          {action.emoji} {action.label}
                        </Button>
                      ))}
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
