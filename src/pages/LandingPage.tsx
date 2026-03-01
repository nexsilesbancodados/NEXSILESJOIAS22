import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  BarChart3, ShoppingCart, Users, Package, Zap, Shield, Star,
  MessageSquare, TrendingUp, Smartphone, ArrowRight, Check,
  Sparkles, Store, Bot, Crown, ChevronDown, Menu, X, Play,
  Heart, Gift, Gem, Clock, HeadphonesIcon, DollarSign, ChevronLeft, ChevronRight,
  AlertTriangle, XCircle, CheckCircle, Percent, Timer, Lock, Eye, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dashboardMockup from '@/assets/landing-dashboard-mockup.jpg';
import mobileMockup from '@/assets/landing-mobile-mockup.jpg';
import heroSlide1 from '@/assets/hero-slide-1.jpg';
import heroSlide2 from '@/assets/hero-slide-2.jpg';
import heroSlide3 from '@/assets/hero-slide-3.jpg';
import devicesMockup from '@/assets/landing-devices-mockup.jpg';
import personaLojista from '@/assets/landing-persona-lojista.jpg';
import personaRevendedora from '@/assets/landing-persona-revendedora.jpg';
import personaCliente from '@/assets/landing-persona-cliente.jpg';
import stepsBg from '@/assets/landing-steps-bg.jpg';
import featuresBg from '@/assets/landing-features-bg.jpg';
import ctaBg from '@/assets/landing-cta-bg.jpg';
import logo from '@/assets/logo.png';
import dashboardInsights from '@/assets/landing-dashboard-insights.png';
import dashboardCharts from '@/assets/landing-dashboard-charts.png';
import pecasMockup from '@/assets/landing-pecas-mockup.png';
import pdvMockup from '@/assets/landing-pdv-mockup.png';
import lojaMockup from '@/assets/landing-loja-mockup.png';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

/* ─── PAIN POINTS (Agitate) ─── */
const DORES = [
  { icon: XCircle, text: 'Controla estoque em planilha e perde peças toda semana?' },
  { icon: XCircle, text: 'Suas revendedoras pedem fotos e preços no WhatsApp o dia todo?' },
  { icon: XCircle, text: 'Não sabe quanto realmente lucra em cada venda?' },
  { icon: XCircle, text: 'Quer vender online mas não tem loja virtual?' },
];

/* ─── SOLUTION FEATURES ─── */
const FEATURES = [
  { icon: BarChart3, title: 'Dashboard Inteligente', desc: 'Vendas, estoque e métricas em tempo real com insights automáticos.' },
  { icon: ShoppingCart, title: 'PDV Completo', desc: 'Leitor de barras, descontos, múltiplos pagamentos e recibo digital.' },
  { icon: Package, title: 'Gestão de Estoque', desc: 'Alertas de reposição, histórico de preços e importação CSV.' },
  { icon: Users, title: 'Revendedoras & Maletas', desc: 'Portal exclusivo, comissões automáticas e controle de consignação.' },
  { icon: Bot, title: 'Assistente IA 24h', desc: 'Chatbot no WhatsApp que vende, agenda e atende automaticamente.' },
  { icon: Store, title: 'Loja Virtual Premium', desc: 'E-commerce com PIX, cartão, boleto, SEO e editor visual.' },
  { icon: MessageSquare, title: 'WhatsApp Integrado', desc: 'Catálogos, cobranças, lembretes e broadcast automático.' },
  { icon: TrendingUp, title: 'Relatórios Completos', desc: 'Lucratividade, ranking de vendedoras e desempenho por período.' },
  { icon: Shield, title: 'Segurança Total', desc: 'Dados isolados por empresa, backup automático e criptografia.' },
];

/* ─── UPDATED PLANS (correct pricing) ─── */
const PLANOS = [
  {
    nome: 'E-commerce',
    tier: 'E-COMMERCE',
    preco: 129,
    
    destaque: false,
    icon: Store,
    desc: 'Ideal para quem quer apenas vender online',
    recursos: ['Loja virtual completa', 'Checkout PIX, Cartão, Boleto', 'Gestão de estoque', 'Carrinho com cupons', 'Cálculo de frete automático', 'SEO otimizado', 'Catálogo digital compartilhável'],
  },
  {
    nome: 'Bronze',
    tier: 'BRONZE',
    preco: 189,
    
    destaque: false,
    icon: Sparkles,
    desc: 'Gestão completa sem Loja Virtual e IA',
    recursos: ['Dashboard inteligente', 'PDV completo', 'Estoque ilimitado', 'Revendedoras & Maletas', 'Catálogos digitais', 'Relatórios completos', 'Programa de fidelidade', 'Integração WhatsApp'],
  },
  {
    nome: 'Prata',
    tier: 'PRATA',
    preco: 239,
    
    destaque: true,
    icon: Bot,
    desc: 'O mais vendido! Gestão + IA integrada',
    recursos: ['Tudo do plano Bronze', 'Assistente IA no WhatsApp', 'Chatbot integrado 24h', 'Respostas automáticas', 'Sugestões de vendas por IA', 'Análise de estoque inteligente', 'Atendimento automatizado', 'Relatórios com IA'],
  },
  {
    nome: 'Diamante',
    tier: 'DIAMANTE',
    preco: 299,
    
    destaque: false,
    icon: Crown,
    desc: 'Acesso completo — Gestão + IA + Loja Virtual',
    recursos: ['Tudo do plano Prata', 'Loja virtual completa', 'Checkout integrado', 'Carrinho com cupons', 'Gestão de pedidos online', 'Cálculo de frete', 'SEO otimizado', 'Campanhas promocionais'],
  },
];

const TESTIMONIALS = [
  { name: 'Carla M.', role: 'Loja de semijoias', text: 'Parei de perder horas controlando estoque no caderno. Agora sei exatamente quanto tenho e quanto lucro.', img: personaLojista, color: 'from-rose-400 to-pink-500' },
  { name: 'Fernanda S.', role: 'Revendedora', text: 'O portal é muito prático. Minhas revendedoras veem peças, vendem e acompanham comissões sozinhas.', img: personaRevendedora, color: 'from-pink-400 to-rose-500' },
  { name: 'Juliana R.', role: 'E-commerce de joias', text: 'A IA no WhatsApp atende minhas clientes de madrugada! Minhas vendas aumentaram 40% no primeiro mês.', img: personaCliente, color: 'from-amber-400 to-rose-400' },
  { name: 'Amanda L.', role: 'Atacadista', text: 'Reduzi 80% das mensagens no WhatsApp! Agora as revendedoras consultam tudo pelo portal.', img: personaLojista, color: 'from-rose-500 to-fuchsia-400' },
  { name: 'Patrícia K.', role: 'Loja + E-commerce', text: 'Gerencio loja física e virtual num só lugar. Não troco por nada!', img: personaRevendedora, color: 'from-pink-500 to-amber-400' },
];

const PASSOS = [
  { num: '01', titulo: 'Crie sua conta', desc: 'Cadastro rápido em menos de 2 minutos. Comece agora.', icon: Smartphone },
  { num: '02', titulo: 'Configure seu negócio', desc: 'Importe peças, adicione revendedoras e personalize.', icon: Package },
  { num: '03', titulo: 'Comece a lucrar', desc: 'Venda, gerencie e acompanhe tudo de qualquer lugar.', icon: TrendingUp },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const planosRef = useRef<HTMLDivElement>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroDir, setHeroDir] = useState(0);
  

  const heroSlides = [
    { img: heroSlide1, title: 'O sistema nº1 para semijoias no Brasil', subtitle: 'Estoque, PDV, revendedoras, loja virtual e IA — tudo num só lugar. Já usado por centenas de empreendedoras.' },
    { img: heroSlide2, title: 'Pare de perder vendas por falta de controle', subtitle: 'Dashboard, relatórios de lucratividade e alertas automáticos para nunca mais ter prejuízo.' },
    { img: heroSlide3, title: 'Sua loja vende sozinha com IA', subtitle: 'Assistente inteligente no WhatsApp que atende, vende e agenda — 24 horas por dia, 7 dias por semana.' },
  ];

  const nextHero = useCallback(() => { setHeroDir(1); setHeroIndex(i => (i + 1) % heroSlides.length); }, [heroSlides.length]);
  useEffect(() => { const t = setInterval(nextHero, 5000); return () => clearInterval(t); }, [nextHero]);

  const scrollToPlanos = () => planosRef.current?.scrollIntoView({ behavior: 'smooth' });
  const goToAuth = () => navigate('/auth');

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif", background: 'linear-gradient(180deg, #FFF0F0 0%, #FFE4E6 15%, #FFF5F5 30%, #FECDD3 50%, #FFF1F2 70%, #FFE4E6 85%, #FFF5F5 100%)', backgroundAttachment: 'fixed', WebkitTextSizeAdjust: '100%' }}>
      
      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 border-b border-rose-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-12 sm:h-16">
          <div className="flex items-center gap-1.5">
            <img src={logo} alt="Nexsiles" className="h-6 sm:h-7 w-auto" />
            <span className="text-base sm:text-lg font-bold text-rose-700">Nexsiles</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-rose-800/70 font-medium">
            <a href="#problema" className="hover:text-rose-600 transition-colors">Por que?</a>
            <a href="#funcionalidades" className="hover:text-rose-600 transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-rose-600 transition-colors">Planos</a>
            <a href="#depoimentos" className="hover:text-rose-600 transition-colors">Depoimentos</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button className="bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200" onClick={goToAuth}>
              Assinar Agora <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <button className="md:hidden p-1.5 -mr-1 text-rose-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-white border-t border-rose-100 px-3 py-3 space-y-2">
            <a href="#problema" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-rose-700 text-sm">Por que?</a>
            <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-rose-700 text-sm">Funcionalidades</a>
            <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-rose-700 text-sm">Planos</a>
            <a href="#depoimentos" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-rose-700 text-sm">Depoimentos</a>
            <Button className="w-full bg-rose-500 text-white text-sm py-2.5 mt-1" onClick={goToAuth}>Assinar Agora</Button>
          </motion.div>
        )}
      </nav>

      {/* ═══ HERO — Sales-focused ═══ */}
      <section className="relative w-full h-[85svh] sm:h-[100svh] overflow-hidden">
        <AnimatePresence initial={false} custom={heroDir} mode="popLayout">
          <motion.div key={heroIndex} custom={heroDir}
            variants={{
              enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
            }}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="absolute inset-0">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroSlides[heroIndex].img})` }} />
            <div className="absolute inset-0 bg-gradient-to-r from-rose-950/85 via-rose-900/60 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-12 lg:px-24 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} key={`text-${heroIndex}`}>
            <Badge className="mb-3 bg-rose-500/20 text-white border-rose-400/30 backdrop-blur-sm px-2.5 py-1 text-[10px] sm:text-sm font-semibold">
              <Rocket className="w-3 h-3 mr-1" /> A plataforma #1 para semijoias
            </Badge>
            <h1 className="text-xl sm:text-4xl lg:text-6xl font-extrabold text-white mb-2 sm:mb-5 leading-[1.1] drop-shadow-lg"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {heroSlides[heroIndex].title}
            </h1>
            <p className="text-xs sm:text-xl text-white/85 max-w-xl mb-4 sm:mb-8 leading-relaxed">
              {heroSlides[heroIndex].subtitle}
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-4">
              <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-lg px-5 py-4 sm:px-10 sm:py-7 rounded-full shadow-xl shadow-rose-500/30 font-bold"
                onClick={goToAuth}>
                Quero Assinar Agora <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 text-xs sm:text-lg px-5 py-4 sm:px-8 sm:py-7 rounded-full backdrop-blur-sm"
                onClick={scrollToPlanos}>
                Ver Planos e Preços
              </Button>
            </div>
            <div className="mt-3 sm:mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-sm text-white/70">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> Pagamento seguro</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> Acesso imediato</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> Suporte dedicado</span>
            </div>
          </motion.div>
        </div>

        <button onClick={() => { setHeroDir(-1); setHeroIndex(i => (i - 1 + heroSlides.length) % heroSlides.length); }}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/15 backdrop-blur-sm hover:bg-white/30 rounded-full p-1.5 sm:p-3 transition-colors">
          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </button>
        <button onClick={() => { setHeroDir(1); setHeroIndex(i => (i + 1) % heroSlides.length); }}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/15 backdrop-blur-sm hover:bg-white/30 rounded-full p-1.5 sm:p-3 transition-colors">
          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => { setHeroDir(i > heroIndex ? 1 : -1); setHeroIndex(i); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`} />
          ))}
        </div>
      </section>

      {/* ═══ SOCIAL PROOF BAR ═══ */}
      <section className="py-4 sm:py-8 bg-white border-b border-rose-100">
        <div className="max-w-5xl mx-auto px-3 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-12">
          {[
            { num: '500+', label: 'Empreendedoras' },
            { num: '50k+', label: 'Peças' },
            { num: '4.9', label: 'Satisfação', suffix: '⭐' },
            { num: '24h', label: 'Suporte' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-base sm:text-2xl font-extrabold text-rose-600">{s.num} {s.suffix || ''}</p>
              <p className="text-[8px] sm:text-xs text-rose-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PAIN POINTS (Agitate) ═══ */}
      <section id="problema" className="py-10 sm:py-20">
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-6 sm:mb-12">
            <Badge className="mb-2 bg-red-100 text-red-600 border-red-200 text-[10px] sm:text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" /> Você se identifica?
            </Badge>
            <h2 className="text-xl sm:text-4xl font-bold text-rose-950 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Se você controla semijoias assim, está <span className="text-red-500">perdendo dinheiro</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-6">
            {DORES.map((d, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.1}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50/80 border border-red-100">
                <d.icon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-800/80">{d.text}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.5}
            className="text-center p-4 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
            <CheckCircle className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base sm:text-xl font-bold text-emerald-900 mb-1.5">A solução existe — e é simples.</h3>
            <p className="text-xs text-emerald-700/70 max-w-lg mx-auto mb-3">
              O Nexsiles resolve todos esses problemas em um só sistema.
            </p>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-5 py-2.5 text-xs sm:text-sm shadow-lg" onClick={goToAuth}>
              Quero Resolver Agora <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══ APP SCREENSHOTS (Proof) ═══ */}
      <section className="py-10 sm:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-5 sm:mb-14">
            <Badge className="mb-2 bg-rose-100 text-rose-600 border-rose-200 text-[10px] sm:text-xs">
              <Eye className="w-3 h-3 mr-1" /> Veja com seus olhos
            </Badge>
            <h2 className="text-xl sm:text-4xl font-bold text-rose-950 mb-1.5">Isso é o que você vai usar</h2>
            <p className="text-rose-600/50 text-[11px] sm:text-base">Capturas reais do sistema.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.1}
            className="relative rounded-xl sm:rounded-3xl overflow-hidden border border-rose-100 shadow-xl shadow-rose-200/30 mb-4 sm:mb-6">
            <img src={dashboardMockup} alt="Dashboard Nexsiles" className="w-full" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-6">
              <Badge className="bg-rose-500 text-white border-0 shadow-lg text-[9px] sm:text-sm">📊 Dashboard completo</Badge>
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {[
              { img: dashboardInsights, label: '💡 Insights' },
              { img: pecasMockup, label: '💎 Estoque' },
              { img: pdvMockup, label: '🛒 PDV' },
              { img: dashboardCharts, label: '📈 Gráficos' },
              { img: lojaMockup, label: '🏪 Loja' },
              { img: devicesMockup, label: '📱 Mobile' },
            ].map((item, i) => (
              <motion.div key={item.label} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }} variants={fadeUp} custom={i * 0.05}
                className="group relative rounded-lg sm:rounded-xl overflow-hidden border border-rose-100 shadow-sm">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={item.img} alt={item.label} className="w-full h-full object-cover object-top" loading="lazy" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-1 sm:p-3 bg-gradient-to-t from-rose-950/70 to-transparent">
                  <span className="text-white text-[8px] sm:text-xs font-medium">{item.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="funcionalidades" className="py-10 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img src={featuresBg} alt="" className="w-full h-full object-cover opacity-5" loading="lazy" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-5 sm:mb-14">
            <Badge className="mb-2 bg-rose-100 text-rose-600 border-rose-200 text-[10px] sm:text-xs">Funcionalidades</Badge>
            <h2 className="text-xl sm:text-4xl font-bold text-rose-950 mb-1.5">Tudo num só lugar</h2>
            <p className="text-rose-600/50 text-[11px] sm:text-base">+20 módulos integrados.</p>
          </motion.div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }} variants={fadeUp} custom={i * 0.05}>
                <Card className="bg-white border-rose-100 h-full">
                  <CardContent className="p-2 sm:p-5">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-rose-50 flex items-center justify-center mb-1.5 sm:mb-3">
                      <f.icon className="w-4 h-4 sm:w-6 sm:h-6 text-rose-500" />
                    </div>
                    <h3 className="text-[10px] sm:text-base font-bold text-rose-950 mb-0.5 leading-tight">{f.title}</h3>
                    <p className="text-[8px] sm:text-sm text-rose-600/50 leading-snug hidden sm:block">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="text-center mt-6 sm:mt-12">
            <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-6 py-3 sm:px-8 sm:py-6 shadow-xl font-bold text-xs sm:text-base" onClick={goToAuth}>
              Escolher Meu Plano <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-10 sm:py-24 relative overflow-hidden text-white">
        <div className="absolute inset-0">
          <img src={stepsBg} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-rose-500/90" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 sm:mb-20">
            <h2 className="text-xl sm:text-5xl font-extrabold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Comece em 2 minutos</h2>
            <p className="text-white/70 text-xs sm:text-base">3 passos simples.</p>
          </motion.div>
          <div className="relative">
            <div className="hidden sm:block absolute top-[60px] left-[16%] right-[16%] border-t-[3px] border-dashed border-white/25 z-0" />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-6 relative z-10">
              {PASSOS.map((p, i) => {
                const isCenter = i === 1;
                return (
                  <div key={p.num} className="flex flex-col items-center text-center">
                    <div className={`relative mb-3 sm:mb-6 ${isCenter ? 'sm:-mt-4' : ''}`}>
                      <div className="absolute -top-2 -right-2 z-20 w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-extrabold text-[10px] sm:text-sm shadow-lg bg-white text-rose-500">{p.num}</div>
                      <div className={`w-16 h-16 sm:w-[120px] sm:h-[120px] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl ${isCenter ? 'bg-white/25 backdrop-blur-md border-2 border-white/40' : 'bg-white/15 backdrop-blur-sm border border-white/25'}`}>
                        <p.icon className="w-7 h-7 sm:w-12 sm:h-12 text-white drop-shadow-lg" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-xl font-bold mb-1">{p.titulo}</h3>
                    <p className="text-white/70 text-[9px] sm:text-sm leading-snug max-w-[220px]">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="text-center mt-8 sm:mt-16">
            <Button className="bg-white text-rose-500 hover:bg-rose-50 text-xs sm:text-lg px-6 py-3 sm:px-8 sm:py-6 rounded-full shadow-xl font-bold" onClick={goToAuth}>
              Quero Começar Agora <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="planos" ref={planosRef} className="py-10 sm:py-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-5 sm:mb-10">
            <Badge className="mb-2 bg-rose-100 text-rose-600 border-rose-200 text-[10px] sm:text-xs">Planos & Preços</Badge>
            <h2 className="text-xl sm:text-4xl font-bold text-rose-950 mb-1.5">Invista no seu negócio</h2>
            <p className="text-rose-600/50 text-[11px] sm:text-base max-w-xl mx-auto">Escolha o plano ideal e comece hoje.</p>
          </motion.div>

          {/* Mobile: scroll */}
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-3 px-3 lg:hidden scrollbar-hide">
            {PLANOS.map((plano) => (
              <div key={plano.nome} className="snap-center flex-shrink-0 w-[240px]">
                <Card className={`relative h-full bg-white border-rose-100 ${plano.destaque ? 'border-rose-400 shadow-xl shadow-rose-200/40 ring-2 ring-rose-400' : ''}`}>
                  {plano.destaque && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-rose-500 text-white border-0 px-2 text-[9px] shadow-lg"><Star className="w-2.5 h-2.5 mr-0.5" /> Mais Vendido</Badge>
                    </div>
                  )}
                  <CardContent className="p-3.5 pt-5 flex flex-col h-full">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <plano.icon className="w-3.5 h-3.5 text-rose-500" />
                      <Badge variant="outline" className="text-[9px] border-rose-200 text-rose-500 px-1.5 py-0">{plano.tier}</Badge>
                    </div>
                    <h3 className="text-sm font-bold text-rose-950 mb-0.5">{plano.nome}</h3>
                    <p className="text-[9px] text-rose-500/50 mb-2">{plano.desc}</p>
                    <div className="mb-3">
                      <span className="text-[10px] text-rose-400">R$</span>
                      <span className="text-2xl font-extrabold text-rose-950 mx-0.5">{plano.preco}</span>
                      <span className="text-[10px] text-rose-400">/mês</span>
                    </div>
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {plano.recursos.map((r) => (
                        <li key={r} className="flex items-start gap-1.5 text-[10px] text-rose-700/60">
                          <Check className="w-3 h-3 text-rose-500 flex-shrink-0 mt-0" />{r}
                        </li>
                      ))}
                    </ul>
                    <Button className={`w-full text-xs rounded-full py-2 ${plano.destaque ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg' : 'bg-rose-50 hover:bg-rose-100 text-rose-700'}`} onClick={goToAuth}>
                      Assinar {plano.nome}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          <p className="text-center text-[9px] text-rose-400/50 mt-1.5 lg:hidden">← Deslize para ver todos →</p>

          {/* Desktop: grid */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-5">
            {PLANOS.map((plano, i) => (
              <motion.div key={plano.nome} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.15}>
                <Card className={`relative h-full bg-white border-rose-100 ${plano.destaque ? 'border-rose-400 shadow-xl shadow-rose-200/40 ring-2 ring-rose-400 scale-105' : ''}`}>
                  {plano.destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-rose-500 text-white border-0 px-4 shadow-lg"><Star className="w-3 h-3 mr-1" /> Mais Vendido</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-1">
                      <plano.icon className="w-5 h-5 text-rose-500" />
                      <Badge variant="outline" className="text-xs border-rose-200 text-rose-500">{plano.tier}</Badge>
                    </div>
                    <h3 className="text-xl font-bold text-rose-950 mb-1">{plano.nome}</h3>
                    <p className="text-xs text-rose-500/50 mb-4">{plano.desc}</p>
                    <div className="mb-6">
                      <span className="text-sm text-rose-400">R$</span>
                      <span className="text-4xl font-extrabold text-rose-950 mx-1">{plano.preco}</span>
                      <span className="text-sm text-rose-400">/mês</span>
                    </div>
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plano.recursos.map((r) => (
                        <li key={r} className="flex items-start gap-2.5 text-sm text-rose-700/60">
                          <Check className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />{r}
                        </li>
                      ))}
                    </ul>
                    <Button className={`w-full rounded-full font-semibold ${plano.destaque ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg' : 'bg-rose-50 hover:bg-rose-100 text-rose-700'}`} onClick={goToAuth}>
                      Assinar {plano.nome}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.5}
            className="mt-5 sm:mt-12 text-center">
            <div className="inline-flex flex-wrap justify-center gap-3 sm:gap-8 text-[10px] sm:text-sm text-rose-600/60">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Pagamento seguro</span>
              <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Cancele quando quiser</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Dados protegidos</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="depoimentos" className="py-10 sm:py-20 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-5 sm:mb-14">
            <Badge className="mb-2 bg-rose-100 text-rose-600 border-rose-200 text-[10px] sm:text-xs">Depoimentos</Badge>
            <h2 className="text-xl sm:text-4xl font-bold text-rose-950 mb-1.5">Quem usa, recomenda</h2>
          </motion.div>

          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-3 px-3 lg:justify-center scrollbar-hide">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.1}
                className="snap-center flex-shrink-0 w-[140px] sm:w-[200px]">
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-[9/16] shadow-lg">
                  <img src={t.img} alt={t.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${t.color} opacity-40`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-0 left-0 right-0 p-2">
                    <div className="w-full h-0.5 rounded-full bg-white/30 overflow-hidden"><div className="h-full bg-white rounded-full w-full" /></div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br ${t.color} p-[1px]`}>
                        <img src={t.img} alt="" className="w-full h-full rounded-full object-cover border border-white" />
                      </div>
                      <span className="text-white text-[8px] sm:text-[10px] font-semibold truncate">{t.name}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4">
                    <div className="flex gap-0.5 mb-1">
                      {Array.from({ length: 5 }).map((_, j) => (<Star key={j} className="w-2 h-2 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />))}
                    </div>
                    <p className="text-white text-[9px] sm:text-xs leading-snug mb-1 line-clamp-3">"{t.text}"</p>
                    <p className="text-white/50 text-[8px] sm:text-[10px]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-10 sm:py-24 relative overflow-hidden text-white">
        <div className="absolute inset-0">
          <img src={ctaBg} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/90 via-rose-600/95 to-pink-600/90" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <Badge className="mb-3 bg-white/20 text-white border-white/30 text-[10px] sm:text-sm">
              <Gem className="w-3 h-3 mr-1" /> Oferta por tempo limitado
            </Badge>
            <h2 className="text-xl sm:text-5xl font-extrabold mb-3 sm:mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Não perca mais vendas.<br />Comece agora.
            </h2>
            <p className="text-xs sm:text-lg text-white/80 mb-5 sm:mb-10 max-w-xl mx-auto">
              Junte-se a centenas de empreendedoras que já transformaram seus negócios.
            </p>
            <Button className="w-full sm:w-auto bg-white text-rose-500 hover:bg-rose-50 text-xs sm:text-lg px-8 py-4 sm:py-7 rounded-full shadow-2xl font-bold"
              onClick={goToAuth}>
              Escolher Meu Plano Agora <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <p className="text-white/50 text-[10px] mt-3">Cadastro rápido • Acesso imediato • Pagamento seguro</p>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-rose-100 py-6 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-1.5">
              <img src={logo} alt="Nexsiles" className="h-5 sm:h-6 w-auto" />
              <span className="font-bold text-rose-800 text-xs sm:text-sm">Nexsiles</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-[10px] sm:text-sm text-rose-600/50">
              <a href="#funcionalidades" className="hover:text-rose-600">Funcionalidades</a>
              <a href="#planos" className="hover:text-rose-600">Planos</a>
              <a href="#depoimentos" className="hover:text-rose-600">Depoimentos</a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-rose-100">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <div className="flex flex-wrap justify-center gap-3 text-[10px] text-rose-500/50">
                <a href="/politica-privacidade" className="hover:text-rose-600 underline">Privacidade</a>
                <a href="/termos-de-uso" className="hover:text-rose-600 underline">Termos</a>
                <a href="mailto:contato@nexsiles.com.br" className="hover:text-rose-600">Contato</a>
              </div>
              <p className="text-[9px] sm:text-[11px] text-rose-400/40">© {new Date().getFullYear()} Nexsiles</p>
            </div>
            <p className="text-[8px] sm:text-xs text-rose-400/30 text-center mt-3 max-w-xl mx-auto leading-relaxed">
              Nexsiles é uma plataforma de gestão de semijoias. Resultados podem variar. Este site não faz parte do Facebook/Meta Inc.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white/95 to-transparent sm:hidden">
        <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-full text-xs font-bold shadow-xl shadow-rose-200/50" onClick={goToAuth}>
          Assinar Agora — A partir de R$ 129/mês <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/5511937687369?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20Nexsiles!"
        target="_top"
        className="fixed bottom-16 sm:bottom-6 right-3 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-transform hover:scale-110"
        aria-label="Fale conosco no WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
