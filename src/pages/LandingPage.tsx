import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Sparkles,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  Bot,
  Store,
  Smartphone,
  ShieldCheck,
  Zap,
  Star,
  Plus,
  Minus,
} from 'lucide-react';
import { PublicCheckoutDialog } from '@/components/landing/PublicCheckoutDialog';
import { PaymentReturnDialog } from '@/components/landing/PaymentReturnDialog';

import heroImg from '@/assets/landing-hero-jewelry.webp';
import pdvImg from '@/assets/landing-pdv-mockup.webp';
import dashImg from '@/assets/landing-dashboard-mockup.webp';
import lojaImg from '@/assets/landing-loja-mockup.webp';
import lojistaImg from '@/assets/landing-persona-lojista.webp';
import revImg from '@/assets/landing-persona-revendedora.webp';
import t1 from '@/assets/testimonial-amanda.jpg';
import t2 from '@/assets/testimonial-carla.jpg';
import t3 from '@/assets/testimonial-fernanda.jpg';
import t4 from '@/assets/testimonial-juliana.jpg';
import t5 from '@/assets/testimonial-patricia.jpg';

/* ============ THEME ============
   Ivory #fdf2f8 · White #ffffff · Ink #0f172a
   Rose #e11d48 (primary) · Blue #2563eb (accent)
   DM Serif Display (headings) · Fira Sans (body)
================================== */
const IVORY = '#fdf2f8';
const INK = '#0f172a';
const ROSE = '#e11d48';
const BLUE = '#2563eb';

const serif = { fontFamily: '"DM Serif Display", Georgia, serif' };
const sans = { fontFamily: '"Fira Sans", system-ui, sans-serif' };

/* ---------- primitives ---------- */
const Reveal = ({ children, delay = 0, y = 24 }: { children: React.ReactNode; delay?: number; y?: number }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.7, delay, ease: [0.2, 0.65, 0.3, 0.9] }}
  >
    {children}
  </motion.div>
);

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const w = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  return (
    <motion.div
      style={{ width: w, background: `linear-gradient(90deg, ${ROSE}, ${BLUE})` }}
      className="fixed top-0 left-0 z-[110] h-[3px]"
    />
  );
};

/* ---------- nav ---------- */
const Nav = ({ onBuy }: { onBuy: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [
    { href: '#recursos', label: 'Recursos' },
    { href: '#modulos', label: 'Módulos' },
    { href: '#depoimentos', label: 'Depoimentos' },
    { href: '#preco', label: 'Preço' },
    { href: '#faq', label: 'FAQ' },
  ];
  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 inset-x-0 z-[90] transition-all ${
        scrolled ? 'bg-white/85 backdrop-blur-xl border-b border-rose-100/70 py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/landing" className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-full grid place-items-center text-white text-lg"
            style={{ background: `linear-gradient(135deg, ${ROSE}, ${BLUE})`, ...serif }}
          >
            N
          </div>
          <span className="text-xl" style={{ ...serif, color: INK }}>
            Nexsiles
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8" style={sans}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-slate-600 hover:text-slate-900 transition relative group"
            >
              {l.label}
              <span
                className="absolute -bottom-1 left-0 h-[1.5px] w-0 group-hover:w-full transition-all duration-300"
                style={{ background: ROSE }}
              />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3" style={sans}>
          <Link
            to="/auth"
            className="hidden sm:inline text-sm text-slate-700 hover:text-slate-900"
          >
            Entrar
          </Link>
          <button
            onClick={onBuy}
            className="text-sm px-5 py-2.5 rounded-full text-white font-medium shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all"
            style={{ background: `linear-gradient(135deg, ${ROSE}, ${BLUE})` }}
          >
            Assinar
          </button>
          <button
            className="md:hidden p-2 text-slate-700"
            onClick={() => setOpen((v) => !v)}
            aria-label="menu"
          >
            {open ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white border-t border-rose-100"
          >
            <div className="px-6 py-4 flex flex-col gap-3" style={sans}>
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-slate-700 py-2"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

/* ---------- hero ---------- */
const Hero = ({ onBuy }: { onBuy: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section ref={ref} className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      {/* soft blobs */}
      <div
        aria-hidden
        className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-40"
        style={{ background: `radial-gradient(circle, ${ROSE}55 0%, transparent 70%)` }}
      />
      <div
        aria-hidden
        className="absolute top-1/2 -left-40 h-[420px] w-[420px] rounded-full blur-3xl opacity-30"
        style={{ background: `radial-gradient(circle, ${BLUE}55 0%, transparent 70%)` }}
      />

      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <Reveal>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-rose-100 shadow-sm text-xs text-slate-700 mb-8"
              style={sans}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: ROSE }} />
              Nexsiles Prime — tudo incluso por R$ 129/mês
            </div>
          </Reveal>

          <h1
            className="text-[46px] leading-[0.98] sm:text-6xl lg:text-[84px] tracking-tight mb-6"
            style={{ ...serif, color: INK }}
          >
            <Reveal>
              <span className="block">O sistema que faz</span>
            </Reveal>
            <Reveal delay={0.1}>
              <span className="block italic">sua semijoia</span>
            </Reveal>
            <Reveal delay={0.2}>
              <span
                className="block"
                style={{
                  background: `linear-gradient(120deg, ${ROSE}, ${BLUE})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                brilhar mais.
              </span>
            </Reveal>
          </h1>

          <Reveal delay={0.3}>
            <p className="text-lg text-slate-600 max-w-xl mb-10 leading-relaxed" style={sans}>
              Estoque, PDV, revendedoras, catálogo digital, loja virtual, IA de atendimento e CRM — 
              um único plano, sem limites artificiais, feito para quem vende joias e semijoias.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="flex flex-wrap gap-3 items-center" style={sans}>
              <button
                onClick={onBuy}
                className="group inline-flex items-center gap-2 px-7 py-4 rounded-full text-white font-medium shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-0.5 transition-all"
                style={{ background: `linear-gradient(135deg, ${ROSE}, ${BLUE})` }}
              >
                Começar agora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white border border-slate-200 text-slate-800 font-medium hover:border-slate-400 transition"
              >
                Já sou cliente
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="mt-10 flex items-center gap-6 text-xs text-slate-500" style={sans}>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" style={{ color: ROSE }} />
                Pagamento seguro Mercado Pago
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Zap className="w-4 h-4" style={{ color: BLUE }} />
                Acesso liberado na hora
              </div>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={0.3} y={40}>
            <div className="relative">
              <motion.div
                style={{ y, scale }}
                className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-rose-500/20"
              >
                <img src={heroImg} alt="Semijoias" className="w-full h-full object-cover" />
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(180deg, transparent 40%, ${ROSE}22)` }}
                />
              </motion.div>

              {/* floating cards */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -left-6 top-10 bg-white rounded-2xl shadow-xl p-4 w-56 border border-rose-50"
                style={sans}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full grid place-items-center"
                    style={{ background: `${ROSE}15` }}
                  >
                    <ShoppingBag className="w-5 h-5" style={{ color: ROSE }} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Venda concluída</div>
                    <div className="text-sm font-semibold" style={{ color: INK }}>
                      R$ 486,00
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-4 bottom-16 bg-white rounded-2xl shadow-xl p-4 w-52 border border-blue-50"
                style={sans}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full grid place-items-center"
                    style={{ background: `${BLUE}15` }}
                  >
                    <Bot className="w-5 h-5" style={{ color: BLUE }} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">IA respondeu</div>
                    <div className="text-sm font-semibold" style={{ color: INK }}>
                      12 clientes hoje
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

/* ---------- stats bar ---------- */
const StatsBar = () => {
  const stats = [
    { n: '+1.500', l: 'Lojistas ativas' },
    { n: '2M+', l: 'Peças gerenciadas' },
    { n: '98%', l: 'Satisfação' },
    { n: '24/7', l: 'IA disponível' },
  ];
  return (
    <section className="border-y border-rose-100/70 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <Reveal key={s.l} delay={i * 0.08}>
            <div className="text-center md:text-left">
              <div className="text-3xl md:text-4xl" style={{ ...serif, color: INK }}>
                {s.n}
              </div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mt-1" style={sans}>
                {s.l}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

/* ---------- features ---------- */
const Features = () => {
  const items = [
    {
      icon: Package,
      title: 'Estoque inteligente',
      text: 'Cadastro rápido, códigos de barras, importação em massa e alertas automáticos de reposição.',
    },
    {
      icon: ShoppingBag,
      title: 'PDV completo',
      text: 'Venda em segundos, modo offline, impressão de recibo, PIX na hora, fiado e cupons.',
    },
    {
      icon: Users,
      title: 'Revendedoras e maletas',
      text: 'Ciclo completo de consignação com portal PWA exclusivo, comissão automática e assinaturas digitais.',
    },
    {
      icon: Store,
      title: 'Loja virtual pronta',
      text: 'Sua vitrine online, checkout MP, PIX direto, cupons, banners animados e SEO dinâmico.',
    },
    {
      icon: Bot,
      title: 'IA Bella 24/7',
      text: 'Atende WhatsApp, envia catálogo, tira dúvidas, gera pedidos e transfere pra você quando precisa.',
    },
    {
      icon: BarChart3,
      title: 'CRM & Relatórios',
      text: 'Aniversariantes, top clientes, ticket médio, lucratividade por peça e previsão de compras.',
    },
  ];
  return (
    <section id="recursos" className="py-28 px-6" style={{ background: IVORY }}>
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3" style={sans}>
              O que está incluso
            </div>
            <h2 className="text-4xl md:text-6xl" style={{ ...serif, color: INK }}>
              Tudo o que sua joalheria precisa,
              <br />
              <span style={{ color: ROSE }}>em um só lugar.</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 0.06} y={30}>
              <motion.div
                whileHover={{ y: -6 }}
                className="group h-full bg-white p-8 rounded-3xl border border-rose-100/60 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/10 transition-all"
              >
                <div
                  className="h-12 w-12 rounded-2xl grid place-items-center mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${ROSE}18, ${BLUE}18)` }}
                >
                  <it.icon className="w-6 h-6" style={{ color: ROSE }} />
                </div>
                <h3 className="text-2xl mb-2" style={{ ...serif, color: INK }}>
                  {it.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed" style={sans}>
                  {it.text}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- showcase (alternating) ---------- */
const Showcase = () => {
  const blocks = [
    {
      tag: '01 · Dashboard',
      title: 'Números que contam a história do seu negócio.',
      text: 'Metas, ranking de vendedoras, faturamento em tempo real, insights de IA e alertas inteligentes — direto ao ponto, com o design que combina com sua marca.',
      img: dashImg,
      color: ROSE,
    },
    {
      tag: '02 · PDV',
      title: 'Vendas rápidas até no fim de semana cheio.',
      text: 'Interface responsiva, código de barras, PIX na hora, fiado, cupons, impressão térmica e modo offline com sincronização automática.',
      img: pdvImg,
      color: BLUE,
      reverse: true,
    },
    {
      tag: '03 · Loja Virtual',
      title: 'Sua vitrine digital, no seu domínio.',
      text: 'Catálogo animado, checkout com Mercado Pago, PIX direto na sua conta, cupons, banners rotativos e integração com WhatsApp e IA.',
      img: lojaImg,
      color: ROSE,
    },
  ];
  return (
    <section id="modulos" className="py-28 px-6 bg-white">
      <div className="max-w-7xl mx-auto space-y-32">
        {blocks.map((b, i) => (
          <div key={b.tag} className={`grid lg:grid-cols-12 gap-12 items-center ${b.reverse ? 'lg:[&>div:first-child]:order-2' : ''}`}>
            <Reveal>
              <div className="lg:col-span-6">
                <div
                  className="text-xs uppercase tracking-[0.3em] mb-4"
                  style={{ ...sans, color: b.color }}
                >
                  {b.tag}
                </div>
                <h3 className="text-3xl md:text-5xl mb-5 leading-tight" style={{ ...serif, color: INK }}>
                  {b.title}
                </h3>
                <p className="text-base text-slate-600 leading-relaxed max-w-xl" style={sans}>
                  {b.text}
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.15} y={40}>
              <div className="lg:col-span-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="relative rounded-3xl overflow-hidden shadow-2xl"
                  style={{ boxShadow: `0 30px 80px -20px ${b.color}30` }}
                >
                  <img src={b.img} alt={b.title} className="w-full h-auto" />
                </motion.div>
              </div>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ---------- personas ---------- */
const Personas = () => {
  const cards = [
    {
      img: lojistaImg,
      tag: 'Para lojistas',
      title: 'Você no controle. Sem planilha, sem chute.',
      bullets: ['Estoque preciso', 'Vendas em segundos', 'Relatórios que decidem'],
      color: ROSE,
    },
    {
      img: revImg,
      tag: 'Para revendedoras',
      title: 'Portal PWA exclusivo, comissão sempre certa.',
      bullets: ['Maletas digitais', 'Vendas no celular', 'Extrato transparente'],
      color: BLUE,
    },
  ];
  return (
    <section className="py-28 px-6" style={{ background: IVORY }}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
        {cards.map((c, i) => (
          <Reveal key={c.tag} delay={i * 0.1} y={40}>
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] group">
              <img
                src={c.img}
                alt={c.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10 text-white">
                <div className="text-xs uppercase tracking-[0.3em] mb-3 opacity-90" style={{ ...sans, color: '#fff' }}>
                  {c.tag}
                </div>
                <h3 className="text-3xl md:text-4xl mb-5 max-w-md" style={serif}>
                  {c.title}
                </h3>
                <ul className="space-y-1.5" style={sans}>
                  {c.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4" style={{ color: c.color }} /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

/* ---------- testimonials ---------- */
const Testimonials = () => {
  const items = [
    { img: t1, name: 'Amanda R.', role: 'Loja em Belo Horizonte', text: 'Tirei 3 planilhas e um caderno da minha vida. Agora tudo está no Nexsiles e minhas vendas cresceram 40%.' },
    { img: t2, name: 'Carla M.', role: 'Rede com 4 revendedoras', text: 'O portal das revendedoras é lindo e as meninas amaram. Comissão sai sozinha, sem discussão.' },
    { img: t3, name: 'Fernanda L.', role: 'Loja física + online', text: 'Loja virtual perfeita, PIX cai direto na minha conta e a IA responde WhatsApp enquanto durmo.' },
    { img: t4, name: 'Juliana P.', role: 'Semi joias em SP', text: 'Suporte rápido, atualizações constantes e o preço mais justo do mercado. Vale cada centavo.' },
    { img: t5, name: 'Patrícia S.', role: 'Franqueada', text: 'O ranking de vendedoras virou uma competição saudável. Bateu meta 3 meses seguidos.' },
  ];
  return (
    <section id="depoimentos" className="py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h2 className="text-4xl md:text-6xl max-w-xl" style={{ ...serif, color: INK }}>
              Lojistas que <span style={{ color: ROSE }}>brilham</span> com a gente.
            </h2>
            <div className="flex items-center gap-2" style={sans}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 fill-current" style={{ color: '#f59e0b' }} />
              ))}
              <span className="text-sm text-slate-600 ml-2">4.9/5 em avaliações</span>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="relative">
        <motion.div
          className="flex gap-6 px-6"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          {[...items, ...items].map((t, i) => (
            <div
              key={i}
              className="min-w-[340px] max-w-[340px] bg-white border border-rose-100 rounded-3xl p-6 shadow-sm"
            >
              <p className="text-slate-700 text-sm leading-relaxed mb-6" style={sans}>
                “{t.text}”
              </p>
              <div className="flex items-center gap-3">
                <img src={t.img} alt={t.name} className="h-11 w-11 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-semibold" style={{ ...sans, color: INK }}>
                    {t.name}
                  </div>
                  <div className="text-xs text-slate-500" style={sans}>
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ---------- pricing ---------- */
const Pricing = ({ onBuy }: { onBuy: () => void }) => {
  const features = [
    'Estoque, PDV, Fiado e Cupons ilimitados',
    'Até 25 funcionários com permissões',
    'Revendedoras e maletas com portal PWA',
    'Loja virtual + checkout Mercado Pago',
    'IA Bella 24/7 no WhatsApp',
    'CRM, metas, ranking e relatórios',
    'Catálogos digitais, QR Code e branding',
    'Suporte humano e atualizações constantes',
  ];
  return (
    <section id="preco" className="py-28 px-6" style={{ background: IVORY }}>
      <div className="max-w-4xl mx-auto text-center mb-14">
        <Reveal>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3" style={sans}>
            Um plano. Tudo incluso.
          </div>
          <h2 className="text-4xl md:text-6xl" style={{ ...serif, color: INK }}>
            Simples como <span style={{ color: ROSE }}>deveria ser.</span>
          </h2>
        </Reveal>
      </div>

      <Reveal y={30}>
        <div
          className="max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-rose-500/20 border"
          style={{ borderColor: `${ROSE}30` }}
        >
          <div
            className="p-8 md:p-10 text-white text-center"
            style={{ background: `linear-gradient(135deg, ${ROSE}, ${BLUE})` }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs mb-4" style={sans}>
              <Sparkles className="w-3.5 h-3.5" /> Nexsiles Prime
            </div>
            <div style={sans} className="flex items-end justify-center gap-2">
              <span className="text-6xl md:text-7xl" style={serif}>
                R$ 129
              </span>
              <span className="text-lg opacity-90 mb-3">/mês</span>
            </div>
            <p className="mt-2 opacity-90 text-sm" style={sans}>
              Sem fidelidade. Cancele quando quiser. Acesso liberado na hora.
            </p>
          </div>

          <div className="bg-white p-8 md:p-10">
            <ul className="grid sm:grid-cols-2 gap-3 mb-8" style={sans}>
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: ROSE }} /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={onBuy}
              className="w-full py-4 rounded-full text-white font-medium text-base shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-0.5 transition-all"
              style={{ background: `linear-gradient(135deg, ${ROSE}, ${BLUE})`, ...sans }}
            >
              Começar agora — R$ 129/mês
            </button>
            <p className="text-center text-xs text-slate-500 mt-4" style={sans}>
              Pagamento seguro via Mercado Pago · PIX · Cartão · Boleto
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
};

/* ---------- FAQ ---------- */
const FAQ = () => {
  const items = [
    { q: 'Preciso instalar algo?', a: 'Não. O Nexsiles roda 100% no navegador. Também funciona como app (PWA) no celular e no PDV.' },
    { q: 'E se eu quiser cancelar?', a: 'Sem burocracia. Cancele a qualquer momento pelo Mercado Pago — sem multa, sem fidelidade.' },
    { q: 'Meu banco de dados é seguro?', a: 'Sim. Hospedagem em nuvem enterprise, backups automáticos, isolamento total entre organizações (multi-tenant com RLS).' },
    { q: 'A IA responde no meu WhatsApp?', a: 'Sim, com a Evolution API. A IA "Bella" atende, envia catálogo, gera pedidos e chama você quando precisa de humano.' },
    { q: 'Tem suporte?', a: 'Suporte humano via WhatsApp em horário comercial e base de ajuda 24/7.' },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-28 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <h2 className="text-4xl md:text-5xl text-center mb-14" style={{ ...serif, color: INK }}>
            Perguntas frequentes
          </h2>
        </Reveal>
        <div className="space-y-3" style={sans}>
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={it.q} delay={i * 0.05}>
                <div className="border border-rose-100 rounded-2xl overflow-hidden bg-white">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-rose-50/40 transition"
                  >
                    <span className="text-base font-medium" style={{ color: INK }}>
                      {it.q}
                    </span>
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                      <Plus className="w-5 h-5" style={{ color: ROSE }} />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{it.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ---------- final CTA ---------- */
const FinalCTA = ({ onBuy }: { onBuy: () => void }) => (
  <section className="py-28 px-6 relative overflow-hidden" style={{ background: IVORY }}>
    <div
      aria-hidden
      className="absolute inset-0 opacity-40"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${ROSE}30, transparent 50%), radial-gradient(circle at 70% 70%, ${BLUE}25, transparent 50%)`,
      }}
    />
    <Reveal>
      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-7xl leading-[1] mb-6" style={{ ...serif, color: INK }}>
          Pronta pra ver sua
          <br />
          <span
            style={{
              background: `linear-gradient(120deg, ${ROSE}, ${BLUE})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            joalheria brilhar?
          </span>
        </h2>
        <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto" style={sans}>
          Ative o Nexsiles Prime em menos de 2 minutos e comece a vender hoje mesmo.
        </p>
        <button
          onClick={onBuy}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-medium text-lg shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-0.5 transition-all"
          style={{ background: `linear-gradient(135deg, ${ROSE}, ${BLUE})`, ...sans }}
        >
          Assinar Nexsiles Prime <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </Reveal>
  </section>
);

/* ---------- footer ---------- */
const Footer = () => (
  <footer className="bg-white border-t border-rose-100 px-6 py-14" style={sans}>
    <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-8 w-8 rounded-full grid place-items-center text-white text-sm"
            style={{ background: `linear-gradient(135deg, ${ROSE}, ${BLUE})`, ...serif }}
          >
            N
          </div>
          <span className="text-lg" style={{ ...serif, color: INK }}>
            Nexsiles
          </span>
        </div>
        <p className="text-sm text-slate-500 max-w-xs">
          Sistema completo para lojas e revendas de semijoias.
        </p>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-slate-400 mb-3">Produto</div>
        <ul className="space-y-2 text-sm text-slate-600">
          <li><a href="#recursos" className="hover:text-slate-900">Recursos</a></li>
          <li><a href="#modulos" className="hover:text-slate-900">Módulos</a></li>
          <li><a href="#preco" className="hover:text-slate-900">Preço</a></li>
          <li><Link to="/auth" className="hover:text-slate-900">Entrar</Link></li>
        </ul>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-slate-400 mb-3">Legal</div>
        <ul className="space-y-2 text-sm text-slate-600">
          <li><Link to="/politica-privacidade" className="hover:text-slate-900">Privacidade</Link></li>
          <li><Link to="/termos-de-uso" className="hover:text-slate-900">Termos</Link></li>
        </ul>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-slate-400 mb-3">Suporte</div>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>
            <a
              href="https://wa.me/5511937687369"
              className="hover:text-slate-900"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp (11) 93768-7369
            </a>
          </li>
          <li className="flex items-center gap-1.5 text-slate-500">
            <Smartphone className="w-3.5 h-3.5" /> App PWA disponível
          </li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-rose-100 text-xs text-slate-400 flex flex-wrap gap-3 justify-between">
      <span>© {new Date().getFullYear()} Nexsiles. Todos os direitos reservados.</span>
      <span>Feito com carinho no Brasil.</span>
    </div>
  </footer>
);

/* ---------- page ---------- */
export default function LandingPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  const openBuy = () => setCheckoutOpen(true);

  return (
    <div className="min-h-screen antialiased" style={{ background: '#ffffff', color: INK, ...sans }}>
      <ScrollProgress />
      <Nav onBuy={openBuy} />
      <Hero onBuy={openBuy} />
      <StatsBar />
      <Features />
      <Showcase />
      <Personas />
      <Testimonials />
      <Pricing onBuy={openBuy} />
      <FAQ />
      <FinalCTA onBuy={openBuy} />
      <Footer />

      <PublicCheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
      <PaymentReturnDialog />
    </div>
  );
}
