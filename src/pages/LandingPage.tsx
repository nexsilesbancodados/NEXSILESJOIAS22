import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  BarChart3, ShoppingCart, Users, Package, Shield, Star,
  MessageSquare, TrendingUp, Smartphone, ArrowRight, Check,
  Sparkles, Store, Bot, Crown, Menu, X,
  Gem, ChevronLeft, ChevronRight,
  AlertTriangle, XCircle, CheckCircle, Timer, Lock, Eye, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dashboardMockup from '@/assets/landing-dashboard-mockup.jpg';
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
import testimonialCarla from '@/assets/testimonial-carla.jpg';
import testimonialFernanda from '@/assets/testimonial-fernanda.jpg';
import testimonialJuliana from '@/assets/testimonial-juliana.jpg';
import testimonialAmanda from '@/assets/testimonial-amanda.jpg';
import testimonialPatricia from '@/assets/testimonial-patricia.jpg';
import dashboardInsights from '@/assets/landing-dashboard-insights.png';
import dashboardCharts from '@/assets/landing-dashboard-charts.png';
import pecasMockup from '@/assets/landing-pecas-mockup.png';
import pdvMockup from '@/assets/landing-pdv-mockup.png';
import lojaMockup from '@/assets/landing-loja-mockup.png';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const DORES = [
  { icon: XCircle, text: 'Controla estoque em planilha e perde peças toda semana?' },
  { icon: XCircle, text: 'Suas revendedoras pedem fotos e preços no WhatsApp o dia todo?' },
  { icon: XCircle, text: 'Não sabe quanto realmente lucra em cada venda?' },
  { icon: XCircle, text: 'Quer vender online mas não tem loja virtual?' },
];

const FEATURES = [
  { icon: BarChart3, title: 'Dashboard Inteligente', desc: 'Vendas, estoque e métricas em tempo real.' },
  { icon: ShoppingCart, title: 'PDV Completo', desc: 'Leitor de barras, descontos e recibo digital.' },
  { icon: Package, title: 'Gestão de Estoque', desc: 'Alertas de reposição e importação CSV.' },
  { icon: Users, title: 'Revendedoras & Maletas', desc: 'Portal exclusivo e comissões automáticas.' },
  { icon: Bot, title: 'Assistente IA 24h', desc: 'Chatbot no WhatsApp que vende sozinho.' },
  { icon: Store, title: 'Loja Virtual Premium', desc: 'E-commerce com PIX, cartão e SEO.' },
  { icon: MessageSquare, title: 'WhatsApp Integrado', desc: 'Catálogos e broadcast automático.' },
  { icon: TrendingUp, title: 'Relatórios Completos', desc: 'Lucratividade e ranking de vendedoras.' },
  { icon: Shield, title: 'Segurança Total', desc: 'Dados isolados e backup automático.' },
];

const PLANOS = [
  { nome: 'E-commerce', tier: 'E-COMMERCE', preco: 129, destaque: false, icon: Store, desc: 'Apenas venda online', recursos: ['Loja virtual completa', 'Checkout PIX, Cartão, Boleto', 'Gestão de estoque', 'Carrinho com cupons', 'Cálculo de frete automático', 'SEO otimizado', 'Catálogo digital'] },
  { nome: 'Bronze', tier: 'BRONZE', preco: 189, destaque: false, icon: Sparkles, desc: 'Gestão completa', recursos: ['Dashboard inteligente', 'PDV completo', 'Estoque ilimitado', 'Revendedoras & Maletas', 'Catálogos digitais', 'Relatórios completos', 'Programa de fidelidade', 'WhatsApp'] },
  { nome: 'Prata', tier: 'PRATA', preco: 239, destaque: true, icon: Bot, desc: 'Mais vendido! Gestão + IA', recursos: ['Tudo do Bronze', 'Assistente IA WhatsApp', 'Chatbot 24h', 'Respostas automáticas', 'Sugestões de vendas IA', 'Estoque inteligente', 'Atendimento automático', 'Relatórios com IA'] },
  { nome: 'Diamante', tier: 'DIAMANTE', preco: 299, destaque: false, icon: Crown, desc: 'Tudo incluído', recursos: ['Tudo do Prata', 'Loja virtual completa', 'Checkout integrado', 'Carrinho com cupons', 'Gestão de pedidos', 'Cálculo de frete', 'SEO otimizado', 'Campanhas'] },
];

const TESTIMONIALS = [
  { name: 'Carla M.', role: 'Loja de semijoias', text: 'Parei de perder horas controlando estoque no caderno. Agora sei exatamente quanto lucro.', img: testimonialCarla, color: 'from-rose-400 to-pink-500' },
  { name: 'Fernanda S.', role: 'Revendedora', text: 'O portal é muito prático. Minhas revendedoras acompanham comissões sozinhas.', img: testimonialFernanda, color: 'from-pink-400 to-rose-500' },
  { name: 'Juliana R.', role: 'E-commerce de joias', text: 'A IA no WhatsApp atende de madrugada! Vendas aumentaram 40%.', img: testimonialJuliana, color: 'from-amber-400 to-rose-400' },
  { name: 'Amanda L.', role: 'Atacadista', text: 'Reduzi 80% das mensagens no WhatsApp com o portal!', img: testimonialAmanda, color: 'from-rose-500 to-fuchsia-400' },
  { name: 'Patrícia K.', role: 'Loja + E-commerce', text: 'Gerencio loja física e virtual num só lugar!', img: testimonialPatricia, color: 'from-pink-500 to-amber-400' },
];

const PASSOS = [
  { num: '01', titulo: 'Crie sua conta', desc: 'Cadastro rápido em 2 minutos.', icon: Smartphone },
  { num: '02', titulo: 'Configure', desc: 'Importe peças e personalize.', icon: Package },
  { num: '03', titulo: 'Lucre', desc: 'Venda de qualquer lugar.', icon: TrendingUp },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const planosRef = useRef<HTMLDivElement>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroDir, setHeroDir] = useState(0);

  const heroSlides = [
    { img: heroSlide1, title: 'O sistema nº1 para semijoias no Brasil', subtitle: 'Estoque, PDV, revendedoras, loja virtual e IA — tudo num só lugar.' },
    { img: heroSlide2, title: 'Pare de perder vendas por falta de controle', subtitle: 'Dashboard, relatórios e alertas automáticos para nunca ter prejuízo.' },
    { img: heroSlide3, title: 'Sua loja vende sozinha com IA', subtitle: 'Assistente no WhatsApp que atende, vende e agenda 24h por dia.' },
  ];

  const nextHero = useCallback(() => { setHeroDir(1); setHeroIndex(i => (i + 1) % heroSlides.length); }, [heroSlides.length]);
  useEffect(() => { const t = setInterval(nextHero, 5000); return () => clearInterval(t); }, [nextHero]);

  const scrollToPlanos = () => planosRef.current?.scrollIntoView({ behavior: 'smooth' });
  const goToAuth = () => navigate('/auth');

  return (
    <div className="lp-container min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: 'linear-gradient(180deg, #FFF0F0 0%, #FFE4E6 15%, #FFF5F5 30%, #FECDD3 50%, #FFF1F2 70%, #FFE4E6 85%, #FFF5F5 100%)', backgroundAttachment: 'fixed' }}>
      
      {/* ═══ NAVBAR — sticky, compact ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 border-b border-rose-100 shadow-sm">
        <div className="max-w-7xl mx-auto lp-section-px flex items-center justify-between" style={{ height: 'clamp(48px, 8vw, 64px)' }}>
          <div className="flex items-center gap-1.5">
            <img src={logo} alt="Nexsiles" style={{ height: 'clamp(24px, 4vw, 32px)' }} className="w-auto" />
            <span className="font-bold text-rose-700 lp-h3">Nexsiles</span>
          </div>
          <div className="hidden md:flex items-center gap-8 lp-small text-rose-800/70 font-medium">
            <a href="#problema" className="hover:text-rose-600 transition-colors">Por que?</a>
            <a href="#funcionalidades" className="hover:text-rose-600 transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-rose-600 transition-colors">Planos</a>
            <a href="#depoimentos" className="hover:text-rose-600 transition-colors">Depoimentos</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button className="bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 lp-touch lp-small" onClick={goToAuth}>
              Assinar Agora <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <button className="md:hidden lp-touch flex items-center justify-center text-rose-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-white border-t border-rose-100 px-4 py-3 space-y-1">
            {['problema', 'funcionalidades', 'planos', 'depoimentos'].map(id => (
              <a key={id} href={`#${id}`} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-rose-700 lp-small capitalize lp-touch">{id === 'problema' ? 'Por que?' : id}</a>
            ))}
            <Button className="w-full bg-rose-500 text-white lp-small py-3 mt-1 lp-touch" onClick={goToAuth}>Assinar Agora</Button>
          </motion.div>
        )}
      </nav>

      {/* ═══ HERO — Above the fold CTA ═══ */}
      <section className="relative w-full overflow-hidden" style={{ height: 'clamp(480px, 85svh, 100svh)' }}>
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
            <img src={heroSlides[heroIndex].img} alt="" className="absolute inset-0 w-full h-full object-cover object-center" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-r from-rose-950/85 via-rose-900/60 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 h-full flex flex-col justify-center lp-section-px" style={{ maxWidth: 'min(56rem, 100%)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} key={`text-${heroIndex}`}>
            <Badge className="mb-3 bg-rose-500/20 text-white border-rose-400/30 backdrop-blur-sm px-2.5 py-1 lp-xs font-semibold">
              <Rocket className="w-3 h-3 mr-1" /> A plataforma #1 para semijoias
            </Badge>
            <h1 className="lp-h1 font-extrabold text-white leading-[1.1] drop-shadow-lg" style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: 'clamp(0.5rem, 2vw, 1.25rem)' }}>
              {heroSlides[heroIndex].title}
            </h1>
            <p className="lp-body text-white/85 leading-relaxed" style={{ maxWidth: 'min(32rem, 100%)', marginBottom: 'clamp(1rem, 3vw, 2rem)' }}>
              {heroSlides[heroIndex].subtitle}
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <Button className="bg-rose-500 hover:bg-rose-600 text-white lp-small lp-touch rounded-full shadow-xl shadow-rose-500/30 font-bold" style={{ padding: 'clamp(0.75rem, 2vw, 1.25rem) clamp(1.25rem, 3vw, 2.5rem)' }}
                onClick={goToAuth}>
                Quero Assinar Agora <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 lp-small lp-touch rounded-full backdrop-blur-sm" style={{ padding: 'clamp(0.75rem, 2vw, 1.25rem) clamp(1.25rem, 3vw, 2rem)' }}
                onClick={scrollToPlanos}>
                Ver Planos e Preços
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 lp-xs text-white/70" style={{ marginTop: 'clamp(0.75rem, 2vw, 1.25rem)' }}>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> Pagamento seguro</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> Acesso imediato</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> Suporte dedicado</span>
            </div>
          </motion.div>
        </div>

        <button onClick={() => { setHeroDir(-1); setHeroIndex(i => (i - 1 + heroSlides.length) % heroSlides.length); }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/15 backdrop-blur-sm hover:bg-white/30 rounded-full lp-touch flex items-center justify-center transition-colors" style={{ padding: 'clamp(6px, 1vw, 12px)' }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <button onClick={() => { setHeroDir(1); setHeroIndex(i => (i + 1) % heroSlides.length); }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/15 backdrop-blur-sm hover:bg-white/30 rounded-full lp-touch flex items-center justify-center transition-colors" style={{ padding: 'clamp(6px, 1vw, 12px)' }}>
          <ChevronRight className="w-5 h-5 text-white" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => { setHeroDir(i > heroIndex ? 1 : -1); setHeroIndex(i); }}
              className={`h-1.5 rounded-full transition-all duration-300 lp-touch ${i === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`} style={{ minWidth: 'auto', minHeight: 'auto' }} />
          ))}
        </div>
      </section>

      {/* ═══ SOCIAL PROOF BAR ═══ */}
      <section className="bg-white border-b border-rose-100" style={{ padding: 'clamp(0.75rem, 2vw, 2rem) 0' }}>
        <div className="max-w-5xl mx-auto lp-section-px grid grid-cols-4 gap-2">
          {[
            { num: '500+', label: 'Empreendedoras' },
            { num: '50k+', label: 'Peças' },
            { num: '4.9', label: 'Satisfação', suffix: '⭐' },
            { num: '24h', label: 'Suporte' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-extrabold text-rose-600" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.5rem)' }}>{s.num} {s.suffix || ''}</p>
              <p className="lp-xs text-rose-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PAIN POINTS ═══ */}
      <section id="problema" className="lp-section-py">
        <div className="max-w-4xl mx-auto lp-section-px">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center" style={{ marginBottom: 'clamp(1rem, 3vw, 3rem)' }}>
            <Badge className="mb-2 bg-red-100 text-red-600 border-red-200 lp-xs">
              <AlertTriangle className="w-3 h-3 mr-1" /> Você se identifica?
            </Badge>
            <h2 className="lp-h2 font-bold text-rose-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Se controla semijoias assim, está <span className="text-red-500">perdendo dinheiro</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lp-gap" style={{ marginBottom: 'clamp(1rem, 3vw, 1.5rem)' }}>
            {DORES.map((d, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.1}
                className="flex items-start gap-2.5 rounded-xl bg-red-50/80 border border-red-100" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
                <d.icon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="lp-small text-red-800/80">{d.text}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.5}
            className="text-center rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200" style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
            <CheckCircle className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
            <h3 className="lp-h3 font-bold text-emerald-900 mb-1.5">A solução existe — e é simples.</h3>
            <p className="lp-small text-emerald-700/70 max-w-lg mx-auto mb-3">O Nexsiles resolve tudo em um só sistema.</p>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full lp-small lp-touch shadow-lg" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(1rem, 2.5vw, 1.25rem)' }} onClick={goToAuth}>
              Quero Resolver Agora <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══ SCREENSHOTS ═══ */}
      <section className="lp-section-py">
        <div className="max-w-7xl mx-auto lp-section-px">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center" style={{ marginBottom: 'clamp(1rem, 3vw, 3.5rem)' }}>
            <Badge className="mb-2 bg-rose-100 text-rose-600 border-rose-200 lp-xs">
              <Eye className="w-3 h-3 mr-1" /> Veja com seus olhos
            </Badge>
            <h2 className="lp-h2 font-bold text-rose-950">Isso é o que você vai usar</h2>
            <p className="text-rose-600/50 lp-small">Capturas reais do sistema.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.1}
            className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-rose-100 shadow-xl shadow-rose-200/30" style={{ marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)' }}>
            <div className="aspect-[16/10] overflow-hidden">
              <img src={dashboardMockup} alt="Dashboard Nexsiles" className="w-full h-full object-cover object-top" loading="lazy" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-rose-500 text-white border-0 shadow-lg lp-xs">📊 Dashboard completo</Badge>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lp-gap">
            {[
              { img: dashboardInsights, label: '💡 Insights' },
              { img: pecasMockup, label: '💎 Estoque' },
              { img: pdvMockup, label: '🛒 PDV' },
              { img: dashboardCharts, label: '📈 Gráficos' },
              { img: lojaMockup, label: '🏪 Loja' },
              { img: devicesMockup, label: '📱 Mobile' },
            ].map((item, i) => (
              <motion.div key={item.label} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }} variants={fadeUp} custom={i * 0.05}
                className="relative rounded-lg overflow-hidden border border-rose-100 shadow-sm">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={item.img} alt={item.label} className="w-full h-full object-cover object-top" loading="lazy" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-rose-950/70 to-transparent" style={{ padding: 'clamp(4px, 0.5vw, 12px)' }}>
                  <span className="text-white lp-xs font-medium">{item.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="funcionalidades" className="lp-section-py relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img src={featuresBg} alt="" className="w-full h-full object-cover opacity-5" loading="lazy" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto lp-section-px">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center" style={{ marginBottom: 'clamp(1rem, 3vw, 3.5rem)' }}>
            <Badge className="mb-2 bg-rose-100 text-rose-600 border-rose-200 lp-xs">Funcionalidades</Badge>
            <h2 className="lp-h2 font-bold text-rose-950">Tudo num só lugar</h2>
            <p className="text-rose-600/50 lp-small">+20 módulos integrados.</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lp-gap">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }} variants={fadeUp} custom={i * 0.05}>
                <Card className="bg-white border-rose-100 h-full">
                  <CardContent style={{ padding: 'clamp(0.5rem, 1.5vw, 1.25rem)' }}>
                    <div className="rounded-lg bg-rose-50 flex items-center justify-center" style={{ width: 'clamp(2rem, 5vw, 3rem)', height: 'clamp(2rem, 5vw, 3rem)', marginBottom: 'clamp(0.375rem, 1vw, 0.75rem)' }}>
                      <f.icon className="text-rose-500" style={{ width: 'clamp(1rem, 2.5vw, 1.5rem)', height: 'clamp(1rem, 2.5vw, 1.5rem)' }} />
                    </div>
                    <h3 className="lp-small font-bold text-rose-950 mb-0.5 leading-tight">{f.title}</h3>
                    <p className="lp-xs text-rose-600/50 leading-snug hidden sm:block">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="text-center" style={{ marginTop: 'clamp(1.5rem, 4vw, 3rem)' }}>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-xl font-bold lp-small lp-touch" style={{ padding: 'clamp(0.75rem, 2vw, 1.5rem) clamp(1.5rem, 4vw, 2rem)' }} onClick={goToAuth}>
              Escolher Meu Plano <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="lp-section-py relative overflow-hidden text-white">
        <div className="absolute inset-0">
          <img src={stepsBg} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-rose-500/90" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto lp-section-px">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center" style={{ marginBottom: 'clamp(1.5rem, 4vw, 5rem)' }}>
            <h2 className="lp-h2 font-extrabold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Comece em 2 minutos</h2>
            <p className="text-white/70 lp-small">3 passos simples.</p>
          </motion.div>
          <div className="relative">
            <div className="hidden sm:block absolute left-[16%] right-[16%] border-t-[3px] border-dashed border-white/25 z-0" style={{ top: 'clamp(40px, 8vw, 60px)' }} />
            <div className="grid grid-cols-3 lp-gap relative z-10">
              {PASSOS.map((p, i) => (
                <div key={p.num} className="flex flex-col items-center text-center">
                  <div className="relative" style={{ marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)' }}>
                    <div className="absolute -top-2 -right-2 z-20 rounded-full flex items-center justify-center font-extrabold lp-xs shadow-lg bg-white text-rose-500" style={{ width: 'clamp(1.5rem, 3.5vw, 2.5rem)', height: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}>{p.num}</div>
                    <div className={`rounded-xl flex items-center justify-center shadow-xl ${i === 1 ? 'bg-white/25 backdrop-blur-md border-2 border-white/40' : 'bg-white/15 backdrop-blur-sm border border-white/25'}`} style={{ width: 'clamp(3.5rem, 10vw, 7.5rem)', height: 'clamp(3.5rem, 10vw, 7.5rem)' }}>
                      <p.icon className="text-white drop-shadow-lg" style={{ width: 'clamp(1.5rem, 4vw, 3rem)', height: 'clamp(1.5rem, 4vw, 3rem)' }} strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="lp-small font-bold mb-0.5">{p.titulo}</h3>
                  <p className="text-white/70 lp-xs leading-snug max-w-[220px]">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="text-center" style={{ marginTop: 'clamp(1.5rem, 4vw, 4rem)' }}>
            <Button className="bg-white text-rose-500 hover:bg-rose-50 lp-small lp-touch rounded-full shadow-xl font-bold" style={{ padding: 'clamp(0.75rem, 2vw, 1.5rem) clamp(1.5rem, 4vw, 2rem)' }} onClick={goToAuth}>
              Quero Começar Agora <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="planos" ref={planosRef} className="lp-section-py">
        <div className="max-w-7xl mx-auto lp-section-px">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center" style={{ marginBottom: 'clamp(1rem, 3vw, 2.5rem)' }}>
            <Badge className="mb-2 bg-rose-100 text-rose-600 border-rose-200 lp-xs">Planos & Preços</Badge>
            <h2 className="lp-h2 font-bold text-rose-950">Invista no seu negócio</h2>
            <p className="text-rose-600/50 lp-small max-w-xl mx-auto">Escolha o plano ideal e comece hoje.</p>
          </motion.div>

          {/* Mobile/Tablet: vertical grid */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {PLANOS.map((plano) => (
              <div key={plano.nome}>
                <Card className={`relative h-full bg-white border-rose-100 ${plano.destaque ? 'border-rose-400 shadow-xl shadow-rose-200/40 ring-2 ring-rose-400' : ''}`}>
                  {plano.destaque && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-rose-500 text-white border-0 px-2 lp-xs shadow-lg whitespace-nowrap"><Star className="w-2.5 h-2.5 mr-0.5" /> Mais Vendido</Badge>
                    </div>
                  )}
                  <CardContent className="flex flex-col h-full p-3 pt-4">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <plano.icon className="w-3.5 h-3.5 text-rose-500" />
                      <Badge variant="outline" className="lp-xs border-rose-200 text-rose-500 px-1.5 py-0">{plano.tier}</Badge>
                    </div>
                    <h3 className="lp-small font-bold text-rose-950 mb-0.5">{plano.nome}</h3>
                    <p className="lp-xs text-rose-500/50 mb-1 line-clamp-1">{plano.desc}</p>
                    <div className="mb-2">
                      <span className="lp-xs text-rose-400">R$</span>
                      <span className="font-extrabold text-rose-950 mx-0.5 text-lg">{plano.preco}</span>
                      <span className="lp-xs text-rose-400">/mês</span>
                    </div>
                    <ul className="space-y-1 mb-3 flex-1">
                      {plano.recursos.slice(0, 4).map((r) => (
                        <li key={r} className="flex items-start gap-1 lp-xs text-rose-700/60">
                          <Check className="w-3 h-3 text-rose-500 flex-shrink-0 mt-0.5" /><span className="line-clamp-1">{r}</span>
                        </li>
                      ))}
                      {plano.recursos.length > 4 && (
                        <li className="lp-xs text-rose-400/60">+{plano.recursos.length - 4} recursos</li>
                      )}
                    </ul>
                    <Button className={`w-full lp-xs lp-touch rounded-full text-xs ${plano.destaque ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg' : 'bg-rose-50 hover:bg-rose-100 text-rose-700'}`} onClick={goToAuth}>
                      Assinar
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

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
                    <Button className={`w-full rounded-full font-semibold lp-touch ${plano.destaque ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg' : 'bg-rose-50 hover:bg-rose-100 text-rose-700'}`} onClick={goToAuth}>
                      Assinar {plano.nome}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.5} className="text-center" style={{ marginTop: 'clamp(1rem, 3vw, 3rem)' }}>
            <div className="inline-flex flex-wrap justify-center gap-3 sm:gap-8 lp-xs text-rose-600/60">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Pagamento seguro</span>
              <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Cancele quando quiser</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Dados protegidos</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="depoimentos" className="lp-section-py relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto lp-section-px">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center" style={{ marginBottom: 'clamp(1rem, 3vw, 3.5rem)' }}>
            <Badge className="mb-2 bg-rose-100 text-rose-600 border-rose-200 lp-xs">Depoimentos</Badge>
            <h2 className="lp-h2 font-bold text-rose-950">Quem usa, recomenda</h2>
          </motion.div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lp-gap">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.1}
                className={`${i >= 3 ? 'hidden sm:block' : ''}`}>
                <div className="relative rounded-xl overflow-hidden aspect-[9/16] shadow-lg">
                  <img src={t.img} alt={t.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${t.color} opacity-40`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-0 left-0 right-0 p-1.5 sm:p-2">
                    <div className="w-full h-0.5 rounded-full bg-white/30 overflow-hidden"><div className="h-full bg-white rounded-full w-full" /></div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className={`rounded-full bg-gradient-to-br ${t.color} p-[1px]`} style={{ width: 'clamp(18px, 3vw, 28px)', height: 'clamp(18px, 3vw, 28px)' }}>
                        <img src={t.img} alt="" className="w-full h-full rounded-full object-cover border border-white" />
                      </div>
                      <span className="text-white lp-xs font-semibold truncate">{t.name}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0" style={{ padding: 'clamp(6px, 1vw, 16px)' }}>
                    <div className="flex gap-0.5 mb-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (<Star key={j} className="fill-amber-400 text-amber-400" style={{ width: 'clamp(8px, 1.2vw, 12px)', height: 'clamp(8px, 1.2vw, 12px)' }} />))}
                    </div>
                    <p className="text-white lp-xs leading-snug mb-0.5 line-clamp-3">"{t.text}"</p>
                    <p className="text-white/50 lp-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="lp-section-py relative overflow-hidden text-white">
        <div className="absolute inset-0">
          <img src={ctaBg} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/90 via-rose-600/95 to-pink-600/90" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto lp-section-px text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <Badge className="mb-3 bg-white/20 text-white border-white/30 lp-xs">
              <Gem className="w-3 h-3 mr-1" /> Oferta por tempo limitado
            </Badge>
            <h2 className="lp-h2 font-extrabold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Não perca mais vendas.<br />Comece agora.
            </h2>
            <p className="lp-body text-white/80 max-w-xl mx-auto" style={{ marginBottom: 'clamp(1.25rem, 3vw, 2.5rem)' }}>
              Junte-se a centenas de empreendedoras que já transformaram seus negócios.
            </p>
            <Button className="w-full sm:w-auto bg-white text-rose-500 hover:bg-rose-50 lp-small lp-touch rounded-full shadow-2xl font-bold" style={{ padding: 'clamp(0.875rem, 2vw, 1.75rem) clamp(2rem, 5vw, 3rem)' }}
              onClick={goToAuth}>
              Escolher Meu Plano Agora <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <p className="text-white/50 lp-xs mt-3">Cadastro rápido • Acesso imediato • Pagamento seguro</p>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-rose-100 bg-white" style={{ padding: 'clamp(1.25rem, 3vw, 3rem) 0' }}>
        <div className="max-w-7xl mx-auto lp-section-px">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-1.5">
              <img src={logo} alt="Nexsiles" style={{ height: 'clamp(18px, 3vw, 24px)' }} className="w-auto" />
              <span className="font-bold text-rose-800 lp-small">Nexsiles</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3 lp-xs text-rose-600/50">
              <a href="#funcionalidades" className="hover:text-rose-600 lp-touch flex items-center">Funcionalidades</a>
              <a href="#planos" className="hover:text-rose-600 lp-touch flex items-center">Planos</a>
              <a href="#depoimentos" className="hover:text-rose-600 lp-touch flex items-center">Depoimentos</a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-rose-100">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <div className="flex flex-wrap justify-center gap-3 lp-xs text-rose-500/50">
                <a href="/politica-privacidade" className="hover:text-rose-600 underline">Privacidade</a>
                <a href="/termos-de-uso" className="hover:text-rose-600 underline">Termos</a>
                <a href="mailto:contato@nexsiles.com.br" className="hover:text-rose-600">Contato</a>
              </div>
              <p className="lp-xs text-rose-400/40">© {new Date().getFullYear()} Nexsiles</p>
            </div>
            <p className="lp-xs text-rose-400/30 text-center mt-3 max-w-xl mx-auto leading-relaxed">
              Nexsiles é uma plataforma de gestão de semijoias. Resultados podem variar. Este site não faz parte do Facebook/Meta Inc.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA — 44px+ touch target */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white/95 to-transparent sm:hidden">
        <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-full lp-xs font-bold shadow-xl shadow-rose-200/50 lp-touch" onClick={goToAuth}>
          Assinar Agora — A partir de R$ 129/mês <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* WhatsApp floating — 44px+ touch target */}
      <a
        href="https://wa.me/5511937687369?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20Nexsiles!"
        target="_top"
        className="fixed bottom-16 sm:bottom-6 right-3 z-50 lp-touch bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-transform hover:scale-110"
        style={{ width: 'clamp(44px, 8vw, 56px)', height: 'clamp(44px, 8vw, 56px)' }}
        aria-label="Fale conosco no WhatsApp"
      >
        <svg viewBox="0 0 24 24" style={{ width: 'clamp(22px, 4vw, 28px)', height: 'clamp(22px, 4vw, 28px)' }} className="fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
