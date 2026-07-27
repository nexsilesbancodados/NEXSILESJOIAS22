import { useEffect, useRef, useState, MouseEvent as ReactMouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useSpring,
  useMotionValue,
  AnimatePresence,
} from 'framer-motion';
import {
  ArrowUpRight,
  Menu,
  X,
  Package,
  ShoppingCart,
  Store,
  Users,
  BarChart3,
  Sparkles,
  MessageCircle,
  Wallet,
  Boxes,
  Gift,
  Bell,
  Instagram,
  Youtube,
  Linkedin,
} from 'lucide-react';

import heroImg from '@/assets/landing-hero-jewelry.webp';
import lojistaImg from '@/assets/landing-persona-lojista.webp';
import revendedoraImg from '@/assets/landing-persona-revendedora.webp';
import ctaImg from '@/assets/landing-cta-bg.webp';
import dashboardImg from '@/assets/landing-dashboard-mockup.webp';
import pdvImg from '@/assets/landing-pdv-mockup.webp';
import lojaImg from '@/assets/landing-loja-mockup.webp';
import { PublicCheckoutDialog } from '@/components/landing/PublicCheckoutDialog';
import { PaymentReturnDialog } from '@/components/landing/PaymentReturnDialog';

/* =========================================================
   Nexsiles Landing — Editorial rebuild inspired by Eagle
   Cream/ivory palette · Cormorant display · rose-gold accent
   ========================================================= */

const BG = '#f6f1ea';
const BG_ALT = '#efe7dc';
const BG_DEEP = '#e8dccd';
const INK = '#1a1410';
const INK_SOFT = 'rgba(26,20,16,0.62)';
const ACCENT = '#b07a4c';
const ACCENT_SOFT = '#e8c9a8';

/* ---------- global fx: cursor blob, grain, scroll progress ---------- */

function CursorBlob() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 320, damping: 32, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 320, damping: 32, mass: 0.4 });
  const [hover, setHover] = useState(false);
  const scale = useSpring(hover ? 2.4 : 1, { stiffness: 260, damping: 22 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      setHover(!!t?.closest('a,button,[data-magnetic],[role="button"]'));
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  // hide on touch devices
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(matchMedia('(hover: none)').matches);
  }, []);
  if (isTouch) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100]"
      style={{
        x: sx,
        y: sy,
        translateX: '-50%',
        translateY: '-50%',
        scale,
        mixBlendMode: 'difference' as const,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#f3d9b4',
        }}
      />
    </motion.div>
  );
}

function Grain() {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.10 0 0 0 0 0.08 0 0 0 0 0.06 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.9'/></svg>`,
  );
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] opacity-[0.07] mix-blend-multiply"
      style={{ backgroundImage: `url("data:image/svg+xml,${svg}")` }}
    />
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 24 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[80] h-[2px] origin-left"
      style={{ scaleX, background: ACCENT }}
    />
  );
}

/* ---------- magnetic wrapper (Awwwards staple) ---------- */

function Magnetic({
  children,
  strength = 22,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 15, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 220, damping: 15, mass: 0.3 });
  const onMove = (e: ReactMouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set(((e.clientX - r.left) / r.width - 0.5) * strength);
    y.set(((e.clientY - r.top) / r.height - 0.5) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.div
      ref={ref}
      data-magnetic
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- word-by-word mask reveal ---------- */

function WordReveal({
  text,
  className,
  style,
  delay = 0,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const words = text.split(' ');
  return (
    <span ref={ref} className={className} style={style}>
      {words.map((w, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          style={{ marginRight: '0.28em' }}
        >
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={inView ? { y: '0%' } : {}}
            transition={{
              duration: 0.9,
              delay: delay + i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}



function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 text-[11px] tracking-[0.32em] uppercase"
      style={{ color: ACCENT }}
    >
      <span>[</span>
      <span>{children}</span>
      <span>]</span>
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  y = 40,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <div ref={ref} className={className}>
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

function ClipReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <div ref={ref} className={`overflow-hidden ${className || ''}`}>
      <motion.div
        initial={{ scale: 1.2, clipPath: 'inset(100% 0% 0% 0%)' }}
        animate={inView ? { scale: 1, clipPath: 'inset(0% 0% 0% 0%)' } : {}}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function Counter({
  to,
  suffix = '',
  prefix = '',
}: {
  to: number;
  suffix?: string;
  prefix?: string;
}) {
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
  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString('pt-BR')}
      {suffix}
    </span>
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
    <Magnetic strength={18} className="inline-block">
      <motion.button
        onClick={onClick}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full text-[12px] tracking-[0.22em] uppercase overflow-hidden"
        style={{
          background: solid ? INK : 'transparent',
          color: solid ? BG : INK,
          border: solid ? 'none' : `1px solid rgba(26,20,16,0.22)`,
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 -z-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ background: solid ? ACCENT : INK }}
        />
        <span className="relative z-10 transition-colors duration-500 group-hover:text-[color:var(--pill-hover)]"
          style={{ ['--pill-hover' as any]: solid ? '#fff8ef' : BG }}
        >
          {children}
        </span>
        <span
          className="relative z-10 inline-flex items-center justify-center w-6 h-6 rounded-full transition-transform group-hover:rotate-45"
          style={{
            background: solid ? ACCENT : INK,
            color: solid ? '#fff8ef' : BG,
          }}
        >
          <ArrowUpRight size={12} />
        </span>
      </motion.button>
    </Magnetic>
  );
}

/* ---------- Stripes background overlay ---------- */

function Stripes() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
      style={{
        backgroundImage: `
          linear-gradient(to right,
            transparent 0, transparent calc(16.66% - 1px),
            rgba(26,20,16,0.05) calc(16.66% - 1px), rgba(26,20,16,0.05) 16.66%,
            transparent 16.66%, transparent calc(50% - 1px),
            rgba(26,20,16,0.05) calc(50% - 1px), rgba(26,20,16,0.05) 50%,
            transparent 50%, transparent calc(83.33% - 1px),
            rgba(26,20,16,0.05) calc(83.33% - 1px), rgba(26,20,16,0.05) 83.33%,
            transparent 83.33%)
        `,
      }}
    />
  );
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
    { label: 'Lojistas', href: '#lojistas' },
    { label: 'Revendedoras', href: '#revendedoras' },
    { label: 'Módulos', href: '#modulos' },
    { label: 'Preços', href: '#precos' },
  ];
  return (
    <>
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}
        style={{
          background: scrolled ? 'rgba(246,241,234,0.82)' : 'transparent',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(26,20,16,0.06)' : 'none',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-[76px] grid grid-cols-3 items-center">
          <button
            onClick={() => setOpen(true)}
            className="justify-self-start inline-flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase"
            style={{ color: INK }}
          >
            <span>Menu</span>
            <Menu size={16} />
          </button>
          <a
            href="#top"
            className="justify-self-center"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              color: INK,
              fontSize: 20,
              letterSpacing: '0.35em',
            }}
          >
            NEXSILES
          </a>
          <div className="justify-self-end hidden md:block">
            <PillButton onClick={onCta}>Contato</PillButton>
          </div>
          <button
            className="justify-self-end md:hidden"
            onClick={() => setOpen(true)}
            aria-label="menu"
          >
            <ArrowUpRight size={20} style={{ color: INK }} />
          </button>
        </div>
      </motion.header>

      {/* Fullscreen overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60]"
            style={{ background: INK }}
          >
            <div className="absolute top-0 left-0 right-0 h-[76px] max-w-[1440px] mx-auto px-6 md:px-10 flex items-center justify-between">
              <span
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  color: BG,
                  fontSize: 20,
                  letterSpacing: '0.35em',
                }}
              >
                NEXSILES
              </span>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase"
                style={{ color: BG }}
              >
                <span>Fechar</span>
                <X size={16} />
              </button>
            </div>
            <div className="h-full grid md:grid-cols-[1.2fr_1fr]">
              <div className="flex flex-col justify-center px-8 md:px-16 gap-8">
                <nav className="flex flex-col gap-4">
                  {links.map((l, i) => (
                    <motion.a
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.06, duration: 0.6 }}
                      style={{
                        fontFamily: 'Cormorant Garamond, serif',
                        color: BG,
                        fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
                        lineHeight: 1,
                        letterSpacing: '-0.03em',
                      }}
                      className="hover:opacity-70 transition-opacity"
                    >
                      {l.label}
                    </motion.a>
                  ))}
                </nav>
                <div
                  className="mt-8 grid grid-cols-2 gap-8 text-[13px]"
                  style={{ color: 'rgba(246,241,234,0.65)' }}
                >
                  <div>
                    <div className="uppercase tracking-[0.25em] mb-3 text-[10px]">
                      Contato
                    </div>
                    <div>contato@nexsiles.com</div>
                    <div>+55 11 93768-7369</div>
                  </div>
                  <div>
                    <div className="uppercase tracking-[0.25em] mb-3 text-[10px]">
                      Redes
                    </div>
                    <div className="flex gap-4">
                      <Instagram size={16} />
                      <Youtube size={16} />
                      <Linkedin size={16} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden md:block relative overflow-hidden">
                <img
                  src={heroImg}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.85)' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- Hero ---------- */

function Hero({ onCta }: { onCta: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '-25%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative overflow-hidden"
      style={{ background: BG, minHeight: '100vh' }}
    >
      {/* Huge display title with per-letter mask reveal */}
      <div className="relative z-10 pt-[140px] md:pt-[160px] pb-8 md:pb-12">
        <motion.h1
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            color: INK,
            fontSize: 'clamp(5rem, 22vw, 22rem)',
            lineHeight: 0.85,
            letterSpacing: '-0.06em',
            fontWeight: 500,
            textAlign: 'center',
            y: titleY,
            opacity: titleOpacity,
          }}
          className="flex justify-center"
        >
          <span className="sr-only">NEXSILES</span>
          {'NEXSILES'.split('').map((ch, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <motion.span
                aria-hidden
                className="inline-block"
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{
                  duration: 1.1,
                  delay: 0.15 + i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {ch}
              </motion.span>
            </span>
          ))}
        </motion.h1>
      </div>


      {/* Content row */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 grid md:grid-cols-[1fr_auto] items-end gap-8 pb-16">
        <div />
        <Reveal delay={0.3}>
          <div className="max-w-[31rem] flex flex-col gap-6">
            <p
              style={{
                color: INK,
                fontSize: 17,
                lineHeight: 1.55,
                letterSpacing: '-0.01em',
              }}
            >
              O sistema completo para <em style={{ fontFamily: 'Cormorant Garamond, serif' }}>lojas de semijoias</em>: estoque,
              PDV, maletas de revenda, loja virtual, IA de atendimento e CRM —
              tudo em um único plano.
            </p>
            <div>
              <PillButton onClick={onCta}>Assinar Nexsiles Prime</PillButton>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Hero image */}
      <motion.div
        style={{ y: imgY, scale: imgScale }}
        className="relative z-0 mx-auto max-w-[1440px] px-6 md:px-10"
      >
        <ClipReveal className="rounded-[2px]">
          <img
            src={heroImg}
            alt="Semijoias premium"
            className="w-full h-[45vh] md:h-[65vh] object-cover"
            style={{ filter: 'brightness(1.02) contrast(1.02)' }}
          />
        </ClipReveal>
      </motion.div>
    </section>
  );
}

/* ---------- Sobre + stats + partners ---------- */

function Sobre() {
  const numeros = [
    { label: 'Peças gerenciadas', value: 120, suffix: 'k+' },
    { label: 'Vendas processadas', value: 30, prefix: 'R$', suffix: 'M' },
  ];
  const modulos = ['Estoque', 'PDV', 'Maletas', 'Loja', 'CRM', 'Portal', 'IA Bella', 'Fiado'];
  return (
    <section id="sistema" className="relative" style={{ background: BG }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-24 md:py-36">
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-16 md:gap-24">
          <div className="flex flex-col gap-12">
            <Reveal>
              <SectionTag>Sobre nós</SectionTag>
            </Reveal>
            <Reveal delay={0.1}>
              <h2
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  color: INK,
                  fontSize: 'clamp(2rem, 4.5vw, 4rem)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                  fontWeight: 500,
                }}
              >
                Somos uma plataforma dedicada a entregar operação impecável para
                lojistas, revendedoras e clientes finais de semijoias.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="grid grid-cols-2 gap-10 pt-6 border-t border-black/10">
                {numeros.map((n) => (
                  <div key={n.label} className="flex flex-col gap-3">
                    <div className="flex items-baseline gap-1">
                      <span
                        style={{
                          fontFamily: 'Cormorant Garamond, serif',
                          color: INK,
                          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                          lineHeight: 1,
                        }}
                      >
                        <Counter to={n.value} prefix={n.prefix} />
                      </span>
                      <span style={{ color: ACCENT, fontSize: 20 }}>
                        {n.suffix}
                      </span>
                    </div>
                    <div
                      style={{ color: INK_SOFT, fontSize: 13 }}
                      className="uppercase tracking-[0.15em]"
                    >
                      {n.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Vertical modules list (mimics partners column) */}
          <div className="flex flex-col divide-y divide-black/10 border-y border-black/10">
            {modulos.map((m, i) => (
              <Reveal key={m} delay={i * 0.05}>
                <div
                  className="py-5 flex items-center justify-between"
                  style={{ color: INK }}
                >
                  <span
                    style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: 26,
                    }}
                  >
                    {m}
                  </span>
                  <span
                    className="text-[11px] tracking-[0.25em] uppercase"
                    style={{ color: INK_SOFT }}
                  >
                    0{i + 1}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Sellers/Buyers editorial blocks ---------- */

function EditorialBlock({
  id,
  tag,
  heading,
  items,
  image,
  imageAlt,
  reverse = false,
}: {
  id: string;
  tag: string;
  heading: string;
  items: { n: string; text: string }[];
  image: string;
  imageAlt: string;
  reverse?: boolean;
}) {
  return (
    <section id={id} className="relative" style={{ background: BG_ALT }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-24 md:py-32">
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-10 md:gap-16 items-start mb-16">
          <Reveal>
            <SectionTag>{tag}</SectionTag>
          </Reveal>
          <Reveal delay={0.1}>
            <h3
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                color: INK,
                fontSize: 'clamp(1.75rem, 3.4vw, 3rem)',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                fontWeight: 500,
              }}
            >
              {heading}
            </h3>
          </Reveal>
        </div>

        <div
          className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${
            reverse ? 'md:[&>*:first-child]:order-2' : ''
          }`}
        >
          <ClipReveal className="rounded-[2px]">
            <img
              src={image}
              alt={imageAlt}
              className="w-full h-[420px] md:h-[560px] object-cover"
            />
          </ClipReveal>

          <div className="flex flex-col gap-8">
            {items.map((it, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="flex gap-6 pb-6 border-b border-black/10">
                  <span
                    style={{
                      color: ACCENT,
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: 28,
                    }}
                  >
                    [{it.n}]
                  </span>
                  <p
                    style={{
                      color: INK,
                      fontSize: 16,
                      lineHeight: 1.6,
                    }}
                  >
                    {it.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Módulos grid ---------- */

function Modulos() {
  const items = [
    { icon: Boxes, name: 'Estoque inteligente', desc: 'Cadastro por SKU, categorias dinâmicas, códigos de barra e alertas de reposição.' },
    { icon: ShoppingCart, name: 'PDV completo', desc: 'Frente de caixa reativa com PIX, cartão, fiado e vendas pendentes.' },
    { icon: Package, name: 'Maletas de revenda', desc: 'Ciclo atômico: montagem, envio, conferência com wizard e acerto financeiro.' },
    { icon: Store, name: 'Loja virtual', desc: 'E-commerce com Mercado Pago, PIX direto e checkout em 3 passos.' },
    { icon: Users, name: 'Portal da revendedora', desc: 'PWA com pedidos, comissões e extrato em tempo real.' },
    { icon: BarChart3, name: 'CRM & Analytics', desc: 'Métricas globais, MRR, funil de vendas e alertas inteligentes.' },
    { icon: Sparkles, name: 'IA Bella', desc: 'Atendente 24/7 com DeepSeek, gestão de carrinho e mídia via WhatsApp.' },
    { icon: MessageCircle, name: 'WhatsApp Automations', desc: 'Cobranças, aniversários, pós-venda e reativação automáticas.' },
    { icon: Wallet, name: 'Fiado & Crédito', desc: 'Crédito da loja, parcelamentos e cobranças automáticas por WhatsApp.' },
    { icon: Gift, name: 'Fidelidade', desc: 'Níveis Bronze, Prata e Ouro com pontos e descontos automáticos.' },
    { icon: Bell, name: 'Alertas inteligentes', desc: 'Aniversários, estoque crítico e maletas próximas do vencimento.' },
    { icon: ArrowUpRight, name: 'E muito mais', desc: 'Financeiro, relatórios, funcionários, permissões — tudo incluso.' },
  ];
  return (
    <section id="modulos" className="relative" style={{ background: BG }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-24 md:py-32">
        <div className="flex flex-col items-center gap-8 mb-20">
          <Reveal>
            <SectionTag>Módulos</SectionTag>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              className="text-center max-w-[47rem] uppercase"
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                color: INK,
                fontSize: 'clamp(2rem, 5vw, 4.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                fontWeight: 500,
              }}
            >
              Todos os recursos que sua loja de semijoias precisa
            </h2>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">
          {items.map((it, i) => {
            const offset = i % 2 === 0 ? 'md:mt-0' : 'md:mt-14';
            const Icon = it.icon;
            return (
              <Reveal key={it.name} delay={(i % 3) * 0.05} className={offset}>
                <motion.a
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="group block p-8 rounded-[2px] border border-black/10 h-full"
                  style={{ background: BG_ALT }}
                >
                  <Icon size={36} style={{ color: ACCENT }} strokeWidth={1.2} />
                  <div className="mt-8">
                    <div
                      style={{
                        fontFamily: 'Cormorant Garamond, serif',
                        color: INK,
                        fontSize: 26,
                        lineHeight: 1.15,
                      }}
                    >
                      {it.name}
                    </div>
                    <p
                      className="mt-3"
                      style={{ color: INK_SOFT, fontSize: 14, lineHeight: 1.6 }}
                    >
                      {it.desc}
                    </p>
                  </div>
                  <div
                    className="mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] transition-transform group-hover:translate-x-1"
                    style={{ color: INK }}
                  >
                    <span>Explorar</span>
                    <ArrowUpRight size={14} />
                  </div>
                </motion.a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Contact band (full-width dark) ---------- */

function ContactBand({ onCta }: { onCta: () => void }) {
  return (
    <section className="relative" style={{ background: INK }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <Reveal>
          <h2
            className="uppercase mb-16"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              color: BG,
              fontSize: 'clamp(2rem, 5vw, 4.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              fontWeight: 500,
              maxWidth: '20ch',
            }}
          >
            Liderando o mercado com foco total no lojista
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <button
            onClick={onCta}
            className="group w-full flex items-center justify-between gap-6 py-8 border-t border-b border-white/15 text-left"
          >
            <span
              style={{ color: BG, fontSize: 20, letterSpacing: '-0.01em' }}
            >
              Cuidamos de toda a operação. Da vitrine ao WhatsApp.
            </span>
            <span
              style={{ color: BG }}
              className="text-[11px] tracking-[0.3em] uppercase hidden md:inline"
            >
              Contato
            </span>
            <span
              className="inline-flex items-center justify-center w-14 h-14 rounded-full transition-transform group-hover:rotate-45"
              style={{ background: ACCENT_SOFT, color: INK }}
            >
              <ArrowUpRight size={22} />
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Testimonials marquee ---------- */

function Depoimentos() {
  const items = [
    {
      quote:
        'A Nexsiles unificou nossa loja física com o e-commerce e o portal das revendedoras. O acerto de maleta que levava horas hoje leva minutos.',
      name: 'Amanda Ribeiro',
      role: 'Lojista · São Paulo',
    },
    {
      quote:
        'A Bella (IA) responde clientes no WhatsApp de madrugada e fecha vendas. Ganhamos um vendedor que nunca dorme.',
      name: 'Carla Menezes',
      role: 'Empresária · BH',
    },
    {
      quote:
        'O portal da revendedora mudou minha rotina. Vejo comissão em tempo real, marco vendas na maleta e envio pedidos direto.',
      name: 'Julia Andrade',
      role: 'Revendedora',
    },
    {
      quote:
        'PDV rápido, PIX direto, fiado organizado. Nunca mais perdi uma venda por falta de estoque.',
      name: 'Renata Souza',
      role: 'Franqueada · Curitiba',
    },
    {
      quote:
        'Cadastrei 800 peças em uma tarde, com fotos e SKU automático. Painel bonito e sério.',
      name: 'Priscila Nunes',
      role: 'Lojista · Recife',
    },
    {
      quote:
        'Suporte humano de verdade. Migração feita em um final de semana.',
      name: 'Débora Lima',
      role: 'Diretora · RS',
    },
  ];
  return (
    <section
      id="depoimentos"
      className="relative overflow-hidden"
      style={{ background: BG_DEEP }}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 pt-24 pb-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          <Reveal>
            <SectionTag>Depoimentos</SectionTag>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                color: INK,
                fontSize: 'clamp(1.75rem, 3.4vw, 3rem)',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                fontWeight: 500,
              }}
            >
              A escolha de quem vive de semijoias todos os dias.
            </h2>
          </Reveal>
        </div>
      </div>

      <div className="relative pb-24">
        <div
          className="flex gap-6"
          style={{
            width: 'max-content',
            animation: 'nex-marquee 60s linear infinite',
          }}
        >
          {[...items, ...items].map((t, i) => (
            <div
              key={i}
              className="w-[380px] md:w-[460px] p-8 rounded-[2px] border border-black/10 flex flex-col justify-between gap-8"
              style={{ background: BG, minHeight: 320 }}
            >
              <p
                style={{
                  color: INK,
                  fontSize: 18,
                  lineHeight: 1.5,
                  fontFamily: 'Cormorant Garamond, serif',
                }}
              >
                “{t.quote}”
              </p>
              <div>
                <div style={{ color: INK, fontSize: 14, fontWeight: 500 }}>
                  {t.name}
                </div>
                <div
                  style={{ color: INK_SOFT, fontSize: 12 }}
                  className="mt-1 uppercase tracking-[0.15em]"
                >
                  {t.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes nex-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

/* ---------- Preços ---------- */

function Precos({ onCta }: { onCta: () => void }) {
  const nav = useNavigate();
  const features = [
    'Estoque ilimitado por SKU',
    'PDV completo com PIX/cartão/fiado',
    'Maletas de revenda com wizard',
    'Loja virtual + checkout',
    'Portal da revendedora (PWA)',
    'CRM + relatórios avançados',
    'IA Bella no WhatsApp',
    'Automações e alertas',
    'Programa de fidelidade',
    'Até 25 funcionários',
    'Suporte humano prioritário',
    'Todas as atualizações inclusas',
  ];
  return (
    <section id="precos" className="relative" style={{ background: BG }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-24 md:py-32">
        <div className="flex flex-col items-center gap-8 mb-16 text-center">
          <Reveal>
            <SectionTag>Plano único</SectionTag>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              className="uppercase max-w-[40rem]"
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                color: INK,
                fontSize: 'clamp(2rem, 5vw, 4.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                fontWeight: 500,
              }}
            >
              Um preço. Tudo incluso.
            </h2>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div
            className="grid md:grid-cols-[1.1fr_1fr] rounded-[2px] overflow-hidden border border-black/10"
            style={{ background: BG_ALT }}
          >
            <div className="p-10 md:p-14 flex flex-col justify-between gap-10">
              <div>
                <div
                  className="text-[11px] tracking-[0.3em] uppercase mb-6"
                  style={{ color: ACCENT }}
                >
                  Nexsiles Prime
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      color: INK,
                      fontSize: 'clamp(4rem, 8vw, 7rem)',
                      lineHeight: 1,
                    }}
                  >
                    R$129
                  </span>
                  <span style={{ color: INK_SOFT, fontSize: 16 }}>/mês</span>
                </div>
                <p
                  className="mt-6 max-w-[28rem]"
                  style={{ color: INK, fontSize: 16, lineHeight: 1.6 }}
                >
                  Um plano único, completo, com todos os módulos do ecossistema
                  Nexsiles. Sem pegadinhas, sem upgrades escondidos.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <PillButton onClick={onCta}>Assinar agora</PillButton>
                <button
                  onClick={() => nav('/minha-assinatura')}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-[12px] tracking-[0.22em] uppercase border"
                  style={{ borderColor: 'rgba(26,20,16,0.22)', color: INK }}
                >
                  Minha assinatura
                </button>
              </div>
            </div>
            <div
              className="p-10 md:p-14 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 border-t md:border-t-0 md:border-l border-black/10"
              style={{ background: BG }}
            >
              {features.map((f) => (
                <div
                  key={f}
                  className="flex items-start gap-3 text-[14px]"
                  style={{ color: INK }}
                >
                  <span
                    style={{ color: ACCENT }}
                    className="mt-[6px] inline-block w-1.5 h-1.5 rounded-full"
                  />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */

function CTA({ onCta }: { onCta: () => void }) {
  return (
    <section className="relative" style={{ background: BG_ALT }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="flex flex-col gap-8">
            <Reveal>
              <SectionTag>Começar agora</SectionTag>
            </Reveal>
            <Reveal delay={0.1}>
              <h2
                className="uppercase"
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  color: INK,
                  fontSize: 'clamp(2rem, 5vw, 4.5rem)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  fontWeight: 500,
                }}
              >
                Agende uma demonstração
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p
                style={{
                  color: INK,
                  fontSize: 16,
                  lineHeight: 1.65,
                  maxWidth: '31rem',
                }}
              >
                Nossa equipe monta seu ambiente, importa seu catálogo e treina
                sua operação em menos de uma semana. Você começa a vender no
                primeiro dia.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <PillButton onClick={onCta}>Fale conosco</PillButton>
            </Reveal>
          </div>
          <ClipReveal className="rounded-[2px]">
            <img
              src={ctaImg}
              alt=""
              className="w-full h-[440px] md:h-[560px] object-cover"
            />
          </ClipReveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

function Footer() {
  return (
    <footer className="relative overflow-hidden" style={{ background: INK }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 pt-20 pb-10">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-16">
          <div>
            <div
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                color: BG,
                fontSize: 28,
                letterSpacing: '0.25em',
              }}
            >
              NEXSILES
            </div>
            <p
              className="mt-6 max-w-[27rem]"
              style={{
                color: 'rgba(246,241,234,0.6)',
                fontSize: 14,
                lineHeight: 1.65,
              }}
            >
              O sistema completo para lojas de semijoias — estoque, PDV,
              maletas, e-commerce, IA e CRM em um só lugar.
            </p>
          </div>
          {[
            { title: 'Sistema', links: ['Módulos', 'Preços', 'Loja virtual', 'IA Bella'] },
            { title: 'Recursos', links: ['Documentação', 'Blog', 'Novidades', 'Segurança'] },
            { title: 'Contato', links: ['WhatsApp', 'Instagram', 'YouTube', 'LinkedIn'] },
          ].map((col) => (
            <div key={col.title}>
              <div
                className="text-[11px] uppercase tracking-[0.28em] mb-5"
                style={{ color: ACCENT_SOFT }}
              >
                {col.title}
              </div>
              <ul className="flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-[14px] hover:opacity-100"
                      style={{ color: 'rgba(246,241,234,0.7)' }}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[12px]"
          style={{ color: 'rgba(246,241,234,0.5)' }}
        >
          <div>© {new Date().getFullYear()} Nexsiles — Todos os direitos reservados</div>
          <div className="flex gap-6">
            <a href="#">Termos</a>
            <a href="#">Privacidade</a>
          </div>
        </div>
      </div>

      {/* Giant wordmark visual */}
      <div
        aria-hidden
        className="text-center leading-none pb-4 overflow-hidden select-none"
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          color: 'rgba(246,241,234,0.08)',
          fontSize: 'clamp(6rem, 22vw, 22rem)',
          letterSpacing: '-0.05em',
        }}
      >
        NEXSILES
      </div>
    </footer>
  );
}

/* ---------- Sticky Showcase (scroll-synced feature switcher) ---------- */

function StickyShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const slides = [
    {
      tag: '01 · PDV',
      title: 'Frente de caixa que acompanha o ritmo da loja',
      copy: 'Vendas em segundos com PIX, cartão, fiado, múltiplos caixas e permissões por funcionário. Interface reativa desenhada para o balcão real.',
      img: pdvImg,
    },
    {
      tag: '02 · Maletas',
      title: 'Ciclo de maleta atômico, do envio ao acerto',
      copy: 'Montagem, conferência assistida com wizard, marcação de vendas em tempo real e acerto financeiro com múltiplas formas de pagamento.',
      img: revendedoraImg,
    },
    {
      tag: '03 · Loja virtual',
      title: 'E-commerce próprio, checkout em 3 passos',
      copy: 'Mercado Pago, PIX direto, cupons, frete calculado e vitrine dinâmica com identidade visual da sua marca.',
      img: lojaImg,
    },
    {
      tag: '04 · CRM & IA',
      title: 'Bella responde no WhatsApp. Você vende dormindo.',
      copy: 'IA 24/7 com DeepSeek, funil de vendas, MRR em tempo real, alertas inteligentes de estoque e aniversário.',
      img: dashboardImg,
    },
  ];

  return (
    <section
      ref={ref}
      id="showcase"
      className="relative"
      style={{ height: `${slides.length * 100}vh`, background: BG_ALT }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 grid md:grid-cols-[1fr_1.1fr] gap-10 md:gap-16 w-full items-center">
          {/* Left: text stack cross-fading */}
          <div className="relative min-h-[360px]">
            {slides.map((s, i) => {
              const start = i / slides.length;
              const end = (i + 1) / slides.length;
              const mid = (start + end) / 2;
              const opacity = useTransform(
                scrollYProgress,
                [start, mid - 0.02, mid + 0.02, end],
                [0, 1, 1, 0],
              );
              const y = useTransform(
                scrollYProgress,
                [start, mid, end],
                [40, 0, -40],
              );
              return (
                <motion.div
                  key={i}
                  style={{ opacity, y }}
                  className="absolute inset-0 flex flex-col gap-8 justify-center"
                >
                  <div
                    className="text-[11px] tracking-[0.32em] uppercase"
                    style={{ color: ACCENT }}
                  >
                    [{s.tag}]
                  </div>
                  <h3
                    style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      color: INK,
                      fontSize: 'clamp(2rem, 4vw, 3.6rem)',
                      lineHeight: 1.05,
                      letterSpacing: '-0.02em',
                      fontWeight: 500,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      color: INK,
                      fontSize: 16,
                      lineHeight: 1.65,
                      maxWidth: '32rem',
                    }}
                  >
                    {s.copy}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Right: image stack with cross-fade + parallax */}
          <div className="relative aspect-[4/5] md:aspect-[5/6] overflow-hidden rounded-[2px]">
            {slides.map((s, i) => {
              const start = i / slides.length;
              const end = (i + 1) / slides.length;
              const mid = (start + end) / 2;
              const opacity = useTransform(
                scrollYProgress,
                [start, mid - 0.03, mid + 0.03, end],
                [0, 1, 1, 0],
              );
              const scale = useTransform(
                scrollYProgress,
                [start, mid, end],
                [1.15, 1.02, 1.15],
              );
              return (
                <motion.img
                  key={i}
                  src={s.img}
                  alt=""
                  style={{ opacity, scale }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              );
            })}
            {/* progress rail */}
            <div className="absolute right-4 top-4 bottom-4 w-[2px] bg-white/25">
              <motion.div
                className="w-full origin-top"
                style={{
                  scaleY: scrollYProgress,
                  background: ACCENT_SOFT,
                  height: '100%',
                }}
              />
            </div>
            {/* counters */}
            <div className="absolute left-4 bottom-4 flex gap-3">
              {slides.map((_, i) => {
                const start = i / slides.length;
                const end = (i + 1) / slides.length;
                const mid = (start + end) / 2;
                const op = useTransform(
                  scrollYProgress,
                  [start, mid, end],
                  [0.35, 1, 0.35],
                );
                return (
                  <motion.span
                    key={i}
                    style={{ opacity: op, color: '#fff8ef' }}
                    className="text-[11px] tracking-[0.3em] uppercase"
                  >
                    0{i + 1}
                  </motion.span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */

export default function LandingPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const openCheckout = () => setCheckoutOpen(true);

  return (
    <div className="relative" style={{ background: BG, color: INK }}>
      <Stripes />
      <Grain />
      <ScrollProgress />
      <CursorBlob />
      <div className="relative z-10">

        <Navbar onCta={openCheckout} />
        <Hero onCta={openCheckout} />
        <Sobre />
        <StickyShowcase />
        <EditorialBlock
          id="lojistas"
          tag="Para lojistas"
          heading="Da vitrine à cobrança — controle total sem sair de um único painel. Fluxos criados por quem entende de semijoias, não por consultores genéricos."
          items={[
            { n: '01', text: 'Cadastro de peças com SKU automático, categorias dinâmicas e fotos organizadas para catálogo e vitrine.' },
            { n: '02', text: 'PDV reativo com PIX, cartão, fiado e vendas pendentes. Múltiplos caixas e permissões por funcionário.' },
            { n: '03', text: 'Relatórios, metas, alertas de estoque crítico e integração automática com WhatsApp e e-commerce.' },
          ]}
          image={lojistaImg}
          imageAlt="Lojista organizando semijoias"
        />
        <EditorialBlock
          id="revendedoras"
          tag="Para revendedoras"
          heading="Um portal PWA feito para quem vende na rua. Maleta, comissão, extrato e pedidos — tudo no bolso, sempre atualizado."
          items={[
            { n: '01', text: 'Receba maletas com conferência assistida, código de barras e checklist item a item.' },
            { n: '02', text: 'Marque vendas em tempo real, envie pedidos e acompanhe sua comissão sem depender da loja.' },
            { n: '03', text: 'Acerto financeiro claro no fechamento — dinheiro, PIX ou parcelas, com histórico completo.' },
          ]}
          image={revendedoraImg}
          imageAlt="Revendedora atendendo cliente"
          reverse
        />
        <Modulos />
        <ContactBand onCta={openCheckout} />
        <Depoimentos />
        <Precos onCta={openCheckout} />
        <CTA onCta={openCheckout} />
        <Footer />
      </div>

      <PublicCheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
      <PaymentReturnDialog />
    </div>
  );
}
