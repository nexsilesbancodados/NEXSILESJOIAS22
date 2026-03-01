import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, ShoppingCart, Users, Package, Zap, Shield, Star,
  MessageSquare, TrendingUp, Smartphone, ArrowRight, Check,
  Sparkles, Store, Bot, Crown, ChevronDown, Menu, X, Play,
  Heart, Gift, Gem, Clock, HeadphonesIcon, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dashboardMockup from '@/assets/landing-dashboard-mockup.jpg';
import mobileMockup from '@/assets/landing-mobile-mockup.jpg';
import heroWoman from '@/assets/landing-hero-woman.jpg';
import personaHero from '@/assets/landing-persona-hero.jpg';
import personaLojista from '@/assets/landing-persona-lojista.jpg';
import personaRevendedora from '@/assets/landing-persona-revendedora.jpg';
import personaCliente from '@/assets/landing-persona-cliente.jpg';
import logo from '@/assets/logo.png';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const VANTAGENS = [
  { icon: DollarSign, title: 'Zero Investimento', desc: 'Teste grátis por 3 dias. Sem cartão, sem compromisso.' },
  { icon: TrendingUp, title: 'Lucros de 35% a 60%', desc: 'Gerencie margens, comissões e relatórios de lucratividade com precisão.' },
  { icon: HeadphonesIcon, title: 'Suporte Humanizado', desc: 'Time dedicado para te ajudar no que precisar, quando precisar.' },
  { icon: Smartphone, title: 'Acesse de Qualquer Lugar', desc: 'Sistema 100% online, funciona em celular, tablet e computador.' },
];

const PASSOS = [
  { num: '01', titulo: 'Crie sua conta', desc: 'Cadastro rápido e gratuito em menos de 2 minutos.' },
  { num: '02', titulo: 'Configure seu negócio', desc: 'Adicione produtos, revendedoras e personalize seu catálogo.' },
  { num: '03', titulo: 'Comece a vender', desc: 'Gerencie vendas, estoque e revendedoras de forma profissional.' },
];

const FEATURES = [
  { icon: BarChart3, title: 'Dashboard Inteligente', desc: 'Vendas, estoque e métricas em tempo real.' },
  { icon: ShoppingCart, title: 'PDV Completo', desc: 'Leitor de barras, descontos e múltiplos pagamentos.' },
  { icon: Package, title: 'Gestão de Estoque', desc: 'Alertas de reposição e histórico de preços.' },
  { icon: Users, title: 'Revendedoras', desc: 'Maletas, comissões e portal exclusivo.' },
  { icon: MessageSquare, title: 'WhatsApp', desc: 'Catálogos, cobranças e notificações.' },
  { icon: Bot, title: 'Assistente IA', desc: 'Chatbot que auxilia nas vendas 24h.' },
  { icon: Store, title: 'Loja Virtual', desc: 'E-commerce com PIX, cartão e boleto.' },
  { icon: TrendingUp, title: 'Relatórios', desc: 'Lucratividade, ranking e desempenho.' },
  { icon: Shield, title: 'Segurança Total', desc: 'Dados isolados por empresa com backup.' },
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
    <div className="min-h-screen overflow-x-hidden bg-[#FFF5F5]" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 border-b border-rose-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Nexsiles" className="h-7 w-auto" />
            <span className="text-lg font-bold text-rose-700">Nexsiles</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-rose-800/70 font-medium">
            <a href="#vantagens" className="hover:text-rose-600 transition-colors">Vantagens</a>
            <a href="#funcionalidades" className="hover:text-rose-600 transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-rose-600 transition-colors">Planos</a>
            <a href="#depoimentos" className="hover:text-rose-600 transition-colors">Depoimentos</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-rose-700 hover:text-rose-800 hover:bg-rose-50" onClick={() => navigate('/auth')}>Entrar</Button>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200" onClick={() => navigate('/auth')}>
              Teste Grátis <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <button className="md:hidden p-2 -mr-2 text-rose-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-rose-100 px-4 py-4 space-y-3">
            <a href="#vantagens" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-rose-700 text-base">Vantagens</a>
            <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-rose-700 text-base">Funcionalidades</a>
            <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-rose-700 text-base">Planos</a>
            <a href="#depoimentos" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-rose-700 text-base">Depoimentos</a>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 border-rose-300 text-rose-700" onClick={() => navigate('/auth')}>Entrar</Button>
              <Button className="flex-1 bg-rose-500 text-white" onClick={() => navigate('/auth')}>Teste Grátis</Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex items-center pt-14 pb-20 sm:pb-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50" />
        <div className="absolute top-20 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-pink-200/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            {/* Text */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="text-center lg:text-left order-2 lg:order-1">
              <Badge className="mb-3 sm:mb-4 bg-rose-100 text-rose-600 border-rose-200 px-2.5 py-0.5 text-[11px] sm:text-sm font-medium">
                <Gem className="w-3 h-3 mr-1" /> Sistema para Semijoias
              </Badge>
              <h1 className="text-[1.65rem] leading-[1.15] sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-rose-950 mb-3 sm:mb-6">
                Complete sua venda e <span className="text-rose-500">multiplique seus lucros</span>
              </h1>
              <p className="text-sm sm:text-lg text-rose-800/60 max-w-lg mx-auto lg:mx-0 mb-5 sm:mb-8 leading-relaxed">
                Dashboard, PDV, estoque, revendedoras, loja virtual e WhatsApp — tudo em um só lugar.
              </p>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3 justify-center lg:justify-start">
                <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white text-sm sm:text-lg px-6 py-5 sm:px-8 sm:py-6 rounded-full shadow-xl shadow-rose-200/50"
                  onClick={() => navigate('/auth')}>
                  Começar Grátis <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
                </Button>
                <Button size="lg" variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-50 text-sm sm:text-lg px-6 py-5 sm:px-8 sm:py-6 rounded-full"
                  onClick={scrollToPlanos}>
                  Ver Planos
                </Button>
              </div>
              <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5 text-[11px] sm:text-sm text-rose-600/50">
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Sem cartão</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> 3 dias grátis</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Cancele quando quiser</span>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="order-1 lg:order-2 flex justify-center">
              <div className="relative">
                <div className="w-52 sm:w-80 lg:w-[420px] aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-rose-300/30 border-[3px] sm:border-4 border-white">
                  <img src={personaHero} alt="Semijoias premium rose gold" className="w-full h-full object-cover" loading="eager" />
                </div>
                <div className="absolute -bottom-3 -left-3 sm:-bottom-5 sm:-left-5 bg-white rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-xl border border-rose-100">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-[10px] text-rose-400 font-medium">Vendas</p>
                      <p className="text-xs sm:text-sm font-bold text-rose-950">+340%</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-rose-500 text-white rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg">
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold">
                    <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> IA Integrada
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vantagens */}
      <section id="vantagens" className="py-12 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 sm:mb-16">
            <Badge className="mb-3 bg-rose-100 text-rose-600 border-rose-200">Vantagens</Badge>
            <h2 className="text-xl sm:text-4xl font-bold text-rose-950 mb-2 sm:mb-3">Conheça algumas de nossas vantagens</h2>
            <p className="text-rose-600/50 text-xs sm:text-base max-w-2xl mx-auto">Por que centenas de empreendedoras escolhem o Nexsiles.</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {VANTAGENS.map((v, i) => (
              <motion.div key={v.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.15}>
                <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100 hover:shadow-lg hover:shadow-rose-100/50 transition-all duration-300 h-full">
                  <CardContent className="p-3 sm:p-6 text-center">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                      <v.icon className="w-5 h-5 sm:w-7 sm:h-7 text-rose-500" />
                    </div>
                    <h3 className="text-xs sm:text-lg font-bold text-rose-950 mb-1 sm:mb-2">{v.title}</h3>
                    <p className="text-[10px] sm:text-sm text-rose-700/50 leading-relaxed hidden sm:block">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quem Usa - Personas */}
      <section className="py-12 sm:py-24 bg-rose-50/50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-10 sm:mb-16">
            <Badge className="mb-3 bg-rose-100 text-rose-600 border-rose-200">Para Quem</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-rose-950 mb-3">Feito para quem vive de semijoias</h2>
            <p className="text-rose-600/50 text-sm sm:text-base max-w-2xl mx-auto">De lojistas a revendedoras, o Nexsiles se adapta ao seu modelo de negócio.</p>
          </motion.div>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:hidden scrollbar-hide">
            {[
              { img: personaLojista, name: 'Lojista', desc: 'PDV, estoque e relatórios de lucratividade.' },
              { img: personaRevendedora, name: 'Revendedora', desc: 'Maletas, vendas e comissões em tempo real.' },
              { img: personaCliente, name: 'E-commerce', desc: 'Loja virtual com checkout integrado.' },
            ].map((persona) => (
              <div key={persona.name} className="snap-center flex-shrink-0 w-[220px]">
                <Card className="bg-white border-rose-100 overflow-hidden h-full">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={persona.img} alt={persona.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <CardContent className="p-3 text-center">
                    <h3 className="text-sm font-bold text-rose-950 mb-1">{persona.name}</h3>
                    <p className="text-[11px] text-rose-700/50 leading-relaxed">{persona.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-rose-400/40 mt-1 sm:hidden">← Deslize →</p>
          <div className="hidden sm:grid sm:grid-cols-3 gap-6">
            {[
              { img: personaLojista, name: 'Lojista', desc: 'Gerencie sua loja física com PDV, estoque inteligente e relatórios detalhados de lucratividade.' },
              { img: personaRevendedora, name: 'Revendedora', desc: 'Acompanhe suas maletas, vendas e comissões em tempo real direto do celular.' },
              { img: personaCliente, name: 'E-commerce', desc: 'Venda online com loja virtual completa, checkout integrado e gestão de pedidos.' },
            ].map((persona, i) => (
              <motion.div key={persona.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.2}>
                <Card className="bg-white border-rose-100 hover:shadow-xl hover:shadow-rose-100/50 transition-all duration-300 overflow-hidden h-full group">
                  <div className="aspect-square overflow-hidden">
                    <img src={persona.img} alt={persona.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <CardContent className="p-5 text-center">
                    <h3 className="text-lg font-bold text-rose-950 mb-2">{persona.name}</h3>
                    <p className="text-sm text-rose-700/50 leading-relaxed">{persona.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Passos - Como Funciona */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-rose-400 to-rose-500 text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3">Veja como é fácil começar</h2>
            <p className="text-white/70 text-sm sm:text-base">3 passos simples para transformar sua gestão.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {PASSOS.map((p, i) => (
              <motion.div key={p.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.2}
                className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                  <span className="text-2xl font-extrabold">{p.num}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{p.titulo}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{p.desc}</p>
                {i < 2 && (
                  <div className="hidden sm:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-white/20" />
                )}
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="text-center mt-10">
            <Button size="lg" className="bg-white text-rose-500 hover:bg-rose-50 text-base sm:text-lg px-8 py-6 rounded-full shadow-xl font-bold"
              onClick={() => navigate('/auth')}>
              Criar Minha Conta Grátis <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Screenshot */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 sm:mb-16">
            <Badge className="mb-3 bg-rose-100 text-rose-600 border-rose-200">Dashboard</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-rose-950 mb-3">Novidades todo mês</h2>
            <p className="text-rose-600/50 text-sm sm:text-base max-w-2xl mx-auto">Tudo o que você precisa num painel intuitivo e bonito.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-rose-100 shadow-2xl shadow-rose-200/30">
            <img src={dashboardMockup} alt="Dashboard Nexsiles" className="w-full" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-16 sm:py-24 bg-rose-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 sm:mb-16">
            <Badge className="mb-3 bg-rose-100 text-rose-600 border-rose-200">Funcionalidades</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-rose-950 mb-3">Tudo em um só sistema</h2>
            <p className="text-rose-600/50 text-sm sm:text-base max-w-2xl mx-auto">Módulos integrados para gerir seu negócio de ponta a ponta.</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} custom={i * 0.15}>
                <Card className="bg-white border-rose-100 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-100/50 transition-all duration-300 h-full">
                  <CardContent className="p-3 sm:p-5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 flex items-center justify-center mb-3">
                      <f.icon className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-rose-950 mb-1">{f.title}</h3>
                    <p className="text-xs sm:text-sm text-rose-600/50 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile + IA Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="flex justify-center order-1 lg:order-2">
              <div className="relative w-56 sm:w-72 lg:w-80">
                <img src={mobileMockup} alt="Loja Virtual Nexsiles - Mobile" className="w-full rounded-2xl sm:rounded-3xl shadow-2xl shadow-rose-200/40" loading="lazy" />
                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-rose-500 text-white rounded-xl sm:rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4" /> IA Integrada
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="order-2 lg:order-1">
              <Badge className="mb-3 bg-rose-100 text-rose-600 border-rose-200">Loja Virtual + IA</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold text-rose-950 mb-4 sm:mb-6">Venda online com inteligência artificial</h2>
              <p className="text-rose-700/50 mb-6 text-sm sm:text-base leading-relaxed">
                Sua loja virtual com checkout PIX, cartão e boleto. 
                O assistente IA auxilia no atendimento via WhatsApp automaticamente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Chatbot IA no WhatsApp', 'Loja com checkout completo', 'Catálogo compartilhável', 'Carrinho abandonado'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-sm text-rose-800/60">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" ref={planosRef} className="py-16 sm:py-24 bg-rose-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 sm:mb-16">
            <Badge className="mb-3 bg-rose-100 text-rose-600 border-rose-200">Planos</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-rose-950 mb-3">Escolha o plano ideal</h2>
            <p className="text-rose-600/50 text-sm sm:text-base max-w-xl mx-auto">3 dias de teste grátis. Cancele quando quiser.</p>
          </motion.div>

          {/* Mobile: horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 lg:hidden scrollbar-hide">
            {PLANOS.map((plano) => (
              <div key={plano.nome} className="snap-center flex-shrink-0 w-[280px]">
                <Card className={`relative h-full bg-white border-rose-100 ${plano.destaque ? 'border-rose-400 shadow-xl shadow-rose-200/40 ring-2 ring-rose-400' : ''}`}>
                  {plano.destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-rose-500 text-white border-0 px-3 text-xs shadow-lg">
                        <Star className="w-3 h-3 mr-1" /> Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-5 pt-7 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-1">
                      <plano.icon className="w-4 h-4 text-rose-500" />
                      <Badge variant="outline" className="text-[10px] border-rose-200 text-rose-500">{plano.tier}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-rose-950 mb-3">{plano.nome}</h3>
                    <div className="mb-5">
                      <span className="text-xs text-rose-400">R$</span>
                      <span className="text-3xl font-extrabold text-rose-950 mx-1">{plano.preco}</span>
                      <span className="text-xs text-rose-400">/mês</span>
                    </div>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plano.recursos.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-xs text-rose-700/60">
                          <Check className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                          {r}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full text-sm rounded-full ${plano.destaque ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg' : 'bg-rose-50 hover:bg-rose-100 text-rose-700'}`}
                      onClick={() => navigate('/auth')}
                    >
                      Experimentar Grátis
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-rose-400/50 mt-2 lg:hidden">← Deslize para ver todos os planos →</p>

          {/* Desktop: grid */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-5">
            {PLANOS.map((plano, i) => (
              <motion.div key={plano.nome} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.3}>
                <Card className={`relative h-full bg-white border-rose-100 ${plano.destaque ? 'border-rose-400 shadow-xl shadow-rose-200/40 ring-2 ring-rose-400 scale-105' : ''}`}>
                  {plano.destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-rose-500 text-white border-0 px-4 shadow-lg">
                        <Star className="w-3 h-3 mr-1" /> Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-1">
                      <plano.icon className="w-5 h-5 text-rose-500" />
                      <Badge variant="outline" className="text-xs border-rose-200 text-rose-500">{plano.tier}</Badge>
                    </div>
                    <h3 className="text-xl font-bold text-rose-950 mb-4">{plano.nome}</h3>
                    <div className="mb-6">
                      <span className="text-sm text-rose-400">R$</span>
                      <span className="text-4xl font-extrabold text-rose-950 mx-1">{plano.preco}</span>
                      <span className="text-sm text-rose-400">/mês</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plano.recursos.map((r) => (
                        <li key={r} className="flex items-start gap-2.5 text-sm text-rose-700/60">
                          <Check className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                          {r}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full rounded-full ${plano.destaque ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg' : 'bg-rose-50 hover:bg-rose-100 text-rose-700'}`}
                      onClick={() => navigate('/auth')}
                    >
                      Experimentar Grátis
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-rose-400/50 mt-6 sm:mt-8">
            * Após o teste, cobrança mensal. Cancele a qualquer momento antes sem custo.
          </p>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 sm:mb-16">
            <Badge className="mb-3 bg-rose-100 text-rose-600 border-rose-200">Depoimentos</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-rose-950 mb-3">O que nossas clientes dizem</h2>
            <p className="text-rose-500/40 text-xs sm:text-sm">Relatos reais. Resultados podem variar.</p>
          </motion.div>

          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:hidden scrollbar-hide">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="snap-center flex-shrink-0 w-[280px]">
                <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100 h-full">
                  <CardContent className="p-5">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-rose-700/60 text-xs leading-relaxed mb-4">"{t.text}"</p>
                    <div>
                      <p className="font-semibold text-rose-950 text-sm">{t.name}</p>
                      <p className="text-[11px] text-rose-500/50">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.3}>
                <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100 h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-rose-700/60 text-sm leading-relaxed mb-6">"{t.text}"</p>
                    <div>
                      <p className="font-semibold text-rose-950">{t.name}</p>
                      <p className="text-xs text-rose-500/50">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 sm:py-24 relative overflow-hidden bg-gradient-to-br from-rose-400 via-rose-500 to-pink-500 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-pink-200 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-5 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-2xl sm:text-5xl font-extrabold mb-4 sm:mb-6">Pronta para organizar seu negócio?</h2>
            <p className="text-sm sm:text-lg text-white/70 mb-6 sm:mb-10 max-w-xl mx-auto">
              Experimente gratuitamente por 3 dias e descubra como o Nexsiles pode multiplicar seus lucros.
            </p>
            <Button size="lg" className="w-full sm:w-auto bg-white text-rose-500 hover:bg-rose-50 text-base sm:text-lg px-8 py-5 sm:py-6 rounded-full shadow-xl font-bold"
              onClick={() => navigate('/auth')}>
              Começar Meu Teste Grátis <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-rose-100 py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Nexsiles" className="h-6 w-auto" />
              <span className="font-bold text-rose-800 text-sm">Nexsiles</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-rose-600/50">
              <a href="#vantagens" className="hover:text-rose-600">Vantagens</a>
              <a href="#funcionalidades" className="hover:text-rose-600">Funcionalidades</a>
              <a href="#planos" className="hover:text-rose-600">Planos</a>
              <a href="#depoimentos" className="hover:text-rose-600">Depoimentos</a>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-rose-100">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="flex flex-wrap justify-center gap-4 text-xs text-rose-500/50">
                <a href="/politica-privacidade" className="hover:text-rose-600 underline">Política de Privacidade</a>
                <a href="/termos-de-uso" className="hover:text-rose-600 underline">Termos de Uso</a>
                <a href="mailto:contato@nexsiles.com.br" className="hover:text-rose-600">Contato</a>
              </div>
              <p className="text-[11px] text-rose-400/40">© {new Date().getFullYear()} Nexsiles. Todos os direitos reservados.</p>
            </div>
            <p className="text-[10px] sm:text-xs text-rose-400/30 text-center mt-4 max-w-xl mx-auto leading-relaxed">
              Nexsiles é uma plataforma de gestão de semijoias. Resultados podem variar. 
              Este site não faz parte do Facebook/Meta Inc.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white/95 to-transparent sm:hidden">
        <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-full text-sm font-semibold shadow-xl shadow-rose-200/50"
          onClick={() => navigate('/auth')}>
          Teste Grátis 3 Dias <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
