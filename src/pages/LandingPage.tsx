import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { ArrowUpRight, ArrowRight, Check, Plus } from 'lucide-react';
import { PublicCheckoutDialog } from '@/components/landing/PublicCheckoutDialog';
import { PaymentReturnDialog } from '@/components/landing/PaymentReturnDialog';

import heroImg from '@/assets/landing-dark-hero.jpg';
import showcaseImg from '@/assets/landing-dark-showcase.jpg';
import pdvImg from '@/assets/landing-pdv-mockup.webp';
import dashImg from '@/assets/landing-dashboard-mockup.webp';
import lojaImg from '@/assets/landing-loja-mockup.webp';
import lojistaImg from '@/assets/landing-persona-lojista.webp';
import revImg from '@/assets/landing-persona-revendedora.webp';

/* ============ THEME TOKENS ============
   Ink #0a0a0a · Panel #111114 · Deep #1a1a2e
   Mint #00ff88 · Coral #e94560 · Bone #f4f4f0
   Font: Archivo Black (display) · Hind (body)
====================================== */

const INK = '#ffffff';
const MINT = '#e11d48';
const CORAL = '#2563eb';
const BONE = '#0f172a';

/* ---------- utilities ---------- */
const Magnetic = ({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });
  return (
    <motion.div
      ref={ref}
      style={{ x, y, display: 'inline-block' }}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
};

const CursorBlob = () => {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 120, damping: 20, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 120, damping: 20, mass: 0.6 });
  useEffect(() => {
    const handler = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [x, y]);
  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%' }}
      className="pointer-events-none fixed top-0 left-0 z-[100] hidden md:block h-[320px] w-[320px] rounded-full blur-3xl opacity-40 mix-blend-screen"
    >
      <div className="h-full w-full rounded-full" style={{ background: `radial-gradient(circle, ${MINT} 0%, transparent 65%)` }} />
    </motion.div>
  );
};

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const w = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  return (
    <motion.div
      style={{ width: w, background: MINT }}
      className="fixed top-0 left-0 z-[110] h-[2px]"
    />
  );
};

const Grain = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-[90] opacity-[0.07] mix-blend-overlay"
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
    }}
  />
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 px-3 py-1 border border-slate-900/15 rounded-full text-[10px] uppercase tracking-[0.25em] text-slate-900/70 font-medium">
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: MINT }} />
    {children}
  </span>
);

/* ---------- page ---------- */
export default function LandingPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'Nexsiles — Sistema SaaS para semijoias';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'A plataforma completa para lojistas de semijoias: PDV, estoque, maletas, loja virtual e CRM em um único plano.');
  }, []);

  return (
    <div className="min-h-screen font-body antialiased" style={{ background: INK, color: BONE, fontFamily: 'Hind, sans-serif' }}>
      <style>{`
        .font-display { font-family: 'Archivo Black', sans-serif; letter-spacing: -0.02em; }
        .font-body { font-family: 'Hind', sans-serif; }
        html { scroll-behavior: smooth; }
        body { background: ${INK}; }
      `}</style>

      <ScrollProgress />
      <CursorBlob />
      <Grain />

      {/* NAVBAR */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-900/5">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <button onClick={() => setMenuOpen(true)} className="text-xs uppercase tracking-[0.3em] text-slate-900/80 hover:text-slate-950 flex items-center gap-2">
            <span className="flex flex-col gap-1">
              <span className="h-px w-5 bg-current" />
              <span className="h-px w-5 bg-current" />
            </span>
            Menu
          </button>
          <Link to="/" className="font-display text-xl uppercase">Nexsiles</Link>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="hidden md:inline text-xs uppercase tracking-[0.3em] text-slate-900/60 hover:text-slate-950">Entrar</Link>
            <Magnetic>
              <button
                onClick={() => setCheckoutOpen(true)}
                className="group relative overflow-hidden text-xs uppercase tracking-[0.25em] px-5 py-2.5 rounded-full font-semibold"
                style={{ background: MINT, color: INK }}
              >
                <span className="relative z-10 flex items-center gap-2">Assinar <ArrowUpRight className="h-3.5 w-3.5" /></span>
              </button>
            </Magnetic>
          </div>
        </div>
      </header>

      {/* FULLSCREEN MENU */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-[120] flex flex-col"
          style={{ background: INK }}
        >
          <div className="h-16 border-b border-slate-900/10 px-6 lg:px-12 flex items-center justify-between">
            <span className="font-display uppercase text-xl">Nexsiles</span>
            <button onClick={() => setMenuOpen(false)} className="text-xs uppercase tracking-[0.3em] flex items-center gap-2">
              <Plus className="h-4 w-4 rotate-45" /> Fechar
            </button>
          </div>
          <div className="flex-1 grid md:grid-cols-2">
            <nav className="flex flex-col justify-center p-10 lg:p-20 gap-4">
              {[
                ['Produto', '#produto'],
                ['Serviços', '#servicos'],
                ['Cases', '#cases'],
                ['Processo', '#processo'],
                ['Preço', '#preco'],
                ['Contato', '#contato'],
              ].map(([label, href], i) => (
                <motion.a
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="group font-display text-5xl lg:text-7xl uppercase text-slate-900/40 hover:text-slate-950 transition-colors flex items-center gap-4"
                >
                  <span className="text-xs font-body tracking-[0.3em]" style={{ color: MINT }}>0{i + 1}</span>
                  {label}
                  <ArrowUpRight className="h-8 w-8 opacity-0 group-hover:opacity-100 transition" style={{ color: MINT }} />
                </motion.a>
              ))}
            </nav>
            <div className="hidden md:block relative overflow-hidden" style={{ background: `#1a1a2e` }}>
              <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
            </div>
          </div>
        </motion.div>
      )}

      {/* HERO */}
      <Hero onCta={() => setCheckoutOpen(true)} />

      {/* MARQUEE */}
      <Marquee />

      {/* STATS + INTRO */}
      <Intro />

      {/* SERVICES */}
      <Services />

      {/* SHOWCASE / CASES */}
      <Cases />

      {/* PROCESS */}
      <Process />

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* PRICING */}
      <Pricing onCta={() => setCheckoutOpen(true)} />

      {/* CTA */}
      <BigCta onCta={() => setCheckoutOpen(true)} />

      {/* FOOTER */}
      <Footer />

      <PublicCheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
      <PaymentReturnDialog />
    </div>
  );
}

/* ================= SECTIONS ================= */

function Hero({ onCta }: { onCta: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <section ref={ref} className="relative min-h-screen pt-16 overflow-hidden">
      {/* bg image */}
      <motion.div style={{ scale }} className="absolute inset-0">
        <img src={heroImg} alt="Semijoias em fundo escuro" fetchPriority="high" className="h-full w-full object-cover opacity-40" width={1600} height={1200} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${INK} 0%, transparent 30%, transparent 70%, ${INK} 100%)` }} />
      </motion.div>

      {/* glow */}
      <div aria-hidden className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-[160px] opacity-30" style={{ background: MINT }} />
      <div aria-hidden className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full blur-[160px] opacity-20" style={{ background: CORAL }} />

      <motion.div style={{ y }} className="relative max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 lg:pt-32">
        <div className="flex items-center gap-3 mb-10">
          <Badge>Nexsiles Studio · SaaS 2026</Badge>
          <span className="hidden md:inline text-xs uppercase tracking-[0.25em] text-slate-900/40">v3.0 — Prime</span>
        </div>

        <h1 className="font-display uppercase leading-[0.85] text-[15vw] md:text-[13vw] lg:text-[11rem]">
          <motion.span initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="block">
            Semijoias
          </motion.span>
          <motion.span initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="block">
            <span style={{ color: MINT }}>em</span> <span className="italic font-normal" style={{ fontFamily: 'Cormorant Garamond, serif' }}>escala.</span>
          </motion.span>
        </h1>

        <div className="mt-12 grid md:grid-cols-12 gap-8 items-end">
          <motion.p
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            className="md:col-span-6 lg:col-span-5 text-lg md:text-xl text-slate-900/70 leading-relaxed"
          >
            A plataforma que reúne <span className="text-white">PDV, estoque, maletas, loja virtual, CRM e IA</span> em um único sistema — para lojistas que tratam a operação como marca.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
            className="md:col-span-6 lg:col-span-7 flex flex-wrap gap-4 md:justify-end"
          >
            <Magnetic>
              <button
                onClick={onCta}
                className="group flex items-center gap-3 px-7 py-4 rounded-full font-display uppercase text-sm tracking-wider"
                style={{ background: MINT, color: INK }}
              >
                Começar por R$ 129
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </Magnetic>
            <Magnetic>
              <a href="#produto" className="flex items-center gap-3 px-7 py-4 rounded-full font-display uppercase text-sm tracking-wider border border-slate-900/20 hover:border-slate-900/60 transition">
                Ver plataforma
              </a>
            </Magnetic>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="mt-24 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-slate-900/40 border-t border-slate-900/10 pt-6"
        >
          <span>Scroll ↓</span>
          <span>São Paulo · Brasil</span>
          <span className="hidden md:inline">Made for jewelry brands</span>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Marquee() {
  const items = ['PDV', 'Estoque', 'Maletas', 'Loja Virtual', 'CRM', 'IA · Bella', 'Financeiro', 'Fiado', 'Metas', 'Multi-loja'];
  return (
    <div className="border-y border-slate-900/10 py-6 overflow-hidden" style={{ background: '#fdf2f8' }}>
      <div className="flex gap-16 animate-marquee whitespace-nowrap font-display uppercase text-3xl md:text-5xl">
        {[...items, ...items, ...items].map((it, i) => (
          <span key={i} className="flex items-center gap-16">
            <span className={i % 3 === 1 ? 'text-slate-900/30' : ''} style={i % 3 === 2 ? { color: MINT } : {}}>{it}</span>
            <span className="text-slate-900/20">✦</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee { from { transform: translateX(0);} to { transform: translateX(-33.333%);} }
        .animate-marquee { animation: marquee 40s linear infinite; }
      `}</style>
    </div>
  );
}

function Intro() {
  const stats = [
    { n: '2.500+', l: 'Lojistas ativos' },
    { n: 'R$ 40M', l: 'Transacionados/ano' },
    { n: '99.9%', l: 'Uptime garantido' },
    { n: '4.9/5', l: 'Nota das clientes' },
  ];
  return (
    <section id="produto" className="py-32 lg:py-48 relative">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <Badge>Sobre a plataforma</Badge>
            <h2 className="mt-6 font-display uppercase text-5xl md:text-7xl leading-[0.9]">
              Uma stack.<br />
              <span style={{ color: MINT }}>Toda</span> a operação<br />
              da sua marca.
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 text-slate-900/70 text-lg leading-relaxed space-y-6">
            <p>
              O Nexsiles é o <span className="text-white">sistema operacional das marcas de semijoias</span>: cada módulo foi desenhado para o dia-a-dia real de quem vende no PDV, consigna maletas, envia catálogos e opera loja virtual.
            </p>
            <p>
              Nada de módulos extras cobrados à parte. Uma assinatura — <span className="text-white">tudo liberado</span> — sem letra miúda.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-900/10">
              {stats.map((s) => (
                <div key={s.l}>
                  <div className="font-display text-3xl md:text-4xl">{s.n}</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-900/50 mt-2">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Services() {
  const services = [
    { n: '01', t: 'PDV Avançado', d: 'Frente de caixa completa com multi-forma de pagamento, fiado, comandas e integração com estoque em tempo real.' },
    { n: '02', t: 'Maletas & Consignação', d: 'Ciclo atômico de montagem, conferência e fechamento com comissão automática e devolução ao estoque.' },
    { n: '03', t: 'Loja Virtual', d: 'E-commerce Rose Gold com checkout Mercado Pago, PIX direto, frete e SEO dinâmico.' },
    { n: '04', t: 'CRM & Fidelidade', d: 'Base de clientes com tiers Bronze/Prata/Ouro, aniversários, retenção e automações WhatsApp.' },
    { n: '05', t: 'IA · Bella', d: 'Atendente virtual 24/7 com DeepSeek, gestão de carrinho e mídia — venda enquanto você dorme.' },
    { n: '06', t: 'Analytics', d: 'Dashboards em tempo real de vendas, margem, top produtos e performance de revendedoras.' },
  ];
  return (
    <section id="servicos" className="py-32 lg:py-48 border-t border-slate-900/10">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex items-end justify-between mb-16 flex-wrap gap-6">
          <div>
            <Badge>Serviços</Badge>
            <h2 className="mt-6 font-display uppercase text-5xl md:text-7xl">O que entregamos</h2>
          </div>
          <p className="text-slate-900/50 max-w-md">Seis pilares. Um único assinatura. Zero plano-versão-pro escondido.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'rgba(15,23,42,0.08)' }}>
          {services.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.6 }}
              className="group relative p-8 lg:p-10 hover:bg-slate-900/[0.02] transition-colors min-h-[280px] flex flex-col"
              style={{ background: INK }}
            >
              <div className="flex items-start justify-between">
                <span className="font-display text-sm tracking-widest" style={{ color: MINT }}>{s.n}</span>
                <ArrowUpRight className="h-5 w-5 text-slate-900/30 group-hover:text-slate-950 group-hover:-translate-y-1 group-hover:translate-x-1 transition" />
              </div>
              <h3 className="mt-8 font-display uppercase text-2xl lg:text-3xl">{s.t}</h3>
              <p className="mt-4 text-slate-900/60 leading-relaxed">{s.d}</p>
              <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500" style={{ background: MINT }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cases() {
  const cases = [
    { title: 'Ateliê Rose', tag: 'Lojista boutique', img: lojistaImg, result: '+312% em vendas online', color: MINT },
    { title: 'Bella Semijoias', tag: 'Rede de revendedoras', img: revImg, result: '48 maletas ativas/mês', color: CORAL },
    { title: 'Aurora Store', tag: 'E-commerce premium', img: lojaImg, result: 'R$ 180k GMV/mês', color: MINT },
    { title: 'Studio POS', tag: 'PDV multi-loja', img: pdvImg, result: '3s por venda média', color: CORAL },
  ];
  return (
    <section id="cases" className="py-32 lg:py-48 border-t border-slate-900/10">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="mb-16 max-w-3xl">
          <Badge>Cases selecionados</Badge>
          <h2 className="mt-6 font-display uppercase text-5xl md:text-7xl">Marcas que operam com o Nexsiles.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {cases.map((c, i) => (
            <motion.a
              key={c.title}
              href="#"
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: (i % 2) * 0.15, duration: 0.7 }}
              className={`group relative block ${i % 2 === 1 ? 'md:mt-24' : ''}`}
            >
              <div className="relative overflow-hidden aspect-[4/5] bg-slate-900/5 rounded-sm">
                <img src={c.img} alt={c.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105 grayscale group-hover:grayscale-0" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 50%, ${INK} 100%)` }} />
                <div className="absolute top-6 left-6 right-6 flex justify-between text-[10px] uppercase tracking-[0.3em]">
                  <span className="text-slate-900/80">{c.tag}</span>
                  <span style={{ color: c.color }}>0{i + 1} / 04</span>
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="font-display uppercase text-4xl md:text-5xl">{c.title}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-slate-900/70">{c.result}</span>
                    <ArrowUpRight className="h-6 w-6 transition group-hover:-translate-y-1 group-hover:translate-x-1" style={{ color: c.color }} />
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    { n: '01', t: 'Assine', d: 'R$ 129/mês. Um plano. Pague por PIX, cartão ou boleto via Mercado Pago.' },
    { n: '02', t: 'Configure', d: 'Onboarding em 10 minutos. Importe produtos, ative módulos e conecte seu WhatsApp.' },
    { n: '03', t: 'Opere', d: 'PDV, maletas, e-commerce e IA rodando desde o dia 1. Sem consultoria obrigatória.' },
    { n: '04', t: 'Escale', d: 'Multi-loja, revendedoras, CRM e analytics para crescer sem trocar de sistema.' },
  ];
  return (
    <section id="processo" className="py-32 lg:py-48 border-t border-slate-900/10 relative overflow-hidden">
      <img src={showcaseImg} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-10" />
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${INK} 0%, transparent 40%, transparent 60%, ${INK} 100%)` }} />
      <div className="relative max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="mb-20">
          <Badge>Como funciona</Badge>
          <h2 className="mt-6 font-display uppercase text-5xl md:text-7xl">Do assinar ao escalar<br />em <span style={{ color: MINT }}>4 passos</span>.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'rgba(15,23,42,0.1)' }}>
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 lg:p-10 min-h-[260px] flex flex-col justify-between"
              style={{ background: INK }}
            >
              <span className="font-display text-6xl" style={{ color: i === 0 ? MINT : 'rgba(15,23,42,0.2)' }}>{s.n}</span>
              <div>
                <h3 className="font-display uppercase text-2xl">{s.t}</h3>
                <p className="mt-3 text-slate-900/60">{s.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { q: 'Migrei do Excel pro Nexsiles e minha operação virou outra. As maletas, que eram um caos, agora fecham em minutos.', a: 'Camila R.', r: 'Ateliê Rose · SP' },
    { q: 'A loja virtual conectada ao PDV foi um divisor de águas. Vendo online e no balcão sem me preocupar com estoque duplicado.', a: 'Fernanda M.', r: 'Bella Semijoias · RJ' },
    { q: 'A Bella (IA) responde as clientes 24h por dia. Já fechei venda às 3 da manhã. Isso pagou o plano no primeiro mês.', a: 'Juliana T.', r: 'Aurora Store · MG' },
  ];
  return (
    <section className="py-32 lg:py-48 border-t border-slate-900/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <Badge>Provas sociais</Badge>
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {items.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="p-8 border border-slate-900/10 rounded-sm relative"
              style={{ background: 'rgba(15,23,42,0.03)' }}
            >
              <span className="font-display text-6xl absolute -top-6 left-6" style={{ color: MINT }}>“</span>
              <p className="text-slate-900/80 leading-relaxed pt-4">{t.q}</p>
              <footer className="mt-6 pt-6 border-t border-slate-900/10">
                <div className="font-display uppercase">{t.a}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-900/40 mt-1">{t.r}</div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ onCta }: { onCta: () => void }) {
  const features = [
    'PDV avançado', 'Estoque completo', 'Maletas atômicas', 'Loja virtual', 'CRM + fidelidade',
    'IA · Bella 24/7', 'WhatsApp automation', 'Multi-loja', 'Revendedoras ilimitadas', 'Portal reseller',
    'Analytics real-time', 'Suporte prioritário', 'Atualizações contínuas',
  ];
  return (
    <section id="preco" className="py-32 lg:py-48 border-t border-slate-900/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="text-center mb-20">
          <Badge>Nexsiles Prime</Badge>
          <h2 className="mt-6 font-display uppercase text-5xl md:text-7xl">Um plano.<br /><span style={{ color: MINT }}>Tudo liberado.</span></h2>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative max-w-4xl mx-auto p-10 lg:p-16 rounded-lg border overflow-hidden"
          style={{ background: '#fff1f2', borderColor: 'rgba(225,29,72,0.3)' }}
        >
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-[100px] opacity-30" style={{ background: MINT }} />
          <div className="relative grid md:grid-cols-2 gap-10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-900/50">Assinatura mensal</div>
              <h3 className="font-display uppercase text-5xl mt-2">Prime</h3>
              <div className="mt-8 flex items-baseline gap-3">
                <span className="text-2xl text-slate-900/50">R$</span>
                <span className="font-display text-8xl leading-none" style={{ color: MINT }}>129</span>
                <span className="text-slate-900/50">/mês</span>
              </div>
              <p className="mt-6 text-slate-900/60">Cancele quando quiser. Sem fidelidade. Sem taxa de setup.</p>
              <Magnetic>
                <button onClick={onCta} className="mt-10 flex items-center gap-3 px-8 py-4 rounded-full font-display uppercase text-sm tracking-wider" style={{ background: MINT, color: INK }}>
                  Assinar Prime <ArrowRight className="h-4 w-4" />
                </button>
              </Magnetic>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-900/50 mb-4">Tudo incluso</div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-slate-900/80 text-sm">
                    <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: MINT }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BigCta({ onCta }: { onCta: () => void }) {
  return (
    <section id="contato" className="py-32 lg:py-48 border-t border-slate-900/10 relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 50% 50%, ${MINT} 0%, transparent 60%)` }} />
      <div className="relative max-w-[1600px] mx-auto px-6 lg:px-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="font-display uppercase text-6xl md:text-8xl lg:text-[9rem] leading-[0.9]"
        >
          Pronta<br /> pra <span style={{ color: MINT }}>escalar?</span>
        </motion.h2>
        <p className="mt-8 text-slate-900/70 max-w-xl mx-auto text-lg">Comece agora. Em 10 minutos você tem PDV, estoque e loja virtual rodando.</p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Magnetic>
            <button onClick={onCta} className="px-10 py-5 rounded-full font-display uppercase text-sm tracking-wider" style={{ background: MINT, color: INK }}>
              Assinar por R$ 129 / mês
            </button>
          </Magnetic>
          <a href="https://wa.me/5511937687369" target="_blank" rel="noreferrer" className="px-10 py-5 rounded-full font-display uppercase text-sm tracking-wider border border-slate-900/20 hover:border-slate-900 transition">
            Falar com vendas
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="pt-32 pb-10 border-t border-slate-900/10 relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-10 mb-20">
          <div className="md:col-span-2">
            <div className="font-display uppercase text-3xl">Nexsiles</div>
            <p className="mt-4 text-slate-900/50 max-w-sm">O sistema operacional das marcas de semijoias. Feito no Brasil, para o mundo.</p>
          </div>
          {[
            { t: 'Produto', l: [['Plataforma', '#produto'], ['Serviços', '#servicos'], ['Preço', '#preco']] },
            { t: 'Empresa', l: [['Cases', '#cases'], ['Contato', 'https://wa.me/5511937687369'], ['Entrar', '/auth']] },
          ].map((col) => (
            <div key={col.t}>
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-900/40 mb-4">{col.t}</div>
              <ul className="space-y-2">
                {col.l.map(([label, href]) => (
                  <li key={label}><a href={href} className="text-slate-900/80 hover:text-slate-950 transition">{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="font-display uppercase text-[20vw] leading-[0.85] text-center select-none" style={{ color: 'rgba(225,29,72,0.06)' }}>
            NEXSILES
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900/10 flex flex-wrap justify-between items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-900/40">
          <span>© 2026 Nexsiles Studio</span>
          <span>São Paulo · Brasil</span>
          <span className="flex items-center gap-2">Status: <span className="h-1.5 w-1.5 rounded-full" style={{ background: MINT }} /> Operacional</span>
        </div>
      </div>
    </footer>
  );
}
