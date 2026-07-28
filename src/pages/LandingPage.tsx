import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { ArrowUpRight, Plus, Minus } from 'lucide-react';
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

/* =========================================================
   NEXSILES — AGENCY EDITION
   Palette:  Bone #f4f1ec · Ink #0b0b0d · Rose #e11d48
   Type:     DM Serif Display (display) · Fira Sans (body) · JetBrains Mono (labels)
   ========================================================= */
const BONE = '#f4f1ec';
const INK = '#0b0b0d';
const ROSE = '#e11d48';

const serif = { fontFamily: '"DM Serif Display", "Times New Roman", serif' };
const sans = { fontFamily: '"Fira Sans", system-ui, sans-serif' };
const mono = { fontFamily: '"JetBrains Mono", ui-monospace, monospace' };

/* ---------- primitives ---------- */
const Reveal = ({ children, delay = 0, y = 30 }: { children: React.ReactNode; delay?: number; y?: number }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.8, delay, ease: [0.22, 0.61, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const SplitLine = ({ text, className = '', delay = 0, style }: { text: string; className?: string; delay?: number; style?: React.CSSProperties }) => (
  <span className={`inline-block overflow-hidden align-bottom ${className}`}>
    <motion.span
      className="inline-block"
      initial={{ y: '100%' }}
      whileInView={{ y: '0%' }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay, ease: [0.22, 0.61, 0.36, 1] }}
      style={style}
    >
      {text}
    </motion.span>
  </span>
);

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const w = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  return <motion.div style={{ width: w, background: INK }} className="fixed top-0 left-0 z-[120] h-[2px]" />;
};

const CursorDot = () => {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40 });
  const sy = useSpring(y, { stiffness: 500, damping: 40 });
  useEffect(() => {
    const h = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, [x, y]);
  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%' }}
      className="pointer-events-none fixed top-0 left-0 z-[130] hidden md:block h-2 w-2 rounded-full mix-blend-difference"
      // white so it inverts nicely on both light bone and dark sections
      children={<div className="h-full w-full rounded-full bg-white" />}
    />
  );
};

const Marker = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em]" style={mono}>
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: ROSE }} />
    {children}
  </span>
);

/* ---------- top bar ---------- */
const TopBar = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const t = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Sao_Paulo' }).format(d);
      setTime(t);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="fixed top-0 inset-x-0 z-[100] border-b border-black/10 bg-[color:var(--bone,#f4f1ec)]/80 backdrop-blur" style={{ ['--bone' as any]: BONE }}>
      <div className="max-w-[1440px] mx-auto px-6 h-9 flex items-center justify-between text-[10px] uppercase tracking-[0.25em]" style={{ ...mono, color: INK }}>
        <span>Nexsiles · Studio de Software para Joalherias</span>
        <span className="hidden md:inline">São Paulo, BR — {time}</span>
        <span>v. 26.7</span>
      </div>
    </div>
  );
};

/* ---------- nav ---------- */
const Nav = ({ onBuy }: { onBuy: () => void }) => {
  const [open, setOpen] = useState(false);
  const links = [
    { href: '#trabalho', n: '01', label: 'Trabalho' },
    { href: '#capacidades', n: '02', label: 'Capacidades' },
    { href: '#processo', n: '03', label: 'Processo' },
    { href: '#vozes', n: '04', label: 'Vozes' },
    { href: '#preco', n: '05', label: 'Preço' },
    { href: '#faq', n: '06', label: 'FAQ' },
  ];
  return (
    <>
      <nav className="fixed top-9 inset-x-0 z-[99] border-b border-black/10" style={{ background: `${BONE}` }}>
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2">
            <span className="text-xl leading-none" style={{ ...serif, color: INK }}>Nexsiles</span>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: ROSE }} />
          </Link>
          <div className="hidden lg:flex items-center gap-8" style={{ ...mono, color: INK }}>
            {links.map(l => (
              <a key={l.href} href={l.href} className="text-[11px] uppercase tracking-[0.2em] group relative">
                <span className="opacity-40 mr-1.5">{l.n}</span>{l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 group-hover:w-full transition-all duration-500" style={{ background: INK }} />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="hidden sm:inline text-[11px] uppercase tracking-[0.2em]" style={{ ...mono, color: INK }}>Entrar</Link>
            <button onClick={onBuy} className="group text-[11px] uppercase tracking-[0.2em] px-4 py-2.5 rounded-full text-white flex items-center gap-2 hover:pl-5 transition-all" style={{ ...mono, background: INK }}>
              Assinar <ArrowUpRight className="w-3 h-3 group-hover:rotate-45 transition-transform" />
            </button>
            <button className="lg:hidden p-2" onClick={() => setOpen(true)} aria-label="menu">
              <Plus className="w-4 h-4" style={{ color: INK }} />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[140]" style={{ background: INK }}>
            <div className="h-9 border-b border-white/10 flex items-center justify-between px-6" style={{ ...mono, color: BONE }}>
              <span className="text-[10px] uppercase tracking-[0.25em]">Menu</span>
              <button onClick={() => setOpen(false)}><Minus className="w-4 h-4" /></button>
            </div>
            <div className="p-8 flex flex-col gap-4">
              {links.map((l, i) => (
                <motion.a key={l.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} href={l.href} onClick={() => setOpen(false)} className="flex items-baseline gap-4 border-b border-white/10 pb-4" style={{ color: BONE }}>
                  <span className="text-xs opacity-50" style={mono}>{l.n}</span>
                  <span className="text-3xl" style={serif}>{l.label}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ---------- HERO ---------- */
const Hero = ({ onBuy }: { onBuy: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <section ref={ref} className="relative pt-32 md:pt-40 pb-16 md:pb-24 border-b border-black/10" style={{ background: BONE }}>
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-12 gap-6 items-end mb-10">
          <div className="col-span-12 md:col-span-6 flex items-center gap-4">
            <Marker>[ 2026 — Software para Joalherias ]</Marker>
          </div>
          <div className="col-span-12 md:col-span-6 text-right hidden md:block" style={mono}>
            <div className="text-[10px] uppercase tracking-[0.25em] opacity-60">Desde 2023 · Mais de 1.500 lojistas</div>
          </div>
        </div>

        {/* Big display */}
        <h1 className="leading-[0.86] tracking-[-0.02em] mb-10" style={{ ...serif, color: INK }}>
          <div className="text-[clamp(56px,13vw,220px)]">
            <SplitLine text="Estúdio" />{' '}
            <SplitLine text="digital" delay={0.05} />
          </div>
          <div className="text-[clamp(48px,10.5vw,180px)] italic">
            <SplitLine text="para joias" delay={0.1} />{' '}
            <SplitLine text="que vendem." delay={0.15} style={{ color: ROSE }} />
          </div>
        </h1>

        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 md:col-span-5">
            <Reveal delay={0.3}>
              <p className="text-base md:text-lg text-black/70 leading-relaxed max-w-md" style={sans}>
                Somos o sistema por trás das joalherias que crescem no Brasil.
                Estoque, PDV, revendedoras, loja virtual, IA de atendimento e CRM — 
                um plano único, sem limites artificiais, feito com o cuidado de quem entende do ofício.
              </p>
            </Reveal>
          </div>

          <div className="col-span-12 md:col-span-3 md:col-start-9">
            <Reveal delay={0.4}>
              <div className="flex flex-col gap-3" style={mono}>
                <button onClick={onBuy} className="group flex items-center justify-between border-b border-black pb-3 text-left">
                  <span className="text-sm uppercase tracking-[0.2em]" style={{ color: INK }}>Assinar Prime</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" style={{ color: INK }} />
                </button>
                <Link to="/auth" className="group flex items-center justify-between border-b border-black/30 pb-3">
                  <span className="text-sm uppercase tracking-[0.2em]" style={{ color: INK }}>Área do cliente</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" style={{ color: INK }} />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Hero image band */}
        <Reveal delay={0.4} y={60}>
          <div className="mt-16 md:mt-24 relative overflow-hidden rounded-sm">
            <motion.div style={{ y, scale }} className="relative aspect-[21/9] w-full">
              <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.4))' }} />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white" style={mono}>
                <span className="text-[10px] uppercase tracking-[0.3em]">Fig. 001 — Coleção 26</span>
                <span className="text-[10px] uppercase tracking-[0.3em]">Rolagem →</span>
              </div>
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

/* ---------- Marquee ---------- */
const Marquee = () => {
  const words = ['Estoque', 'PDV', 'Revendedoras', 'Maletas', 'Loja Virtual', 'IA Bella', 'CRM', 'Fiado', 'Catálogo', 'Metas'];
  return (
    <section className="border-b border-black/10 overflow-hidden py-6" style={{ background: INK }}>
      <motion.div className="flex gap-16 whitespace-nowrap" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
        {[...words, ...words, ...words].map((w, i) => (
          <span key={i} className="flex items-center gap-16 text-5xl md:text-7xl" style={{ ...serif, color: BONE }}>
            {w}
            <span className="text-[8px]" style={{ color: ROSE }}>●</span>
          </span>
        ))}
      </motion.div>
    </section>
  );
};

/* ---------- Manifesto ---------- */
const Manifesto = () => (
  <section className="py-24 md:py-36 border-b border-black/10 px-6" style={{ background: BONE }}>
    <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-3">
        <Marker>[ Manifesto — 01 ]</Marker>
      </div>
      <div className="col-span-12 md:col-span-9">
        <h2 className="text-[clamp(36px,5.5vw,84px)] leading-[1] tracking-[-0.02em]" style={{ ...serif, color: INK }}>
          <Reveal>Software não deveria pesar. </Reveal>
          <Reveal delay={0.1}><span className="italic" style={{ color: ROSE }}>Deveria brilhar.</span></Reveal>
          <Reveal delay={0.2}> Construímos a única</Reveal>
          <Reveal delay={0.3}> plataforma pensada</Reveal>
          <Reveal delay={0.4}> para quem vive de </Reveal>
          <Reveal delay={0.5}>vender semijoias.</Reveal>
        </h2>
      </div>
    </div>
  </section>
);

/* ---------- Work / Cases ---------- */
const Work = () => {
  const items = [
    { n: '01', tag: 'PDV', title: 'Vendas em segundos, offline ou online.', text: 'Interface responsiva, código de barras, PIX na hora, fiado, cupons, impressão térmica.', img: pdvImg },
    { n: '02', tag: 'Dashboard', title: 'Números que contam a história do seu negócio.', text: 'Metas, ranking, faturamento em tempo real, insights de IA e alertas inteligentes.', img: dashImg },
    { n: '03', tag: 'Loja Virtual', title: 'Sua vitrine digital, no seu domínio.', text: 'Checkout Mercado Pago, PIX direto, cupons, banners animados e SEO dinâmico.', img: lojaImg },
  ];
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <section id="trabalho" className="border-b border-black/10" style={{ background: BONE }}>
      <div className="max-w-[1440px] mx-auto px-6 pt-24 pb-8">
        <div className="grid grid-cols-12 gap-6 items-end mb-10">
          <div className="col-span-6"><Marker>[ Trabalho selecionado — 02 ]</Marker></div>
          <div className="col-span-6 text-right hidden md:block" style={mono}><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">03 módulos em destaque</span></div>
        </div>
      </div>

      <div className="border-t border-black/10">
        {items.map((it, i) => (
          <a key={it.n} href="#capacidades" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} className="group block border-b border-black/10 relative">
            <div className="max-w-[1440px] mx-auto px-6 py-8 md:py-12 grid grid-cols-12 gap-6 items-center relative z-10 transition-colors" style={{ color: hovered === i ? ROSE : INK }}>
              <div className="col-span-1 text-[10px] uppercase tracking-[0.25em]" style={mono}>{it.n}</div>
              <div className="col-span-11 md:col-span-5 text-[clamp(28px,4vw,56px)] leading-[1.05] tracking-[-0.01em]" style={serif}>{it.title}</div>
              <div className="hidden md:block col-span-3 text-sm text-black/60 group-hover:text-black/80 transition" style={sans}>{it.text}</div>
              <div className="hidden md:flex col-span-2 items-center justify-end">
                <span className="text-[10px] uppercase tracking-[0.25em]" style={mono}>{it.tag}</span>
              </div>
              <div className="hidden md:flex col-span-1 justify-end">
                <ArrowUpRight className="w-6 h-6 transition-transform group-hover:translate-x-2 group-hover:-translate-y-2" />
              </div>
            </div>

            {/* image reveal on hover */}
            <AnimatePresence>
              {hovered === i && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className="hidden lg:block pointer-events-none absolute right-[8%] top-1/2 -translate-y-1/2 w-[320px] aspect-[4/3] overflow-hidden rounded-sm shadow-2xl z-20"
                >
                  <img src={it.img} alt="" className="w-full h-full object-cover" />
                </motion.div>
              )}
            </AnimatePresence>
          </a>
        ))}
      </div>
    </section>
  );
};

/* ---------- Capacidades (features grid) ---------- */
const Capacities = () => {
  const items = [
    ['Gestão', ['Estoque ilimitado', 'Códigos de barras', 'Categorias dinâmicas', 'Histórico de preços', 'Importação em massa']],
    ['Vendas', ['PDV offline', 'PIX na hora', 'Fiado & cupons', 'Impressão térmica', 'Troca e devolução']],
    ['Rede', ['Maletas com portal PWA', 'Comissão automática', 'Assinatura digital', 'Ranking de vendedoras', 'Extrato transparente']],
    ['Digital', ['Loja virtual pronta', 'Catálogos animados', 'QR Code de vitrines', 'Checkout Mercado Pago', 'SEO dinâmico']],
    ['Inteligência', ['IA Bella no WhatsApp', 'Follow-up automático', 'Insights de vendas', 'Alertas smart', 'A/B testing de prompt']],
    ['Financeiro', ['CRM completo', 'Metas & indicadores', 'Lucratividade por peça', 'Aniversariantes', 'Relatórios PDF/CSV']],
  ];
  return (
    <section id="capacidades" className="border-b border-black/10 py-24 md:py-32 px-6" style={{ background: BONE }}>
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-12 gap-6 mb-14">
          <div className="col-span-12 md:col-span-3"><Marker>[ Capacidades — 03 ]</Marker></div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="text-[clamp(36px,6vw,84px)] leading-[0.95] tracking-[-0.02em]" style={{ ...serif, color: INK }}>
              <Reveal>Um plano.</Reveal>{' '}
              <Reveal delay={0.1}><span className="italic">Tudo dentro.</span></Reveal>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-black/10">
          {items.map(([title, list], i) => (
            <Reveal key={title as string} delay={i * 0.05}>
              <div className="border-r border-b border-black/10 p-8 min-h-[280px] flex flex-col justify-between group hover:bg-black hover:text-[color:var(--bone,#f4f1ec)] transition-colors duration-500" style={{ ['--bone' as any]: BONE }}>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] uppercase tracking-[0.25em]" style={mono}>{String(i + 1).padStart(2, '0')}</span>
                  <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <div>
                  <div className="text-3xl md:text-4xl mb-5" style={serif}>{title as string}</div>
                  <ul className="space-y-1.5" style={sans}>
                    {(list as string[]).map((li) => (
                      <li key={li} className="text-sm opacity-70 group-hover:opacity-100 transition-opacity">— {li}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- Processo ---------- */
const Process = () => {
  const steps = [
    ['01', 'Assine', 'R$ 129/mês via Mercado Pago. PIX, cartão ou boleto. Acesso liberado em segundos.'],
    ['02', 'Configure', 'Cadastro guiado com IA de setup. Importe seu estoque em minutos. Suporte humano no WhatsApp.'],
    ['03', 'Venda', 'PDV, loja virtual, revendedoras e IA respondendo WhatsApp 24/7. Você foca no que importa.'],
  ];
  return (
    <section id="processo" className="border-b border-white/10 py-24 md:py-32 px-6" style={{ background: INK, color: BONE }}>
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-12 gap-6 mb-14">
          <div className="col-span-12 md:col-span-3">
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em]" style={mono}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: ROSE }} />
              [ Processo — 04 ]
            </span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="text-[clamp(36px,6vw,84px)] leading-[0.95] tracking-[-0.02em]" style={serif}>
              <Reveal>Do assine ao</Reveal>{' '}
              <Reveal delay={0.1}><span className="italic" style={{ color: ROSE }}>primeiro venda</span></Reveal>
              <Reveal delay={0.2}> em minutos.</Reveal>
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-px" style={{ background: 'rgba(255,255,255,0.1)' }}>
          {steps.map(([n, title, text], i) => (
            <Reveal key={n} delay={i * 0.1}>
              <div className="p-8 md:p-10 min-h-[280px] flex flex-col justify-between" style={{ background: INK }}>
                <span className="text-[10px] uppercase tracking-[0.25em] opacity-60" style={mono}>{n}</span>
                <div>
                  <div className="text-4xl md:text-5xl mb-4" style={serif}>{title}</div>
                  <p className="text-sm opacity-70 max-w-xs" style={sans}>{text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- Personas ---------- */
const Personas = () => {
  const cards = [
    { img: lojistaImg, tag: 'Para lojistas', title: 'Você no controle.', text: 'Sem planilha, sem chute. Estoque preciso, vendas em segundos, relatórios que decidem.' },
    { img: revImg, tag: 'Para revendedoras', title: 'Portal exclusivo.', text: 'Maletas digitais, vendas no celular, extrato transparente e comissão sempre certa.' },
  ];
  return (
    <section className="border-b border-black/10 grid md:grid-cols-2" style={{ background: BONE }}>
      {cards.map((c, i) => (
        <Reveal key={c.tag} delay={i * 0.1}>
          <div className={`relative aspect-[4/5] md:aspect-auto md:min-h-[720px] overflow-hidden group ${i === 0 ? 'md:border-r' : ''} border-black/10`}>
            <img src={c.img} alt={c.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale group-hover:grayscale-0" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.75))' }} />
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between text-white">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em]" style={mono}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: ROSE }} />
                {c.tag}
              </div>
              <div>
                <div className="text-4xl md:text-6xl leading-[0.95] mb-3" style={serif}>{c.title}</div>
                <p className="text-sm max-w-xs opacity-90" style={sans}>{c.text}</p>
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </section>
  );
};

/* ---------- Vozes ---------- */
const Voices = () => {
  const items = [
    { img: t1, name: 'Amanda R.', role: 'Belo Horizonte', text: 'Tirei 3 planilhas e um caderno da minha vida. As vendas cresceram 40%.' },
    { img: t2, name: 'Carla M.', role: '4 revendedoras', text: 'O portal das revendedoras é lindo. Comissão sai sozinha, sem discussão.' },
    { img: t3, name: 'Fernanda L.', role: 'Loja híbrida', text: 'PIX cai direto, a IA responde WhatsApp enquanto durmo. Perfeito.' },
    { img: t4, name: 'Juliana P.', role: 'São Paulo', text: 'Suporte rápido, atualizações constantes. Vale cada centavo.' },
    { img: t5, name: 'Patrícia S.', role: 'Franqueada', text: 'O ranking virou competição saudável. Bateu meta 3 meses seguidos.' },
  ];
  return (
    <section id="vozes" className="border-b border-black/10 py-24 md:py-32 px-6 overflow-hidden" style={{ background: BONE }}>
      <div className="max-w-[1440px] mx-auto mb-14">
        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-6"><Marker>[ Vozes — 05 ]</Marker></div>
          <div className="col-span-6 text-right hidden md:block" style={mono}><span className="text-[10px] uppercase tracking-[0.25em] opacity-60">4.9 / 5.0 · +1500 lojistas</span></div>
        </div>
        <Reveal>
          <h2 className="mt-8 text-[clamp(36px,6vw,84px)] leading-[0.95] tracking-[-0.02em]" style={{ ...serif, color: INK }}>
            Quem usa, <span className="italic" style={{ color: ROSE }}>fala.</span>
          </h2>
        </Reveal>
      </div>

      <div className="max-w-[1440px] mx-auto grid md:grid-cols-3 gap-px border-t border-l border-black/10">
        {items.slice(0, 3).map((t, i) => (
          <Reveal key={t.name} delay={i * 0.05}>
            <figure className="border-r border-b border-black/10 p-8 min-h-[320px] flex flex-col justify-between bg-transparent">
              <blockquote className="text-xl md:text-2xl leading-snug" style={{ ...serif, color: INK }}>“{t.text}”</blockquote>
              <figcaption className="flex items-center gap-3 mt-6">
                <img src={t.img} alt={t.name} className="h-10 w-10 rounded-full object-cover grayscale" />
                <div style={mono}>
                  <div className="text-[11px] uppercase tracking-[0.15em]" style={{ color: INK }}>{t.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] opacity-60">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
        {items.slice(3).map((t, i) => (
          <Reveal key={t.name} delay={i * 0.05}>
            <figure className="border-r border-b border-black/10 p-8 min-h-[280px] flex flex-col justify-between md:col-span-1">
              <blockquote className="text-xl md:text-2xl leading-snug" style={{ ...serif, color: INK }}>“{t.text}”</blockquote>
              <figcaption className="flex items-center gap-3 mt-6">
                <img src={t.img} alt={t.name} className="h-10 w-10 rounded-full object-cover grayscale" />
                <div style={mono}>
                  <div className="text-[11px] uppercase tracking-[0.15em]" style={{ color: INK }}>{t.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] opacity-60">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
        <div className="border-r border-b border-black/10 p-8 min-h-[280px] flex flex-col justify-between" style={{ background: INK, color: BONE }}>
          <div className="text-6xl md:text-7xl leading-none" style={serif}>4.9<span style={{ color: ROSE }}>.</span></div>
          <div style={mono}><div className="text-[10px] uppercase tracking-[0.2em] opacity-70">Avaliação média</div><div className="text-[10px] uppercase tracking-[0.2em] opacity-70">Google & App Store</div></div>
        </div>
      </div>
    </section>
  );
};

/* ---------- Pricing ---------- */
const Pricing = ({ onBuy }: { onBuy: () => void }) => {
  const features = [
    'Estoque, PDV, Fiado e Cupons ilimitados',
    'Até 25 funcionários com permissões',
    'Revendedoras com portal PWA',
    'Loja virtual + checkout Mercado Pago',
    'IA Bella 24/7 no WhatsApp',
    'CRM, metas, ranking, relatórios',
    'Catálogos digitais e QR Code',
    'Suporte humano no WhatsApp',
  ];
  return (
    <section id="preco" className="border-b border-black/10 py-24 md:py-32 px-6" style={{ background: BONE }}>
      <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4">
          <Marker>[ Preço — 06 ]</Marker>
          <h2 className="mt-6 text-[clamp(40px,6vw,96px)] leading-[0.9] tracking-[-0.02em]" style={{ ...serif, color: INK }}>
            Um plano. <br /><span className="italic" style={{ color: ROSE }}>Sem asterisco.</span>
          </h2>
          <p className="mt-8 text-black/70 max-w-xs" style={sans}>
            Sem fidelidade. Sem taxa de setup. Cancele quando quiser, direto no Mercado Pago.
          </p>
        </div>

        <div className="col-span-12 md:col-span-8">
          <Reveal>
            <div className="border-t border-black">
              <div className="py-8 border-b border-black/10 flex items-end justify-between">
                <div style={mono} className="text-[10px] uppercase tracking-[0.25em] opacity-60">Nexsiles Prime</div>
                <div className="flex items-end gap-1" style={{ color: INK }}>
                  <span className="text-6xl md:text-8xl leading-none" style={serif}>R$ 129</span>
                  <span className="text-sm pb-2" style={mono}>/mês</span>
                </div>
              </div>
              <ul className="grid sm:grid-cols-2">
                {features.map((f, i) => (
                  <li key={f} className={`py-4 border-b border-black/10 flex items-baseline gap-3 ${i % 2 === 0 ? 'sm:border-r sm:pr-6' : 'sm:pl-6'}`} style={sans}>
                    <span className="text-[10px] pt-1" style={{ ...mono, color: ROSE }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm text-black/80">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button onClick={onBuy} className="group flex-1 flex items-center justify-between px-6 py-5 rounded-full text-white transition-all hover:pl-8" style={{ background: INK }}>
                  <span className="text-sm uppercase tracking-[0.2em]" style={mono}>Assinar agora — R$ 129/mês</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                </button>
                <div className="flex items-center justify-center gap-3 px-4 text-[10px] uppercase tracking-[0.2em]" style={{ ...mono, color: INK }}>
                  PIX · Cartão · Boleto
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

/* ---------- FAQ ---------- */
const FAQ = () => {
  const items = [
    { q: 'Preciso instalar algo?', a: 'Não. Roda 100% no navegador. Funciona como app (PWA) no celular e no PDV.' },
    { q: 'E se eu quiser cancelar?', a: 'Sem burocracia. Cancele a qualquer momento pelo Mercado Pago — sem multa, sem fidelidade.' },
    { q: 'É seguro?', a: 'Hospedagem em nuvem enterprise, backups automáticos, isolamento total entre organizações (multi-tenant com RLS).' },
    { q: 'A IA responde no meu WhatsApp?', a: 'Sim. A IA "Bella" atende, envia catálogo, gera pedidos e transfere pra você quando precisa de humano.' },
    { q: 'Tem suporte?', a: 'Suporte humano via WhatsApp em horário comercial e base de ajuda 24/7.' },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-b border-black/10 py-24 md:py-32 px-6" style={{ background: BONE }}>
      <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4">
          <Marker>[ FAQ — 07 ]</Marker>
          <h2 className="mt-6 text-[clamp(40px,6vw,84px)] leading-[0.9] tracking-[-0.02em]" style={{ ...serif, color: INK }}>
            Dúvidas <span className="italic">honestas.</span>
          </h2>
        </div>
        <div className="col-span-12 md:col-span-8 border-t border-black">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={it.q} className="border-b border-black/10">
                <button onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between py-6 text-left group">
                  <span className="flex items-baseline gap-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] opacity-50" style={mono}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-xl md:text-2xl" style={{ ...serif, color: INK }}>{it.q}</span>
                  </span>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25 }}>
                    <Plus className="w-5 h-5" style={{ color: ROSE }} />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="pb-6 pl-10 pr-10 text-sm text-black/70 max-w-2xl" style={sans}>{it.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ---------- Final CTA ---------- */
const FinalCTA = ({ onBuy }: { onBuy: () => void }) => (
  <section className="py-24 md:py-40 px-6 border-b border-white/10 relative overflow-hidden" style={{ background: INK, color: BONE }}>
    <div className="max-w-[1440px] mx-auto text-center">
      <Reveal>
        <div className="text-[10px] uppercase tracking-[0.3em] opacity-60 mb-8" style={mono}>[ Comece hoje ]</div>
      </Reveal>
      <h2 className="leading-[0.86] tracking-[-0.02em]" style={serif}>
        <div className="text-[clamp(56px,13vw,220px)]"><SplitLine text="Faça sua" /></div>
        <div className="text-[clamp(56px,13vw,220px)] italic" style={{ color: ROSE }}><SplitLine text="joia brilhar." delay={0.1} /></div>
      </h2>
      <Reveal delay={0.4}>
        <button onClick={onBuy} className="group mt-12 inline-flex items-center gap-3 px-8 py-5 rounded-full bg-white text-black transition-all hover:gap-5">
          <span className="text-sm uppercase tracking-[0.2em]" style={mono}>Assinar Nexsiles Prime</span>
          <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
        </button>
      </Reveal>
    </div>
  </section>
);

/* ---------- Footer ---------- */
const Footer = () => (
  <footer className="px-6 py-16" style={{ background: INK, color: BONE }}>
    <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-5">
        <div className="text-6xl md:text-8xl leading-none" style={serif}>Nexsiles<span style={{ color: ROSE }}>.</span></div>
        <p className="mt-6 text-sm opacity-70 max-w-sm" style={sans}>
          Estúdio de software para joalherias e semijoias. Feito com carinho no Brasil.
        </p>
      </div>
      <div className="col-span-6 md:col-span-2" style={mono}>
        <div className="text-[10px] uppercase tracking-[0.25em] opacity-50 mb-4">Produto</div>
        <ul className="space-y-2 text-sm">
          <li><a href="#trabalho" className="hover:opacity-70">Trabalho</a></li>
          <li><a href="#capacidades" className="hover:opacity-70">Capacidades</a></li>
          <li><a href="#preco" className="hover:opacity-70">Preço</a></li>
          <li><Link to="/auth" className="hover:opacity-70">Entrar</Link></li>
        </ul>
      </div>
      <div className="col-span-6 md:col-span-2" style={mono}>
        <div className="text-[10px] uppercase tracking-[0.25em] opacity-50 mb-4">Legal</div>
        <ul className="space-y-2 text-sm">
          <li><Link to="/politica-privacidade" className="hover:opacity-70">Privacidade</Link></li>
          <li><Link to="/termos-de-uso" className="hover:opacity-70">Termos</Link></li>
        </ul>
      </div>
      <div className="col-span-12 md:col-span-3" style={mono}>
        <div className="text-[10px] uppercase tracking-[0.25em] opacity-50 mb-4">Contato</div>
        <ul className="space-y-2 text-sm">
          <li><a href="https://wa.me/5511937687369" target="_blank" rel="noreferrer" className="hover:opacity-70">WhatsApp · (11) 93768-7369</a></li>
          <li className="opacity-60">São Paulo — Brasil</li>
        </ul>
      </div>
    </div>
    <div className="max-w-[1440px] mx-auto mt-16 pt-6 border-t border-white/10 flex flex-wrap justify-between text-[10px] uppercase tracking-[0.25em] opacity-60" style={mono}>
      <span>© {new Date().getFullYear()} Nexsiles Studio.</span>
      <span>Todos os direitos reservados.</span>
    </div>
  </footer>
);

/* ---------- PAGE ---------- */
export default function LandingPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = ''; };
  }, []);
  const openBuy = () => setCheckoutOpen(true);

  return (
    <div className="min-h-screen antialiased selection:bg-black selection:text-white" style={{ background: BONE, color: INK, ...sans }}>
      <ScrollProgress />
      <CursorDot />
      <TopBar />
      <Nav onBuy={openBuy} />
      <Hero onBuy={openBuy} />
      <Marquee />
      <Manifesto />
      <Work />
      <Capacities />
      <Process />
      <Personas />
      <Voices />
      <Pricing onBuy={openBuy} />
      <FAQ />
      <FinalCTA onBuy={openBuy} />
      <Footer />

      <PublicCheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
      <PaymentReturnDialog />
    </div>
  );
}
