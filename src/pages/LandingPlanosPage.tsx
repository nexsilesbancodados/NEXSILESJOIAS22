import { useState } from 'react';
import { motion } from 'framer-motion';
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
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
  { icon: Package, title: 'Gestão de Estoque', description: 'Controle completo do seu inventário com alertas inteligentes' },
  { icon: ShoppingBag, title: 'PDV Integrado', description: 'Ponto de venda rápido e eficiente com impressão de recibos' },
  { icon: Users, title: 'Revendedoras', description: 'Gerencie maletas, comissões e acompanhe vendas' },
  { icon: Palette, title: 'Catálogos Digitais', description: 'Crie e compartilhe catálogos online personalizados' },
  { icon: BarChart3, title: 'Relatórios', description: 'Análises de vendas, estoque e desempenho' },
  { icon: Smartphone, title: 'Portal Revendedora', description: 'Acesso exclusivo para suas revendedoras' },
];

const FEATURES_MAX = [
  { icon: Bot, title: 'Atendente IA', description: 'Assistente virtual inteligente para atendimento 24h' },
  { icon: MessageSquare, title: 'WhatsApp Automatizado', description: 'Chatbot que responde clientes automaticamente' },
  { icon: TrendingUp, title: 'Recomendações', description: 'Sugestões inteligentes de produtos para cada cliente' },
  { icon: Headphones, title: 'Suporte VIP', description: 'Atendimento prioritário por especialistas' },
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

export default function LandingPlanosPage() {
  const [isAnual, setIsAnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getPrecoComDesconto = (preco: number) => {
    if (isAnual) {
      return (preco * 12 * 0.8) / 12;
    }
    return preco;
  };

  const handleSelectPlan = (plano: 'nexsiles' | 'nexsiles_max') => {
    // Redirect to auth with plan info
    window.location.href = `/auth?plano=${plano}&anual=${isAnual}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-warning/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-12"
          >
            <Link to="/" className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary">
                <Crown className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">Nexsiles</span>
            </Link>
          </motion.div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center max-w-4xl mx-auto mb-12"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Sistema completo para semi-joias
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Gerencie sua loja com{' '}
              <span className="purple-text">inteligência</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Do estoque à venda, das revendedoras ao cliente final. 
              Tudo em uma única plataforma poderosa e fácil de usar.
            </p>
          </motion.div>

          {/* Toggle Mensal/Anual */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4 mb-12"
          >
            <Label className={cn("text-base", !isAnual && 'text-foreground font-semibold')}>
              Mensal
            </Label>
            <Switch
              checked={isAnual}
              onCheckedChange={setIsAnual}
              className="data-[state=checked]:bg-success"
            />
            <div className="flex items-center gap-2">
              <Label className={cn("text-base", isAnual && 'text-foreground font-semibold')}>
                Anual
              </Label>
              {isAnual && (
                <Badge className="bg-success/10 text-success border-success/20">
                  Economize 20%
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Nexsiles */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="relative h-full overflow-hidden border-2 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-primary/10">
                      <Zap className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{PLANOS.nexsiles.nome}</h3>
                      <p className="text-muted-foreground text-sm">{PLANOS.nexsiles.descricao}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-5xl font-bold text-foreground">
                        {getPrecoComDesconto(PLANOS.nexsiles.valor).toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {isAnual && (
                      <p className="text-sm text-success mt-2">
                        Total: R$ {(PLANOS.nexsiles.valor * 12 * 0.8).toFixed(2).replace('.', ',')} /ano
                      </p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8">
                    {FEATURES_NEXSILES.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                          <Check className="w-3.5 h-3.5 text-success" />
                        </div>
                        <div>
                          <span className="font-medium text-foreground">{feature.title}</span>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    size="lg"
                    className="w-full text-base h-12"
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
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="relative h-full overflow-hidden border-2 border-warning/50 hover:border-warning transition-all duration-300 hover:shadow-xl shadow-warning/10">
                {/* Popular ribbon */}
                <div className="absolute -right-12 top-7 rotate-45 bg-gradient-to-r from-warning to-warning/80 text-warning-foreground text-xs font-bold px-12 py-1.5 shadow-lg">
                  MAIS POPULAR
                </div>

                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-warning/20">
                      <Sparkles className="w-7 h-7 text-warning" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold text-foreground">{PLANOS.nexsiles_max.nome}</h3>
                        <Star className="w-5 h-5 text-warning fill-warning" />
                      </div>
                      <p className="text-muted-foreground text-sm">{PLANOS.nexsiles_max.descricao}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-5xl font-bold text-foreground">
                        {getPrecoComDesconto(PLANOS.nexsiles_max.valor).toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {isAnual && (
                      <p className="text-sm text-success mt-2">
                        Total: R$ {(PLANOS.nexsiles_max.valor * 12 * 0.8).toFixed(2).replace('.', ',')} /ano
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-medium text-foreground mb-3">Tudo do Nexsiles, mais:</p>
                    <ul className="space-y-4">
                      {FEATURES_MAX.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center mt-0.5">
                            <feature.icon className="w-3.5 h-3.5 text-warning" />
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{feature.title}</span>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    size="lg"
                    className="w-full text-base h-12 bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 text-warning-foreground"
                    onClick={() => handleSelectPlan('nexsiles_max')}
                  >
                    Começar com Nexsiles Max
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 bg-muted/30">
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
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desenvolvido especialmente para lojas de semi-joias e acessórios
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Package, title: 'Gestão de Estoque', description: 'Controle peças por código, categoria, material e banho. Alertas de estoque baixo automáticos.', color: 'bg-primary/10 text-primary' },
              { icon: ShoppingBag, title: 'PDV Completo', description: 'Venda rápido com leitor de código de barras, múltiplas formas de pagamento e impressão de recibo.', color: 'bg-success/10 text-success' },
              { icon: Users, title: 'Revendedoras', description: 'Gerencie maletas, calcule comissões automaticamente e acompanhe o desempenho de cada revendedora.', color: 'bg-warning/10 text-warning' },
              { icon: Palette, title: 'Catálogos Online', description: 'Crie catálogos digitais personalizados e compartilhe com seus clientes via link ou WhatsApp.', color: 'bg-vendico-blue/10 text-vendico-blue' },
              { icon: BarChart3, title: 'Relatórios Detalhados', description: 'Análises de vendas, lucratividade, produtos mais vendidos e projeções de crescimento.', color: 'bg-vendico-purple/10 text-vendico-purple' },
              { icon: Globe, title: 'Acesso em Qualquer Lugar', description: 'Sistema 100% online. Acesse de qualquer dispositivo, a qualquer hora, de qualquer lugar.', color: 'bg-vendico-green/10 text-vendico-green' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
                  <CardContent className="p-6">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", feature.color)}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section - Only for Max */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-background to-primary/5" />
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-warning/10 rounded-full blur-3xl opacity-30 -translate-y-1/2" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-warning/10 text-warning border-warning/20">
                <Bot className="w-3.5 h-3.5 mr-1.5" />
                Exclusivo Nexsiles Max
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Inteligência Artificial trabalhando por você
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Seu atendente virtual nunca dorme. Responde clientes no WhatsApp, 
                recomenda produtos personalizados e aumenta suas vendas automaticamente.
              </p>

              <div className="space-y-6">
                {[
                  { icon: MessageSquare, title: 'Atendimento 24/7', description: 'Responde perguntas, envia catálogos e fecha vendas mesmo quando você está dormindo.' },
                  { icon: TrendingUp, title: 'Recomendações Inteligentes', description: 'Sugere produtos com base no histórico e preferências de cada cliente.' },
                  { icon: Clock, title: 'Economia de Tempo', description: 'Automatize tarefas repetitivas e foque no que realmente importa.' },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-warning/20">
                <AspectRatio ratio={4/3}>
                  <div className="w-full h-full bg-gradient-to-br from-card to-muted flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
                        <Bot className="w-10 h-10 text-warning" />
                      </div>
                      <h4 className="text-xl font-semibold text-foreground mb-2">Atendente IA</h4>
                      <p className="text-muted-foreground">Atendimento inteligente via WhatsApp</p>
                    </div>
                  </div>
                </AspectRatio>
              </div>
              
              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-lg p-4 border border-border"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-sm font-medium">+40% em vendas</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: Shield, value: '100%', label: 'Seguro' },
              { icon: Clock, value: '24/7', label: 'Suporte' },
              { icon: Users, value: '500+', label: 'Clientes ativos' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-muted-foreground">
              Tire suas dúvidas sobre o Nexsiles
            </p>
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
                    "cursor-pointer transition-all duration-200",
                    openFaq === index && "ring-2 ring-primary/20"
                  )}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground pr-4">{item.question}</h4>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                        openFaq === index && "rotate-180"
                      )} />
                    </div>
                    {openFaq === index && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-muted-foreground mt-3 text-sm leading-relaxed"
                      >
                        {item.answer}
                      </motion.p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Crown className="w-16 h-16 text-primary-foreground/80 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              Pronto para transformar sua loja?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de lojistas que já estão vendendo mais com o Nexsiles
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-base h-12 px-8"
                onClick={() => handleSelectPlan('nexsiles')}
              >
                Começar com Nexsiles
              </Button>
              <Button 
                size="lg"
                className="text-base h-12 px-8 bg-warning hover:bg-warning/90 text-warning-foreground"
                onClick={() => handleSelectPlan('nexsiles_max')}
              >
                Experimentar com IA
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Nexsiles</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nexsiles. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
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
