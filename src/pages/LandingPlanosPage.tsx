import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Crown, 
  Check, 
  Sparkles, 
  Zap,
  Package,
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  Bot,
  Headphones,
  Star,
  ArrowRight,
  ShoppingBag,
  Palette,
  TrendingUp,
  Clock,
  Shield,
  Smartphone,
  Globe,
  ChevronDown,
  Play,
  Gem,
  Heart,
  Gift,
  BadgeCheck,
  Rocket,
  MousePointerClick,
  Layers,
  CircleCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const PLANOS = {
  nexsiles: {
    nome: 'Nexsiles',
    descricao: 'Gestão completa para sua loja de semi-joias',
    valor: 189.00,
  },
  nexsiles_max: {
    nome: 'Nexsiles Max',
    descricao: 'Tudo do Nexsiles + Inteligência Artificial',
    valor: 249.00,
  },
};

const FEATURES_NEXSILES = [
  { icon: Package, title: 'Gestão de Estoque', description: 'Controle completo do inventário' },
  { icon: ShoppingBag, title: 'PDV Integrado', description: 'Vendas rápidas e eficientes' },
  { icon: Users, title: 'Revendedoras', description: 'Maletas e comissões automáticas' },
  { icon: Palette, title: 'Catálogos Digitais', description: 'Compartilhe via link/WhatsApp' },
  { icon: BarChart3, title: 'Relatórios', description: 'Análises completas de vendas' },
  { icon: Smartphone, title: 'Portal Exclusivo', description: 'Acesso para revendedoras' },
];

const FEATURES_MAX = [
  { icon: Bot, title: 'Atendente IA 24/7', description: 'Atendimento automatizado' },
  { icon: MessageSquare, title: 'WhatsApp Bot', description: 'Responde automaticamente' },
  { icon: TrendingUp, title: 'Recomendações IA', description: 'Sugestões personalizadas' },
  { icon: Headphones, title: 'Suporte VIP', description: 'Atendimento prioritário' },
];

const FAQ_ITEMS = [
  {
    question: 'Como funciona o período de teste?',
    answer: 'Você pode testar todas as funcionalidades do plano escolhido por 3 dias gratuitamente após a compra. Se não gostar, devolvemos seu dinheiro.'
  },
  {
    question: 'Posso mudar de plano depois?',
    answer: 'Sim! Você pode fazer upgrade do Nexsiles para o Nexsiles Max a qualquer momento e pagar apenas a diferença proporcional.'
  },
  {
    question: 'Como funciona o pagamento?',
    answer: 'Aceitamos PIX, boleto e cartão de crédito. Após o pagamento, você recebe um código de acesso por email para criar sua conta.'
  },
  {
    question: 'Quantas revendedoras posso cadastrar?',
    answer: 'Não há limite! Você pode cadastrar quantas revendedoras precisar em qualquer um dos planos.'
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Sim! Utilizamos criptografia de ponta a ponta e servidores seguros. Seus dados nunca são compartilhados com terceiros.'
  },
];

const TESTIMONIALS = [
  {
    name: 'Maria Silva',
    role: 'Dona da Joias Maria',
    content: 'O Nexsiles transformou minha loja! Agora tenho controle total do estoque e minhas vendas aumentaram 40%.',
    avatar: 'M',
    rating: 5,
  },
  {
    name: 'Ana Santos',
    role: 'Revendedora há 3 anos',
    content: 'O portal da revendedora é incrível! Consigo ver tudo que tenho na maleta e calcular minha comissão na hora.',
    avatar: 'A',
    rating: 5,
  },
  {
    name: 'Carla Oliveira',
    role: 'Loja Brilho & Cia',
    content: 'O atendente IA do Max é demais! Responde minhas clientes no WhatsApp 24 horas, mesmo quando estou dormindo.',
    avatar: 'C',
    rating: 5,
  },
];

// Floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-primary/20"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

// Animated gradient orbs
const GradientOrbs = () => (
  <>
    <motion.div
      className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }}
      animate={{
        x: [0, 50, 0],
        y: [0, 30, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
    <motion.div
      className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--warning) / 0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }}
      animate={{
        x: [0, -40, 0],
        y: [0, -20, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  </>
);

export default function LandingPlanosPage() {
  const [isAnual, setIsAnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
  
  const getPrecoComDesconto = (preco: number) => {
    if (isAnual) {
      return (preco * 12 * 0.8) / 12;
    }
    return preco;
  };

  const handleSelectPlan = (plano: 'nexsiles' | 'nexsiles_max') => {
    window.location.href = `/auth?plano=${plano}&anual=${isAnual}`;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Floating Header */}
      <motion.header
        style={{ opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Nexsiles</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Button 
              size="sm" 
              className="hidden sm:flex bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
              onClick={() => handleSelectPlan('nexsiles_max')}
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <GradientOrbs />
        <FloatingParticles />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(0 0 0 / 0.5)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-primary/10 to-warning/10 border-primary/20 text-foreground font-medium">
                  <Sparkles className="w-4 h-4 mr-2 text-warning" />
                  Sistema #1 para Semi-joias no Brasil
                </Badge>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-[1.1] mb-6">
                Gerencie sua loja com{' '}
                <span className="relative">
                  <span className="purple-text">inteligência</span>
                  <motion.svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 200 12"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                  >
                    <motion.path
                      d="M0 8 Q100 0 200 8"
                      fill="none"
                      stroke="hsl(var(--warning))"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </motion.svg>
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Do estoque à venda, das revendedoras ao cliente final. 
                Tudo em uma única plataforma <span className="text-foreground font-medium">poderosa</span> e <span className="text-foreground font-medium">fácil de usar</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button 
                  size="lg" 
                  className="h-14 px-8 text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl shadow-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/40"
                  onClick={() => handleSelectPlan('nexsiles_max')}
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Começar Gratuitamente
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 px-8 text-base border-2 hover:bg-muted/50"
                  onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Ver Planos
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CircleCheck className="w-5 h-5 text-success" />
                  <span>Teste grátis de 3 dias</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>100% seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-warning" />
                  <span>+500 clientes</span>
                </div>
              </div>
            </motion.div>

            {/* Right Content - App Preview */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main dashboard mockup */}
                <motion.div 
                  className="relative bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="h-8 bg-muted/50 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <div className="p-6">
                    {/* Dashboard preview content */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Vendas Hoje', value: 'R$ 2.450', color: 'success' },
                        { label: 'Peças', value: '1.234', color: 'primary' },
                        { label: 'Revendedoras', value: '45', color: 'warning' },
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + i * 0.1 }}
                          className="bg-muted/30 rounded-xl p-3"
                        >
                          <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                          <p className={cn(
                            "text-lg font-bold",
                            stat.color === 'success' && "text-success",
                            stat.color === 'primary' && "text-primary",
                            stat.color === 'warning' && "text-warning",
                          )}>{stat.value}</p>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Chart placeholder */}
                    <div className="h-32 bg-gradient-to-t from-primary/5 to-transparent rounded-xl flex items-end justify-around px-4 pb-2">
                      {[60, 45, 75, 55, 85, 70, 90].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-6 bg-gradient-to-t from-primary to-primary/60 rounded-t"
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Floating cards */}
                <motion.div
                  initial={{ opacity: 0, x: -20, y: -20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute -left-8 top-1/4 bg-card rounded-2xl shadow-xl border border-border p-4 max-w-[180px]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Crescimento</p>
                      <p className="text-lg font-bold text-success">+42%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="absolute -right-4 bottom-1/4 bg-card rounded-2xl shadow-xl border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">IA Ativa</p>
                      <p className="text-xs text-muted-foreground">24/7 Online</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <MousePointerClick className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </section>

      {/* Logos/Trust Section */}
      <section className="py-12 border-y border-border/50 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Confiado por centenas de lojistas em todo o Brasil
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
            {[
              { icon: Gem, label: 'Semi-joias' },
              { icon: Heart, label: 'Acessórios' },
              { icon: Gift, label: 'Presentes' },
              { icon: Layers, label: 'Atacado' },
              { icon: ShoppingBag, label: 'Varejo' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 text-muted-foreground/60"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Funcionalidades
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Tudo que você precisa em{' '}
              <span className="purple-text">um só lugar</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desenvolvido especialmente para lojas de semi-joias e acessórios
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[
              { icon: Package, title: 'Gestão de Estoque', description: 'Controle peças por código, categoria, material e banho. Alertas de estoque baixo automáticos.', color: 'primary', span: 'lg:col-span-2' },
              { icon: ShoppingBag, title: 'PDV Completo', description: 'Venda rápido com leitor de código de barras e impressão de recibo.', color: 'success' },
              { icon: Users, title: 'Revendedoras', description: 'Gerencie maletas e calcule comissões automaticamente.', color: 'warning' },
              { icon: Palette, title: 'Catálogos Online', description: 'Crie catálogos digitais e compartilhe via WhatsApp.', color: 'vendico-blue' },
              { icon: BarChart3, title: 'Relatórios Detalhados', description: 'Análises de vendas, lucratividade e projeções de crescimento.', color: 'vendico-purple', span: 'lg:col-span-2' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn("group", feature.span)}
              >
                <Card className="h-full overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                  <CardContent className="p-6 lg:p-8">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110",
                      feature.color === 'primary' && "bg-primary/10",
                      feature.color === 'success' && "bg-success/10",
                      feature.color === 'warning' && "bg-warning/10",
                      feature.color === 'vendico-blue' && "bg-vendico-blue/10",
                      feature.color === 'vendico-purple' && "bg-vendico-purple/10",
                    )}>
                      <feature.icon className={cn(
                        "w-7 h-7",
                        feature.color === 'primary' && "text-primary",
                        feature.color === 'success' && "text-success",
                        feature.color === 'warning' && "text-warning",
                        feature.color === 'vendico-blue' && "text-vendico-blue",
                        feature.color === 'vendico-purple' && "text-vendico-purple",
                      )} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-background to-primary/5" />
        <GradientOrbs />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-warning/20 to-warning/10 text-warning border-warning/30">
                <Bot className="w-4 h-4 mr-2" />
                Exclusivo Nexsiles Max
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                Inteligência Artificial{' '}
                <span className="text-warning">trabalhando por você</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Seu atendente virtual nunca dorme. Responde clientes no WhatsApp, 
                recomenda produtos personalizados e aumenta suas vendas <strong className="text-foreground">automaticamente</strong>.
              </p>

              <div className="space-y-6">
                {[
                  { icon: MessageSquare, title: 'Atendimento 24/7', description: 'Responde perguntas e fecha vendas enquanto você dorme' },
                  { icon: TrendingUp, title: 'Recomendações Inteligentes', description: 'Sugere produtos baseados no perfil de cada cliente' },
                  { icon: Clock, title: 'Economia de Tempo', description: 'Automatize tarefas e foque no que importa' },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                    className="flex gap-4 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-warning/30 transition-colors"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* AI Chat mockup */}
              <div className="relative bg-card rounded-3xl shadow-2xl border border-warning/20 overflow-hidden">
                <div className="h-14 bg-gradient-to-r from-warning to-warning/80 flex items-center px-5 gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Atendente Nexsiles</p>
                    <p className="text-xs text-white/70">Online agora</p>
                  </div>
                </div>
                
                <div className="p-5 space-y-4 min-h-[300px]">
                  {/* Chat messages */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-end"
                  >
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                      <p className="text-sm">Olá! Vocês têm brincos dourados?</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="flex"
                  >
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                      <p className="text-sm text-foreground">Olá! Sim, temos vários modelos lindos! 😊</p>
                      <p className="text-sm text-foreground mt-2">Posso te mostrar nossos mais vendidos?</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.9 }}
                    className="flex justify-end"
                  >
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
                      <p className="text-sm">Sim, por favor!</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.2 }}
                    className="flex"
                  >
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                      <p className="text-sm text-foreground">Aqui estão 3 opções incríveis para você:</p>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center">
                            <Gem className="w-5 h-5 text-warning" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Stats badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-card rounded-2xl shadow-xl border border-success/20 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">+40%</p>
                    <p className="text-sm text-muted-foreground">em vendas</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-success/10 text-success border-success/20">
              <Star className="w-3.5 h-3.5 mr-1.5 fill-success" />
              Depoimentos
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              O que nossos clientes dizem
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                      ))}
                    </div>
                    <p className="text-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-24 relative">
        <GradientOrbs />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Planos
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Escolha o plano ideal
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Comece com 3 dias grátis em qualquer plano. Cancele quando quiser.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-4 p-2 bg-muted rounded-full">
              <button
                onClick={() => setIsAnual(false)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-medium transition-all",
                  !isAnual ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                Mensal
              </button>
              <button
                onClick={() => setIsAnual(true)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                  isAnual ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                Anual
                <Badge className="bg-success/20 text-success border-0 text-xs">-20%</Badge>
              </button>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Nexsiles */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="relative h-full overflow-hidden border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl group">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:scale-110 transition-transform">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{PLANOS.nexsiles.nome}</h3>
                      <p className="text-muted-foreground text-sm">{PLANOS.nexsiles.descricao}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg text-muted-foreground">R$</span>
                      <span className="text-6xl font-bold text-foreground tracking-tight">
                        {getPrecoComDesconto(PLANOS.nexsiles.valor).toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {isAnual && (
                      <p className="text-sm text-success mt-2 flex items-center gap-1">
                        <BadgeCheck className="w-4 h-4" />
                        Economia de R$ {(PLANOS.nexsiles.valor * 12 * 0.2).toFixed(0)} /ano
                      </p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8">
                    {FEATURES_NEXSILES.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-success" />
                        </div>
                        <span className="text-foreground">{feature.title}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full text-base h-14 border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                    onClick={() => handleSelectPlan('nexsiles')}
                  >
                    Começar com Nexsiles
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Nexsiles Max */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="relative h-full overflow-hidden border-2 border-warning/50 hover:border-warning transition-all duration-300 shadow-xl shadow-warning/10 group">
                {/* Popular badge */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-warning to-warning/80 text-warning-foreground border-0 px-3 py-1">
                    <Star className="w-3.5 h-3.5 mr-1 fill-current" />
                    Mais Popular
                  </Badge>
                </div>

                <CardContent className="p-8 pt-14">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-warning/30 to-warning/10 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-8 h-8 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{PLANOS.nexsiles_max.nome}</h3>
                      <p className="text-muted-foreground text-sm">{PLANOS.nexsiles_max.descricao}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg text-muted-foreground">R$</span>
                      <span className="text-6xl font-bold text-foreground tracking-tight">
                        {getPrecoComDesconto(PLANOS.nexsiles_max.valor).toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {isAnual && (
                      <p className="text-sm text-success mt-2 flex items-center gap-1">
                        <BadgeCheck className="w-4 h-4" />
                        Economia de R$ {(PLANOS.nexsiles_max.valor * 12 * 0.2).toFixed(0)} /ano
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      Tudo do Nexsiles, mais:
                    </p>
                    <ul className="space-y-4">
                      {FEATURES_MAX.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center">
                            <feature.icon className="w-3.5 h-3.5 text-warning" />
                          </div>
                          <span className="text-foreground">{feature.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    size="lg"
                    className="w-full text-base h-14 bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 text-warning-foreground shadow-lg shadow-warning/25 hover:shadow-xl hover:shadow-warning/30 transition-all"
                    onClick={() => handleSelectPlan('nexsiles_max')}
                  >
                    Começar com Nexsiles Max
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Guarantee */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-success/10 text-success">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Garantia de 3 dias ou seu dinheiro de volta</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Perguntas Frequentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-300 hover:shadow-md",
                    openFaq === index && "ring-2 ring-primary/20 shadow-md"
                  )}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground pr-4">{item.question}</h4>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0",
                        openFaq === index && "rotate-180"
                      )} />
                    </div>
                    <motion.div
                      initial={false}
                      animate={{
                        height: openFaq === index ? 'auto' : 0,
                        opacity: openFaq === index ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                        {item.answer}
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-8"
            >
              <Crown className="w-10 h-10 text-white" />
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Pronto para transformar sua loja?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Junte-se a centenas de lojistas que já estão vendendo mais com o Nexsiles
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="h-14 px-8 text-base bg-white text-primary hover:bg-white/90 shadow-xl"
                onClick={() => handleSelectPlan('nexsiles')}
              >
                Começar com Nexsiles
              </Button>
              <Button 
                size="lg"
                className="h-14 px-8 text-base bg-warning hover:bg-warning/90 text-warning-foreground shadow-xl shadow-warning/30"
                onClick={() => handleSelectPlan('nexsiles_max')}
              >
                Experimentar com IA
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <Crown className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Nexsiles</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nexsiles. Todos os direitos reservados.
            </p>
            
            <div className="flex items-center gap-6">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
