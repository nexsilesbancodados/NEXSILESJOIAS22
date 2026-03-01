import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, ShoppingCart, Users, Package, Zap, Shield, Star,
  MessageSquare, TrendingUp, Smartphone, ArrowRight, Check,
  Sparkles, Store, Bot, Crown, ChevronDown, Menu, X, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dashboardMockup from '@/assets/landing-dashboard-mockup.jpg';
import mobileMockup from '@/assets/landing-mobile-mockup.jpg';
import fullBg from '@/assets/landing-fullbg.jpg';
import logo from '@/assets/logo.png';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const FEATURES = [
  { icon: BarChart3, title: 'Dashboard Inteligente', desc: 'Vendas, estoque e métricas em tempo real.' },
  { icon: ShoppingCart, title: 'PDV Completo', desc: 'Leitor de barras, descontos e múltiplos pagamentos.' },
  { icon: Package, title: 'Gestão de Estoque', desc: 'Alertas de reposição e histórico de preços.' },
  { icon: Users, title: 'Revendedoras', desc: 'Maletas, comissões e portal exclusivo.' },
  { icon: MessageSquare, title: 'WhatsApp', desc: 'Catálogos, cobranças e notificações.' },
  { icon: TrendingUp, title: 'Relatórios', desc: 'Lucratividade, ranking e desempenho.' },
  { icon: Bot, title: 'Assistente IA', desc: 'Chatbot que auxilia nas vendas.' },
  { icon: Store, title: 'Loja Virtual', desc: 'E-commerce com PIX, cartão e boleto.' },
  { icon: Shield, title: 'Segurança', desc: 'Dados isolados por empresa.' },
];

const PLANOS = [
  {
    nome: 'E-commerce Premium',
    tier: 'E-COMMERCE',
    preco: 149,
    destaque: false,
    icon: Store,
    recursos: ['Loja virtual com domínio', 'Checkout Pix, Cartão, Boleto', 'Gestão de estoque', 'Carrinho com cupons', 'Cálculo de frete', 'SEO otimizado', 'Catálogo digital'],
  },
  {
    nome: 'Nexsiles',
    tier: 'PRATA',
    preco: 189,
    destaque: false,
    icon: Sparkles,
    recursos: ['Dashboard inteligente', 'PDV completo', 'Estoque ilimitado', 'Revendedoras & Maletas', 'Catálogos digitais', 'Relatórios completos', 'Fidelidade', 'WhatsApp'],
  },
  {
    nome: 'Nexsiles Ysis',
    tier: 'OURO',
    preco: 249,
    destaque: true,
    icon: Bot,
    recursos: ['Tudo do plano Prata', 'Assistente IA WhatsApp', 'Chatbot integrado', 'Respostas automáticas', 'Sugestões de vendas IA', 'Análise de estoque', 'Atendimento auto', 'Relatórios IA'],
  },
  {
    nome: 'Nexsiles Commerce',
    tier: 'DIAMANTE',
    preco: 299,
    destaque: false,
    icon: Crown,
    recursos: ['Tudo do plano Ouro', 'Loja virtual completa', 'Checkout integrado', 'Carrinho com cupons', 'Gestão de pedidos', 'Cálculo de frete', 'SEO otimizado', 'Campanhas'],
  },
];

const TESTIMONIALS = [
  { name: 'Carla M.', role: 'Loja de semijoias', text: 'O Nexsiles facilitou muito minha gestão. Antes eu perdia horas no controle manual.' },
  { name: 'Fernanda S.', role: 'Revendedora', text: 'O portal é muito prático. Vejo peças, vendas e comissões em tempo real.' },
  { name: 'Juliana R.', role: 'E-commerce de joias', text: 'A automação no WhatsApp me ajuda a atender fora do horário. Senti diferença nas vendas.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const planosRef = useRef<HTMLDivElement>(null);

  const scrollToPlanos = () => {
    planosRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative">
      {/* Fixed full background */}
      <div className="fixed inset-0 z-0">
        <img src={fullBg} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-[hsl(224,30%,8%)]/75" />
      </div>

      <div className="relative z-10">
        {/* Navbar - Compact mobile */}
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[hsl(224,30%,8%)]/80 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Nexsiles" className="h-7 w-auto" />
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Nexsiles</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
              <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
              <a href="#screenshots" className="hover:text-white transition-colors">Screenshots</a>
              <a href="#planos" className="hover:text-white transition-colors">Planos</a>
              <a href="#depoimentos" className="hover:text-white transition-colors">Depoimentos</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => navigate('/auth')}>Entrar</Button>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" onClick={() => navigate('/auth')}>
                Experimente Grátis <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <button className="md:hidden p-2 -mr-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden bg-[hsl(224,30%,10%)] border-t border-white/5 px-4 py-4 space-y-3"
            >
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/70 hover:text-white text-base">Funcionalidades</a>
              <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/70 hover:text-white text-base">Planos</a>
              <a href="#depoimentos" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-white/70 hover:text-white text-base">Depoimentos</a>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 border-white/20 text-white" onClick={() => navigate('/auth')}>Entrar</Button>
                <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white" onClick={() => navigate('/auth')}>Teste Grátis</Button>
              </div>
            </motion.div>
          )}
        </nav>

        {/* Hero - Mobile optimized */}
        <section className="relative min-h-[100svh] flex items-center justify-center pt-14">
          <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <Badge className="mb-4 sm:mb-6 bg-purple-500/20 text-purple-300 border-purple-500/30 px-3 py-1 text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 mr-1" /> Gestão para Semijoias
              </Badge>
            </motion.div>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="text-[2rem] leading-[1.15] sm:text-5xl lg:text-7xl font-extrabold mb-4 sm:mb-6">
              Organize seu negócio de{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                semijoias
              </span>
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="text-base sm:text-xl text-white/60 max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed px-2">
              Dashboard, PDV, estoque, revendedoras, loja virtual e WhatsApp — tudo em um só lugar.
            </motion.p>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center px-2">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 rounded-xl shadow-[0_0_30px_hsl(263,70%,50%,0.4)]"
                onClick={() => navigate('/auth')}>
                Experimente 3 Dias Grátis <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 rounded-xl"
                onClick={scrollToPlanos}>
                Ver Planos
              </Button>
            </motion.div>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-white/40">
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-400" /> Sem cartão</span>
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-400" /> Cancele quando quiser</span>
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-400" /> Suporte incluso</span>
            </motion.div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-5 h-5 text-white/30" />
          </div>
        </section>

        {/* Dashboard Screenshot */}
        <section id="screenshots" className="py-16 sm:py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 sm:mb-16">
              <Badge className="mb-3 bg-purple-500/20 text-purple-300 border-purple-500/30">Dashboard</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">Visão completa do seu negócio</h2>
              <p className="text-white/50 text-sm sm:text-base max-w-2xl mx-auto">Acompanhe vendas, estoque e metas num painel intuitivo.</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_hsl(263,70%,50%,0.12)]">
              <img src={dashboardMockup} alt="Dashboard Nexsiles - Painel de gestão para semijoias" className="w-full" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(224,30%,8%)] via-transparent to-transparent" />
            </motion.div>
          </div>
        </section>

        {/* Features - 2 cols on mobile */}
        <section id="features" className="py-16 sm:py-24 bg-[hsl(224,30%,8%)]/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 sm:mb-16">
              <Badge className="mb-3 bg-purple-500/20 text-purple-300 border-purple-500/30">Funcionalidades</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">Tudo em um só sistema</h2>
              <p className="text-white/50 text-sm sm:text-base max-w-2xl mx-auto">Módulos integrados para gerir seu negócio de ponta a ponta.</p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {FEATURES.map((f, i) => (
                <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} custom={i * 0.3}>
                  <Card className="bg-white/[0.03] border-white/[0.06] hover:border-purple-500/30 transition-all duration-300 h-full">
                    <CardContent className="p-3 sm:p-6">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center mb-2 sm:mb-4">
                        <f.icon className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
                      </div>
                      <h3 className="text-sm sm:text-lg font-semibold text-white mb-1">{f.title}</h3>
                      <p className="text-xs sm:text-sm text-white/50 leading-relaxed">{f.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile + IA Section */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* On mobile, image first for visual impact */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
                className="flex justify-center order-1 lg:order-2">
                <div className="relative w-56 sm:w-72 lg:w-80">
                  <img src={mobileMockup} alt="Loja Virtual Nexsiles - Mobile" className="w-full rounded-2xl sm:rounded-3xl shadow-[0_0_50px_hsl(263,70%,50%,0.2)]" loading="lazy" />
                  <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold">
                      <Bot className="w-3 h-3 sm:w-4 sm:h-4" /> IA Integrada
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="order-2 lg:order-1">
                <Badge className="mb-3 bg-pink-500/20 text-pink-300 border-pink-500/30">Loja Virtual + IA</Badge>
                <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">Venda online com inteligência artificial</h2>
                <p className="text-white/50 mb-6 text-sm sm:text-base leading-relaxed">
                  Sua loja virtual com checkout PIX, cartão e boleto. 
                  O assistente IA auxilia no atendimento via WhatsApp.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Chatbot IA no WhatsApp', 'Loja com checkout completo', 'Catálogo compartilhável', 'Carrinho abandonado'].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-sm text-white/70">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Planos - Horizontal scroll on mobile */}
        <section id="planos" ref={planosRef} className="py-16 sm:py-24 bg-[hsl(224,30%,8%)]/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 sm:mb-16">
              <Badge className="mb-3 bg-purple-500/20 text-purple-300 border-purple-500/30">Planos</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">Escolha o plano ideal</h2>
              <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto">3 dias de teste grátis. Cancele quando quiser.</p>
            </motion.div>

            {/* Mobile: horizontal scroll */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 lg:hidden scrollbar-hide">
              {PLANOS.map((plano, i) => (
                <div key={plano.nome} className="snap-center flex-shrink-0 w-[280px]">
                  <Card className={`relative h-full bg-white/[0.03] border-white/[0.06] ${plano.destaque ? 'border-purple-500/50 shadow-[0_0_30px_hsl(263,70%,50%,0.15)]' : ''}`}>
                    {plano.destaque && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-3 text-xs">
                          <Star className="w-3 h-3 mr-1" /> Mais Popular
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-5 pt-7 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-1">
                        <plano.icon className="w-4 h-4 text-purple-400" />
                        <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">{plano.tier}</Badge>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-3">{plano.nome}</h3>
                      <div className="mb-5">
                        <span className="text-xs text-white/40">R$</span>
                        <span className="text-3xl font-extrabold text-white mx-1">{plano.preco}</span>
                        <span className="text-xs text-white/40">/mês</span>
                      </div>
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {plano.recursos.map((r) => (
                          <li key={r} className="flex items-start gap-2 text-xs text-white/60">
                            <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                            {r}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full text-sm ${plano.destaque ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}
                        onClick={() => navigate('/auth')}
                      >
                        Experimentar Grátis
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            {/* Mobile scroll hint */}
            <p className="text-center text-xs text-white/30 mt-2 lg:hidden">← Deslize para ver todos os planos →</p>

            {/* Desktop: grid */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-6">
              {PLANOS.map((plano, i) => (
                <motion.div key={plano.nome} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}>
                  <Card className={`relative h-full bg-white/[0.03] border-white/[0.06] ${plano.destaque ? 'border-purple-500/50 shadow-[0_0_40px_hsl(263,70%,50%,0.15)]' : ''}`}>
                    {plano.destaque && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4">
                          <Star className="w-3 h-3 mr-1" /> Mais Popular
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6 pt-8 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-1">
                        <plano.icon className="w-5 h-5 text-purple-400" />
                        <Badge variant="outline" className="text-xs border-white/20 text-white/60">{plano.tier}</Badge>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">{plano.nome}</h3>
                      <div className="mb-6">
                        <span className="text-sm text-white/40">R$</span>
                        <span className="text-4xl font-extrabold text-white mx-1">{plano.preco}</span>
                        <span className="text-sm text-white/40">/mês</span>
                      </div>
                      <ul className="space-y-3 mb-8 flex-1">
                        {plano.recursos.map((r) => (
                          <li key={r} className="flex items-start gap-2.5 text-sm text-white/60">
                            <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            {r}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full ${plano.destaque ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}
                        onClick={() => navigate('/auth')}
                      >
                        Experimentar Grátis
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-xs text-white/30 mt-6 sm:mt-8">
              * Após o teste, cobrança mensal. Cancele a qualquer momento antes sem custo.
            </p>
          </div>
        </section>

        {/* Depoimentos - Horizontal scroll mobile */}
        <section id="depoimentos" className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 sm:mb-16">
              <Badge className="mb-3 bg-purple-500/20 text-purple-300 border-purple-500/30">Depoimentos</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold mb-3">O que nossas clientes dizem</h2>
              <p className="text-white/40 text-xs sm:text-sm">Relatos reais. Resultados podem variar.</p>
            </motion.div>

            {/* Mobile: scroll horizontal */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:hidden scrollbar-hide">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="snap-center flex-shrink-0 w-[280px]">
                  <Card className="bg-white/[0.03] border-white/[0.06] h-full">
                    <CardContent className="p-5">
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-white/60 text-xs leading-relaxed mb-4">"{t.text}"</p>
                      <div>
                        <p className="font-semibold text-white text-sm">{t.name}</p>
                        <p className="text-[11px] text-white/40">{t.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {/* Desktop: grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}>
                  <Card className="bg-white/[0.03] border-white/[0.06] h-full">
                    <CardContent className="p-6">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed mb-6">"{t.text}"</p>
                      <div>
                        <p className="font-semibold text-white">{t.name}</p>
                        <p className="text-xs text-white/40">{t.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-pink-900/40" />
          <div className="relative z-10 max-w-4xl mx-auto px-5 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <h2 className="text-2xl sm:text-5xl font-extrabold mb-4 sm:mb-6">Pronta para organizar seu negócio?</h2>
              <p className="text-sm sm:text-lg text-white/50 mb-6 sm:mb-10 max-w-xl mx-auto">
                Experimente gratuitamente por 3 dias e descubra como o Nexsiles pode ajudar na gestão do seu negócio.
              </p>
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base sm:text-lg px-8 py-5 sm:py-6 rounded-xl shadow-[0_0_40px_hsl(263,70%,50%,0.4)]"
                onClick={() => navigate('/auth')}>
                Começar Meu Teste Grátis <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 sm:py-12 bg-[hsl(224,30%,8%)]/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Nexsiles" className="h-6 w-auto" />
                <span className="font-bold text-white/80 text-sm">Nexsiles</span>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-white/40">
                <a href="#features" className="hover:text-white/70">Funcionalidades</a>
                <a href="#planos" className="hover:text-white/70">Planos</a>
                <a href="#depoimentos" className="hover:text-white/70">Depoimentos</a>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="flex flex-wrap justify-center gap-4 text-xs text-white/40">
                  <a href="/politica-privacidade" className="hover:text-white/70 underline">Política de Privacidade</a>
                  <a href="/termos-de-uso" className="hover:text-white/70 underline">Termos de Uso</a>
                  <a href="mailto:contato@nexsiles.com.br" className="hover:text-white/70">Contato</a>
                </div>
                <p className="text-[11px] text-white/30">© {new Date().getFullYear()} Nexsiles. Todos os direitos reservados.</p>
              </div>
              <p className="text-[10px] sm:text-xs text-white/20 text-center mt-4 max-w-xl mx-auto leading-relaxed">
                Nexsiles é uma plataforma de gestão de semijoias. Resultados podem variar. 
                Este site não faz parte do Facebook/Meta Inc.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-gradient-to-t from-[hsl(224,30%,8%)] via-[hsl(224,30%,8%)]/95 to-transparent sm:hidden">
        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-5 rounded-xl text-base font-semibold shadow-[0_0_30px_hsl(263,70%,50%,0.4)]"
          onClick={() => navigate('/auth')}>
          Experimente 3 Dias Grátis <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
