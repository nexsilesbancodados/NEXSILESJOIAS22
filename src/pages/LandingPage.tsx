import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import heroImg from '@/assets/landing-hero-jewelry.jpg';
import sellersImg from '@/assets/landing-sellers.jpg';
import buyersImg from '@/assets/landing-buyers.jpg';

/* ---------- Design tokens (local to landing) ----------
   Editorial dark canvas + rose-gold accent.
   Inspired by the Eagle real-estate reference (huge display type,
   stripes, scroll-driven parallax, magazine cadence). */

const ACCENT = '#b07a4c';       // rose-gold escuro para contraste em fundo claro
const ACCENT_SOFT = '#e8c9a8';
const BG = '#f6f1ea';           // creme editorial
const BG_ALT = '#efe7dc';       // creme mais quente para faixas
const INK = '#1a1410';          // tinta quase preta
const MUTED = 'rgba(26,20,16,0.6)';

/* ---------- Small primitives ---------- */

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase" style={{ color: ACCENT }}>
      <span className="inline-block w-6 h-px" style={{ background: ACCENT }} />
      <span>{children}</span>
    </div>
  );
}

function Reveal({ children, delay = 0, y = 40 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1800;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val.toLocaleString('pt-BR')}{suffix}</span>;
}

/* ---------- Navbar ---------- */

function Navbar({ onCta }: { onCta: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const links = [
    { label: 'Sistema', href: '#sistema' },
    { label: 'Para você', href: '#lojistas' },
    { label: 'Recursos', href: '#recursos' },
    { label: 'Depoimentos', href: '#depoimentos' },
  ];
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'backdrop-blur-xl bg-[rgba(11,10,9,0.72)] border-b border-white/5' : ''
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3 group">
          <span
            className="text-[13px] tracking-[0.35em] uppercase"
            style={{ color: INK, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Nexsiles
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[12px] tracking-[0.22em] uppercase transition-colors hover:opacity-100"
              style={{ color: MUTED }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
          <PillButton onClick={onCta}>Começar agora</PillButton>
        </div>
        <button
          className="md:hidden p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
          style={{ color: INK }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="md:hidden border-t border-white/5"
          style={{ background: 'rgba(11,10,9,0.95)' }}
        >
          <div className="px-6 py-6 flex flex-col gap-5">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm tracking-[0.2em] uppercase"
                style={{ color: INK }}
              >
                {l.label}
              </a>
            ))}
            <PillButton onClick={onCta}>Começar agora</PillButton>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

function PillButton({
  children,
  onClick,
  variant = 'solid',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'solid' | 'ghost';
}) {
  const solid = variant === 'solid';
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full text-[12px] tracking-[0.22em] uppercase transition-colors"
      style={{
        background: solid ? ACCENT : 'transparent',
        color: solid ? '#1a1410' : INK,
        border: solid ? 'none' : `1px solid rgba(245,239,230,0.2)`,
      }}
    >
      <span>{children}</span>
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full transition-transform group-hover:rotate-45"
        style={{ background: solid ? '#1a1410' : ACCENT, color: solid ? ACCENT : '#1a1410' }}
      >
        <ArrowUpRight size={12} />
      </span>
    </motion.button>
  );
}

/* ---------- Hero ---------- */

function Hero({ onCta }: { onCta: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative h-[100svh] min-h-[720px] overflow-hidden" style={{ background: BG }}>
      {/* Vertical stripes */}
      <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-r border-white/[0.03] h-full" />
        ))}
      </div>

      {/* Background image */}
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0">
        <img
          src={heroImg}
          alt="Semi-jewelry"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.55) contrast(1.05)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,10,9,0.55) 0%, rgba(11,10,9,0.35) 40%, rgba(11,10,9,0.85) 100%)',
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col justify-end pb-16 md:pb-24">
        <motion.div style={{ y: titleY, opacity: titleOpacity }}>
          <motion.h1
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="font-serif leading-[0.85] tracking-[-0.02em]"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              color: INK,
              fontSize: 'clamp(5rem, 18vw, 20rem)',
              fontWeight: 400,
            }}
          >
            Nexsiles
          </motion.h1>
        </motion.div>

        <div className="mt-10 md:mt-14 grid md:grid-cols-12 gap-8 md:gap-12 items-end">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="md:col-span-5 md:col-start-6"
          >
            <p className="text-[15px] md:text-[17px] leading-relaxed" style={{ color: 'rgba(245,239,230,0.78)' }}>
              O sistema completo para quem vive de semi-joias.
              De estoque a maleta, de PDV a loja virtual — tudo em um só lugar,
              feito com o cuidado que sua marca merece.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <PillButton onClick={onCta}>Começar agora</PillButton>
              <PillButton onClick={() => document.getElementById('sistema')?.scrollIntoView({ behavior: 'smooth' })} variant="ghost">
                Conhecer sistema
              </PillButton>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="md:col-span-3 md:col-start-1 md:row-start-1 hidden md:block"
          >
            <div className="text-[11px] tracking-[0.3em] uppercase" style={{ color: ACCENT }}>
              [ Est. 2024 ]
            </div>
            <div className="mt-3 text-xs" style={{ color: MUTED }}>
              Feito no Brasil, para o mundo das semi-joias.
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase"
        style={{ color: MUTED }}
      >
        role para descobrir
      </motion.div>
    </section>
  );
}

/* ---------- Sobre + stats ---------- */

function Sobre() {
  return (
    <section id="sistema" className="relative py-28 md:py-40 px-6 md:px-10" style={{ background: BG, color: INK }}>
      <div className="max-w-[1440px] mx-auto">
        <div className="grid md:grid-cols-12 gap-12 md:gap-20">
          <div className="md:col-span-6">
            <Reveal>
              <SectionTag>[ o sistema ]</SectionTag>
            </Reveal>
            <Reveal delay={0.1}>
              <h2
                className="mt-8 text-[2rem] md:text-[3.4rem] leading-[1.05] tracking-[-0.01em]"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}
              >
                Um só lugar para gerir suas peças, suas revendedoras
                e a sua loja — com a{' '}
                <span style={{ color: ACCENT, fontStyle: 'italic' }}>elegância</span> que sua marca pede.
              </h2>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-14 grid grid-cols-2 gap-8">
                {[
                  { n: 1200, s: '+', label: 'Peças gerenciadas por lojista' },
                  { n: 25, s: '', label: 'Módulos inclusos no Prime' },
                  { n: 99, s: '%', label: 'Uptime da plataforma' },
                  { n: 129, s: '', prefix: 'R$', label: 'Mensal — tudo incluso' },
                ].map((s, i) => (
                  <div key={i} className="border-t border-white/10 pt-4">
                    <div className="flex items-baseline gap-1">
                      <div
                        className="text-3xl md:text-5xl"
                        style={{ fontFamily: 'Cormorant Garamond, serif', color: INK, fontWeight: 400 }}
                      >
                        <Counter to={s.n} suffix={s.s} prefix={s.prefix} />
                      </div>
                    </div>
                    <div className="mt-2 text-xs tracking-[0.2em] uppercase" style={{ color: MUTED }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-6">
            <Reveal delay={0.15}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Estoque',
                  'Maletas',
                  'PDV',
                  'Catálogo',
                  'Loja Virtual',
                  'IA Bella',
                  'CRM',
                  'Fidelidade',
                  'Relatórios',
                ].map((label, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.6 }}
                    className="aspect-[3/2] border border-white/10 flex items-center justify-center text-center px-3 relative overflow-hidden group cursor-default"
                  >
                    <span
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: `linear-gradient(135deg, ${ACCENT}22, transparent)` }}
                    />
                    <span
                      className="relative text-sm md:text-base tracking-wide"
                      style={{ fontFamily: 'Cormorant Garamond, serif', color: INK }}
                    >
                      {label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Sellers / Buyers editorial ---------- */

function Editorial({
  tag,
  title,
  items,
  img,
  reverse = false,
  id,
}: {
  tag: string;
  title: string;
  items: string[];
  img: string;
  reverse?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section id={id} className="relative py-24 md:py-36 px-6 md:px-10" style={{ background: BG, color: INK }}>
      <div className="max-w-[1440px] mx-auto">
        <div className={`grid md:grid-cols-12 gap-10 md:gap-16 items-center ${reverse ? 'md:[direction:rtl]' : ''}`}>
          <div className="md:col-span-7 md:[direction:ltr]" ref={ref}>
            <div className="relative overflow-hidden aspect-[4/5] md:aspect-[5/6]">
              <motion.img
                src={img}
                alt=""
                style={{ y }}
                className="absolute inset-0 w-full h-[115%] object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="md:col-span-5 md:[direction:ltr]">
            <Reveal>
              <SectionTag>{tag}</SectionTag>
            </Reveal>
            <Reveal delay={0.1}>
              <h3
                className="mt-8 text-[1.8rem] md:text-[2.6rem] leading-[1.1] tracking-[-0.01em]"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}
              >
                {title}
              </h3>
            </Reveal>
            <div className="mt-10 space-y-6">
              {items.map((t, i) => (
                <Reveal key={i} delay={0.15 + i * 0.08}>
                  <div className="flex gap-6 border-t border-white/10 pt-5">
                    <span className="text-xs tracking-[0.2em]" style={{ color: ACCENT }}>
                      [{String(i + 1).padStart(2, '0')}]
                    </span>
                    <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(245,239,230,0.72)' }}>
                      {t}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Marquee ---------- */

function Marquee() {
  const words = ['Estoque', 'Maletas', 'PDV', 'Catálogo público', 'Loja virtual', 'IA de atendimento', 'CRM', 'Fidelidade', 'Relatórios', 'Fiado'];
  return (
    <section className="py-10 border-y border-white/5 overflow-hidden" style={{ background: '#0d0c0b' }}>
      <motion.div
        className="flex gap-16 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
      >
        {[...words, ...words, ...words].map((w, i) => (
          <span
            key={i}
            className="text-4xl md:text-6xl tracking-[-0.01em]"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: i % 2 === 0 ? INK : ACCENT, fontStyle: i % 3 === 0 ? 'italic' : 'normal' }}
          >
            {w} <span style={{ color: ACCENT_SOFT, opacity: 0.4 }}>✦</span>
          </span>
        ))}
      </motion.div>
    </section>
  );
}

/* ---------- Recursos grid ---------- */

const RECURSOS = [
  { n: '01', t: 'Controle de estoque', d: 'Peças, categorias, banhos, códigos e etiquetas — organizadas do jeito que a semi-joia pede.' },
  { n: '02', t: 'Sistema de Maletas', d: 'Ciclo completo: montagem, envio, conferência atômica, acerto financeiro e retorno automático ao estoque.' },
  { n: '03', t: 'PDV completo', d: 'Vendas rápidas, fiado, cupons, fidelidade, impressora e modo offline. Feito para o balcão.' },
  { n: '04', t: 'Loja Virtual', d: 'E-commerce próprio, checkout com Mercado Pago e Pix direto. Sua marca no ar em minutos.' },
  { n: '05', t: 'IA Bella', d: 'Atendimento 24/7 no WhatsApp — carrinho, mídia, follow-up e conversão automatizada.' },
  { n: '06', t: 'Portal da Revendedora', d: 'App dedicado com maletas, pedidos, vendas e comissão em tempo real.' },
];

function Recursos() {
  return (
    <section id="recursos" className="relative py-28 md:py-40 px-6 md:px-10" style={{ background: BG, color: INK }}>
      <div className="max-w-[1440px] mx-auto">
        <div className="grid md:grid-cols-12 gap-10 mb-16 md:mb-24">
          <div className="md:col-span-4">
            <Reveal>
              <SectionTag>[ recursos ]</SectionTag>
            </Reveal>
          </div>
          <div className="md:col-span-8">
            <Reveal delay={0.1}>
              <h2
                className="text-[2rem] md:text-[3.2rem] leading-[1.05] tracking-[-0.01em]"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}
              >
                Cada módulo pensado para o dia-a-dia real de quem vende semi-joias — do balcão à revendedora.
              </h2>
            </Reveal>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-y border-white/10">
          {RECURSOS.map((r, i) => (
            <motion.div
              key={r.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.8 }}
              className={`p-8 md:p-12 group relative overflow-hidden ${
                i >= 3 ? 'md:border-t md:border-white/10' : ''
              }`}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{ background: `radial-gradient(circle at 50% 100%, ${ACCENT}18, transparent 60%)` }}
              />
              <div className="relative">
                <div className="text-xs tracking-[0.3em]" style={{ color: ACCENT }}>
                  {r.n}
                </div>
                <h3
                  className="mt-6 text-2xl md:text-3xl"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}
                >
                  {r.t}
                </h3>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: MUTED }}>
                  {r.d}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Depoimentos ---------- */

const DEPOIMENTOS = [
  {
    q: 'Em duas semanas eu tirei minhas planilhas do ar. O sistema entende como a semi-joia funciona.',
    n: 'Carla M.',
    r: 'Loja em Belo Horizonte',
  },
  {
    q: 'A maleta digital mudou minhas revendedoras. Fecho acerto em minutos com fotos e tudo.',
    n: 'Fernanda R.',
    r: 'Atacadista, São Paulo',
  },
  {
    q: 'O PDV com fiado e a loja virtual no mesmo lugar — parece feito para nós.',
    n: 'Juliana S.',
    r: 'Boutique, Curitiba',
  },
];

function Depoimentos() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % DEPOIMENTOS.length), 6000);
    return () => clearInterval(t);
  }, []);
  const d = DEPOIMENTOS[i];
  return (
    <section id="depoimentos" className="relative py-28 md:py-40 px-6 md:px-10" style={{ background: '#0d0c0b', color: INK }}>
      <div className="max-w-[1200px] mx-auto text-center">
        <Reveal>
          <SectionTag>[ vozes ]</SectionTag>
        </Reveal>
        <motion.blockquote
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mt-10 text-[1.6rem] md:text-[2.6rem] leading-[1.25] tracking-[-0.01em]"
          style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}
        >
          <span style={{ color: ACCENT }}>“</span>
          {d.q}
          <span style={{ color: ACCENT }}>”</span>
        </motion.blockquote>
        <motion.div
          key={`m-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="mt-8 text-xs tracking-[0.3em] uppercase"
          style={{ color: MUTED }}
        >
          — {d.n} · {d.r}
        </motion.div>
        <div className="mt-10 flex justify-center gap-3">
          {DEPOIMENTOS.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              className="w-8 h-px transition-all"
              style={{ background: k === i ? ACCENT : 'rgba(245,239,230,0.2)' }}
              aria-label={`depoimento ${k + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */

function CTA({ onCta }: { onCta: () => void }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  return (
    <section
      className="relative py-32 md:py-48 px-6 md:px-10 overflow-hidden"
      style={{ background: BG, color: INK }}
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 40);
        my.set(((e.clientY - r.top) / r.height - 0.5) * 40);
      }}
    >
      <motion.div
        style={{ x: sx, y: sy }}
        className="absolute -inset-32 opacity-40 pointer-events-none"
      >
        <div
          className="w-full h-full"
          style={{
            background: `radial-gradient(circle at 30% 40%, ${ACCENT}55, transparent 45%), radial-gradient(circle at 70% 70%, ${ACCENT_SOFT}33, transparent 50%)`,
          }}
        />
      </motion.div>

      <div className="relative max-w-[1200px] mx-auto text-center">
        <Reveal>
          <SectionTag>[ comece ]</SectionTag>
        </Reveal>
        <Reveal delay={0.1}>
          <h2
            className="mt-8 text-[2.6rem] md:text-[5.5rem] leading-[0.95] tracking-[-0.02em]"
            style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}
          >
            Seu negócio de <span style={{ color: ACCENT, fontStyle: 'italic' }}>semi-joia</span>,
            <br />
            no padrão que ele merece.
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-xl mx-auto text-[15px]" style={{ color: MUTED }}>
            R$ 129/mês. Tudo incluso. Sem letras miúdas.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <PillButton onClick={onCta}>Assinar Nexsiles Prime</PillButton>
            <PillButton onClick={() => window.open('https://wa.me/5511937687369', '_blank')} variant="ghost">
              Falar com atendimento
            </PillButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

function Footer() {
  return (
    <footer className="border-t border-white/10 py-14 px-6 md:px-10" style={{ background: BG, color: INK }}>
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between gap-10">
        <div>
          <div
            className="text-2xl tracking-[0.3em] uppercase"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Nexsiles
          </div>
          <div className="mt-2 text-xs" style={{ color: MUTED }}>
            © {new Date().getFullYear()} — Feito com cuidado para o mercado de semi-joias.
          </div>
        </div>
        <div className="flex flex-wrap gap-8 text-xs tracking-[0.2em] uppercase" style={{ color: MUTED }}>
          <a href="/planos" className="hover:opacity-100 transition">Planos</a>
          <a href="/auth" className="hover:opacity-100 transition">Entrar</a>
          <a href="/politica-privacidade" className="hover:opacity-100 transition">Privacidade</a>
          <a href="/termos-de-uso" className="hover:opacity-100 transition">Termos</a>
          <a href="https://wa.me/5511937687369" target="_blank" rel="noreferrer" className="hover:opacity-100 transition">
            WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Page ---------- */

export default function LandingPage() {
  const navigate = useNavigate();
  const goCta = () => navigate('/planos');

  useEffect(() => {
    document.title = 'Nexsiles — Sistema completo para semi-joias';
  }, []);

  return (
    <div className="min-h-screen antialiased" style={{ background: BG, color: INK, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Navbar onCta={goCta} />
      <Hero onCta={goCta} />
      <Sobre />
      <Marquee />
      <Editorial
        id="lojistas"
        tag="[ para lojistas ]"
        title="Do balcão ao caixa, tudo pensado para o ritmo do seu dia."
        items={[
          'Estoque, PDV e loja virtual conectados em tempo real — sem planilhas, sem retrabalho.',
          'Fiado, fidelidade, cupons e relatórios prontos para decidir com clareza.',
          'Impressão de etiquetas, códigos e recibos — tudo pronto para o balcão.',
        ]}
        img={heroImg}
      />
      <Editorial
        id="revendedoras"
        tag="[ para revendedoras ]"
        title="A maleta digital que fecha acerto em minutos, com prova e comissão automáticas."
        items={[
          'Portal exclusivo com maletas, pedidos e vendas — tudo na palma da mão.',
          'Conferência atômica: cada peça marcada como vendida, devolvida ou perdida.',
          'Fotos de evidência e acerto financeiro com múltiplas formas de pagamento.',
        ]}
        img={sellersImg}
        reverse
      />
      <Recursos />
      <Editorial
        tag="[ atendimento com ia ]"
        title="Bella, sua atendente 24/7 no WhatsApp — vende, encanta e converte enquanto você dorme."
        items={[
          'Reconhece a intenção, monta carrinho e envia fotos automaticamente.',
          'Cai silenciosa quando você entra na conversa. Volta quando você quiser.',
          'A/B testing de prompts e métricas de conversão em tempo real.',
        ]}
        img={buyersImg}
      />
      <Depoimentos />
      <CTA onCta={goCta} />
      <Footer />
    </div>
  );
}
