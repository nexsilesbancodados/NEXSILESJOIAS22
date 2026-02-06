import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GraduationCap, 
  Play, 
  CheckCircle2, 
  Circle,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  MessageCircle,
  Tag,
  Droplets,
  Link2,
  Truck,
  FileText,
  Sparkles,
  ChevronRight,
  BookOpen,
  Video,
  HelpCircle,
  Lightbulb,
  Clock,
  Star,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTourManager } from '@/hooks/useTourManager';
import { InteractiveTour } from '@/components/onboarding/InteractiveTour';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
}

interface TutorialModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  route: string;
  steps: TutorialStep[];
  tourName?: 'dashboard' | 'pdv' | 'pecas' | 'revendedoras' | 'relatorios';
}

const tutorialModules: TutorialModule[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Aprenda a usar o painel principal e entender suas métricas',
    icon: LayoutDashboard,
    color: 'from-violet-500 to-purple-600',
    route: '/',
    tourName: 'dashboard',
    steps: [
      { id: '1', title: 'Visão geral do Dashboard', description: 'Entenda as principais áreas do painel', duration: '2 min', completed: false },
      { id: '2', title: 'Cards de estatísticas', description: 'Aprenda a ler os indicadores de vendas e estoque', duration: '3 min', completed: false },
      { id: '3', title: 'Meta mensal', description: 'Configure e acompanhe suas metas de vendas', duration: '2 min', completed: false },
      { id: '4', title: 'Insights inteligentes', description: 'Use as dicas automáticas para melhorar seu negócio', duration: '2 min', completed: false },
    ]
  },
  {
    id: 'pecas',
    title: 'Gestão de Peças',
    description: 'Cadastre e gerencie seu catálogo de semijoias',
    icon: Package,
    color: 'from-amber-500 to-orange-600',
    route: '/pecas',
    tourName: 'pecas',
    steps: [
      { id: '1', title: 'Cadastrar nova peça', description: 'Adicione peças com fotos, preços e códigos', duration: '5 min', completed: false },
      { id: '2', title: 'Controle de estoque', description: 'Gerencie quantidades e alertas de estoque baixo', duration: '3 min', completed: false },
      { id: '3', title: 'Categorias e filtros', description: 'Organize suas peças por categoria e material', duration: '2 min', completed: false },
      { id: '4', title: 'Importação em massa', description: 'Importe peças via planilha CSV', duration: '4 min', completed: false },
    ]
  },
  {
    id: 'pdv',
    title: 'Caixa / PDV',
    description: 'Realize vendas e gerencie o caixa',
    icon: ShoppingCart,
    color: 'from-green-500 to-emerald-600',
    route: '/pdv',
    tourName: 'pdv',
    steps: [
      { id: '1', title: 'Abrir o caixa', description: 'Inicie o dia informando o fundo de troco', duration: '2 min', completed: false },
      { id: '2', title: 'Realizar uma venda', description: 'Adicione produtos e finalize a venda', duration: '5 min', completed: false },
      { id: '3', title: 'Aplicar descontos', description: 'Use cupons e descontos nas vendas', duration: '3 min', completed: false },
      { id: '4', title: 'Fechamento de caixa', description: 'Finalize o dia e confira os valores', duration: '3 min', completed: false },
      { id: '5', title: 'Atalhos do teclado', description: 'Agilize vendas com atalhos', duration: '2 min', completed: false },
    ]
  },
  {
    id: 'revendedoras',
    title: 'Revendedoras',
    description: 'Gerencie sua equipe de vendas e maletas',
    icon: Users,
    color: 'from-fuchsia-500 to-pink-600',
    route: '/revendedoras',
    tourName: 'revendedoras',
    steps: [
      { id: '1', title: 'Cadastrar revendedora', description: 'Adicione uma nova revendedora à equipe', duration: '3 min', completed: false },
      { id: '2', title: 'Criar maleta', description: 'Monte uma maleta com peças para consignação', duration: '5 min', completed: false },
      { id: '3', title: 'Registrar vendas', description: 'Lance as vendas feitas pela revendedora', duration: '4 min', completed: false },
      { id: '4', title: 'Conferência e devolução', description: 'Faça a conferência e receba peças de volta', duration: '4 min', completed: false },
      { id: '5', title: 'Portal da revendedora', description: 'Configure o acesso ao portal exclusivo', duration: '3 min', completed: false },
    ]
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    description: 'Analise seu negócio com gráficos e dados',
    icon: BarChart3,
    color: 'from-cyan-500 to-blue-600',
    route: '/relatorios',
    tourName: 'relatorios',
    steps: [
      { id: '1', title: 'Relatório de vendas', description: 'Veja o desempenho de vendas por período', duration: '3 min', completed: false },
      { id: '2', title: 'Lucratividade', description: 'Analise lucros e margens por produto', duration: '4 min', completed: false },
      { id: '3', title: 'Relatório de estoque', description: 'Identifique produtos parados e giro rápido', duration: '3 min', completed: false },
      { id: '4', title: 'Exportar relatórios', description: 'Baixe relatórios em PDF ou Excel', duration: '2 min', completed: false },
    ]
  },
  {
    id: 'catalogos',
    title: 'Catálogos Online',
    description: 'Crie catálogos virtuais para seus clientes',
    icon: Link2,
    color: 'from-indigo-500 to-blue-600',
    route: '/catalogos',
    steps: [
      { id: '1', title: 'Criar catálogo', description: 'Monte um catálogo com suas peças', duration: '5 min', completed: false },
      { id: '2', title: 'Personalizar visual', description: 'Configure cores e logo do catálogo', duration: '3 min', completed: false },
      { id: '3', title: 'Compartilhar link', description: 'Envie o catálogo para clientes via WhatsApp', duration: '2 min', completed: false },
      { id: '4', title: 'Receber pedidos', description: 'Gerencie pedidos vindos do catálogo', duration: '3 min', completed: false },
    ]
  },
  {
    id: 'etiquetas',
    title: 'Etiquetas',
    description: 'Imprima etiquetas para suas peças',
    icon: Tag,
    color: 'from-teal-500 to-emerald-600',
    route: '/etiquetas',
    steps: [
      { id: '1', title: 'Configurar impressora', description: 'Configure sua impressora de etiquetas', duration: '5 min', completed: false },
      { id: '2', title: 'Criar modelo', description: 'Personalize o layout das etiquetas', duration: '4 min', completed: false },
      { id: '3', title: 'Imprimir lote', description: 'Imprima etiquetas em massa', duration: '3 min', completed: false },
    ]
  },
  {
    id: 'banhos',
    title: 'Banhos (Galvânica)',
    description: 'Controle envios e custos de banho em peças',
    icon: Droplets,
    color: 'from-blue-500 to-cyan-600',
    route: '/banhos',
    steps: [
      { id: '1', title: 'Cadastrar banhos', description: 'Registre tipos de banho e custos', duration: '3 min', completed: false },
      { id: '2', title: 'Enviar para banho', description: 'Crie um envio para a galvânica', duration: '4 min', completed: false },
      { id: '3', title: 'Receber retorno', description: 'Registre a volta das peças banhadas', duration: '3 min', completed: false },
    ]
  },
  {
    id: 'campanhas',
    title: 'Campanhas',
    description: 'Crie promoções e metas para a equipe',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-600',
    route: '/campanhas',
    steps: [
      { id: '1', title: 'Criar campanha', description: 'Configure uma nova campanha promocional', duration: '4 min', completed: false },
      { id: '2', title: 'Definir prêmios', description: 'Estabeleça metas e recompensas', duration: '3 min', completed: false },
      { id: '3', title: 'Acompanhar resultados', description: 'Veja o progresso das revendedoras', duration: '2 min', completed: false },
    ]
  },
  {
    id: 'fornecedores',
    title: 'Fornecedores',
    description: 'Cadastre e gerencie seus fornecedores',
    icon: Truck,
    color: 'from-slate-500 to-gray-600',
    route: '/fornecedores',
    steps: [
      { id: '1', title: 'Cadastrar fornecedor', description: 'Adicione dados de contato e endereço', duration: '3 min', completed: false },
      { id: '2', title: 'Vincular produtos', description: 'Associe peças aos fornecedores', duration: '2 min', completed: false },
    ]
  },
  {
    id: 'romaneios',
    title: 'Romaneios',
    description: 'Organize entregas e maletas para revendedoras',
    icon: FileText,
    color: 'from-orange-500 to-red-600',
    route: '/romaneios',
    steps: [
      { id: '1', title: 'Criar romaneio', description: 'Monte um romaneio de entrega', duration: '4 min', completed: false },
      { id: '2', title: 'Adicionar itens', description: 'Inclua maletas e peças no romaneio', duration: '3 min', completed: false },
      { id: '3', title: 'Imprimir etiqueta', description: 'Gere etiqueta de envio', duration: '2 min', completed: false },
    ]
  },
  {
    id: 'atendimento',
    title: 'Atendimento IA',
    description: 'Configure o agente de atendimento inteligente',
    icon: MessageCircle,
    color: 'from-violet-500 to-fuchsia-600',
    route: '/atendimento',
    steps: [
      { id: '1', title: 'Configurar agente', description: 'Personalize o nome e prompt do agente', duration: '5 min', completed: false },
      { id: '2', title: 'Conectar WhatsApp', description: 'Integre o agente ao WhatsApp', duration: '5 min', completed: false },
      { id: '3', title: 'Criar FAQs', description: 'Adicione perguntas frequentes', duration: '4 min', completed: false },
      { id: '4', title: 'Gerenciar conversas', description: 'Acompanhe e interveja nas conversas', duration: '3 min', completed: false },
    ]
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    description: 'Personalize o sistema para seu negócio',
    icon: Settings,
    color: 'from-zinc-500 to-neutral-600',
    route: '/configuracoes',
    steps: [
      { id: '1', title: 'Dados da empresa', description: 'Configure nome, logo e informações', duration: '3 min', completed: false },
      { id: '2', title: 'Metas de vendas', description: 'Defina metas mensais e anuais', duration: '2 min', completed: false },
      { id: '3', title: 'Notificações', description: 'Configure alertas e notificações', duration: '2 min', completed: false },
      { id: '4', title: 'Integrações', description: 'Conecte com WhatsApp e outros serviços', duration: '5 min', completed: false },
    ]
  },
];

const quickTips = [
  { icon: Lightbulb, title: 'Atalho rápido', description: 'Use F2 no PDV para abrir a busca de produtos rapidamente.' },
  { icon: Star, title: 'Dica de ouro', description: 'Configure alertas de estoque baixo para nunca perder vendas.' },
  { icon: Clock, title: 'Economize tempo', description: 'Importe peças em massa usando planilhas CSV.' },
  { icon: HelpCircle, title: 'Suporte', description: 'Clique em qualquer ícone de ajuda (?) para ver dicas contextuais.' },
];

export default function TutorialPage() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<TutorialModule | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  
  // Tour states for each module
  const dashboardTour = useTourManager('dashboard');
  const pdvTour = useTourManager('pdv');
  const pecasTour = useTourManager('pecas');
  const revendedorasTour = useTourManager('revendedoras');
  const relatoriosTour = useTourManager('relatorios');

  const getTourForModule = (tourName?: string) => {
    switch (tourName) {
      case 'dashboard': return dashboardTour;
      case 'pdv': return pdvTour;
      case 'pecas': return pecasTour;
      case 'revendedoras': return revendedorasTour;
      case 'relatorios': return relatoriosTour;
      default: return null;
    }
  };

  const handleStartTour = (module: TutorialModule) => {
    const tour = getTourForModule(module.tourName);
    if (tour) {
      tour.resetTour();
      navigate(module.route);
    } else {
      navigate(module.route);
    }
  };

  const toggleStepComplete = (moduleId: string, stepId: string) => {
    const key = `${moduleId}-${stepId}`;
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getModuleProgress = (module: TutorialModule) => {
    const completed = module.steps.filter(step => 
      completedSteps.has(`${module.id}-${step.id}`)
    ).length;
    return Math.round((completed / module.steps.length) * 100);
  };

  const totalProgress = Math.round(
    (completedSteps.size / tutorialModules.reduce((acc, m) => acc + m.steps.length, 0)) * 100
  );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Tutorial"
        subtitle="Aprenda a usar todas as funcionalidades do Nexsiles"
        icon={GraduationCap}
      />

      {/* Progress Overview */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Seu progresso geral</h3>
                <p className="text-sm text-muted-foreground">
                  {completedSteps.size} de {tutorialModules.reduce((acc, m) => acc + m.steps.length, 0)} etapas concluídas
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary">{totalProgress}%</span>
            </div>
          </div>
          <Progress value={totalProgress} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="modules" className="gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Módulos</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Vídeos</span>
          </TabsTrigger>
          <TabsTrigger value="tips" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Dicas</span>
          </TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutorialModules.map((module) => {
              const progress = getModuleProgress(module);
              const Icon = module.icon;
              
              return (
                <Card 
                  key={module.id} 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
                    selectedModule?.id === module.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedModule(selectedModule?.id === module.id ? null : module)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                        module.color
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant={progress === 100 ? "default" : "secondary"} className="text-xs">
                        {progress}%
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{module.title}</CardTitle>
                    <CardDescription className="text-sm">{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <Progress value={progress} className="h-2 mb-3" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{module.steps.length} etapas</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTour(module);
                        }}
                      >
                        <Play className="w-3 h-3" />
                        Iniciar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Module Details */}
          {selectedModule && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
                      selectedModule.color
                    )}>
                      <selectedModule.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle>{selectedModule.title}</CardTitle>
                      <CardDescription>{selectedModule.description}</CardDescription>
                    </div>
                  </div>
                  <Button onClick={() => handleStartTour(selectedModule)} className="gap-2">
                    <Play className="w-4 h-4" />
                    Iniciar Tour Interativo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {selectedModule.steps.map((step, index) => {
                      const isComplete = completedSteps.has(`${selectedModule.id}-${step.id}`);
                      
                      return (
                        <div
                          key={step.id}
                          className={cn(
                            "flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
                            isComplete 
                              ? "bg-primary/5 border-primary/20" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleStepComplete(selectedModule.id, step.id)}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {isComplete ? (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                Etapa {index + 1}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {step.duration}
                              </Badge>
                            </div>
                            <h4 className={cn(
                              "font-medium mt-1",
                              isComplete && "line-through text-muted-foreground"
                            )}>
                              {step.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {step.description}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(selectedModule.route);
                            }}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Vídeos Tutoriais
              </CardTitle>
              <CardDescription>
                Assista vídeos explicativos sobre cada funcionalidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tutorialModules.slice(0, 6).map((module) => (
                  <div 
                    key={module.id}
                    className="group relative aspect-video rounded-lg bg-gradient-to-br from-muted to-muted/50 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  >
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-20",
                      module.color
                    )} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-primary ml-0.5" />
                      </div>
                      <span className="text-sm font-medium">{module.title}</span>
                    </div>
                    <Badge className="absolute top-2 right-2 text-xs">
                      Em breve
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-center text-muted-foreground mt-6">
                Os vídeos tutoriais estarão disponíveis em breve!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickTips.map((tip, index) => (
              <Card key={index}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <tip.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{tip.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Atalhos do Teclado</CardTitle>
              <CardDescription>Use atalhos para agilizar seu trabalho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Buscar produtos (PDV)</span>
                  <kbd className="px-2 py-1 text-xs bg-background rounded border">F2</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Finalizar venda</span>
                  <kbd className="px-2 py-1 text-xs bg-background rounded border">F4</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Cancelar operação</span>
                  <kbd className="px-2 py-1 text-xs bg-background rounded border">ESC</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Aplicar desconto</span>
                  <kbd className="px-2 py-1 text-xs bg-background rounded border">F5</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Abrir calculadora</span>
                  <kbd className="px-2 py-1 text-xs bg-background rounded border">F6</kbd>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Ajuda</span>
                  <kbd className="px-2 py-1 text-xs bg-background rounded border">F1</kbd>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Precisa de Ajuda?</CardTitle>
              <CardDescription>Estamos aqui para ajudar você</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1 gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat de Suporte
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <HelpCircle className="w-4 h-4" />
                Central de Ajuda
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <Video className="w-4 h-4" />
                Agendar Demo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Interactive Tours */}
      {dashboardTour.showTour && (
        <InteractiveTour
          steps={dashboardTour.steps}
          onComplete={dashboardTour.endTour}
          storageKey={dashboardTour.storageKey}
        />
      )}
      {pdvTour.showTour && (
        <InteractiveTour
          steps={pdvTour.steps}
          onComplete={pdvTour.endTour}
          storageKey={pdvTour.storageKey}
        />
      )}
      {pecasTour.showTour && (
        <InteractiveTour
          steps={pecasTour.steps}
          onComplete={pecasTour.endTour}
          storageKey={pecasTour.storageKey}
        />
      )}
      {revendedorasTour.showTour && (
        <InteractiveTour
          steps={revendedorasTour.steps}
          onComplete={revendedorasTour.endTour}
          storageKey={revendedorasTour.storageKey}
        />
      )}
      {relatoriosTour.showTour && (
        <InteractiveTour
          steps={relatoriosTour.steps}
          onComplete={relatoriosTour.endTour}
          storageKey={relatoriosTour.storageKey}
        />
      )}
    </div>
  );
}
