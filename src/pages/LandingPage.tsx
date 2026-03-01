import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import {
  BarChart3, ShoppingCart, Users, Package, Shield, Star,
  MessageSquare, TrendingUp, Smartphone, ArrowRight, Check,
  Sparkles, Store, Bot, Crown, Menu, X,
  Gem, ChevronLeft, ChevronRight,
  AlertTriangle, XCircle, CheckCircle, Timer, Lock, Eye, Rocket, Play, Zap, Heart, Loader2, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.6 } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const DORES = [
  { icon: XCircle, text: 'Controla estoque em planilha e perde peças toda semana?' },
  { icon: XCircle, text: 'Suas revendedoras pedem fotos e preços no WhatsApp o dia todo?' },
  { icon: XCircle, text: 'Não sabe quanto realmente lucra em cada venda?' },
  { icon: XCircle, text: 'Quer vender online mas não tem loja virtual?' },
];

const FEATURES = [
  { icon: BarChart3, title: 'Dashboard Inteligente', desc: 'Vendas, estoque e métricas em tempo real.', gradient: 'from-violet-500 to-purple-600' },
  { icon: ShoppingCart, title: 'PDV Completo', desc: 'Leitor de barras, descontos e recibo digital.', gradient: 'from-rose-500 to-pink-600' },
  { icon: Package, title: 'Gestão de Estoque', desc: 'Alertas de reposição e importação CSV.', gradient: 'from-amber-500 to-orange-600' },
  { icon: Users, title: 'Revendedoras & Maletas', desc: 'Portal exclusivo e comissões automáticas.', gradient: 'from-emerald-500 to-teal-600' },
  { icon: Bot, title: 'Assistente IA 24h', desc: 'Chatbot no WhatsApp que vende sozinho.', gradient: 'from-blue-500 to-indigo-600' },
  { icon: Store, title: 'Loja Virtual Premium', desc: 'E-commerce com PIX, cartão e SEO.', gradient: 'from-fuchsia-500 to-pink-600' },
  { icon: MessageSquare, title: 'WhatsApp Integrado', desc: 'Catálogos e broadcast automático.', gradient: 'from-green-500 to-emerald-600' },
  { icon: TrendingUp, title: 'Relatórios Completos', desc: 'Lucratividade e ranking de vendedoras.', gradient: 'from-cyan-500 to-blue-600' },
  { icon: Shield, title: 'Segurança Total', desc: 'Dados isolados e backup automático.', gradient: 'from-slate-500 to-gray-600' },
];

const PLANOS = [
  { nome: 'E-commerce', tier: 'E-COMMERCE', preco: 129, destaque: false, icon: Store, desc: 'Apenas venda online', gradient: 'from-rose-400 to-pink-500', slug: 'ecommerce', recursos: ['Loja virtual completa', 'Checkout PIX, Cartão, Boleto', 'Gestão de estoque', 'Carrinho com cupons', 'Cálculo de frete automático', 'SEO otimizado', 'Catálogo digital'] },
  { nome: 'Bronze', tier: 'BRONZE', preco: 189, destaque: false, icon: Sparkles, desc: 'Gestão completa', gradient: 'from-amber-400 to-orange-500', slug: 'bronze', recursos: ['Dashboard inteligente', 'PDV completo', 'Estoque ilimitado', 'Revendedoras & Maletas', 'Catálogos digitais', 'Relatórios completos', 'Programa de fidelidade', 'WhatsApp'] },
  { nome: 'Prata', tier: 'PRATA', preco: 239, destaque: true, icon: Bot, desc: 'Mais vendido! Gestão + IA', gradient: 'from-rose-500 to-pink-600', slug: 'prata', recursos: ['Tudo do Bronze', 'Assistente IA WhatsApp', 'Chatbot 24h', 'Respostas automáticas', 'Sugestões de vendas IA', 'Estoque inteligente', 'Atendimento automático', 'Relatórios com IA'] },
  { nome: 'Diamante', tier: 'DIAMANTE', preco: 299, destaque: false, icon: Crown, desc: 'Tudo incluído', gradient: 'from-violet-400 to-purple-600', slug: 'diamante', recursos: ['Tudo do Prata', 'Loja virtual completa', 'Checkout integrado', 'Carrinho com cupons', 'Gestão de pedidos', 'Cálculo de frete', 'SEO otimizado', 'Campanhas'] },
];

const TESTIMONIALS = [
  { name: 'Carla M.', role: 'Loja de semijoias', text: 'Parei de perder horas controlando estoque no caderno. Agora sei exatamente quanto lucro.', img: testimonialCarla, rating: 5 },
  { name: 'Fernanda S.', role: 'Revendedora', text: 'O portal é muito prático. Minhas revendedoras acompanham comissões sozinhas.', img: testimonialFernanda, rating: 5 },
  { name: 'Juliana R.', role: 'E-commerce de joias', text: 'A IA no WhatsApp atende de madrugada! Vendas aumentaram 40%.', img: testimonialJuliana, rating: 5 },
  { name: 'Amanda L.', role: 'Atacadista', text: 'Reduzi 80% das mensagens no WhatsApp com o portal!', img: testimonialAmanda, rating: 5 },
  { name: 'Patrícia K.', role: 'Loja + E-commerce', text: 'Gerencio loja física e virtual num só lugar!', img: testimonialPatricia, rating: 5 },
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
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPlano, setCheckoutPlano] = useState<typeof PLANOS[0] | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const heroSlides = [
    { img: heroSlide1, title: 'O sistema nº1 para semijoias no Brasil', subtitle: 'Estoque, PDV, revendedoras, loja virtual e IA — tudo num só lugar.' },
    { img: heroSlide2, title: 'Pare de perder vendas por falta de controle', subtitle: 'Dashboard, relatórios e alertas automáticos para nunca ter prejuízo.' },
    { img: heroSlide3, title: 'Sua loja vende sozinha com IA', subtitle: 'Assistente no WhatsApp que atende, vende e agenda 24h por dia.' },
  ];

  const nextHero = useCallback(() => { setHeroDir(1); setHeroIndex(i => (i + 1) % heroSlides.length); }, [heroSlides.length]);
  useEffect(() => { const t = setInterval(nextHero, 5000); return () => clearInterval(t); }, [nextHero]);

  const scrollToPlanos = () => planosRef.current?.scrollIntoView({ behavior: 'smooth' });

  const openCheckout = (plano: typeof PLANOS[0]) => {
    setCheckoutPlano(plano);
    setCheckoutEmail('');
    setCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    if (!checkoutEmail || !checkoutPlano) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(checkoutEmail)) {
      toast.error('Digite um e-mail válido');
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-checkout-public', {
        body: { email: checkoutEmail, plano: checkoutPlano.slug, periodo: 'mensal' },
      });
      if (error) throw error;
      if (data?.initPoint) {
        window.location.href = data.initPoint;
      } else if (data?.sandboxInitPoint) {
        window.location.href = data.sandboxInitPoint;
      } else {
        toast.error('Erro ao gerar link de pagamento');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err?.message || 'Erro ao processar pagamento');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="lp-root">
      
      {/* ═══ NAVBAR ═══ */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Nexsiles" className="lp-nav-logo" />
            <span className="lp-nav-brand">Nexsiles</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[
              { id: 'problema', label: 'Por que?' },
              { id: 'funcionalidades', label: 'Funcionalidades' },
              { id: 'planos', label: 'Planos' },
              { id: 'depoimentos', label: 'Depoimentos' },
            ].map(link => (
              <a key={link.id} href={`#${link.id}`} className="lp-nav-link">{link.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button className="lp-btn-primary" onClick={scrollToPlanos}>
              Começar agora <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
          <button className="md:hidden lp-touch flex items-center justify-center lp-nav-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden lp-mobile-menu"
            >
              <div className="px-5 py-4 space-y-1">
                {['problema', 'funcionalidades', 'planos', 'depoimentos'].map(id => (
                  <a key={id} href={`#${id}`} onClick={() => setMobileMenuOpen(false)} 
                    className="block py-2.5 lp-nav-link capitalize lp-touch">
                    {id === 'problema' ? 'Por que?' : id}
                  </a>
                ))}
                <Button className="w-full lp-btn-primary mt-3" onClick={scrollToPlanos}>Começar agora</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="lp-hero">
        <AnimatePresence initial={false} custom={heroDir} mode="popLayout">
          <motion.div key={heroIndex} custom={heroDir}
            variants={{
              enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
            }}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0">
            <img src={heroSlides[heroIndex].img} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 lp-hero-overlay" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 h-full flex flex-col justify-center lp-hero-content">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} key={`text-${heroIndex}`}>
            <div className="lp-hero-badge">
              <Gem className="w-3.5 h-3.5" />
              <span>A plataforma #1 para semijoias</span>
            </div>
            <h1 className="lp-hero-title">
              {heroSlides[heroIndex].title}
            </h1>
            <p className="lp-hero-subtitle">
              {heroSlides[heroIndex].subtitle}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button className="lp-btn-hero-primary lp-touch" onClick={scrollToPlanos}>
                Quero Assinar Agora <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button variant="outline" className="lp-btn-hero-outline lp-touch" onClick={scrollToPlanos}>
                Ver Planos e Preços
              </Button>
            </div>
            <div className="lp-hero-trust">
              {['Pagamento seguro', 'Acesso imediato', 'Suporte dedicado'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <button onClick={() => { setHeroDir(-1); setHeroIndex(i => (i - 1 + heroSlides.length) % heroSlides.length); }}
          className="lp-hero-arrow lp-hero-arrow-left lp-touch">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => { setHeroDir(1); setHeroIndex(i => (i + 1) % heroSlides.length); }}
          className="lp-hero-arrow lp-hero-arrow-right lp-touch">
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => { setHeroDir(i > heroIndex ? 1 : -1); setHeroIndex(i); }}
              className={`lp-hero-dot ${i === heroIndex ? 'lp-hero-dot-active' : ''}`} />
          ))}
        </div>
      </section>

      {/* ═══ SOCIAL PROOF STRIP ═══ */}
      <section className="lp-social-proof">
        <div className="lp-container-lg">
          <div className="grid grid-cols-4 gap-3">
            {[
              { num: '500+', label: 'Empreendedoras', icon: Users },
              { num: '50k+', label: 'Peças gerenciadas', icon: Gem },
              { num: '4.9', label: 'Satisfação', icon: Star },
              { num: '24h', label: 'Suporte', icon: Heart },
            ].map(s => (
              <div key={s.label} className="lp-stat-item">
                <s.icon className="lp-stat-icon" />
                <p className="lp-stat-num">{s.num}</p>
                <p className="lp-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PAIN POINTS ═══ */}
      <section id="problema" className="lp-section">
        <div className="lp-container-md">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center lp-section-header">
            <span className="lp-label lp-label-red">
              <AlertTriangle className="w-3.5 h-3.5" /> Você se identifica?
            </span>
            <h2 className="lp-title">
              Se controla semijoias assim, está <span className="lp-text-danger">perdendo dinheiro</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {DORES.map((d, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.1}
                className="lp-pain-card">
                <d.icon className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="lp-pain-text">{d.text}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} custom={0.5}
            className="lp-solution-card">
            <div className="lp-solution-icon">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <h3 className="lp-solution-title">A solução existe — e é simples.</h3>
            <p className="lp-solution-text">O Nexsiles resolve tudo em um só sistema.</p>
            <Button className="lp-btn-success lp-touch" onClick={scrollToPlanos}>
              Quero Resolver Agora <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══ SCREENSHOTS ═══ */}
      <section className="lp-section lp-section-alt">
        <div className="lp-container-lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center lp-section-header">
            <span className="lp-label lp-label-rose">
              <Eye className="w-3.5 h-3.5" /> Veja com seus olhos
            </span>
            <h2 className="lp-title">Isso é o que você vai usar</h2>
            <p className="lp-subtitle">Capturas reais do sistema — sem surpresas.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} custom={0.1}
            className="lp-screenshot-hero">
            <div className="aspect-[16/10] overflow-hidden">
              <img src={dashboardMockup} alt="Dashboard Nexsiles" className="w-full h-full object-cover object-top" loading="lazy" />
            </div>
            <div className="lp-screenshot-hero-overlay">
              <Badge className="lp-screenshot-badge">📊 Dashboard completo</Badge>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-5">
            {[
              { img: dashboardInsights, label: '💡 Insights', pos: 'object-left-top' },
              { img: pecasMockup, label: '💎 Estoque', pos: 'object-left-top' },
              { img: pdvMockup, label: '🛒 PDV', pos: 'object-right-top' },
              { img: dashboardCharts, label: '📈 Gráficos', pos: 'object-top' },
              { img: lojaMockup, label: '🏪 Loja', pos: 'object-top' },
              { img: devicesMockup, label: '📱 Mobile', pos: 'object-top' },
            ].map((item, i) => (
              <motion.div key={item.label} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }} variants={scaleIn} custom={i * 0.08}
                className="lp-screenshot-card group">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={item.img} alt={item.label} className={`w-full h-full object-cover ${item.pos} transition-transform duration-700 group-hover:scale-110`} loading="lazy" />
                </div>
                <div className="lp-screenshot-label">
                  <span>{item.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="funcionalidades" className="lp-section">
        <div className="lp-container-lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center lp-section-header">
            <span className="lp-label lp-label-rose">
              <Zap className="w-3.5 h-3.5" /> Funcionalidades
            </span>
            <h2 className="lp-title">Tudo num só lugar</h2>
            <p className="lp-subtitle">+20 módulos integrados para seu negócio de semijoias.</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }} variants={fadeUp} custom={i * 0.06}>
                <div className="lp-feature-card group">
                  <div className={`lp-feature-icon bg-gradient-to-br ${f.gradient}`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="lp-feature-title">{f.title}</h3>
                  <p className="lp-feature-desc hidden sm:block">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="text-center mt-8 sm:mt-12">
            <Button className="lp-btn-primary lp-btn-lg lp-touch" onClick={scrollToPlanos}>
              Escolher Meu Plano <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="lp-section lp-section-dark">
        <div className="absolute inset-0">
          <img src={stepsBg} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 lp-dark-overlay" />
        </div>
        <div className="relative z-10 lp-container-md">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center lp-section-header">
            <h2 className="lp-title text-white">Comece em 2 minutos</h2>
            <p className="lp-subtitle text-white/60">3 passos simples.</p>
          </motion.div>
          <div className="relative">
            <div className="hidden sm:block absolute left-[16%] right-[16%] border-t-2 border-dashed border-white/20 z-0" style={{ top: '48px' }} />
            <div className="grid grid-cols-3 gap-4 sm:gap-8 relative z-10">
              {PASSOS.map((p, i) => (
                <motion.div key={p.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.2}
                  className="flex flex-col items-center text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="lp-step-num">{p.num}</div>
                    <div className={`lp-step-icon ${i === 1 ? 'lp-step-icon-active' : ''}`}>
                      <p.icon className="lp-step-icon-svg" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="lp-step-title">{p.titulo}</h3>
                  <p className="lp-step-desc">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="text-center mt-8 sm:mt-14">
            <Button className="lp-btn-white lp-btn-lg lp-touch" onClick={scrollToPlanos}>
              Quero Começar Agora <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="planos" ref={planosRef} className="lp-section">
        <div className="lp-container-lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center lp-section-header">
            <span className="lp-label lp-label-rose">
              <Crown className="w-3.5 h-3.5" /> Planos & Preços
            </span>
            <h2 className="lp-title">Invista no seu negócio</h2>
            <p className="lp-subtitle">Escolha o plano ideal e comece hoje mesmo.</p>
          </motion.div>

          {/* Mobile/Tablet: 2x2 grid */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {PLANOS.map((plano, i) => (
              <motion.div key={plano.nome} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} custom={i * 0.1}>
                <div className={`lp-plan-card ${plano.destaque ? 'lp-plan-card-featured' : ''}`}>
                  {plano.destaque && (
                    <div className="lp-plan-badge">
                      <Star className="w-3 h-3" /> Mais Vendido
                    </div>
                  )}
                  <div className="lp-plan-content">
                    <div className={`lp-plan-icon-wrap bg-gradient-to-br ${plano.gradient}`}>
                      <plano.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="lp-plan-name">{plano.nome}</h3>
                    <p className="lp-plan-desc">{plano.desc}</p>
                    <div className="lp-plan-price">
                      <span className="lp-plan-currency">R$</span>
                      <span className="lp-plan-amount">{plano.preco}</span>
                      <span className="lp-plan-period">/mês</span>
                    </div>
                    <ul className="lp-plan-features">
                      {plano.recursos.slice(0, 4).map((r) => (
                        <li key={r}><Check className="w-3 h-3 text-emerald-500 flex-shrink-0" /><span className="line-clamp-1">{r}</span></li>
                      ))}
                      {plano.recursos.length > 4 && (
                        <li className="lp-plan-more">+{plano.recursos.length - 4} recursos</li>
                      )}
                    </ul>
                    <Button className={`w-full lp-touch rounded-full text-xs font-semibold ${plano.destaque ? 'lp-btn-primary' : 'lp-btn-outline-rose'}`} onClick={() => openCheckout(plano)}>
                      Assinar
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: 4-col grid */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-6">
            {PLANOS.map((plano, i) => (
              <motion.div key={plano.nome} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.15}>
                <div className={`lp-plan-card-lg ${plano.destaque ? 'lp-plan-card-lg-featured' : ''}`}>
                  {plano.destaque && (
                    <div className="lp-plan-badge-lg">
                      <Star className="w-3.5 h-3.5" /> Mais Vendido
                    </div>
                  )}
                  <div className="p-6 pt-8 flex flex-col h-full">
                    <div className={`lp-plan-icon-wrap-lg bg-gradient-to-br ${plano.gradient}`}>
                      <plano.icon className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="outline" className="w-fit text-xs border-rose-200 text-rose-500 mb-2">{plano.tier}</Badge>
                    <h3 className="text-xl font-bold text-rose-950 mb-1">{plano.nome}</h3>
                    <p className="text-xs text-rose-500/50 mb-5">{plano.desc}</p>
                    <div className="mb-6">
                      <span className="text-sm text-rose-400">R$</span>
                      <span className="text-4xl font-extrabold text-rose-950 mx-1">{plano.preco}</span>
                      <span className="text-sm text-rose-400">/mês</span>
                    </div>
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plano.recursos.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-sm text-rose-700/60">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{r}
                        </li>
                      ))}
                    </ul>
                    <Button className={`w-full rounded-full font-semibold lp-touch ${plano.destaque ? 'lp-btn-primary' : 'lp-btn-outline-rose'}`} onClick={() => openCheckout(plano)}>
                      Assinar {plano.nome}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.5} className="text-center mt-6 sm:mt-10">
            <div className="lp-trust-badges">
              <span><Lock className="w-3.5 h-3.5" /> Pagamento seguro</span>
              <span><Timer className="w-3.5 h-3.5" /> Cancele quando quiser</span>
              <span><Shield className="w-3.5 h-3.5" /> Dados protegidos</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="depoimentos" className="lp-section lp-section-alt">
        <div className="lp-container-lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center lp-section-header">
            <span className="lp-label lp-label-rose">
              <Heart className="w-3.5 h-3.5" /> Depoimentos
            </span>
            <h2 className="lp-title">Quem usa, recomenda</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.1}
                className={`${i >= 3 ? 'hidden lg:block' : ''}`}>
                <div className="lp-testimonial-card">
                  <div className="lp-testimonial-header">
                    <img src={t.img} alt={t.name} className="lp-testimonial-avatar" loading="lazy" />
                    <div>
                      <p className="lp-testimonial-name">{t.name}</p>
                      <p className="lp-testimonial-role">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="lp-testimonial-text">"{t.text}"</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="lp-section lp-section-dark">
        <div className="absolute inset-0">
          <img src={ctaBg} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 lp-cta-overlay" />
        </div>
        <div className="relative z-10 lp-container-md text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} custom={0}>
            <div className="lp-cta-badge">
              <Gem className="w-3.5 h-3.5" /> Oferta por tempo limitado
            </div>
            <h2 className="lp-cta-title">
              Não perca mais vendas.<br />Comece agora.
            </h2>
            <p className="lp-cta-text">
              Junte-se a centenas de empreendedoras que já transformaram seus negócios.
            </p>
            <Button className="lp-btn-white lp-btn-xl lp-touch" onClick={scrollToPlanos}>
              Escolher Meu Plano Agora <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="lp-cta-disclaimer">Cadastro rápido • Acesso imediato • Pagamento seguro</p>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="lp-footer">
        <div className="lp-container-lg">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Nexsiles" className="h-6 w-auto" />
              <span className="font-bold text-rose-800 text-sm">Nexsiles</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-rose-500/60">
              <a href="#funcionalidades" className="hover:text-rose-600 transition-colors lp-touch flex items-center">Funcionalidades</a>
              <a href="#planos" className="hover:text-rose-600 transition-colors lp-touch flex items-center">Planos</a>
              <a href="#depoimentos" className="hover:text-rose-600 transition-colors lp-touch flex items-center">Depoimentos</a>
            </div>
          </div>
          <div className="lp-footer-divider" />
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-rose-500/50">
              <a href="/politica-privacidade" className="hover:text-rose-600 underline transition-colors">Privacidade</a>
              <a href="/termos-de-uso" className="hover:text-rose-600 underline transition-colors">Termos</a>
              <a href="mailto:contato@nexsiles.com.br" className="hover:text-rose-600 transition-colors">Contato</a>
            </div>
            <p className="text-xs text-rose-400/40">© {new Date().getFullYear()} Nexsiles</p>
          </div>
          <p className="text-[10px] text-rose-400/30 text-center mt-4 max-w-xl mx-auto leading-relaxed">
            Nexsiles é uma plataforma de gestão de semijoias. Resultados podem variar. Este site não faz parte do Facebook/Meta Inc.
          </p>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="lp-sticky-cta sm:hidden">
        <Button className="w-full lp-btn-primary py-3 rounded-full text-xs font-bold shadow-2xl lp-touch" onClick={scrollToPlanos}>
          Assinar Agora — A partir de R$ 129/mês <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* WhatsApp floating */}
      <a
        href="https://wa.me/5511937687369?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20Nexsiles!"
        target="_top"
        className="lp-whatsapp lp-touch"
        aria-label="Fale conosco no WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* ═══ CHECKOUT DIALOG ═══ */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Assinar {checkoutPlano?.nome}
            </DialogTitle>
            <DialogDescription>
              Plano {checkoutPlano?.nome} por <strong>R$ {checkoutPlano?.preco}/mês</strong>. Insira seu e-mail para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="seu@email.com"
                value={checkoutEmail}
                onChange={(e) => setCheckoutEmail(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
                autoFocus
              />
            </div>
            <Button
              className="w-full lp-btn-primary rounded-full font-semibold"
              onClick={handleCheckout}
              disabled={checkoutLoading || !checkoutEmail}
            >
              {checkoutLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
              ) : (
                <>Ir para Pagamento <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              <Lock className="w-3 h-3 inline mr-1" />
              Pagamento seguro via Mercado Pago
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
